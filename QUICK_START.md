# 🚀 快速启动指南

## 30秒启动管理后台

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境
复制 `.env.example` 为 `.env.local`，填入你的 Supabase 配置：
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

### 3. 初始化数据库
在 Supabase SQL Editor 执行：
- `supabaseSQL/verification_setup.sql`
- `supabaseSQL/insert_demo_code.sql`（可选）

### 4. 启动服务
```bash
npm run dev
```

### 5. 登录
访问 [http://localhost:3000](http://localhost:3000)
- 邮箱: `admin@xhs-evaluation.com`
- 密码: `Admin@2024!`

---

## 核心功能速览

### 创建验证码
1. 进入「验证码管理」
2. 点击「创建验证码」
3. 选择模式：
   - **随机生成**: 批量创建12位验证码
   - **自定义**: 手动输入验证码
4. 设置有效期和使用次数
5. 点击「创建」

### 导出验证码
1. 进入「验证码管理」
2. 点击「导出」按钮
3. 选择导出范围：
   - 按批次
   - 按时间范围
4. 选择字段范围：核心/全部
5. 下载 Excel 文件

### 查看统计
1. 进入「仪表盘」
2. 查看关键指标：
   - 验证码总数
   - 活跃验证码
   - 即将过期
   - 使用率
3. 查看7天创建趋势
4. 查看最新创建记录

---

## 常用命令

```bash
# 开发环境
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# 代码检查
npm run lint
```

---

## 目录结构

```
xhs-evalution-admin/
├── app/                 # Next.js 页面和 API
├── components/          # React 组件
├── lib/                 # 业务逻辑
├── types/               # TypeScript 类型
├── supabaseSQL/         # 数据库脚本
└── README.md            # 完整文档
```

---

## 下一步

- 阅读 [README.md](README.md) 了解完整功能
- 阅读 [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) 了解如何与用户端集成
- 修改默认管理员密码（`lib/constants/auth.ts`）

---

**需要帮助？** 查看 [README.md](README.md) 的「常见问题」章节
