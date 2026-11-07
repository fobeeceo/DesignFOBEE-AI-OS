-- ============================================================
-- GBRICK Coffee MVP — 테이블 권한 부여
-- gbrick-app-dev (rzgrkrffksqdeztzxyrt) 전용
-- SQL Editor에서 실행
-- ============================================================

-- service_role (서버 API용) 전체 권한
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO service_role;

-- 확인
SELECT grantee, table_name, privilege_type
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name LIKE 'gb_%'
  AND grantee = 'service_role'
ORDER BY table_name
LIMIT 10;
