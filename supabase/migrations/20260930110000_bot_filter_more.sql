-- Lọc thêm BOT khỏi "khách thật" (A Khoa 30/09), sau khi có vị trí theo IP.
--
-- Bằng chứng (30 ngày tới 30/09, đang được tính là khách thật):
--   * CN 28 IP / 29 lượt, JP 17 IP / 17 lượt, HK·SG·AU·MN vài IP: user-agent y
--     trình duyệt thật nhưng MỖI IP đúng 1 lượt, không referrer, vào thẳng trang
--     chi tiết số (/0703487779.html…) — bot cào chạy trên máy chủ đám mây
--     Tencent Cloud / Huawei Cloud (116.204.*, 121.37.*, 49.232.*, 82.156.*,
--     101.42.*, 43.130–43.173.*, 119.28.*, 129.226.*…).
--   * FR 51.158.* / 151.115.* (Scaleway) 6 lượt/IP vào "/", CA 149.56.* (OVH,
--     UA Dataprovider.com), US 13.58.* / 18.217.* (AWS), 34.122.* (Google Cloud),
--     74.125.* / 192.178.* (hạ tầng Google, có UA Google-Ads-Conversions),
--     IE 31.13.* (Meta).
--   * UA không có chữ "bot" nên lọt regex cũ: "Google-Ads-Conversions",
--     "Dataprovider.com".
--
-- CỐ Ý KHÔNG lọc: 104.28.* (Cloudflare WARP) và 172.226.* (iCloud Private Relay)
-- — người thật dùng VPN/ẩn IP; lượt bấm quảng cáo từ nhà mạng dân dụng UAE/Armenia
-- (có thể là người thật ở nước ngoài — xử lý bằng nhắm vị trí trong Google Ads).
-- Không dải nào dưới đây là dải nhà mạng Việt Nam.
--
-- Giữ nguyên chữ ký + IMMUTABLE/PARALLEL SAFE (chỉ so hằng, không đọc bảng) nên
-- is_internal_visit, view *_khach và các RPC tự dùng luật mới, không phải tạo lại.

create or replace function public.is_bot_visit(p_ua text, p_ip text)
returns boolean
language sql
immutable
parallel safe
set search_path = ''
as $$
  select
    coalesce(p_ua, '') ~* '(bot|crawl|spider|slurp|googlebot|google-inspectiontool|googleother|google-safety|mediapartners-google|feedfetcher|apis-google|adsbot|google-ads|google-read-aloud|bingbot|yandex|baiduspider|petalbot|bytespider|ahrefs|semrush|mj12|dotbot|dataprovider|facebookexternalhit|facebookcatalog|meta-externalagent|whatsapp/|skypeuripreview|embedly|iframely|perplexity|headlesschrome|phantomjs|puppeteer|playwright|selenium|lighthouse|pagespeed|censys|zgrab|nuclei|masscan|expanse|python|curl|wget|axios|okhttp|scrapy|aiohttp|httpx|^node$|go-http-client|java/|claude)'
    or coalesce(
      public.safe_inet(p_ip) <<= any (array[
        -- Crawler Google + Meta (đã có từ 26/09)
        '66.249.64.0/19', '57.141.0.0/16',
        -- Hạ tầng Google (Ads, Read Aloud…) + Google Cloud
        '74.125.0.0/16', '192.178.0.0/15', '34.64.0.0/10',
        -- Crawler / link preview của Meta
        '31.13.0.0/16', '66.220.144.0/20', '69.63.176.0/20', '69.171.224.0/19', '173.252.64.0/18',
        -- AWS (us-east-2, ap-south-1) nơi thấy bot
        '13.58.0.0/15', '18.216.0.0/14', '43.204.0.0/15',
        -- Tencent Cloud (CN, quốc tế, HK, SG)
        '43.128.0.0/10', '49.232.0.0/14', '58.87.64.0/18', '82.156.0.0/15', '101.32.0.0/16',
        '101.42.0.0/15', '119.28.0.0/16', '129.226.0.0/16', '140.143.0.0/16', '152.136.0.0/16',
        -- Huawei Cloud
        '1.92.0.0/14', '49.0.192.0/18', '113.44.0.0/16', '116.204.0.0/16', '119.13.0.0/16', '121.37.0.0/16',
        -- Scaleway, OVH
        '51.158.0.0/15', '151.115.0.0/16', '149.56.0.0/16'
      ]::inet[]),
      false
    )
$$;

notify pgrst, 'reload schema';
