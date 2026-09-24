-- Migration: 20260924150000_sim_articles_and_sold_candidates.sql
-- Mô tả: Tạo bảng đánh dấu sim đã viết bài (sim_articles) và hàm RPC lấy sim mới bán

-- 1. Bảng public.sim_articles
CREATE TABLE IF NOT EXISTS public.sim_articles (
    phone_digits text PRIMARY KEY,
    blog_post_id uuid,
    slug text,
    price_segment text,
    created_at timestamptz DEFAULT now()
);

-- Bật RLS
ALTER TABLE public.sim_articles ENABLE ROW LEVEL SECURITY;

-- Policy cho service_role và public read
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sim_articles' AND policyname = 'sim_articles_service_role'
    ) THEN
        CREATE POLICY sim_articles_service_role ON public.sim_articles
        FOR ALL TO service_role USING (true) WITH CHECK (true);
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'sim_articles' AND policyname = 'sim_articles_public_read'
    ) THEN
        CREATE POLICY sim_articles_public_read ON public.sim_articles
        FOR SELECT TO public USING (true);
    END IF;
END $$;

GRANT ALL ON public.sim_articles TO service_role;
GRANT SELECT ON public.sim_articles TO anon, authenticated;

-- 2. Hàm RPC get_sold_sim_candidates
CREATE OR REPLACE FUNCTION public.get_sold_sim_candidates(p_hours int DEFAULT 24)
RETURNS TABLE (
    raw_digits text,
    display_number text,
    effective_price bigint,
    network text,
    tags jsonb,
    beauty_score integer,
    sold_at timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT DISTINCT ON (s.raw_digits)
        s.raw_digits,
        s.display_number,
        COALESCE(s.effective_price, s.final_price, s.original_price) AS effective_price,
        s.network,
        s.tags,
        s.beauty_score,
        ss.sold_at
    FROM sold_sims ss
    JOIN sims s ON (
        ss.id = s.id 
        OR (ss.raw_digits IS NOT NULL AND ss.raw_digits = s.raw_digits)
        OR (ss.phone_digits IS NOT NULL AND ss.phone_digits = s.raw_digits)
    )
    LEFT JOIN sim_articles sa ON sa.phone_digits = s.raw_digits
    WHERE sa.phone_digits IS NULL
      AND ss.sold_at >= (now() - (p_hours || ' hours')::interval)
    ORDER BY s.raw_digits, ss.sold_at DESC;
$$;

-- Chỉ cho service_role gọi
REVOKE EXECUTE ON FUNCTION public.get_sold_sim_candidates(int) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_sold_sim_candidates(int) TO service_role;
