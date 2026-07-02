# 商品浏览功能 实现计划

> **面向 AI 代理的工作者：** 必需子技能：使用 subagent-driven-development（推荐）或 executing-plans 逐任务实现此计划。步骤使用复选框（`- [ ]`）语法来跟踪进度。

**目标：** 实现 Step 5 商品浏览功能：商品列表 API、分类 API、商品卡片/网格/搜索/分页组件、首页改造、商品列表页

**架构：** 服务端 API（Prisma 查询 SQLite） + 客户端组件（URL 参数驱动搜索/筛选/分页），首页为服务端组件直接查库，`/products` 页为客户端组件调用 API

**技术栈：** Next.js 16 App Router, Prisma, TailwindCSS 4, TypeScript

---

## 文件变更清单

### 创建
| 文件 | 职责 |
|------|------|
| `src/types/index.ts` | 商品/分类/API 响应类型定义 |
| `src/app/api/categories/route.ts` | GET /api/categories — 全部分类 |
| `src/app/api/products/route.ts` | GET /api/products — 分页/搜索/筛选 |
| `src/components/product/ProductCard.tsx` | 单件商品卡片展示 |
| `src/components/product/ProductGrid.tsx` | 商品网格（含骨架屏/空状态） |
| `src/components/product/SearchBar.tsx` | 搜索输入 + 分类下拉（客户端） |
| `src/components/ui/Pagination.tsx` | 分页导航（客户端） |
| `src/app/products/page.tsx` | 商品列表页（搜索/筛选/分页） |

### 修改
| 文件 | 变更 |
|------|------|
| `src/app/page.tsx` | 替换占位内容为 Hero + 分类入口 + 新品推荐 |

---

### 任务 1：定义公共类型

**文件：**
- 创建：`src/types/index.ts`

- [ ] **步骤 1：创建类型文件**

```typescript
// src/types/index.ts — 公共类型定义

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  imageUrl: string;
  isPublished: boolean;
  categoryId: number;
  category: Category;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  products: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ProductWithCategory extends Product {
  category: Category;
}
```

- [ ] **步骤 2：验证无编译错误**

运行：`npx tsc --noEmit`
预期：无报错

- [ ] **步骤 3：Commit**

```bash
git add src/types/index.ts
git commit -m "feat: 添加商品浏览相关类型定义"
```

---

### 任务 2：创建 GET /api/categories

**文件：**
- 创建：`src/app/api/categories/route.ts`

- [ ] **步骤 1：实现分类列表 API**

```typescript
// src/app/api/categories/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { id: "asc" },
    });
    return NextResponse.json(categories);
  } catch {
    return NextResponse.json(
      { error: "获取分类失败" },
      { status: 500 }
    );
  }
}
```

- [ ] **步骤 2：启动开发服务器验证**

运行：`curl http://localhost:3001/api/categories`
预期：返回 JSON 数组，含 id/name/slug 字段

- [ ] **步骤 3：Commit**

```bash
git add src/app/api/categories/route.ts
git commit -m "feat: 添加分类列表 API"
```

---

### 任务 3：创建 GET /api/products

**文件：**
- 创建：`src/app/api/products/route.ts`

- [ ] **步骤 1：实现商品列表 API（分页+搜索+筛选）**

```typescript
// src/app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { Product, PaginatedResponse } from "@/types";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "12", 10)));

    // 构建查询条件：只查已发布商品
    const where: Record<string, unknown> = { isPublished: true };

    // 关键词模糊搜索
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { description: { contains: search } },
      ];
    }

    // 分类筛选
    if (categoryId) {
      where.categoryId = parseInt(categoryId, 10);
    }

    // 并行查询：总条数 + 当前页数据
    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        include: { category: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    const response: PaginatedResponse<Product> = {
      products: products as unknown as Product[],
      total,
      page,
      pageSize,
      totalPages,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      { error: "获取商品列表失败" },
      { status: 500 }
    );
  }
}
```

- [ ] **步骤 2：验证 API**

运行：`curl "http://localhost:3001/api/products?page=1&pageSize=2" | head -200`
预期：返回分页 JSON，含 products / total / page / totalPages

运行：`curl "http://localhost:3001/api/products?search=耳机" | head -200`
预期：返回含"无线蓝牙耳机"的结果

运行：`curl "http://localhost:3001/api/products?categoryId=1" | head -200`
预期：只返回"服装"分类的商品

- [ ] **步骤 3：Commit**

```bash
git add src/app/api/products/route.ts
git commit -m "feat: 添加商品列表 API（分页+搜索+分类筛选）"
```

