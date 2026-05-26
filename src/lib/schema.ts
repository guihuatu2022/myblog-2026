import { sqliteTable, text, integer, index } from 'drizzle-orm/sqlite-core';

// =============================================
// 用户表
// =============================================
export const users = sqliteTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  avatar: text('avatar'),
  role: text('role', { enum: ['admin', 'user'] }).default('user'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

// =============================================
// 站点配置表
// =============================================
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
  type: text('type', { enum: ['string', 'number', 'boolean', 'json'] }).default('string'),
  description: text('description'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// =============================================
// 文章分类
// =============================================
export const logCategories = sqliteTable('log_categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  sortOrder: integer('sort_order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// =============================================
// 文章表
// =============================================
export const posts = sqliteTable('posts', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  content: text('content').notNull(),
  excerpt: text('excerpt'),
  categoryId: text('category_id').references(() => logCategories.id, { onDelete: 'set null' }),
  categoryName: text('category_name'),
  coverImage: text('cover_image'),
  permission: text('permission', { enum: ['public', 'encrypted', 'private'] }).default('public'),
  password: text('password'),
  status: text('status', { enum: ['published', 'draft'] }).default('published'),
  isPinned: integer('is_pinned', { mode: 'boolean' }).default(false),
  isDeleted: integer('is_deleted', { mode: 'boolean' }).default(false),
  weather: text('weather'),
  mood: text('mood'),
  tags: text('tags'),
  viewCount: integer('view_count').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
}, (table) => [
  index('idx_posts_category').on(table.categoryId),
  index('idx_posts_status').on(table.status),
  index('idx_posts_permission').on(table.permission),
  index('idx_posts_created').on(table.createdAt),
]);

// =============================================
// 文章附件
// =============================================
export const postAttachments = sqliteTable('post_attachments', {
  id: text('id').primaryKey(),
  postId: text('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  path: text('path').notNull(),
  size: integer('size'),
  mimeType: text('mime_type'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// =============================================
// 相册分类
// =============================================
export const albumCategories = sqliteTable('album_categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  sortOrder: integer('sort_order').default(0),
  permission: text('permission', { enum: ['public', 'encrypted', 'private'] }).default('public'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// =============================================
// 相册表
// =============================================
export const albums = sqliteTable('albums', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').unique(),
  description: text('description'),
  cover: text('cover'),
  categoryId: text('category_id').references(() => albumCategories.id, { onDelete: 'set null' }),
  categoryName: text('category_name'),
  photoCount: integer('photo_count').default(0),
  permission: text('permission', { enum: ['public', 'encrypted', 'private'] }).default('public'),
  password: text('password'),
  isDeleted: integer('is_deleted', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
}, (table) => [
  index('idx_albums_category').on(table.categoryId),
  index('idx_albums_created').on(table.createdAt),
]);

// =============================================
// 照片表
// =============================================
export const photos = sqliteTable('photos', {
  id: text('id').primaryKey(),
  albumId: text('album_id').notNull().references(() => albums.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  originalName: text('original_name').notNull(),
  path: text('path').notNull(),
  thumbnail: text('thumbnail'),
  caption: text('caption'),
  width: integer('width'),
  height: integer('height'),
  exif: text('exif'),
  sortOrder: integer('sort_order').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => [
  index('idx_photos_album').on(table.albumId),
]);

// =============================================
// 网盘分类
// =============================================
export const driveCategories = sqliteTable('drive_categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  icon: text('icon'),
  description: text('description'),
  sortOrder: integer('sort_order').default(0),
  permission: text('permission', { enum: ['public', 'encrypted', 'private'] }).default('public'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// =============================================
// 文件表
// =============================================
export const files = sqliteTable('files', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  originalName: text('original_name').notNull(),
  path: text('path').notNull(),
  description: text('description'),
  categoryId: text('category_id').references(() => driveCategories.id, { onDelete: 'set null' }),
  categoryName: text('category_name'),
  size: integer('size'),
  mimeType: text('mime_type'),
  extension: text('extension'),
  permission: text('permission', { enum: ['public', 'encrypted', 'private'] }).default('public'),
  password: text('password'),
  downloadCount: integer('download_count').default(0),
  isDeleted: integer('is_deleted', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => [
  index('idx_files_category').on(table.categoryId),
  index('idx_files_created').on(table.createdAt),
]);

// =============================================
// 导航分类
// =============================================
export const navCategories = sqliteTable('nav_categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  icon: text('icon'),
  sortOrder: integer('sort_order').default(0),
  permission: text('permission', { enum: ['public', 'encrypted', 'private'] }).default('public'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// =============================================
// 导航站点
// =============================================
export const navSites = sqliteTable('nav_sites', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  url: text('url').notNull(),
  description: text('description'),
  icon: text('icon'),
  favicon: text('favicon'),
  categoryId: text('category_id').references(() => navCategories.id, { onDelete: 'set null' }),
  categoryName: text('category_name'),
  sortOrder: integer('sort_order').default(0),
  permission: text('permission', { enum: ['public', 'encrypted', 'private'] }).default('public'),
  isDeleted: integer('is_deleted', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => [
  index('idx_nav_sites_category').on(table.categoryId),
]);

// =============================================
// 留言板
// =============================================
export const messages = sqliteTable('messages', {
  id: text('id').primaryKey(),
  userName: text('user_name').notNull(),
  email: text('email'),
  content: text('content').notNull(),
  isPrivate: integer('is_private', { mode: 'boolean' }).default(false),
  isReplied: integer('is_replied', { mode: 'boolean' }).default(false),
  replyContent: text('reply_content'),
  replyTime: integer('reply_time', { mode: 'timestamp' }),
  ipHash: text('ip_hash'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => [
  index('idx_messages_created').on(table.createdAt),
]);

// =============================================
// 评论表
// =============================================
export const comments = sqliteTable('comments', {
  id: text('id').primaryKey(),
  targetType: text('target_type', { enum: ['post', 'album', 'file'] }).notNull(),
  targetId: text('target_id').notNull(),
  userName: text('user_name').notNull(),
  email: text('email'),
  content: text('content').notNull(),
  isReplied: integer('is_replied', { mode: 'boolean' }).default(false),
  replyContent: text('reply_content'),
  replyTime: integer('reply_time', { mode: 'timestamp' }),
  ipHash: text('ip_hash'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => [
  index('idx_comments_target').on(table.targetType, table.targetId),
]);

// =============================================
// 主人寄语
// =============================================
export const hostMessage = sqliteTable('host_message', {
  id: integer('id').primaryKey(),
  content: text('content').notNull(),
  signature: text('signature').default('主人敬上'),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// =============================================
// 待办清单
// =============================================
export const todos = sqliteTable('todos', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  status: text('status', { enum: ['pending', 'done'] }).default('pending'),
  priority: text('priority', { enum: ['low', 'normal', 'high'] }).default('normal'),
  dueDate: text('due_date'),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// =============================================
// OpenList 存储实例
// =============================================
export const storageInstances = sqliteTable('storage_instances', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  apiUrl: text('api_url').notNull(),
  token: text('token').notNull(),
  rootPath: text('root_path').default('/'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  isDefault: integer('is_default', { mode: 'boolean' }).default(false),
  totalSpace: integer('total_space'),
  usedSpace: integer('used_space'),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

// =============================================
// 业务存储映射
// =============================================
export const storageMappings = sqliteTable('storage_mappings', {
  id: text('id').primaryKey(),
  business: text('business', { enum: ['post', 'album', 'drive', 'nav'] }).notNull().unique(),
  instanceId: text('instance_id').notNull().references(() => storageInstances.id),
  rootPath: text('root_path').notNull(),
  autoArchive: integer('auto_archive', { mode: 'boolean' }).default(true),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// =============================================
// 操作日志
// =============================================
export const adminLogs = sqliteTable('admin_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id'),
  userName: text('user_name'),
  action: text('action').notNull(),
  targetType: text('target_type'),
  targetId: text('target_id'),
  targetName: text('target_name'),
  details: text('details'),
  ip: text('ip'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

// =============================================
// 会话表
// =============================================
export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  ip: text('ip'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
}, (table) => [
  index('idx_sessions_user').on(table.userId),
  index('idx_sessions_token').on(table.token),
]);

// 类型导出
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Album = typeof albums.$inferSelect;
export type NewAlbum = typeof albums.$inferInsert;
export type Photo = typeof photos.$inferSelect;
export type File = typeof files.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type NavSite = typeof navSites.$inferSelect;
export type Todo = typeof todos.$inferSelect;
export type StorageInstance = typeof storageInstances.$inferSelect;
export type StorageMapping = typeof storageMappings.$inferSelect;
