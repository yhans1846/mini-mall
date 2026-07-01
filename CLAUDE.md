# Mini Mall

微型电商平台，基于 Next.js 16 全栈开发。

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript |
| 数据库 | SQLite (Prisma ORM) |
| 样式 | TailwindCSS 4 |
| 认证 | next-auth v5 (Credentials + JWT) |
| 加密 | bcryptjs |
| 校验 | zod |

## 目录结构

```
src/
├── app/
│   ├── api/            # API 路由
│   │   ├── auth/       # next-auth
│   │   ├── products/   # 商品查询
│   │   ├── cart/       # 购物车
│   │   ├── orders/     # 订单
│   │   └── admin/      # 后台管理
│   ├── layout.tsx      # 根布局
│   ├── page.tsx        # 首页
│   ├── products/       # 商品浏览
│   ├── cart/           # 购物车
│   ├── orders/         # 订单管理
│   ├── auth/           # 登录注册
│   ├── member/         # 会员中心
│   └── admin/          # 后台管理
├── components/
│   ├── layout/         # Header / Footer / AdminSidebar
│   ├── product/        # 商品卡片、网格、搜索
│   ├── cart/           # 购物车项、汇总
│   ├── order/          # 订单卡片
│   ├── admin/          # 商品表单、分类表单
│   └── ui/             # 分页、确认弹窗
├── lib/
│   ├── prisma.ts       # Prisma 客户端单例
│   ├── auth.ts         # next-auth 配置
│   ├── validations.ts  # zod 校验规则
│   └── utils.ts        # 通用工具函数
└── types/
    └── index.ts        # 类型定义
```

## 数据模型

6 个模型：User / Category / Product / CartItem / Order / OrderItem

详见 [prisma/schema.prisma](prisma/schema.prisma)

### 核心设计要点

- **价格快照**：`OrderItem.price` 存下单时单价，商品调价不影响历史订单
- **购物车去重**：`@@unique([userId, productId])` 同一用户同一商品只保留一条
- **软发布**：`Product.isPublished` 控制前台可见性
- **角色**：`User.role` 区分 USER / ADMIN，用于路由守卫和 API 鉴权
- **会员折扣**：`Order.originalAmount`（原价） + `discountRate`（折扣率快照） + `totalAmount`（折后实付）

## 心悦会员等级

| 等级 | 名称 | 累计消费门槛 | 折扣 |
|------|------|-------------|------|
| 0 | 普通会员 | 默认 | 无 |
| 1 | 心悦1级 | ≥ ¥8,000 | 9.8折 |
| 2 | 心悦2级 | ≥ ¥80,000 | 9.5折 |
| 3 | 心悦3级 | ≥ ¥800,000 | 9折 |

- 累计消费基于已支付订单（PAID / SHIPPED / COMPLETED）的实付金额
- 等级只升不降
- 下单时取当前等级对应折扣率，写入 `Order.discountRate` 快照

## 路由设计

### 前台

| 路由 | 页面 |
|------|------|
| `/` | 首页（商品列表、搜索、分类筛选） |
| `/products/[id]` | 商品详情 |
| `/cart` | 购物车 |
| `/orders` | 我的订单列表 |
| `/orders/[id]` | 订单详情 |
| `/auth/login` | 登录 |
| `/auth/register` | 注册 |
| `/member` | 会员中心 |

### 后台（需 ADMIN）

| 路由 | 页面 |
|------|------|
| `/admin` | 仪表盘 |
| `/admin/products` | 商品管理 |
| `/admin/products/new` | 新增商品 |
| `/admin/products/[id]/edit` | 编辑商品 |
| `/admin/orders` | 订单管理 |
| `/admin/orders/[id]` | 订单详情 |
| `/admin/categories` | 分类管理 |

## API

- **公开**: `GET /api/products`（分页/搜索/筛选）、`GET /api/products/[id]`
- **需登录**: 购物车 CRUD、订单 CRUD、`/api/member`
- **需 ADMIN**: `/api/admin/products/*`、`/api/admin/orders/*`、`/api/admin/categories/*`

## 开发命令

```bash
npm run dev        # 启动开发服务器
npm run build      # 构建生产版本
npm run db:push    # 同步 Prisma schema 到数据库
npm run db:studio  # 打开 Prisma Studio
npm run db:seed    # 运行种子数据
```

## 业务流程

1. 注册/登录 → 浏览商品 → 加入购物车
2. 结算 → 会员折扣自动计算 → 创建订单（PENDING）
3. 模拟支付 → 订单变 PAID → 累计消费更新 → 等级自动升级
4. 后台管理订单状态流转

## 实现顺序