---

### 任务 4：构建 ProductCard 组件

**文件：**
- 创建：`src/components/product/ProductCard.tsx`

- [ ] **步骤 1：实现商品卡片组件

```tsx
// src/components/product/ProductCard.tsx
import Link from "next/link";
import type { Product } from "@/types";

/** 格式化价格，保留两位小数 */
function formatPrice(price: number): string {
  return `¥${price.toFixed(2)}`;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link
      href={`/products/${product.id}`}
      className="group block overflow-hidden rounded-lg border bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      {/* 商品图片 */}
      <div className="aspect-square overflow-hidden bg-gray-100">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl text-gray-400">
            {product.name.charAt(0)}
          </div>
        )}
      </div>

      {/* 商品信息 */}
      <div className="p-3">
        {/* 分类标签 */}
        <span className="inline-block rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-600">
          {product.category.name}
        </span>

        {/* 商品名称 */}
        <h3 className="mt-1.5 text-sm font-medium text-gray-900 line-clamp-2">
          {product.name}
        </h3>

        {/* 价格 */}
        <p className="mt-2 text-base font-bold text-red-500">
          {formatPrice(product.price)}
        </p>

        {/* 加入购物车按钮（占位，Step 6 实现功能） */}
        <div className="mt-2 rounded-md bg-blue-600 py-1.5 text-center text-sm text-white transition-colors hover:bg-blue-700">
          加入购物车
        </div>
      </div>
    </Link>
  );
}
```

- [ ] **步骤 2：验证无编译错误**

运行：`npx tsc --noEmit`
预期：无报错

- [ ] **步骤 3：Commit**

```bash
git add src/components/product/ProductCard.tsx
git commit -m "feat: 添加商品卡片组件 ProductCard"
```

---

### 任务 5：构建 ProductGrid 组件

**文件：**
- 创建：`src/components/product/ProductGrid.tsx`

- [ ] **步骤 1：实现商品网格组件（含骨架屏和空状态）

```tsx
// src/components/product/ProductGrid.tsx
import type { Product } from "@/types";
import ProductCard from "./ProductCard";

interface ProductGridProps {
  products: Product[];
  loading?: boolean;
}

/** 骨架屏卡片：灰块模拟图片+文字 */
function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-lg border bg-white">
      <div className="aspect-square bg-gray-200" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-12 rounded bg-gray-200" />
        <div className="h-4 w-3/4 rounded bg-gray-200" />
        <div className="h-5 w-20 rounded bg-gray-200" />
        <div className="h-8 w-full rounded bg-gray-200" />
      </div>
    </div>
  );
}

export default function ProductGrid({ products, loading }: ProductGridProps) {
  // 加载中：显示 6 个骨架屏
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  // 空状态
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        <svg className="mb-4 h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
        <p className="text-lg">没有找到商品</p>
        <p className="mt-1 text-sm">换个关键词试试，或者清除筛选条件</p>
      </div>
    );
  }

  // 正常网格
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

- [ ] **步骤 2：验证无编译错误**

运行：`npx tsc --noEmit`
预期：无报错

- [ ] **步骤 3：Commit**

```bash
git add src/components/product/ProductGrid.tsx
git commit -m "feat: 添加商品网格组件 ProductGrid（含骨架屏和空状态）"
```

---

### 任务 6：构建 SearchBar 组件

**文件：**
- 创建：`src/components/product/SearchBar.tsx`

- [ ] **步骤 1：实现搜索栏组件（URL 参数驱动）

```tsx
// src/components/product/SearchBar.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Category } from "@/types";

interface SearchBarProps {
  categories: Category[];
}

