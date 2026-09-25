import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { DAILY_IP_LIMIT, ROOM_TYPES, STYLES } from '@/lib/constants';
import { getIpUsage, consumeIpUsage, getClientIp } from '@/lib/ipLimit';
import { logPublicGeneration } from '@/lib/usageLog';

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    // 요청 용량 제한 체크 (~12MB, 평면도까지 함께 올리는 경우를 감안)
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 12 * 1024 * 1024) {
      return NextResponse.json(
        { error: '업로드 요청 크기가 제한(12MB)을 초과했습니다. 이미지 해상도를 줄여주세요.' },
        { status: 413 }
      );
    }

    const { image, floorPlanImage, roomTypeId, styleId, byokKey } = await req.json();

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: '인테리어 디자인을 입힐 원본 방 사진을 업로드해 주세요.' },
        { status: 400 }
      );
    }

    const roomType = ROOM_TYPES.find((r) => r.id === roomTypeId);
    const style = STYLES.find((s) => s.id === styleId);
    if (!roomType || !style) {
      return NextResponse.json(
        { error: '공간 유형과 인테리어 스타일을 선택해 주세요.' },
        { status: 400 }
      );
    }

    const ip = getClientIp(req);

    // API 키 결정 (BYOK 우선, 없으면 서버 환경변수 키)
    const apiKey = (typeof byokKey === 'string' && byokKey.trim()) || process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return NextResponse.json(
        { error: '서버의 GEMINI_API_KEY가 설정되지 않았습니다. "내 API 키" 모드를 켜고 개인 키를 입력해 주세요.' },
        { status: 500 }
      );
    }

    // 데모 모드(서버 제공 키)인 경우에만 IP당 일일 제한 검증
    const isDemoMode = !byokKey;
    if (isDemoMode && !getIpUsage(ip).allowed) {
      return NextResponse.json(
        {
          error: `데모 일일 제한(IP당 하루 ${DAILY_IP_LIMIT}회)을 초과했습니다. 무제한 사용을 위해 "내 API 키로 무제한 사용" 모드를 켜고 무료 API 키를 등록해 주세요.`,
        },
        { status: 429 }
      );
    }

    // base64 및 mimeType 파싱
    let mimeType = 'image/jpeg';
    let base64Image = image;

    if (image.startsWith('data:')) {
      const match = image.match(/^data:([^;]+);base64,(.*)$/);
      if (match) {
        mimeType = match[1];
        base64Image = match[2];
      }
    }

    // 이미지 base64 바이트 사이즈 검증 (~8MB)
    if (base64Image.length > 8 * 1024 * 1024 * 1.33) {
      return NextResponse.json(
        { error: '업로드 이미지 용량이 8MB를 초과합니다. 더 작은 이미지를 업로드해 주세요.' },
        { status: 413 }
      );
    }

    // 평면도(선택) 파싱 — 있으면 방 구조·동선의 근거 자료로 함께 전달한다.
    let floorPlanMimeType: string | null = null;
    let base64FloorPlan: string | null = null;
    if (typeof floorPlanImage === 'string' && floorPlanImage.trim()) {
      floorPlanMimeType = 'image/jpeg';
      base64FloorPlan = floorPlanImage;
      if (floorPlanImage.startsWith('data:')) {
        const match = floorPlanImage.match(/^data:([^;]+);base64,(.*)$/);
        if (match) {
          floorPlanMimeType = match[1];
          base64FloorPlan = match[2];
        }
      }
      if (base64FloorPlan.length > 8 * 1024 * 1024 * 1.33) {
        return NextResponse.json(
          { error: '평면도 이미지 용량이 8MB를 초과합니다. 더 작은 이미지를 업로드해 주세요.' },
          { status: 413 }
        );
      }
    }

    const instruction = base64FloorPlan
      ? `Redesign this ${roomType.prompt} interior in ${style.prompt}. A floor plan of this same space is provided as reference — use it to understand the real wall layout, room boundaries, and door/window positions, and make sure furniture placement in the redesign respects that layout. Keep the room architecture in the photo — walls, windows, doors, ceiling and camera perspective — exactly the same. Replace furniture, lighting, color palette and decor to match the target style. Photorealistic interior photography, natural lighting, high detail.`
      : `Redesign this ${roomType.prompt} interior in ${style.prompt}. Keep the room architecture — walls, windows, doors, ceiling and camera perspective — exactly the same. Replace furniture, lighting, color palette and decor to match the target style. Photorealistic interior photography, natural lighting, high detail.`;

    const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [];
    if (base64FloorPlan && floorPlanMimeType) {
      parts.push({ text: 'Reference floor plan of this space (context only — do not redesign this image):' });
      parts.push({ inlineData: { mimeType: floorPlanMimeType, data: base64FloorPlan } });
      parts.push({ text: 'Room photo to redesign:' });
    }
    parts.push({ inlineData: { mimeType, data: base64Image } });
    parts.push({ text: instruction });

    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: [{ role: 'user', parts }],
    });

    const candidate = res.candidates?.[0];

    if (candidate?.finishReason === 'SAFETY') {
      return NextResponse.json(
        { error: '안전 정책에 의해 이미지 생성이 차단되었습니다. 다른 사진을 사용해 주세요.' },
        { status: 400 }
      );
    }

    const part = candidate?.content?.parts?.find((p) => p.inlineData);
    const imageBase64 = part?.inlineData?.data;

    if (!imageBase64) {
      return NextResponse.json(
        { error: '이미지 생성이 실패했거나 차단되었습니다. 다른 공간 유형이나 스타일을 선택해 주세요.' },
        { status: 400 }
      );
    }

    if (isDemoMode) consumeIpUsage(ip);
    logPublicGeneration('generate', !isDemoMode);

    return NextResponse.json({ image: imageBase64 });
  } catch (error) {
    console.error('Gemini Generate API Error:', error);
    const errMsg = error instanceof Error ? error.message : '';

    if (
      errMsg.includes('API_KEY_INVALID') ||
      errMsg.includes('API key not valid') ||
      errMsg.includes('invalid api key')
    ) {
      return NextResponse.json(
        { error: 'API 키가 잘못되었습니다. 발급받은 유효한 API 키를 정확히 입력해 주세요.' },
        { status: 401 }
      );
    }

    if (errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('quota') || errMsg.includes('429')) {
      return NextResponse.json(
        { error: 'API 무료 요청 할당량을 초과했습니다. 잠시 후 다시 시도해 주세요.' },
        { status: 429 }
      );
    }

    if (errMsg.includes('SAFETY') || errMsg.includes('safety') || errMsg.includes('blocked')) {
      return NextResponse.json(
        { error: '안전 필터에 의해 생성이 거부되었습니다. 다른 사진이나 스타일로 시도해 주세요.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: `인테리어 생성 실패: ${errMsg || '알 수 없는 서버 내부 오류'}` },
      { status: 500 }
    );
  }
}
