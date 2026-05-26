-- =============================================
-- 岁月博客 - D1 数据库完整 Schema
-- Cloudflare D1 / SQLite 语法
-- =============================================

-- =============================================
-- 1. 用户表（管理员）
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  avatar TEXT,
  role TEXT DEFAULT 'user' CHECK(role IN ('admin', 'user')),
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER
);

-- =============================================
-- 2. 站点配置表
-- =============================================
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  type TEXT DEFAULT 'string' CHECK(type IN ('string', 'number', 'boolean', 'json')),
  description TEXT,
  updated_at INTEGER DEFAULT (unixepoch())
);

-- =============================================
-- 3. 文章分类
-- =============================================
CREATE TABLE IF NOT EXISTS log_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);

-- =============================================
-- 4. 文章表
-- =============================================
CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  category_id TEXT REFERENCES log_categories(id) ON DELETE SET NULL,
  category_name TEXT,
  cover_image TEXT,
  permission TEXT DEFAULT 'public' CHECK(permission IN ('public', 'encrypted', 'private')),
  password TEXT,
  status TEXT DEFAULT 'published' CHECK(status IN ('published', 'draft')),
  is_pinned INTEGER DEFAULT 0,
  is_deleted INTEGER DEFAULT 0,
  weather TEXT,
  mood TEXT,
  tags TEXT,
  view_count INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER
);

-- =============================================
-- 5. 文章附件
-- =============================================
CREATE TABLE IF NOT EXISTS post_attachments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  path TEXT NOT NULL,
  size INTEGER,
  mime_type TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

-- =============================================
-- 6. 相册分类
-- =============================================
CREATE TABLE IF NOT EXISTS album_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  permission TEXT DEFAULT 'public',
  created_at INTEGER DEFAULT (unixepoch())
);

-- =============================================
-- 7. 相册表
-- =============================================
CREATE TABLE IF NOT EXISTS albums (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  cover TEXT,
  category_id TEXT REFERENCES album_categories(id) ON DELETE SET NULL,
  category_name TEXT,
  photo_count INTEGER DEFAULT 0,
  permission TEXT DEFAULT 'public' CHECK(permission IN ('public', 'encrypted', 'private')),
  password TEXT,
  is_deleted INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER
);

-- =============================================
-- 8. 照片表
-- =============================================
CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  album_id TEXT NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  path TEXT NOT NULL,
  thumbnail TEXT,
  caption TEXT,
  width INTEGER,
  height INTEGER,
  exif TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);

-- =============================================
-- 9. 网盘分类
-- =============================================
CREATE TABLE IF NOT EXISTS drive_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  permission TEXT DEFAULT 'public',
  created_at INTEGER DEFAULT (unixepoch())
);

-- =============================================
-- 10. 文件表
-- =============================================
CREATE TABLE IF NOT EXISTS files (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  path TEXT NOT NULL,
  description TEXT,
  category_id TEXT REFERENCES drive_categories(id) ON DELETE SET NULL,
  category_name TEXT,
  size INTEGER,
  mime_type TEXT,
  extension TEXT,
  permission TEXT DEFAULT 'public' CHECK(permission IN ('public', 'encrypted', 'private')),
  password TEXT,
  download_count INTEGER DEFAULT 0,
  is_deleted INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);

-- =============================================
-- 11. 导航分类
-- =============================================
CREATE TABLE IF NOT EXISTS nav_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  permission TEXT DEFAULT 'public',
  created_at INTEGER DEFAULT (unixepoch())
);

-- =============================================
-- 12. 导航站点
-- =============================================
CREATE TABLE IF NOT EXISTS nav_sites (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  favicon TEXT,
  category_id TEXT REFERENCES nav_categories(id) ON DELETE SET NULL,
  category_name TEXT,
  sort_order INTEGER DEFAULT 0,
  permission TEXT DEFAULT 'public',
  is_deleted INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);

-- =============================================
-- 13. 留言板
-- =============================================
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  user_name TEXT NOT NULL,
  email TEXT,
  content TEXT NOT NULL,
  is_private INTEGER DEFAULT 0,
  is_replied INTEGER DEFAULT 0,
  reply_content TEXT,
  reply_time INTEGER,
  ip_hash TEXT,
  user_agent TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

-- =============================================
-- 14. 评论表（文章/相册/网盘评论）
-- =============================================
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  target_type TEXT NOT NULL CHECK(target_type IN ('post', 'album', 'file')),
  target_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  email TEXT,
  content TEXT NOT NULL,
  is_replied INTEGER DEFAULT 0,
  reply_content TEXT,
  reply_time INTEGER,
  ip_hash TEXT,
  user_agent TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