export default function SearchBar({ categories }: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("search") || "";
  const currentCategory = searchParams.get("categoryId") || "";

  const [search, setSearch] = useState(currentSearch);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // 防抖搜索：输入暂停 500ms 后自动跳转
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (value) {
          params.set("search", value);
        } else {
          params.delete("search");
        }
        params.set("page", "1"); // 重置到第一页
        router.push(`/products?${params.toString()}`);
      }, 500);
    },
    [router, searchParams]
  );

  // 分类筛选：选中即跳转
  const handleCategoryChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set("categoryId", value);
      } else {
        params.delete("categoryId");
      }
      params.set("page", "1");
      router.push(`/products?${params.toString()}`);
    },
    [router, searchParams]
  );

  // 同步外部 URL 变化（如浏览器回退）
  useEffect(() => {
    setSearch(currentSearch);
  }, [currentSearch]);

  // 清除所有筛选
  const handleClear = useCallback(() => {
    setSearch("");
    router.push("/products");
  }, [router]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      {/* 搜索输入框 */}
      <div className="relative flex-1">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="搜索商品..."
          className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      </div>

      {/* 分类下拉 */}
      <select
        value={currentCategory}
        onChange={(e) => handleCategoryChange(e.target.value)}
        className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        <option value="">全部分类</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      {/* 有筛选条件时显示清除按钮 */}
      {(currentSearch || currentCategory) && (
        <button
          onClick={handleClear}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
        >
          清除筛选
        </button>
      )}
    </div>
  );
}
```

- [ ] **步骤 2：验证无编译错误**

运行：`npx tsc --noEmit`
预期：无报错

- [ ] **步骤 3：Commit**

```bash
git add src/components/product/SearchBar.tsx
git commit -m "feat: 添加搜索栏组件 SearchBar（URL 参数驱动 + 防抖）"
```

---

### 任务 7：构建 Pagination 组件

**文件：**
- 创建：`src/components/ui/Pagination.tsx`

- [ ] **步骤 1：实现分页组件

```tsx
// src/components/ui/Pagination.tsx
"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";

interface PaginationProps {
  page: number;
  totalPages: number;
}

export default function Pagination({ page, totalPages }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // 跳转到指定页
  const goToPage = useCallback(
    (p: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(p));
      router.push(`/products?${params.toString()}`);
    },
    [router, searchParams]
  );

  // 只有一页时不显示分页
  if (totalPages <= 1) return null;

  // 生成页码列表：当前页前后各 2 页 + 首尾页 + 省略号
  const getPageNumbers = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];
    const delta = 2;
    const left = Math.max(2, page - delta);
    const right = Math.min(totalPages - 1, page + delta);

    pages.push(1);
    if (left > 2) pages.push("...");
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="mt-8 flex items-center justify-center gap-1">
      {/* 上一页 */}
      <button
        onClick={() => goToPage(page - 1)}
        disabled={page <= 1}
        className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
      >
        上一页
      </button>

      {/* 页码 */}
      {pageNumbers.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}`} className="px-2 text-gray-400">
            ...
          </span>
        ) : (
          <button
            key={p}
            onClick={() => goToPage(p)}
            className={`rounded-md px-3 py-1.5 text-sm ${
              p === page
                ? "bg-blue-600 text-white"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {p}
          </button>
        )
      )}

      {/* 下一页 */}
      <button
        onClick={() => goToPage(page + 1)}
        disabled={page >= totalPages}
        className="rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-300"
      >
        下一页
      </button>
    </div>
  );
}
```

- [ ] **步骤 2：验证无编译错误**

运行：`npx tsc --noEmit`
预期：无报错

- [ ] **步骤 3：Commit**

```bash
git add src/components/ui/Pagination.tsx
git commit -m "feat: 添加分页组件 Pagination"
```

---

### 任务 8：改造首页

**文件：**
- 修改：`src/app/page.tsx`

- [ ] **步骤 1：实现首页（Hero + 分类入口 + 新品推荐）

```tsx
// src/app/page.tsx
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductGrid from "@/components/product/ProductGrid";
import type { Product } from "@/types";

/** 分类配置：id 对应数据库中的分类 id */
const CATEGORIES = [
  { id: 1, name: "服装", slug: "clothing", icon: "👕" },
  { id: 2, name: "电子产品", slug: "electronics", icon: "📱" },
  { id: 3, name: "家居用品", slug: "home", icon: "🏠" },
  { id: 4, name: "食品饮料", slug: "food", icon: "🍜" },
  { id: 5, name: "图书", slug: "books", icon: "📚" },
  { id: 6, name: "运动户外", slug: "sports", icon: "🏃" },
] as const;

