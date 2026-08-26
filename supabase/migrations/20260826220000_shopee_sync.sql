-- Shopee Product Sync: credential + settings + mapping + sync log.
--
-- Khác hẳn module ads của kitleather: ở đây Heoiu/Koi không gọi vào. Mọi thứ
-- nằm gọn trong app chonsomobifone (sim-sanctuary-23), admin tự uỷ quyền shop
-- của chính mình rồi bấm sync lô SIM lên Shopee.

-- ── Credential Shopee ─────────────────────────────────────────────────────────
-- Các cột *_enc chứa ciphertext AES-256-GCM (xem src/lib/shopee/crypto.ts).
--
-- Vì sao ở DB chứ không phải biến môi trường: access_token của Shopee hết hạn
-- sau 4 tiếng. Serverless không ghi lại được env của chính nó, nên nếu chỉ dựa
-- vào env thì refresh_token mới do Shopee cấp sẽ mất, đến lúc token cũ hết hiệu
-- lực là phải uỷ quyền lại bằng tay.
--
-- Chỉ một dòng duy nhất, id = 'default': shop này chỉ nối một shop Shopee.
create table if not exists shopee_credential (
  id                text        primary key default 'default',
  partner_id        bigint      not null,
  shop_id           bigint      not null,
  partner_key_enc   text        not null,
  access_token_enc  text,
  refresh_token_enc text,
  env               text        not null default 'live',
  token_expires_at  timestamptz,
  authorized_at     timestamptz,
  updated_by        text,
  updated_at        timestamptz not null default now()
);

-- ── Cài đặt đăng bán ─────────────────────────────────────────────────────────
-- Một dòng duy nhất (id = 'default'). category_id để đăng sản phẩm, image_url
-- là ảnh sim chung dùng tạm, logistic_id nếu muốn chốt kênh giao hàng.
create table if not exists shopee_settings (
  id           text   primary key default 'default',
  category_id  bigint,
  image_url    text,
  logistic_id  bigint,
  updated_at   timestamptz not null default now()
);

-- ── Map SIM -> sản phẩm Shopee ───────────────────────────────────────────────
-- sim_id lấy từ cột SIMID của Google Sheet (chuỗi, vd "SIM036227"). Shopee
-- không có tham chiếu ổn định về kho của mình nên cột `item_sku` phải gán bằng
-- sim_id để mỗi lần sync tra được product đã tạo mà không cần quét item_list.
create table if not exists shopee_item_map (
  sim_id          text        primary key,
  item_id         bigint,
  item_sku        text,
  status          text        not null default 'pending', -- pending | live | failed | removed
  price           numeric,
  stock           integer     not null default 0,
  last_synced_at  timestamptz,
  last_success_at timestamptz,
  last_error      text,
  raw_response    jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists shopee_item_map_status_idx
  on shopee_item_map (status);

-- ── Nhật ký mỗi lần sync ─────────────────────────────────────────────────────
-- errors lưu theo từng sim_id (jsonb) chứ không nối chuỗi, để admin thấy đúng
-- cái nào lỗi gì mà không phải parse text.
create table if not exists shopee_sync_log (
  id           bigint generated always as identity primary key,
  batch_id     text        not null,
  kind         text        not null default 'sync', -- sync | category | config
  started_at   timestamptz not null default now(),
  finished_at  timestamptz,
  total        integer     not null default 0,
  created      integer     not null default 0,
  updated      integer     not null default 0,
  failed       integer     not null default 0,
  skipped      integer     not null default 0,
  errors       jsonb       not null default '[]'::jsonb,
  created_by   text
);

-- ── RLS: khoá cứng ───────────────────────────────────────────────────────────
-- Bật RLS mà KHÔNG tạo policy nào = chặn hết anon và authenticated. Chỉ service
-- role (bỏ qua RLS) đọc/ghi được, tức chỉ đi qua route handler /api/admin/shopee/*
-- nơi đã kiểm tra session admin.
alter table shopee_credential enable row level security;
alter table shopee_settings     enable row level security;
alter table shopee_item_map     enable row level security;
alter table shopee_sync_log     enable row level security;

-- Chặn luôn cả việc lỡ cấp quyền qua GRANT: force RLS áp cả với table owner.
alter table shopee_credential force row level security;
alter table shopee_settings     force row level security;
alter table shopee_item_map     force row level security;
alter table shopee_sync_log     force row level security;
