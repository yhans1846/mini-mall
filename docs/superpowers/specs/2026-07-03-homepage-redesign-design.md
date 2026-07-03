# 首页改版设计文档

> 首页全面优化，参考主流电商风格，提升专业感和品质感。

## 背景

当前首页只有 Hero 轮播 + "新品推荐"一行文字，内容空洞，缺乏电商首页应有的信息密度和引导性。

## 设计方案

采用**主流电商风格**（方案 B），共 6 个区块从上到下滚动排列：

```
① Hero 轮播        → 已有，保持
② 分类入口         → 6 个渐变彩色圆角图标
③ 限时秒杀         → 倒计时 + 横滑商品卡片
④ 热销排行         → 销量 Top 8
⑤ 新品上架         → 最新 8 个商品网格
⑥ 品牌故事         → 简约底部介绍
```

## 区块详情

### ① Hero 轮播

- **状态**：已有组件 `HeroCarousel.tsx`，无需修改
- **位置**：页面顶部全宽

### ② 分类入口

- **数据**：从 `/api/categories` 获取 6 个分类
- **样式**：每个分类配渐变彩色圆角图标 + 文字标签
- **交互**：点击跳转 `/products?categoryId=X`
- **组件**：新建 `CategoryNav.tsx`

### ③ 限时秒杀

- **数据模型变更**：
  - Product 表新增 `originalPrice`（原价，Float?，可选）
  - Product 表新增 `isFlashSale`（是否秒杀，Boolean，默认 false）
- **数据获取**：从 `/api/products?flashSale=true&pageSize=8` 获取秒杀商品
- **展示**：横滑列表，每张卡片显示折扣标签（-XX%）、原价/秒杀价、已抢进度条
- **倒计时**：客户端定时器，截止到当日 23:59:59，跨日自动重置
- **"更多 →"**：跳转 `/products`

### ④ 热销排行

- **数据**：从 OrderItem 聚合累计销量，取 Top 8（无销量数据时按创建时间倒序兜底）
- **API**：`GET /api/products?sort=sales&pageSize=8`
- **展示**：2 列网格，每项显示排名数字（1-3 名彩色，4+ 名灰色）、商品名、价格
- **"更多 →"**：跳转 `/products`

### ⑤ 新品上架

- **数据**：按 `createdAt` 倒序，取最新 8 个
- **API**：`GET /api/products?sort=newest&pageSize=8`
- **展示**：4 列网格，复用 `ProductCard` 组件
- **"更多 →"**：跳转 `/products`

### ⑥ 品牌故事

- **展示**：简约底部区域，居中排版
- **内容**：品牌名 + Slogan + 简介 + 数据统计（商品数、分类数、正品保障）
- **组件**：静态内容，商品数和分类数硬编码（变化不频繁，避免多余的 API 调用）

## 数据模型变更

```prisma
model Product {
  // ... 已有字段保持不变 ...
  originalPrice  Float?   // 原价（用于秒杀显示折扣）
  isFlashSale    Boolean  @default(false) // 是否秒杀商品
}
```

## API 变更

`GET /api/products` 新增查询参数：

| 参数 | 类型 | 说明 |
|------|------|------|
| `sort` | `"newest"` \| `"sales"` | 排序方式 |
| `flashSale` | `boolean` | 筛选秒杀商品 |
| `pageSize` | `number` | 每页条数（已有，增加默认值逻辑） |

- `sort=sales`：按 OrderItem 聚合销量降序
- `sort=newest`：按 createdAt 降序
- `flashSale=true`：筛选 `isFlashSale=true` 的商品

## 种子数据更新

- 为 20-30 个商品设置 `originalPrice`（比 price 高 20%-50%）和 `isFlashSale=true`
- 已有 200 个商品，确保有足够的订单数据支撑热销排行

## 组件结构

```
src/components/home/
├── HeroCarousel.tsx   # 已有，不改
├── CategoryNav.tsx    # 新建：分类图标入口
├── FlashSale.tsx      # 新建：限时秒杀
├── HotRanking.tsx     # 新建：热销排行
└── BrandStory.tsx     # 新建：品牌故事

src/app/(main)/page.tsx  # 改造：组装所有区块
```

## 依赖关系

所有区块都是独立组件，无共享状态。首页服务端组件并行获取各区块数据，传给客户端组件渲染。

## 测试

- 各区块 API 数据获取正常
- 限时秒杀倒计时：初始值、归零状态
- 热销排行：有订单数据时显示正常；无订单时显示 "暂无数据"
- 首页整体加载性能
