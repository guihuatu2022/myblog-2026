import type { APIRoute } from 'astro';
import { nanoid } from 'nanoid';

export const GET: APIRoute = async ({ url, request }) => {
  try {
    const category = url.searchParams.get('category') || '';
    const status = url.searchParams.get('status') || 'published';
    const search = url.searchParams.get('search') || '';
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = 20;

    // TODO: 从 D1 查询
    // const { results } = await env.DB.prepare(
    //   'SELECT * FROM posts WHERE status = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
    // ).bind(status, pageSize, (page - 1) * pageSize).all();

    // 模拟数据
    const mockPosts = [
      { id: '1', title: '三十岁的第一个清晨', excerpt: '时光荏苒，转眼已是而立之年...', category: '随笔', status: 'published', isPinned: true, createdAt: '2024-05-20', viewCount: 128 },
      { id: '2', title: '五渔村的光影', excerpt: '地中海的阳光洒在彩色房屋上...', category: '摄影', status: 'published', isPinned: false, createdAt: '2024-05-18', viewCount: 89 },
      { id: '3', title: '搭建博客的思考', excerpt: '最近在折腾博客，记录一下过程...', category: '技术', status: 'published', isPinned: false, createdAt: '2024-05-15', viewCount: 156 },
      { id: '4', title: '胶片里的旧时光', excerpt: '翻出老照片，回忆涌上心头...', category: '摄影', status: 'draft', isPinned: false, createdAt: '2024-05-10', viewCount: 0 },
    ];

    return new Response(JSON.stringify({
      success: true,
      data: {
        posts: mockPosts,
        pagination: {
          page,
          pageSize,
          total: mockPosts.length,
          totalPages: Math.ceil(mockPosts.length / pageSize),
        },
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Get posts error:', error);
    return new Response(JSON.stringify({ error: '服务器错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { title, content, excerpt, categoryId, coverImage, permission, status, weather, mood } = body;

    if (!title || !content) {
      return new Response(JSON.stringify({ error: '标题和内容不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const id = nanoid();
    const now = Date.now();

    // TODO: 插入到 D1
    // await env.DB.prepare(
    //   'INSERT INTO posts (id, title, content, excerpt, category_id, cover_image, permission, status, weather, mood, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    // ).bind(id, title, content, excerpt, categoryId, coverImage, permission, status, weather, mood, now).run();

    return new Response(JSON.stringify({
      success: true,
      data: { id, title, createdAt: now },
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Create post error:', error);
    return new Response(JSON.stringify({ error: '服务器错误' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
