---
layout: '../layouts/BookLayout.astro'
title: '博客系统 - 岁月博客'
---

# 岁月博客

基于 Astro + Cloudflare Pages + D1 + OpenList 构建的复古风格博客系统。

## 技术栈

- **框架**: Astro 4.x + SSR
- **部署**: Cloudflare Pages
- **数据库**: Cloudflare D1
- **存储**: OpenList
- **样式**: Tailwind CSS

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

```bash
cp .env.example .env
# 编辑 .env 填入配置
```

### 3. 创建 D1 数据库

在 Cloudflare Dashboard 创建 D1 数据库，然后：

```bash
# 本地开发
wrangler d1 execute blog-db --local --file=./drizzle/*.sql

# 推送到远程
wrangler d1 execute blog-db --remote --file=./drizzle/*.sql
```

### 4. 启动开发服务器

```bash
npm run dev
```

### 5. 部署

```bash
npm run deploy
```

## 目录结构

```
src/
├── components/     # 组件
├── layouts/       # 布局
├── pages/        # 页面
│   ├── admin/    # 后台管理
│   ├── api/     # API 接口
│   ├── log/     # 日志模块
│   ├── album/   # 相册模块
│   └── drive/   # 网盘模块
└── lib/         # 工具库
```

## 功能

- [x] 前台页面（首页/日志/相册/网盘/导航/归档/留言）
- [x] 后台管理（仪表盘/文章/相册/网盘/导航/留言/设置）
- [x] AI 辅助写作（错别字检查/标题推荐/润色/续写）
- [x] OpenList 文件存储
- [x] D1 数据库
- [x] 用户认证

## 许可证

MIT
