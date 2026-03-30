# DashGen – AI BI Dashboard Generator
> Describe your metrics → Get a beautiful, interactive BI dashboard in 30 seconds.

## Tech Stack
- **Frontend/Backend**: Next.js 14 (App Router, Edge Runtime)
- **Database + Auth + Storage**: Supabase
- **AI**: 可插拔多模型（OpenClaw / OpenAI / Anthropic / Gemini）
- **Deployment**: **Cloudflare Pages** (primary) / Vercel (alternative)

---

## 🚀 Cloudflare Pages 部署（推荐，交给 OpenClaw 操作）

### Step 1 — Supabase 建库

1. [supabase.com](https://supabase.com) → New project
2. SQL Editor → 粘贴运行 `supabase-schema.sql`
3. SQL Editor → 粘贴运行 `supabase-rpc.sql`
4. Project Settings → API → 复制三个 Key

### Step 2 — 接入 OpenClaw（小龙虾）大模型

在 `lib/ai.ts` 中已预留接口，只需在环境变量中配置：

```env
AI_PROVIDER = openclaw
AI_MODEL    = openclaw-pro   # 换成你们的模型名
OPENCLAW_API_KEY  = your_key
OPENCLAW_BASE_URL = https://api.openclaw.ai/v1  # 换成实际地址
```

然后在 `lib/ai.ts` 末尾添加：

```typescript
async function generateOpenClaw(prompt: string): Promise<string> {
  const res = await fetch(`${process.env.OPENCLAW_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENCLAW_API_KEY}`,
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || 'openclaw-pro',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 8000,
      temperature: 0.7,
    }),
  })
  if (!res.ok) throw new Error(`OpenClaw error: ${res.status}`)
  const data = await res.json()
  return data.choices[0].message.content  // 如果接口格式不同，这里调整
}
```

同时在 `generateWithAI()` 函数顶部加一行：
```typescript
if (provider === 'openclaw') return generateOpenClaw(prompt)
```

### Step 3 — Cloudflare Pages 部署

```bash
# 安装依赖
npm install

# 构建（生成 Cloudflare 兼容产物）
npm run build:cf
# 等价于：npx @cloudflare/next-on-pages
```

**通过 Cloudflare Dashboard 部署（推荐给 OpenClaw 操作）：**

1. push 代码到 GitHub
2. Cloudflare Dashboard → Pages → Create a project → Connect to Git
3. Build settings:
   - Build command: `npx @cloudflare/next-on-pages`
   - Build output directory: `.vercel/output/static`
4. Environment variables（在 Pages → Settings → Environment Variables 添加）：

```
NEXT_PUBLIC_SUPABASE_URL        = your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY   = your_anon_key
SUPABASE_SERVICE_ROLE_KEY       = your_service_role_key
AI_PROVIDER                     = openclaw
AI_MODEL                        = openclaw-pro
OPENCLAW_API_KEY                = your_openclaw_key
OPENCLAW_BASE_URL               = https://api.openclaw.ai/v1
NEXT_PUBLIC_APP_URL             = https://dashgen.pages.dev
FREE_GENERATION_LIMIT           = 3
```

5. Save → Deploy → ✅

**通过 Wrangler CLI 部署（本地命令行）：**
```bash
# 设置 secrets
npx wrangler secret put OPENCLAW_API_KEY
npx wrangler secret put SUPABASE_SERVICE_ROLE_KEY

# 发布
npx wrangler pages deploy .vercel/output/static --project-name=dashgen
```

### Step 4 — Supabase Auth 配置

Cloudflare Pages 域名：`https://dashgen.pages.dev`（或自定义域名）

1. Supabase → Authentication → URL Configuration
2. Site URL: `https://dashgen.pages.dev`
3. Redirect URLs: `https://dashgen.pages.dev/**`

---

## ⚡ 关键差异：Cloudflare vs Vercel

| 项目 | Cloudflare Pages | Vercel |
|------|-----------------|--------|
| 运行时 | Edge (V8 isolates) | Node.js |
| 冷启动 | 极快 (~0ms) | 较慢 |
| 免费额度 | 无限请求 | 有限 |
| 函数超时 | 30s (免费) / 可配置 | 60s |
| 全球节点 | 300+ 边缘节点 | 有限 |
| 构建命令 | `npx @cloudflare/next-on-pages` | `next build` |

> ⚠️ AI 生成可能接近30秒，如果超时可在 Cloudflare Pages 付费计划中提高超时限制，
> 或考虑拆分为「创建任务 → 轮询结果」的异步模式（Phase 2 优化）。

---

## 🔧 本地开发

```bash
npm install
cp .env.local.example .env.local
# 填入 key
npm run dev
# 访问 http://localhost:3000
```

---

## 📁 项目结构

```
dashgen/
├── app/
│   ├── page.tsx                   # 落地页
│   ├── signup / login             # 注册/登录
│   ├── dashboard/page.tsx         # 报表历史列表
│   ├── generate/page.tsx          # 生成表单（核心）
│   ├── preview/[id]/page.tsx      # 预览 + 导出
│   └── api/
│       ├── generate/route.ts      # AI 生成接口 (Edge Runtime)
│       └── reports/[id]/route.ts  # CRUD (Edge Runtime)
├── lib/
│   ├── ai.ts                      # 多模型适配（加 OpenClaw 只需+5行）
│   ├── prompt.ts                  # Prompt 工程
│   ├── supabase.ts                # 浏览器端 Supabase
│   ├── supabase-server.ts         # Edge 兼容服务端 Supabase
│   └── utils.ts                   # 工具 + 指标预设
├── types/index.ts
├── supabase-schema.sql            # 建表 + RLS
├── supabase-rpc.sql               # 存储过程
├── wrangler.toml                  # Cloudflare 配置
└── vercel.json                    # (备用) Vercel 配置
```

---

## 💡 OpenClaw 接入只需3步

1. `.env.local` 中设置 `AI_PROVIDER=openclaw`
2. 填入 `OPENCLAW_API_KEY` 和 `OPENCLAW_BASE_URL`
3. `lib/ai.ts` 末尾加 `generateOpenClaw()` 函数（模板在上方）

**如果 OpenClaw 的 API 格式兼容 OpenAI（`/v1/chat/completions`）：**
直接设置 `AI_PROVIDER=openai`，把 `OPENAI_API_KEY` 换成 OpenClaw 的 key，
再加一行 `process.env.OPENAI_BASE_URL = 'https://api.openclaw.ai/v1'` 即可，
不需要改任何代码。

---

## 🔜 Phase 2 Roadmap

- [ ] 接入 Stripe / 国内支付（针对海外：Stripe）
- [ ] 异步生成（解决30s超时问题）：前端轮询 + Cloudflare Queue
- [ ] 在线编辑器（拖拽调整布局）
- [ ] PDF 导出（Cloudflare Browser Rendering API）
- [ ] 模板库 / 公开画廊
- [ ] 团队协作

---

## 📊 成本估算（每1000次生成）

| 模型 | 费用 |
|------|------|
| OpenClaw（你们自有） | 内部成本 |
| GPT-4o | ~$15–25 |
| Gemini 1.5 Pro | ~$5–10 |


## Tech Stack
- **Frontend/Backend**: Next.js 14 (App Router)
- **Database + Auth + Storage**: Supabase
- **AI**: OpenAI GPT-4o / Anthropic Claude / Google Gemini (pluggable)
- **Deployment**: Vercel

---

## 🚀 Deploy in 5 Steps

### Step 1 — Supabase Setup

1. Go to [supabase.com](https://supabase.com) → New project
2. Open **SQL Editor** → paste & run `supabase-schema.sql`
3. Open **SQL Editor** again → paste & run `supabase-rpc.sql`
4. Go to **Project Settings → API** → copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### Step 2 — Get your AI API Key

Choose one provider:
- **OpenAI**: [platform.openai.com](https://platform.openai.com) → API Keys → Create key
- **Anthropic**: [console.anthropic.com](https://console.anthropic.com) → API Keys
- **Gemini**: [aistudio.google.com](https://aistudio.google.com) → Get API Key

### Step 3 — Deploy to Vercel

1. Push this project to a GitHub repo
2. Go to [vercel.com](https://vercel.com) → New Project → Import your repo
3. Add **Environment Variables** (Settings → Environment Variables):

```
NEXT_PUBLIC_SUPABASE_URL        = your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY   = your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY       = your_service_role_key

# Choose one:
OPENAI_API_KEY                  = sk-...
# ANTHROPIC_API_KEY             = sk-ant-...
# GEMINI_API_KEY                = ...

AI_PROVIDER                     = openai   # or anthropic / gemini
AI_MODEL                        = gpt-4o   # or claude-opus-4-6 / gemini-1.5-pro

NEXT_PUBLIC_APP_URL             = https://your-app.vercel.app
FREE_GENERATION_LIMIT           = 3
```

4. Click **Deploy** → Done!

### Step 4 — Configure Supabase Auth

1. Supabase Dashboard → **Authentication → URL Configuration**
2. Set **Site URL**: `https://your-app.vercel.app`
3. Add **Redirect URLs**: `https://your-app.vercel.app/**`

### Step 5 — Test it

1. Open your deployed URL
2. Sign up for a new account
3. Click "New Dashboard"
4. Enter a title, select "Supply Chain", add 3-4 metrics
5. Click "Generate Dashboard" → wait ~30s → 🎉

---

## 🔧 Local Development

```bash
# 1. Clone and install
git clone <your-repo>
cd dashgen
npm install

# 2. Set up env
cp .env.local.example .env.local
# Fill in your keys

# 3. Run dev server
npm run dev
# Open http://localhost:3000
```

---

## 📁 Project Structure

```
dashgen/
├── app/
│   ├── page.tsx              # Landing page
│   ├── signup/page.tsx       # Sign up
│   ├── login/page.tsx        # Login
│   ├── dashboard/page.tsx    # My reports list
│   ├── generate/page.tsx     # Create new report (main form)
│   ├── preview/[id]/page.tsx # View & export report
│   └── api/
│       ├── generate/route.ts # AI generation endpoint
│       └── reports/[id]/route.ts
├── lib/
│   ├── ai.ts                 # Multi-provider AI adapter
│   ├── prompt.ts             # Prompt engineering
│   ├── supabase.ts           # Browser Supabase client
│   ├── supabase-server.ts    # Server Supabase client
│   └── utils.ts              # Helpers + metric suggestions
├── types/index.ts            # TypeScript types
├── supabase-schema.sql       # DB tables + RLS policies
├── supabase-rpc.sql          # Stored procedures
└── vercel.json               # Deployment config
```

---

## 💡 Switching AI Provider

Just change 2 env vars in Vercel:
```
AI_PROVIDER = anthropic
AI_MODEL    = claude-opus-4-6
```

No code changes needed — the adapter in `lib/ai.ts` handles all providers.

---

## 🔜 Phase 2 Roadmap

- [ ] Stripe subscription integration (Pro/Team plans)
- [ ] In-browser dashboard editor (drag & drop layout)
- [ ] PDF export via Puppeteer
- [ ] Public gallery / template library
- [ ] Team workspaces
- [ ] Webhook for generation completion notification
- [ ] Custom domain support

---

## 📊 Cost Estimate (per 1000 generations)

| Provider | Model | ~Cost |
|----------|-------|-------|
| OpenAI | GPT-4o | ~$15–25 |
| Anthropic | Claude Opus | ~$20–35 |
| Google | Gemini 1.5 Pro | ~$5–10 |

With Pro plan at $19/month × 50 gens/user, margin is healthy at any provider.

<!-- Build: 2026-03-30 -->