export default async function Home() {
  // 查询最新 4 件已发布商品
  const newProducts = await prisma.product.findMany({
    where: { isPublished: true },
    include: { category: true },
    orderBy: { createdAt: "desc" },
    take: 4,
  });

  return (
    <div>
      {/* Hero Banner */}
      <section className="-mx-4 mb-8 bg-gradient-to-r from-blue-500 to-blue-700 px-4 py-16 text-white sm:rounded-lg sm:mx-0">
        <div className="text-center">
          <h1 className="text-3xl font-bold sm:text-4xl">Mini Mall 精选好物</h1>
          <p className="mt-3 text-lg text-blue-100">
            精选商品，品质生活，从 Mini Mall 开始
          </p>
          <Link
            href="/products"
            className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-medium text-blue-600 shadow transition-colors hover:bg-blue-50"
          >
            逛逛商品
          </Link>
        </div>
      </section>

      {/* 分类快速入口 */}
      <section className="mb-8">
        <h2 className="mb-4 text-lg font-bold text-gray-900">商品分类</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?categoryId=${cat.id}`}
              className="flex flex-col items-center rounded-lg border bg-white p-4 transition-shadow hover:shadow-md"
            >
              <span className="text-2xl">{cat.icon}</span>
              <span className="mt-2 text-sm text-gray-700">{cat.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 新品推荐 */}
      <section>
        <h2 className="mb-4 text-lg font-bold text-gray-900">新品推荐</h2>
        <ProductGrid products={newProducts as unknown as Product[]} />
      </section>
    </div>
  );
}
```

- [ ] **步骤 2：验证页面渲染**

访问 `http://localhost:3001/`，确认 Hero 区域、6 个分类入口、4 个新品卡片正常显示

- [ ] **步骤 3：Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: 改造首页（Hero + 分类入口 + 新品推荐）"
```

---

### 任务 9：创建 /products 商品列表页

**文件：**
- 创建：`src/app/products/page.tsx`

- [ ] **步骤 1：实现商品列表页（搜索/筛选/分页）

```tsx
// src/app/products/page.tsx
import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import ProductListContent from "./ProductListContent";
import type { Category } from "@/types";

export default async function ProductsPage() {
  // 服务端获取分类列表供筛选使用
  const categories = await prisma.category.findMany({
    orderBy: { id: "asc" },
  });

  return (
    <div className="py-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">全部商品</h1>
      <Suspense>
        <ProductListContent categories={categories as unknown as Category[]} />
      </Suspense>
    </div>
  );
}
```

- [ ] **步骤 2：创建 ProductListContent 客户端组件

```tsx
// src/app/products/ProductListContent.tsx
"use client";

import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import SearchBar from "@/components/product/SearchBar";
import ProductGrid from "@/components/product/ProductGrid";
import Pagination from "@/components/ui/Pagination";
import type { Category, PaginatedResponse, Product } from "@/types";

interface ProductListContentProps {
  categories: Category[];
}

/** SWR fetcher */
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ProductListContent({ categories }: ProductListContentProps) {
  const searchParams = useSearchParams();

  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const page = searchParams.get("page") || "1";

  // 拼接 API 查询参数
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (categoryId) params.set("categoryId", categoryId);
  params.set("page", page);

  const { data, error, isLoading } = useSWR<PaginatedResponse<Product>>(
    `/api/products?${params.toString()}`,
    fetcher
  );

  // 错误状态
  if (error) {
    return (
      <div>
        <SearchBar categories={categories} />
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <p className="text-lg">加载失败</p>
          <p className="mt-1 text-sm">请检查网络后重试</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SearchBar categories={categories} />

      <div className="mt-6">
        <ProductGrid products={data?.products || []} loading={isLoading} />
      </div>

      {data && (
        <Pagination page={data.page} totalPages={data.totalPages} />
      )}
    </div>
  );
}
```

- [ ] **步骤 3：验证无编译错误并检查页面**

运行：`npx tsc --noEmit`
预期：无报错

访问 `http://localhost:3001/products`，确认搜索框、分类下拉、商品网格、分页正常

访问 `http://localhost:3001/products?search=耳机`，确认搜索过滤正常

访问 `http://localhost:3001/products?categoryId=1`，确认分类筛选正常

- [ ] **步骤 4：Commit**

```bash
git add src/app/products/page.tsx src/app/products/ProductListContent.tsx
git commit -m "feat: 添加商品列表页（搜索/筛选/分页）"
```

---

### 任务 10：安装 swr 依赖

注意到 ProductListContent 使用了 `swr` 作为数据请求库。

- [ ] **步骤 1：安装 swr**

```bash
npm install swr
```

- [ ] **步骤 2：验证安装**

运行：`npx tsc --noEmit`
预期：无报错

- [ ] **步骤 3：Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: 添加 swr 依赖"
```

---

## 验证清单

1. `npm run dev` 无编译错误
2. `curl /api/categories` 返回 6 个分类
3. `curl /api/products` 返回分页商品
4. `curl /api/products?search=耳机` 匹配正确
5. `curl /api/products?categoryId=1` 只返回服装类
6. 首页显示 Hero、6 个分类入口、4 个商品卡片
7. `/products` 页搜索/分类筛选/分页联动正常
8. 空搜索结果显示空状态
9. 分页在仅 1 页时隐藏
