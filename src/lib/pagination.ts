// =============================================
// 分页工具函数
// =============================================

export interface PaginationOptions {
  page: number;
  pageSize: number;
  total: number;
  groupSize?: number; // 每组显示多少个页码
}

export interface PaginationResult {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
  pages: (number | 'ellipsis')[];
  startIndex: number;
  endIndex: number;
  offset: number;
}

// 默认分组大小
const DEFAULT_GROUP_SIZE = 5;

// 计算偏移量
export function getOffset(page: number, pageSize: number): number {
  return Math.max(0, (page - 1) * pageSize);
}

// 获取分页信息
export function getPagination(options: PaginationOptions): PaginationResult {
  const { page, pageSize, total, groupSize = DEFAULT_GROUP_SIZE } = options;
  
  const totalPages = Math.ceil(total / pageSize);
  const validPage = Math.min(Math.max(1, page), totalPages || 1);
  const offset = getOffset(validPage, pageSize);
  
  // 计算显示的页码数组
  const pages = generatePageNumbers(validPage, totalPages, groupSize);
  
  // 计算当前页的起始和结束索引
  const startIndex = (validPage - 1) * pageSize + 1;
  const endIndex = Math.min(validPage * pageSize, total);
  
  return {
    page: validPage,
    pageSize,
    total,
    totalPages,
    hasPrev: validPage > 1,
    hasNext: validPage < totalPages,
    pages,
    startIndex,
    endIndex,
    offset,
  };
}

// 生成页码数组
function generatePageNumbers(
  current: number,
  total: number,
  groupSize: number
): (number | 'ellipsis')[] {
  if (total <= groupSize) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }
  
  const pages: (number | 'ellipsis')[] = [];
  
  // 计算当前组
  const currentGroup = Math.floor((current - 1) / groupSize);
  const totalGroups = Math.ceil(total / groupSize);
  
  // 计算当前组的起始和结束页码
  const groupStart = currentGroup * groupSize + 1;
  const groupEnd = Math.min(groupStart + groupSize - 1, total);
  
  // 添加省略号（如果前面有更多页）
  if (currentGroup > 0) {
    pages.push(1);
    if (currentGroup > 1) {
      pages.push('ellipsis');
    }
  }
  
  // 添加当前组的页码
  for (let i = groupStart; i <= groupEnd; i++) {
    pages.push(i);
  }
  
  // 添加省略号（如果后面有更多页）
  if (currentGroup < totalGroups - 1) {
    if (currentGroup < totalGroups - 2) {
      pages.push('ellipsis');
    }
    pages.push(total);
  }
  
  return pages;
}

// 生成中文数字页码
export function getChineseNumber(n: number): string {
  const chineseNumbers = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  
  if (n <= 10) {
    return chineseNumbers[n];
  }
  
  if (n < 20) {
    return `十${chineseNumbers[n - 10]}`;
  }
  
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    return `${chineseNumbers[tens]}十${ones === 0 ? '' : chineseNumbers[ones]}`;
  }
  
  return String(n);
}

// 获取中文页码标签（用于显示）
export function getPageLabel(page: number, totalPages: number): string {
  if (totalPages <= 10) {
    return getChineseNumber(page);
  }
  
  const groupSize = 5;
  const currentGroup = Math.floor((page - 1) / groupSize);
  return `${getChineseNumber(currentGroup + 1)}`;
}

// 生成分页 URL
export function getPageUrl(path: string, page: number): string {
  const url = new URL(path, 'http://localhost');
  url.searchParams.set('page', String(page));
  return url.pathname + url.searchParams.toString();
}

// 解析分页参数
export function parsePageParam(param: string | null): number {
  const page = parseInt(param || '1', 10);
  return isNaN(page) || page < 1 ? 1 : page;
}

// 按年份分组
export interface YearGroup<T> {
  year: number;
  items: T[];
  count: number;
}

// 按年份分组列表（用于日志归档）
export function groupByYear<T extends { createdAt: Date | string | number }>(
  items: T[]
): YearGroup<T>[] {
  const groups = new Map<number, T[]>();
  
  items.forEach(item => {
    const date = new Date(item.createdAt);
    const year = date.getFullYear();
    
    if (!groups.has(year)) {
      groups.set(year, []);
    }
    groups.get(year)!.push(item);
  });
  
  return Array.from(groups.entries())
    .sort((a, b) => b[0] - a[0]) // 降序排列
    .map(([year, yearItems]) => ({
      year,
      items: yearItems,
      count: yearItems.length,
    }));
}

// 按年份分组并分页（每 N 个年份为 1 页）
export function groupByYearPaginated<T extends { createdAt: Date | string | number }>(
  items: T[],
  page: number,
  groupSize: number = 5
): {
  groups: YearGroup<T>[];
  totalGroups: number;
  currentPage: number;
  hasMore: boolean;
} {
  const yearGroups = groupByYear(items);
  const totalGroups = Math.ceil(yearGroups.length / groupSize);
  const validPage = Math.min(Math.max(1, page), totalGroups || 1);
  
  const startIndex = (validPage - 1) * groupSize;
  const endIndex = startIndex + groupSize;
  
  return {
    groups: yearGroups.slice(startIndex, endIndex),
    totalGroups,
    currentPage: validPage,
    hasMore: validPage < totalGroups,
  };
}

// 获取分页导航信息
export function getPaginationNav(
  page: number,
  totalPages: number,
  groupSize: number = 5
): {
  prevPage: number | null;
  nextPage: number | null;
  pages: (number | 'ellipsis')[];
  currentGroup: number;
  totalGroups: number;
} {
  const prevPage = page > 1 ? page - 1 : null;
  const nextPage = page < totalPages ? page + 1 : null;
  const pages = generatePageNumbers(page, totalPages, groupSize);
  const currentGroup = Math.floor((page - 1) / groupSize);
  const totalGroups = Math.ceil(totalPages / groupSize);
  
  return {
    prevPage,
    nextPage,
    pages,
    currentGroup,
    totalGroups,
  };
}

// 导出类型
export type { PaginationParams, PaginatedResult } from './db';
