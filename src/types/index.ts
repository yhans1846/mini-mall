// src/types/index.ts — 公共类型定义

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface SpecItem {
  key: string;
  value: string;
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
  brand: string;
  subtitle: string;
  images: string[];
  specs: SpecItem[];
  tags: string[];
  videoUrl: string;
  origin: string;
  weight: number | null;
  createdAt: string;
  flashSale?: FlashSaleInfo | null;
  salesCount?: number;
}

export interface FlashSaleInfo {
  flashPrice: number;
  flashStock: number;
  endTime: string;
}

export interface FlashSale {
  id: number;
  productId: number;
  flashPrice: number;
  flashStock: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  product: Product;
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
