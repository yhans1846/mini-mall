# 首页改版实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 superpowers:subagent-driven-development（推荐）或 superpowers:executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 将首页从空白的轮播+一行文字，改造成主流电商风格的信息密集型首页

**架构：** 服务端组件组装 6 个区块，数据通过 API 路由获取，每个区块为独立客户端组件

**技术栈：** Next.js 16 App Router、Prisma、TailwindCSS 4、SWR

---

## 文件清单

| 操作 | 文件 | 职责 |
|------|------|------|
| 修改 | `prisma/schema.prisma` | Product 表加 originalPrice / isFlashSale |
| 修改 | `prisma/seed-products.js` | 更新种子数据：设置秒杀商品和销量 |
| 修改 | `src/app/api/products/route.ts` | 增加 sort 和 flashSale 查询参数 |
| 创建 | `src/components/home/CategoryNav.tsx` | 分类图标入口 |
| 创建 | `src/components/home/FlashSale.tsx` | 限时秒杀（倒计时+横滑卡片） |
| 创建 | `src/components/home/HotRanking.tsx` | 热销排行 Top 8 |
| 创建 | `src/components/home/BrandStory.tsx` | 品牌故事底部区块 |
| 修改 | `src/app/(main)/page.tsx` | 组装所有区块 |
| 修改 | `.gitignore` | 添加 .superpowers/ |

---

### 任务 1：Prisma Schema — 添加秒杀字段

**文件：**
- 修改：`prisma/schema.prisma:32-40`（Product 模型区域）

- [ ] **步骤 1：修改 Product 模型**

在 `prisma/schema.prisma` 的 Product 模型中，在 `isPublished` 后面添加两个字段：

```prisma
model Product {
  id          Int         @id @default(autoincrement())
  name        String
  description String      @default("")
  price       Float
  originalPrice Float?    // 原价（用于秒杀显示折扣）
  isFlashSale Boolean    @default(false) // 是否秒杀商品
  stock       Int         @default(0)
  imageUrl    String      @default("")
  isPublished Boolean     @default(true)
  categoryId  Int
  category    Category    @relation(fields: [categoryId], references: [id])
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt
  cartItems   CartItem[]
  orderItems  OrderItem[]
}
```

- [ ] **步骤 2：同步数据库**

```bash
cd e:/WorkSpace/VibeCoding/mini-mall && npx prisma db push
```

预期输出：`Your database is now in sync with your Prisma schema.`

- [ ] **步骤 3：更新类型定义（可选）**

如果 `src/types/index.ts` 中有 Product 类型定义，添加 `originalPrice?` 和 `isFlashSale` 字段。

---

### 任务 2：种子数据 — 秒杀商品和销量数据

**文件：**
- 修改：`prisma/seed-products.js`

- [ ] **步骤 1：更新种子数据**

在 `prisma/seed-products.js` 中，为商品数组的前 30 个商品添加秒杀字段，并为其他商品随机设置 originalPrice：

```javascript
// 在创建 product 时，为前 30 个设 isFlashSale
// 核心改动：product 创建数据增加 originalPrice 和 isFlashSale
// 示例：
const products = [];
for (let i = 1; i <= 200; i++) {
  const price = getRandomPrice(categoryIndex); // 保持现有逻辑
  products.push({
    name: productNames[i - 1],
    description: `这是${productNames[i - 1]}的描述...`,
    price: price,
    originalPrice: i <= 30 ? Math.round(price * (1.3 + Math.random() * 0.4) * 100) / 100 : null,
    isFlashSale: i <= 30,
    stock: Math.floor(Math.random() * 200) + 10,
    imageUrl: "",
    isPublished: true,
    categoryId: categoryIds[categoryIndex],
  });
}
```

无需改动 Order 种子数据 — 已有的种子订单足够支撑热销排行显示。

---

### 任务 3：API — 增加排序和秒杀筛选

**文件：**
- 修改：`src/app/api/products/route.ts`

- [ ] **步骤 1：扩展查询参数**

在 `GET` 处理函数中，增加 `sort` 和 `flashSale` 参数处理：

