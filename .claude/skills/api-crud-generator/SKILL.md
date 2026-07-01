---
name: api-crud-generator
version: 1.0
description: 根据 Prisma 模型生成标准的 Next.js API Route + 前端管理页面
trigger: ["生成CRUD", "生成接口", "生成管理页面"]
---

# API CRUD 生成器

## 功能说明
根据指定的 Prisma 模型，自动生成标准的管理后台 CRUD 代码：
1. API Routes（5 个）：GET 列表、GET 详情、POST 创建、PUT 更新、DELETE 删除
2. 前端页面：数据列表页、创建/编辑表单

## 执行步骤

### 第 1 步：确认模型信息
询问用户：
- 要生成的模型名称（如 Product、Category）
- API 路径（如 /api/admin/products）
- 页面路由（如 /admin/products）

### 第 2 步：生成 API Route Handlers
按照标准模板生成以下文件：
1. `route.ts` — GET 列表 + POST 创建
2. `[id]/route.ts` — GET 详情 + PUT 更新 + DELETE 删除

### 第 3 步：生成前端管理页面
生成一个包含以下功能的管理页面：
- 数据表格（列出所有字段）
- "新增"按钮 + 表单
- 每行的"编辑"和"删除"按钮
- TailwindCSS 样式

### 第 4 步：确认并验证
- 列出所有生成的文件
- 提醒用户执行 npx prisma generate（如果模型有变更）
- 给出测试方法

## 注意事项
- 所有 UI 文案使用中文
- 使用 Next.js App Router 的 params 语法
- 创建和更新前做输入验证
- 密码字段永远不通过 API 返回