import type { D1Database } from '@cloudflare/workers-types';
import { createDb } from './db';
import { users, sessions } from './schema';
import { eq, and, gt } from 'drizzle-orm';
import type { Db } from './db';

// 密码哈希
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// 验证密码
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return passwordHash === hash;
}

// 生成随机 token
export function generateToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
}

// 会话过期时间（7天）
const SESSION_EXPIRES_DAYS = 7;

// 创建会话
export async function createSession(
  db: Db,
  userId: string,
  ip?: string,
  userAgent?: string
): Promise<string> {
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRES_DAYS);

  await db.insert(sessions).values({
    id: crypto.randomUUID(),
    userId,
    token,
    expiresAt,
    ip,
    userAgent,
  });

  return token;
}

// 验证会话
export async function verifySession(db: Db, token: string) {
  const now = new Date();
  
  const result = await db
    .select({
      session: sessions,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.token, token),
        gt(sessions.expiresAt, now)
      )
    )
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return {
    session: result[0].session,
    user: result[0].user,
  };
}

// 删除会话
export async function deleteSession(db: Db, token: string) {
  await db.delete(sessions).where(eq(sessions.token, token));
}

// 删除用户所有会话
export async function deleteAllUserSessions(db: Db, userId: string) {
  await db.delete(sessions).where(eq(sessions.user.id, userId));
}

// 用户登录
export async function login(
  db: Db,
  email: string,
  password: string,
  ip?: string,
  userAgent?: string
): Promise<{ user: typeof users.$inferSelect; token: string } | null> {
  // 查找用户
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const user = result[0];

  // 验证密码
  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  // 创建会话
  const token = await createSession(db, user.id, ip, userAgent);

  return { user, token };
}

// 用户登出
export async function logout(db: Db, token: string) {
  await deleteSession(db, token);
}

// 从请求中获取 token
export function getTokenFromRequest(request: Request): string | null {
  // 优先从 Authorization header 获取
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // 从 cookie 获取
  const cookieHeader = request.headers.get('Cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map(c => c.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith('session_token=')) {
        return cookie.substring('session_token='.length);
      }
    }
  }

  return null;
}

// 认证中间件结果
export interface AuthResult {
  isAuthenticated: boolean;
  user?: typeof users.$inferSelect;
  token?: string;
}

// 认证检查
export async function authenticate(request: Request, db: Db): Promise<AuthResult> {
  const token = getTokenFromRequest(request);
  
  if (!token) {
    return { isAuthenticated: false };
  }

  const session = await verifySession(db, token);
  
  if (!session) {
    return { isAuthenticated: false };
  }

  return {
    isAuthenticated: true,
    user: session.user,
    token,
  };
}

// 创建 Set-Cookie header
export function createSessionCookie(token: string, expiresDays: number = 7): string {
  const expires = new Date();
  expires.setDate(expires.getDate() + expiresDays);
  
  return `session_token=${token}; Path=/; HttpOnly; SameSite=Lax; Expires=${expires.toUTCString()}`;
}

// 创建用户
export async function createUser(
  db: Db,
  name: string,
  email: string,
  password: string,
  role: 'admin' | 'user' = 'user'
): Promise<typeof users.$inferSelect> {
  const passwordHash = await hashPassword(password);
  
  const result = await db.insert(users).values({
    id: crypto.randomUUID(),
    name,
    email,
    passwordHash,
    role,
  }).returning();
  
  return result[0];
}

// 创建登出 cookie
export function createLogoutCookie(): string {
  return 'session_token=; Path=/; HttpOnly; SameSite=Lax; Expires=Thu, 01 Jan 1970 00:00:00 GMT';
}
