-- 插入测试验证码
-- 验证码: TEST2024
-- 有效期: 30天
-- 最大使用次数: 100

insert into public.access_codes (code_hash, plain_code, expires_at, max_uses, description)
values (
  crypt('TEST2024', gen_salt('bf')),
  'TEST2024',
  timezone('utc', now()) + interval '30 days',
  100,
  '测试验证码 - 30天有效'
);
