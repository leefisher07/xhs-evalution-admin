# XHS 心理测评系统 - 用户端升级指南

本文件为 xhs-evaluation 用户端提供升级到数据库验证码系统的完整代码。

## 升级步骤

### 1. 安装依赖

```bash
cd xhs-evaluation
npm install @supabase/supabase-js
```

### 2. 更新环境变量

编辑 `.env.local`，添加 Supabase 配置：

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...your-service-role-key

# 删除旧的验证码配置
# VERIFICATION_CODE=test123  # 删除这行
```

### 3. 替换验证码 API

将下面的代码复制到 `app/api/verify-code/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const VERIFICATION_WINDOW_MS = 72 * 60 * 60 * 1000; // 72小时

/**
 * 验证码验证 API - 数据库版本
 * POST /api/verify-code
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    // 验证输入
    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { error: '请输入有效的验证码' },
        { status: 400 }
      );
    }

    // 连接 Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.error('[verify-code] Missing Supabase configuration');
      return NextResponse.json(
        { error: '服务器配置错误' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false }
    });

    const trimmedCode = code.trim().toUpperCase();

    // 1. 查询验证码
    const { data, error: queryError } = await supabase
      .from('access_codes')
      .select('id, expires_at, max_uses, used_count, plain_code')
      .eq('plain_code', trimmedCode)
      .maybeSingle();

    if (queryError) {
      console.error('[verify-code] Query error:', queryError);
      return NextResponse.json(
        { error: '验证码校验失败，请稍后重试' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: '验证码不存在或已失效' },
        { status: 401 }
      );
    }

    // 2. 检查过期时间
    const expiresAt = new Date(data.expires_at).getTime();
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      return NextResponse.json(
        { error: '验证码已过期' },
        { status: 401 }
      );
    }

    // 3. 检查使用次数
    if (data.used_count >= data.max_uses) {
      return NextResponse.json(
        { error: '验证码已达到使用上限' },
        { status: 401 }
      );
    }

    // 4. 更新使用次数（使用乐观锁防止并发问题）
    const { data: updatedRows, error: updateError } = await supabase
      .from('access_codes')
      .update({ used_count: data.used_count + 1 })
      .eq('id', data.id)
      .eq('used_count', data.used_count) // 乐观锁：只有当前值匹配时才更新
      .select('id');

    if (updateError) {
      console.error('[verify-code] Update error:', updateError);
      return NextResponse.json(
        { error: '验证码校验失败，请稍后重试' },
        { status: 500 }
      );
    }

    // 检查是否更新成功（可能因为并发导致失败）
    if (!updatedRows || updatedRows.length === 0) {
      return NextResponse.json(
        { error: '验证码正在被使用，请稍后重试' },
        { status: 409 }
      );
    }

    // 5. 验证成功，返回有效期时间戳
    const verifiedUntil = Date.now() + VERIFICATION_WINDOW_MS;

    console.log('[verify-code] Verification successful:', {
      code: trimmedCode,
      used_count: data.used_count + 1,
      max_uses: data.max_uses
    });

    return NextResponse.json({
      verifiedUntil,
    });

  } catch (error) {
    console.error('[verify-code] Unexpected error:', error);
    return NextResponse.json(
      { error: '服务器错误，请稍后重试' },
      { status: 500 }
    );
  }
}
```

### 4. 测试升级

启动用户端：

```bash
npm run dev
```

测试流程：

1. 访问任意测试页面
2. 输入在管理后台创建的验证码
3. 验证成功后进入测试
4. 在管理后台查看统计数据是否更新

---

## 验证码格式说明

### 自动转换规则

用户端会自动将验证码转换为大写字母：

```typescript
const trimmedCode = code.trim().toUpperCase();
```

**示例**：
- 用户输入: `test2024`
- 实际查询: `TEST2024`

### 推荐格式

- **长度**: 6-12位
- **字符集**: 大写字母 + 数字
- **排除**: 易混淆字符（I、L、O、0、1）

**管理后台随机生成的验证码示例**：
- `ABC23DEF456G`
- `MN45PQR789ST`

---

## 错误处理

### 用户端显示的错误信息

| 后端错误 | 用户看到的提示 |
|---------|---------------|
| 验证码不存在 | "验证码不存在或已失效" |
| 验证码已过期 | "验证码已过期" |
| 达到使用上限 | "验证码已达到使用上限" |
| 并发冲突 | "验证码正在被使用，请稍后重试" |
| 服务器错误 | "服务器错误，请稍后重试" |

---

## 数据库查询说明

### 查询验证码

```typescript
const { data } = await supabase
  .from('access_codes')
  .select('id, expires_at, max_uses, used_count, plain_code')
  .eq('plain_code', trimmedCode)
  .maybeSingle();  // 使用 maybeSingle() 而不是 single()，避免找不到记录时抛出异常
```

### 更新使用次数（乐观锁）

```typescript
const { data: updatedRows } = await supabase
  .from('access_codes')
  .update({ used_count: data.used_count + 1 })
  .eq('id', data.id)
  .eq('used_count', data.used_count)  // 乐观锁：防止并发更新
  .select('id');

// 检查是否更新成功
if (!updatedRows || updatedRows.length === 0) {
  // 更新失败，可能因为并发冲突
}
```

**为什么需要乐观锁？**

假设两个用户同时输入同一个验证码：

1. 用户A查询到 `used_count = 5`
2. 用户B查询到 `used_count = 5`
3. 用户A更新为 `used_count = 6`
4. 用户B尝试更新，但检查到 `used_count` 已经不是 5，更新失败
5. 用户B收到「验证码正在被使用」提示

---

## 兼容性说明

### 与旧版本的兼容性

升级后，旧的环境变量验证方式将**失效**。

**旧版本** (`.env.local`):
```bash
VERIFICATION_CODE=test123  # 废弃
```

**新版本** (`.env.local`):
```bash
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 迁移建议

如果你有旧的验证码系统在运行：

1. 提前通知用户升级计划
2. 在管理后台创建新验证码
3. 替换用户端 API 代码
4. 测试验证码功能
5. 正式上线

---

## 性能优化

### 数据库索引

管理后台的数据库脚本已经创建了必要的索引：

```sql
-- plain_code 唯一索引（加速查询）
create unique index idx_access_codes_plain_code
  on public.access_codes (plain_code)
  where plain_code is not null;

-- expires_at 索引（加速过期检查）
create index idx_access_codes_expires_at
  on public.access_codes (expires_at);

-- used_count 和 max_uses 索引（加速使用情况查询）
create index idx_access_codes_usage
  on public.access_codes (used_count, max_uses);
```

### API 响应时间

典型响应时间：

- 验证码查询: < 50ms
- 使用次数更新: < 30ms
- 总响应时间: < 100ms

---

## 监控和日志

### 控制台日志

成功验证时的日志：

```
[verify-code] Verification successful: {
  code: 'TEST2024',
  used_count: 6,
  max_uses: 100
}
```

错误时的日志：

```
[verify-code] Query error: { ... }
[verify-code] Update error: { ... }
[verify-code] Unexpected error: { ... }
```

### Supabase Dashboard

在 Supabase Dashboard > Logs 中可以查看：

- 数据库查询日志
- API 请求日志
- 错误堆栈信息

---

## 安全注意事项

1. **Service Role Key 保密**: 不要将 `SUPABASE_SERVICE_ROLE_KEY` 提交到 Git
2. **RLS 策略**: 数据库已启用 RLS，只有 Service Role 可以访问
3. **大小写转换**: 自动转换为大写，防止大小写不匹配
4. **乐观锁**: 防止并发更新导致的数据不一致

---

## 故障排查

### 1. "服务器配置错误"

**原因**: 缺少 Supabase 环境变量

**解决**: 检查 `.env.local` 是否正确配置

### 2. "验证码不存在或已失效"

**原因**: 验证码未在管理后台创建，或已被删除

**解决**: 在管理后台创建新的验证码

### 3. "验证码正在被使用，请稍后重试"

**原因**: 并发更新冲突

**解决**: 这是正常情况，用户重新提交即可

### 4. 验证成功但无法进入测试

**原因**: VerificationProvider 状态未更新

**解决**: 检查 `verifiedUntil` 是否正确存储到 localStorage

---

## 完成！

升级完成后，你的用户端将拥有：

- ✅ 完整的数据库验证码系统
- ✅ 实时使用情况追踪
- ✅ 过期和使用次数限制
- ✅ 并发安全保护

**下一步**: 访问 [管理后台 README](../xhs-evalution-admin/README.md) 了解如何管理验证码
