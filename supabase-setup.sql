-- ESG 자가진단 결과 저장 테이블
-- Supabase SQL Editor에서 실행하세요

CREATE TABLE IF NOT EXISTS diagnosis_results (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at    timestamptz DEFAULT now(),
  company_name  text        NOT NULL,
  company_biz   text,
  company_size  text,
  company_industry text,
  score         integer,
  grade         text,
  grade_label   text,
  e_score       numeric(4,2),
  s_score       numeric(4,2),
  g_score       numeric(4,2),
  strong_count  integer,
  weak_count    integer,
  answers       jsonb
);

-- Row Level Security: 서비스 롤 키로만 접근 허용
ALTER TABLE diagnosis_results ENABLE ROW LEVEL SECURITY;

-- 서비스 롤 키는 RLS를 우회하므로 추가 정책 불필요
-- (anon 키로 직접 접근 차단됨)
