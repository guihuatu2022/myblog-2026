import type { APIRoute } from 'astro';
import { createUser, verifyPassword, generateToken } from '../../../lib/auth';
import { nanoid } from 'nanoid';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { action, email, password, name } = body;

    // 登录
    if (action === 'login') {
      if (!email || !password) {
        return new Response(JSON.stringify({ error: '邮箱和密码不能为空' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // TODO: 从 D1 查询用户
      // const user = await getUserByEmail(email);
      
      // 模拟用户验证
      const mockUser = {
        id: 'admin-1',
        email: 'admin@example.com',
        password_hash: '$2a$10$dummy', // 实际从数据库获取
        name: '博主',
        role: 'admin',
      };

      // 验证密码
      // const isValid = await verifyPassword(password, mockUser.password_hash);
      const isValid = password === 'admin123'; // 开发环境测试

      if (!isValid) {
        return new Response(JSON.stringify({ error: '邮箱或密码错误' }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // 生成 token
      const token = generateToken(mockUser.id);

      // 设置 cookie
      cookies.set('auth_token', token, {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7, // 7 天
      });

      return new Response(JSON.stringify({
        success: true,
        user: {
          id: mockUser.id,
          email: mockUser.email,
          name: mockUser.name,
          role: mockUser.role,
        },
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 注册
    if (action === 'register') {
      if (!email || !password || !name) {
        return new Response(JSON.stringify({ error: '请填写所有必填项' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // TODO: 创建用户到 D1
      // const userId = await createUser({ email, password, name });

      return new Response(JSON.stringify({
        success: true,
        message: '注册成功',
      }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: '未知操作' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Auth error:', error);
    return new Response(JSON.stringify({ error: '服务器错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ cookies }) => {
  cookies.delete('auth_token', { path: '/' });
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