```typescript
// src/app/api/products/route.ts — GET handler
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const sort = searchParams.get("sort") || "";        // "newest" | "sales" | ""
  const flashSale = searchParams.get("flashSale") || ""; // "true" | ""

  // 筛选条件
  const where: any = { isPublished: true };

  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
    ];
  }

  if (categoryId) {
    where.categoryId = parseInt(categoryId);
  }

  if (flashSale === "true") {
    where.isFlashSale = true;
  }

  // 排序
  let orderBy: any = { id: "desc" }; // 默认

  if (sort === "newest") {
    orderBy = { createdAt: "desc" };
  } else if (sort === "sales") {
    // 按销量排序：先聚合 OrderItem，再排序
    // 使用原始 SQL 太复杂，这里使用简单方案：先查所有商品，再按订单量排序
    // 如果查询中同时需要 sales 排序和分页，用两步法：
    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        // 不跳过，取全部再排序 — 对于 Top 8 查询是合理的
        // 对于分页查询，复杂度在可控范围内（最多 200 个商品）
      }),
      prisma.product.count({ where }),
    ]);

    // 聚合销量
    const orderItems = await prisma.orderItem.groupBy({
      by: ["productId"],
      _sum: { quantity: true },
    });

    const salesMap = new Map(orderItems.map((o) => [o.productId, o._sum.quantity || 0]));

    // 按销量降序，没销量的按 id 降序
    products.sort((a, b) => {
      const sa = salesMap.get(a.id) || 0;
      const sb = salesMap.get(b.id) || 0;
      if (sa !== sb) return sb - sa;
      return b.id - a.id;
    });

    const skip = (page - 1) * pageSize;
    const paginatedProducts = products.slice(skip, skip + pageSize);

    return NextResponse.json({
      products: paginatedProducts,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  }

  // 非 sales 排序走正常分页
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return NextResponse.json({
    products,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
```

---

### 任务 4：CategoryNav 组件

**文件：**
- 创建：`src/components/home/CategoryNav.tsx`

- [ ] **步骤 1：创建 CategoryNav 组件**

```tsx
// src/components/home/CategoryNav.tsx — 分类图标入口
"use client";

import Link from "next/link";

interface Category {
  id: number;
  name: string;
  slug?: string;
}

interface CategoryNavProps {
  categories: Category[];
}

const CATEGORY_ICONS: Record<string, string> = {
  "服装": "👕", "电子产品": "📱", "家居用品": "🏠",
  "食品饮料": "🍜", "图书": "📚", "运动户外": "🏃",
};

const GRADIENTS: Record<string, string> = {
  "服装": "linear-gradient(135deg,#667eea,#764ba2)",
  "电子产品": "linear-gradient(135deg,#4facfe,#00f2fe)",
  "家居用品": "linear-gradient(135deg,#43e97b,#38f9d7)",
  "食品饮料": "linear-gradient(135deg,#f093fb,#f5576c)",
  "图书": "linear-gradient(135deg,#fa709a,#fee140)",
  "运动户外": "linear-gradient(135deg,#a18cd1,#fbc2eb)",
};

const DEFAULT_GRADIENT = "linear-gradient(135deg,#667eea,#764ba2)";

export default function CategoryNav({ categories }: CategoryNavProps) {
  return (
    <section className="py-4">
      <div className="flex items-center justify-center gap-4 sm:gap-6">
        {categories.map((cat) => {
          const icon = CATEGORY_ICONS[cat.name] || "📦";
          const gradient = GRADIENTS[cat.name] || DEFAULT_GRADIENT;
          return (
            <Link
              key={cat.id}
              href={`/products?categoryId=${cat.id}`}
              className="flex flex-col items-center gap-1.5 transition-transform hover:scale-105"
            >
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl text-xl text-white shadow-sm sm:h-14 sm:w-14 sm:text-2xl"
                style={{ background: gradient }}
              >
                {icon}
              </div>
              <span className="text-xs font-medium text-gray-600 sm:text-sm">
                {cat.name}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
```

---

### 任务 5：FlashSale 组件

**文件：**
- 创建：`src/components/home/FlashSale.tsx`

- [ ] **步骤 1：创建 FlashSale 组件**

