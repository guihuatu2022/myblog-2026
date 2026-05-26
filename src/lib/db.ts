import { drizzle } from 'drizzle-orm/d1';
import * as schema from './schema';
import type { D1Database } from '@cloudflare/workers-types';

// 创建 D1 数据库实例
export function createDb(d1: D1Database) {
  return drizzle(d1, { schema });
}

// 数据库实例类型
export type Db = ReturnType<typeof createDb>;

// 分页参数类型
export interface PaginationParams {
  page: number;
  pageSize: number;
}

// 分页结果类型
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

// 创建分页结果
export function createPaginatedResult<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / pageSize);
  return {
    items,
    total,
    page,
    pageSize,
    totalPages,
    hasMore: page < totalPages,
  };
}

// 获取分页偏移量
export function getOffset(page: number, pageSize: number): number {
  return (page - 1) * pageSize;
}

// 默认分页参数
export const DEFAULT_PAGINATION: PaginationParams = {
  page: 1,
  pageSize: 20,
};

// 结果响应类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 创建成功响应
export function successResponse<T>(data: T, message?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    message,
  };
}

// 创建错误响应
export function errorResponse(error: string): ApiResponse {
  return {
    success: false,
    error,
  };
}

// 导出 schema
export { schema };
