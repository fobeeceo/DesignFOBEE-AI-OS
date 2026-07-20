/**
 * @deprecated STEP 2부터는 lib/supabase/client.ts (브라우저) 또는
 * lib/supabase/server.ts (서버)를 사용한다. 이 파일은 하위 호환용으로만 남겨둔다.
 * (@supabase/ssr 기반으로 세션 쿠키를 다루기 위해 클라이언트를 분리했다)
 */
export { createClient as createBrowserSupabaseClient } from "@/lib/supabase/client";
