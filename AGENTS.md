# 岁月博客 - 开发规范

## 项目概述

基于 Astro + Cloudflare Pages + D1 + OpenList 构建的复古风格个人博客系统。

## 技术栈

| 组件 | 技术 |
|------|------|
| 框架 | Astro 4.x + SSR |
| 部署 | Cloudflare Pages |
| 数据库 | Cloudflare D1 |
| 存储 | OpenList |
| AI | DeepSeek / Kimi / 豆包 |
| 样式 | Tailwind CSS |

## 目录结构

```
blog/
├── src/
│   ├── components/           # 公共组件
│   │   ├── Sidebar.astro    # 前台侧边栏
│   │   └── Pagination.astro  # 分页组件
│   ├── layouts/              # 页面布局
│   │   ├── BaseLayout.astro # 基础布局
│   │   ├── BookLayout.astro # 书本布局（前台）
│   │   └── AdminLayout.astro # 后台布局
│   ├── pages/               # 页面
│   │   ├── admin/          # 后台管理
│   │   │   ├── login.astro  # 登录页
│   │   │   ├── index.astro # 仪表盘
│   │   │   ├── log/        # 文章管理
│   │   │   ├── album/      # 相册管理
│   │   │   ├── drive/      # 网盘管理
│   │   │   ├── nav/        # 导航管理
│   │   │   ├── message/    # 留言管理
│   │   │   ├── todo/       # 待办管理
│   │   │   └── settings/   # 系统设置
│   │   ├── api/            # API 接口
│   │   │   ├── auth.ts     # 认证
│   │   │   ├── logs.ts     # 日志 CRUD
│   │   │   ├── ai.ts       # AI 功能
│   │   │   └── upload.ts   # 文件上传
│   │   ├── log/           # 前台日志
│   │   ├── album/         # 前台相册
│   │   ├── drive/         # 前台网盘
│   │   ├── index.astro    # 首页
│   │   ├── nav.astro      # 导航页
│   │   ├── archive.astro   # 归档页
│   │   ├── guestbook.astro # 留言板
│   │   └── todo.astro     # 待办页
│   ├── lib/               # 工具库
│   │   ├── schema.ts     # 数据库表定义
│   │   ├── db.ts         # 数据库操作
│   │   ├── auth.ts       # 认证逻辑
│   │   ├── ai.ts         # AI 集成
│   │   ├── openlist.ts   # OpenList 集成
│   │   └── pagination.ts # 分页工具
│   └── styles/
│       ├── global.css    # 全局样式
│       └── admin.css     # 后台样式
├── drizzle/              # 数据库迁移
│   └── schema.sql        # DDL
├── wrangler.toml         # Cloudflare 配置
└── drizzle.config.ts     # ORM 配置
```

## 数据库

### D1 表结构

- `users` - 用户表
- `settings` - 站点配置
- `posts` - 文章表
- `post_categories` - 文章分类
- `post_attachments` - 文章附件
- `albums` - 相册表
- `album_categories` - 相册分类
- `photos` - 照片表
- `drive_files` - 网盘文件
- `drive_categories` - 网盘分类
- `nav_sites` - 导航站点
- `nav_categories` - 导航分类
- `messages` - 留言表
- `todos` - 待办表
- `storage_instances` - 存储实例

### 初始化命令

```bash
# 本地
wrangler d1 execute blog-db --local --file=./drizzle/*.sql

# 远程
wrangler d1 execute blog-db --remote --file=./drizzle/*.sql
```

## 环境变量

```bash
SITE_TITLE=三十而立
OPENLIST_API_URL=https://openlist.example.com/api
OPENLIST_TOKEN=xxx
AI_API_URL=https://api.deepseek.com
AI_API_KEY=sk-xxx
JWT_SECRET=xxx
```

## 开发命令

```bash
npm run dev      # 开发服务器
npm run build    # 构建
npm run deploy   # 部署
```

## 设计规范

### 颜色

- 主色: `#8b3a3a` (印泥红)
- 桌面: `#cfc6b5`
- 书脊: `#2c2a29`
- 羊皮纸: `#f7f1e3`

### 字体

- 标题: 霞鹜文楷 / serif
- 正文: 宋体 / serif

### 权限类型

- `public` - 公开
- `encrypted` - 加密（需密码）
- `private` - 私有（仅管理员）
