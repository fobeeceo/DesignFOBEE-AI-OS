import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { getIpUsage, consumeIpUsage, getClientIp } from '@/lib/ipLimit';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * 대화형 리파인: /api/generate로 만든 결과 이미지에 자연어 지시를 한 번 더 반영한다.
 * generate와 동일한 IP당 일일 제한·BYOK 모드를 공유한다(별도 한도 신설 없음).
 */
export async function POST(req: NextRequest) {
  try {
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > 8 * 1024 * 1024) {
      return NextResponse.json(
        { error: '업로드 요청 크기가 제한(8MB)을 초과했습니다.' },
        { status: 413 }
      );
    }

    const { image, instruction, byokKey } = await req.json();

    if (!image || typeof image !== 'string') {
      return NextResponse.json(
        { error: '다듬을 결과 이미지가 없습니다. 먼저 디자인을 생성해 주세요.' },
        { status: 400 }
      );
    }

    const trimmedInstruction = typeof instruction === 'string' ? instruction.trim() : '';
    if (trimmedInstruction.length < 2 || trimmedInstruction.length > 200) {
      return NextResponse.json(
        { error: '어떻게 수정할지 2~200자로 입력해 주세요.' },
        { status: 400 }
      );
    }

    const ip = getClientIp(req);
    const apiKey = (typeof byokKey === 'string' && byokKey.trim()) || process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return NextResponse.json(
        { error: '서버의 GEMINI_API_KEY가 설정되지 않았습니다. "내 API 키" 모드를 켜고 개인 키를 입력해 주세요.' },
        { status: 500 }
      );
    }

    const isDemoMode = !byokKey;
    if (isDemoMode && !getIpUsage(ip).allowed) {
      return NextResponse.json(
        {
          error: '데모 일일 제한을 초과했습니다. 무제한 사용을 위해 "내 API 키로 무제한 사용" 모드를 켜고 무료 API 키를 등록해 주세요.',
        },
        { status: 429 }
      );
    }

    let mimeType = 'image/png';
    let base64Image = image;
    if (image.startsWith('data:')) {
      const match = image.match(/^data:([^;]+);base64,(.*)$/);
      if (match) {
        mimeType = match[1];
        base64Image = match[2];
      }
    }

    if (base64Image.length > 8 * 1024 * 1024 * 1.33) {
      return NextResponse.json(
        { error: '이미지 용량이 8MB를 초과합니다.' },
        { status: 413 }
      );
    }

    const geminiInstruction = `Apply this change to the interior photo: "${trimmedInstruction}". Keep the room architecture — walls, windows, doors, ceiling and camera perspective — exactly the same, and keep everything else about the current design unchanged unless the instruction says otherwise. Photorealistic interior photography, high detail.`;

    const ai = new GoogleGenAI({ apiKey });
    const res = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: [
        {
          role: 'user',
          parts: [{ inlineData: { mimeType, data: base64Image } }, { text: geminiInstruction }],
        },
      ],
    });

    const candidate = res.candidates?.[0];

    if (candidate?.finishReason === 'SAFETY') {
      return NextResponse.json(
        { error: '안전 정책에 의해 이미지 생성이 차단되었습니다. 다른 요청으로 시도해 주세요.' },
        { status: 400 }
      );
    }

    const part = candidate?.content?.parts?.find((p) => p.inlineData);
    const imageBase64 = part?.inlineData?.data;

    if (!imageBase64) {
      return NextResponse.json(
        { error: '반영에 실패했거나 차단되었습니다. 다른 표현으로 다시 시도해 주세요.' },
        { status: 400 }
      );
    }

    if (isDemoMode) consumeIpUsage(ip);

    return NextResponse.json({ image: imageBase64 });
  } catch (error) {
    console.error('Gemini Refine API Error:', error);
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
        { error: '안전 필터에 의해 생성이 거부되었습니다. 다른 표현으로 시도해 주세요.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: `반영 실패: ${errMsg || '알 수 없는 서버 내부 오류'}` },
      { status: 500 }
    );
  }
}
