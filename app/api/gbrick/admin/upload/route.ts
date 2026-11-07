export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { nanoid } from "nanoid";

// getAdmin()과 동일한 URL 선택 로직 — gbrick-app-dev 버킷에 업로드
const GBRICK_SUPABASE_URL = "https://rzgrkrffksqdeztzxyrt.supabase.co";

function getStorageClient() {
  const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const url = envUrl.includes("rzgrkrffksqdeztzxyrt") ? envUrl : GBRICK_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "파일 없음" }, { status: 400 });

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filename = `menu/${nanoid()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const supabase = getStorageClient();
    const { error } = await supabase.storage
      .from("gbrick-menu-images")
      .upload(filename, buffer, { contentType: file.type, upsert: true });

    if (error) {
      console.error("[upload] supabase storage error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from("gbrick-menu-images")
      .getPublicUrl(filename);

    return NextResponse.json({ url: publicUrl });
  } catch (err) {
    console.error("[upload]", err);
    return NextResponse.json({ error: "업로드 실패" }, { status: 500 });
  }
}
