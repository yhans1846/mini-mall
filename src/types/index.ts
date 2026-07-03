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
  isFlashSale: boolean;
  originalPrice: number | null;
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