```tsx
// src/components/home/FlashSale.tsx — 限时秒杀
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

interface FlashProduct {
  id: number;
  name: string;
  price: number;
  originalPrice: number | null;
  imageUrl: string;
}

interface FlashSaleProps {
  products: FlashProduct[];
}

/** 计算距当日结束的秒数 */
function getRemainingSeconds(): number {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);
  return Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000));
}

/** 格式化倒计时 */
function formatCountdown(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function FlashSale({ products }: FlashSaleProps) {
  const [seconds, setSeconds] = useState(getRemainingSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(getRemainingSeconds());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 没有秒杀商品时隐藏
  if (!products || products.length === 0) return null;

  return (
    <section className="py-4">
      {/* 标题栏 */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="rounded bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
            限时秒杀
          </span>
          <span className="text-xs text-gray-400">距结束</span>
          <span className="rounded bg-gray-900 px-1.5 py-0.5 font-mono text-sm font-bold text-white">
            {formatCountdown(seconds)}
          </span>
        </div>
        <Link href="/products" className="text-xs text-blue-600 hover:underline">
          更多 →
        </Link>
      </div>

      {/* 商品横滑 */}
      <div className="-mx-1 flex gap-3 overflow-x-auto pb-2">
        {products.map((p) => {
          const discount = p.originalPrice
            ? Math.round((1 - p.price / p.originalPrice) * 100)
            : 0;
          return (
            <Link
              key={p.id}
              href={`/products/${p.id}`}
              className="min-w-[140px] flex-shrink-0 overflow-hidden rounded-lg border border-gray-100 bg-white sm:min-w-[160px]"
            >
              <div className="relative aspect-square bg-gray-50">
                {p.originalPrice && (
                  <span className="absolute left-1.5 top-1.5 z-10 rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    -{discount}%
                  </span>
                )}
                <img
                  src={p.imageUrl}
                  alt={p.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="p-2">
                <div className="truncate text-xs font-medium text-gray-700">
                  {p.name}
                </div>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="text-sm font-bold text-red-500">
                    ¥{p.price.toFixed(2)}
                  </span>
                  {p.originalPrice && (
                    <span className="text-[10px] text-gray-400 line-through">
                      ¥{p.originalPrice.toFixed(2)}
                    </span>
                  )}
                </div>
                {/* 进度条 */}
                <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-400"
                    style={{ width: `${Math.min(95, Math.floor(Math.random() * 70 + 20))}%` }}
                  />
                </div>
                <div className="mt-0.5 text-[10px] text-gray-400">
                  已抢 {Math.floor(Math.random() * 50 + 30)}%
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
```

---

### 任务 6：HotRanking 组件

**文件：**
- 创建：`src/components/home/HotRanking.tsx`

- [ ] **步骤 1：创建 HotRanking 组件**

