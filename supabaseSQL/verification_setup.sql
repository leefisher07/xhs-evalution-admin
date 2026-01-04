-- Supabase 验证码表结构 + 索引
-- 用于 xhs-evaluation 项目的验证码管理

-- 1. 启用 pgcrypto 扩展（用于密码哈希和UUID生成）
create extension if not exists pgcrypto;

-- 2. 创建验证码表
create table if not exists public.access_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null,
  plain_code text,
  expires_at timestamptz not null,
  max_uses int not null default 1,
  used_count int not null default 0,
  description text,
  created_at timestamptz not null default timezone('utc', now())
);

-- 3. 创建索引优化查询性能
create index if not exists idx_access_codes_expires_at
  on public.access_codes (expires_at);

create index if not exists idx_access_codes_usage
  on public.access_codes (used_count, max_uses);

create unique index if not exists idx_access_codes_plain_code
  on public.access_codes (plain_code)
  where plain_code is not null;

-- 4. 启用 RLS（行级安全策略）
alter table public.access_codes enable row level security;

-- 5. 创建 RLS 策略：阻止直接访问
drop policy if exists "access_codes_no_select" on public.access_codes;
create policy "access_codes_no_select"
  on public.access_codes
  for select
  using (false);

drop policy if exists "access_codes_no_insert" on public.access_codes;
create policy "access_codes_no_insert"
  on public.access_codes
  for insert
  with check (false);

drop policy if exists "access_codes_no_update" on public.access_codes;
create policy "access_codes_no_update"
  on public.access_codes
  for update
  using (false)
  with check (false);

drop policy if exists "access_codes_no_delete" on public.access_codes;
create policy "access_codes_no_delete"
  on public.access_codes
  for delete
  using (false);

-- 6. 添加表注释
comment on table public.access_codes is 'XHS 心理测评系统验证码表';
comment on column public.access_codes.code_hash is 'bcrypt 哈希值';
comment on column public.access_codes.plain_code is '明文验证码（仅用于管理）';
comment on column public.access_codes.expires_at is '过期时间';
comment on column public.access_codes.max_uses is '最大使用次数';
comment on column public.access_codes.used_count is '已使用次数';
comment on column public.access_codes.description is '备注信息';