1. ✅ 项目初始化（已完成）
2. □ 数据模型 + 建表 + 种子数据
3. □ 认证系统（next-auth + 登录注册页面）
4. □ 公共布局（Header / Footer）
5. □ 商品浏览（列表、详情、搜索、分类筛选）
6. □ 商品详情页 + 加入购物车
7. □ 购物车功能
8. □ 下单流程 + 会员折扣
9. □ 会员中心
10. □ 我的订单
11. □ 后台管理
12. □ 中间件与权限守卫

<!-- superpowers-zh:begin (do not edit between these markers) -->
# Superpowers-ZH 中文增强版

本项目已安装 superpowers-zh 技能框架（20 个 skills）。

## 核心规则

1. **收到任务时，先检查是否有匹配的 skill** — 哪怕只有 1% 的可能性也要检查
2. **设计先于编码** — 收到功能需求时，先用 brainstorming skill 做需求分析
3. **测试先于实现** — 写代码前先写测试（TDD）
4. **验证先于完成** — 声称完成前必须运行验证命令

## 可用 Skills

Skills 位于 `.claude/skills/` 目录，每个 skill 有独立的 `SKILL.md` 文件。

- **brainstorming**: 在任何创造性工作之前必须使用此技能——创建功能、构建组件、添加功能或修改行为。在实现之前先探索用户意图、需求和设计。
- **chinese-code-review**: 中文 review 沟通参考——话术模板、分级标注（必须修复/建议修改/仅供参考）、国内团队常见反模式应对。仅在用户显式 /chinese-code-review 时调用，不要根据上下文自动触发。
- **chinese-commit-conventions**: 中文 commit 与 changelog 配置参考——Conventional Commits 中文适配、commitlint/husky/commitizen 中文模板、conventional-changelog 中文配置。仅在用户显式 /chinese-commit-conventions 时调用，不要根据上下文自动触发。
- **chinese-documentation**: 中文文档排版参考——中英文空格、全半角标点、术语保留、链接格式、中文文案排版指北约定。仅在用户显式 /chinese-documentation 时调用，不要根据上下文自动触发。
- **chinese-git-workflow**: 国内 Git 平台配置参考——Gitee、Coding.net、极狐 GitLab、CNB 的 SSH/HTTPS/凭据/CI 接入差异与镜像同步配置。仅在用户显式 /chinese-git-workflow 时调用，不要根据上下文自动触发。
- **dispatching-parallel-agents**: 当面对 2 个以上可以独立进行、无共享状态或顺序依赖的任务时使用
- **executing-plans**: 当你有一份书面实现计划需要在单独的会话中执行，并设有审查检查点时使用
- **finishing-a-development-branch**: 当实现完成、所有测试通过、需要决定如何集成工作时使用——通过提供合并、PR 或清理等结构化选项来引导开发工作的收尾
- **mcp-builder**: MCP 服务器构建方法论 — 系统化构建生产级 MCP 工具，让 AI 助手连接外部能力
- **receiving-code-review**: 收到代码审查反馈后、实施建议之前使用，尤其当反馈不明确或技术上有疑问时——需要技术严谨性和验证，而非敷衍附和或盲目执行
- **requesting-code-review**: 完成任务、实现重要功能或合并前使用，用于验证工作成果是否符合要求
- **subagent-driven-development**: 当在当前会话中执行包含独立任务的实现计划时使用
- **systematic-debugging**: 遇到任何 bug、测试失败或异常行为时使用，在提出修复方案之前执行
- **test-driven-development**: 在实现任何功能或修复 bug 时使用，在编写实现代码之前
- **using-git-worktrees**: 当需要开始与当前工作区隔离的功能开发，或在执行实现计划之前使用——通过原生工具或 git worktree 回退机制确保隔离工作区存在
- **using-superpowers**: 在开始任何对话时使用——确立如何查找和使用技能，要求在任何响应（包括澄清性问题）之前调用 Skill 工具
- **verification-before-completion**: 在宣称工作完成、已修复或测试通过之前使用，在提交或创建 PR 之前——必须运行验证命令并确认输出后才能声称成功；始终用证据支撑断言
- **workflow-runner**: 在 Claude Code / OpenClaw / Cursor 中直接运行 agency-orchestrator YAML 工作流——无需 API key，使用当前会话的 LLM 作为执行引擎。当用户提供 .yaml 工作流文件或要求多角色协作完成任务时触发。
- **writing-plans**: 当你有规格说明或需求用于多步骤任务时使用，在动手写代码之前
- **writing-skills**: 当创建新技能、编辑现有技能或在部署前验证技能是否有效时使用

## 如何使用

当任务匹配某个 skill 时，使用 `Skill` 工具加载对应 skill 并严格遵循其流程。绝不要用 Read 工具读取 SKILL.md 文件。

如果你认为哪怕只有 1% 的可能性某个 skill 适用于你正在做的事情，你必须调用该 skill 检查。
<!-- superpowers-zh:end -->