```tsx
// src/components/home/HotRanking.tsx — 热销排行
"use client";

import Link from "next/link";

interface HotProduct {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  _salesCount?: number;
}

interface HotRankingProps {
  products: HotProduct[];
}

const RANK_COLORS = [
  "linear-gradient(135deg,#e53935,#ff6f00)", // 1st
  "linear-gradient(135deg,#ff9800,#ffc107)", // 2nd
  "linear-gradient(135deg,#4caf50,#8bc34a)", // 3rd
];

export default function HotRanking({ products }: HotRankingProps) {
  if (!products || products.length === 0) return null;

  const displayProducts = products.slice(0, 8);

  return (
    <section className="py-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-base font-bold text-gray-900">🔥 热销排行</span>
        <Link href="/products" className="text-xs text-blue-600 hover:underline">
          更多 →
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {displayProducts.map((p, idx) => (
          <Link
            key={p.id}
            href={`/products/${p.id}`}
            className="flex items-center gap-3 rounded-lg border border-gray-100 bg-white p-2.5 transition-shadow hover:shadow-sm sm:p-3"
          >
            {/* 排名 */}
            <div
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white sm:h-10 sm:w-10"
              style={{
                background:
                  idx < 3
                    ? RANK_COLORS[idx]
                    : "#e0e0e0",
                color: idx < 3 ? "white" : "#666",
              }}
            >
              {idx + 1}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium text-gray-700 sm:text-sm">
                {p.name}
              </div>
              <div className="mt-0.5 text-xs font-bold text-red-500 sm:text-sm">
                ¥{p.price.toFixed(2)}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

---

### 任务 7：BrandStory 组件

**文件：**
- 创建：`src/components/home/BrandStory.tsx`

- [ ] **步骤 1：创建 BrandStory 组件**

```tsx
// src/components/home/BrandStory.tsx — 品牌故事
export default function BrandStory() {
  return (
    <section className="py-8">
      <div className="rounded-2xl bg-gradient-to-r from-blue-50 via-white to-blue-50 px-6 py-10 text-center">
        <div className="text-2xl font-bold text-blue-600">Mini Mall</div>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-gray-400">
          精选好物 · 用心服务
        </p>
        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-gray-500">
          每一件商品都经过精心挑选，只为给你更好的购物体验。
          <br />
          从品质到服务，我们用心做好每一件事。
        </p>
        <div className="mt-6 flex items-center justify-center gap-10">
          <div>
            <div className="text-xl font-bold text-blue-600">200+</div>
            <div className="mt-0.5 text-xs text-gray-400">精选商品</div>
          </div>
          <div>
            <div className="text-xl font-bold text-blue-600">6</div>
            <div className="mt-0.5 text-xs text-gray-400">商品分类</div>
          </div>
          <div>
            <div className="text-xl font-bold text-blue-600">100%</div>
            <div className="mt-0.5 text-xs text-gray-400">正品保障</div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

---

### 任务 8：首页组装

**文件：**
- 修改：`src/app/(main)/page.tsx`

- [ ] **步骤 1：重写首页**

```tsx
// src/app/(main)/page.tsx — 首页（服务端组件）
import { prisma } from "@/lib/prisma";
import HeroCarousel from "@/components/home/HeroCarousel";
import CategoryNav from "@/components/home/CategoryNav";
import FlashSale from "@/components/home/FlashSale";
import HotRanking from "@/components/home/HotRanking";
import BrandStory from "@/components/home/BrandStory";

export default async function Home() {
  // 并行获取数据
  const [categories, flashProducts, hotProducts] = await Promise.all([
    prisma.category.findMany({ orderBy: { id: "asc" } }),
    // 秒杀商品
    prisma.product.findMany({
      where: { isPublished: true, isFlashSale: true },
      take: 8,
    }),
    // 热销商品：先聚合销量
    (async () => {
      const products = await prisma.product.findMany({
        where: { isPublished: true },
      });
      const orderItems = await prisma.orderItem.groupBy({
        by: ["productId"],
        _sum: { quantity: true },
      });
      const salesMap = new Map(orderItems.map((o) => [o.productId, o._sum.quantity || 0]));
      products.sort((a, b) => {
        const sa = salesMap.get(a.id) || 0;
        const sb = salesMap.get(b.id) || 0;
        if (sa !== sb) return sb - sa;
        return b.id - a.id;
      });
      return products.slice(0, 8);
    })(),
  ]);

  return (
    <div>
      <HeroCarousel />
      <CategoryNav categories={categories} />
      <FlashSale products={flashProducts} />
      <HotRanking products={hotProducts} />
      <BrandStory />
    </div>
  );
}
```

---

### 任务 9：Git 清理

**文件：**
- 修改：`.gitignore`

- [ ] **步骤 1：添加 .superpowers/ 到 .gitignore**

在 `.gitignore` 末尾添加：

```
# brainstorm prototypes
.superpowers/
```

---

## 规格覆盖检查

| 规格需求 | 对应任务 |
|----------|----------|
| Product 加 originalPrice / isFlashSale | 任务 1 |
| 种子数据更新 | 任务 2 |
| API 增加 sort 和 flashSale 参数 | 任务 3 |
| 分类图标入口 | 任务 4 |
| 限时秒杀（倒计时+横滑） | 任务 5 |
| 热销排行 Top 8 | 任务 6 |
| 品牌故事 | 任务 7 |
| 首页组装 | 任务 8 |
| .superpowers/ 忽略 | 任务 9 |

无遗漏。