-- =============================================
-- 15. 主人寄语
-- =============================================
CREATE TABLE IF NOT EXISTS host_message (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  content TEXT NOT NULL,
  signature TEXT DEFAULT '主人敬上',
  updated_at INTEGER DEFAULT (unixepoch())
);

-- =============================================
-- 16. 待办清单
-- =============================================
CREATE TABLE IF NOT EXISTS todos (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'done')),
  priority TEXT DEFAULT 'normal' CHECK(priority IN ('low', 'normal', 'high')),
  due_date TEXT,
  completed_at INTEGER,
  created_at INTEGER DEFAULT (unixepoch())
);

-- =============================================
-- 17. OpenList 存储实例
-- =============================================
CREATE TABLE IF NOT EXISTS storage_instances (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  api_url TEXT NOT NULL,
  token TEXT NOT NULL,
  root_path TEXT DEFAULT '/',
  is_active INTEGER DEFAULT 1,
  is_default INTEGER DEFAULT 0,
  total_space INTEGER,
  used_space INTEGER,
  description TEXT,
  created_at INTEGER DEFAULT (unixepoch()),
  updated_at INTEGER
);

-- =============================================
-- 18. 业务存储映射
-- =============================================
CREATE TABLE IF NOT EXISTS storage_mappings (
  id TEXT PRIMARY KEY,
  business TEXT NOT NULL UNIQUE CHECK(business IN ('post', 'album', 'drive', 'nav')),
  instance_id TEXT NOT NULL REFERENCES storage_instances(id),
  root_path TEXT NOT NULL,
  auto_archive INTEGER DEFAULT 1,
  updated_at INTEGER DEFAULT (unixepoch())
);

-- =============================================
-- 19. 操作日志（审计）
-- =============================================
CREATE TABLE IF NOT EXISTS admin_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_name TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  target_name TEXT,
  details TEXT,
  ip TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

-- =============================================
-- 20. 会话表（可选，用于管理登录会话）
-- =============================================
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at INTEGER NOT NULL,
  ip TEXT,
  user_agent TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

-- =============================================
-- 索引优化
-- =============================================

-- 文章索引
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category_id);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_permission ON posts(permission);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_pinned ON posts(is_pinned DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_deleted ON posts(is_deleted);

-- 相册索引
CREATE INDEX IF NOT EXISTS idx_albums_category ON albums(category_id);
CREATE INDEX IF NOT EXISTS idx_albums_created ON albums(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_albums_permission ON albums(permission);

-- 照片索引
CREATE INDEX IF NOT EXISTS idx_photos_album ON photos(album_id);
CREATE INDEX IF NOT EXISTS idx_photos_sort ON photos(sort_order, created_at DESC);

-- 文件索引
CREATE INDEX IF NOT EXISTS idx_files_category ON files(category_id);
CREATE INDEX IF NOT EXISTS idx_files_created ON files(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_files_permission ON files(permission);

-- 导航索引
CREATE INDEX IF NOT EXISTS idx_nav_sites_category ON nav_sites(category_id);
CREATE INDEX IF NOT EXISTS idx_nav_sites_permission ON nav_sites(permission);

-- 留言/评论索引
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_target ON comments(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_comments_created ON comments(created_at DESC);

-- 会话索引
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

-- =============================================
-- 初始数据
-- =============================================

-- 默认管理员（密码：admin123，需要首次登录后修改）
INSERT OR IGNORE INTO users (id, name, email, password_hash, role) VALUES
  ('admin', '博主', 'admin@example.com', '$2a$10$placeholder_hash_replace_me', 'admin');

-- 默认主人寄语
INSERT OR IGNORE INTO host_message (id, content, signature) VALUES
  (1, '来者皆是客，不必拘礼。\n留下一言半语，便是缘分。', '主人敬上');

-- 默认设置
INSERT OR IGNORE INTO settings (key, value, type, description) VALUES
  ('blog_title', '三十而立', 'string', '博客标题'),
  ('blog_subtitle', '记录 · 沉淀 · 回忆', 'string', '博客副标题'),
  ('blog_description', '记录三十岁以后的生活琐碎。没有算法推荐，没有红点通知，只有一方安静的岁月自留地。', 'string', '博客描述'),
  ('posts_per_page', '10', 'number', '每页文章数'),
  ('albums_per_page', '12', 'number', '每页相册数'),
  ('files_per_page', '20', 'number', '每页文件数'),
  ('enable_comment', 'true', 'boolean', '是否开启评论'),
  ('enable_guestbook', 'true', 'boolean', '是否开启留言板'),
  ('timezone', 'Asia/Shanghai', 'string', '时区设置'),
  ('site_url', '', 'string', '网站地址');
