# 商品浏览功能设计

## 概述

实现商品浏览功能，包括首页营销展示、商品列表搜索/筛选/分页。

## API 设计

### GET /api/products

商品列表查询接口，公开访问。

| 参数 | 类型 | 默认 | 说明 |
|------|------|------|------|
| `search` | string | - | 模糊匹配 name/description |
| `categoryId` | number | - | 分类筛选 |
| `page` | number | 1 | 页码 |
| `pageSize` | number | 12 | 每页条数 |

返回：

```json
{
  "products": [
    {
      "id": 1,
      "name": "经典纯棉T恤",
      "description": "100% 纯棉面料...",
      "price": 99,
      "stock": 200,
      "imageUrl": "/images/products/t-shirt.jpg",
      "categoryId": 1,
      "category": { "id": 1, "name": "服装", "slug": "clothing" },
      "createdAt": "2026-07-01T00:00:00.000Z"
    }
  ],
  "total": 16,
  "page": 1,
  "pageSize": 12,
  "totalPages": 2
}
```

### GET /api/categories

返回全部分类列表，公开访问。

```json
[
  { "id": 1, "name": "服装", "slug": "clothing" },
  { "id": 2, "name": "电子产品", "slug": "electronics" }
]
```

## 组件设计

### ProductCard

| 属性 | 类型 | 说明 |
|------|------|------|
| product | Product | 商品数据 |

- 展示：图片、名称、价格（¥xx.xx 格式）、分类标签
- 点击整张卡片跳转 `/products/[id]`
- 底部预留"加入购物车"按钮区域（Step 6 实现）
- 无图片时显示占位灰色块 + 商品名首字

### ProductGrid

| 属性 | 类型 | 说明 |
|------|------|------|
| products | Product[] | 商品列表 |
| loading | boolean | 是否加载中 |

- CSS Grid：`grid-cols-2 md:grid-cols-3 lg:grid-cols-4`
- `loading=true` 时渲染 6 个骨架屏卡片（animate-pulse）
- 空数组且非 loading 时显示"没有找到商品"空状态
- 首页"新品推荐"区域复用此组件（不带分页）

### SearchBar

| 属性 | 类型 | 说明 |
|------|------|------|
| categories | Category[] | 分类列表 |

- 搜索输入框 + 分类下拉 + 搜索按钮
- URL 参数驱动（客户端组件，useRouter + useSearchParams）
- 输入防抖 500ms 后自动跳转 URL
- 分类下拉选中即跳转
- 搜索按钮点击立即跳转

### Pagination

| 属性 | 类型 | 说明 |
|------|------|------|
| page | number | 当前页 |
| totalPages | number | 总页数 |
| basePath | string | 基础路径（默认 `/products`） |

- 上一页 / 页码列表 / 下一页
- 页码列表显示前后各 2 页 + 首尾页 + 省略号
- 点击通过 URL search params 跳转
- 仅 1 页时隐藏

## 页面设计

### 首页（改造 `app/page.tsx`）

区块布局：

1. **Hero Banner** — 大标题 "Mini Mall 精选好物" + 副标题 + "逛逛商品"按钮跳转 `/products`
2. **分类快速入口** — 6 个分类卡片（图标用 emoji/文字），点击跳转 `/products?categoryId=X`
3. **新品推荐** — 取最新 4 件已发布商品，用 ProductGrid 展示（不带动画），标题"新品推荐"

首页为服务端组件，直接通过 Prisma 查询数据。

### 商品列表页（`app/products/page.tsx`）

- 客户端组件，从 URL 读取 search/categoryId/page 参数
- 通过 `GET /api/products` 获取数据
- 加载中显示骨架屏
- 空结果显示"没有找到匹配的商品" + "清除筛选"按钮
- 筛选栏固定，响应式布局

## 数据流

```
用户操作 → URL searchParams 变化 → 请求 /api/products → 渲染 ProductGrid
                                    ↓
                        Prisma 查询 SQLite → 返回 JSON
```

搜索/筛选/分页全部通过 URL 参数驱动，保证可分享和可回退。

## 错误处理

- API 请求失败：显示"加载失败，请重试" + 重试按钮
- 网络错误：catch 后显示错误状态，不崩溃页面
- 空数据：空状态组件（含引导操作）

## 未纳入范围（此步骤不做）

- 加入购物车功能（Step 6）
- 商品排序（后续可加）
- 图片上传/管理
- 价格区间筛选
