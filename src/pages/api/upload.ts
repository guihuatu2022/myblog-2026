import type { APIRoute } from 'astro';
import { OpenListService, type OpenListConfig } from '../../lib/openlist';
import { nanoid } from 'nanoid';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { file, path, business } = body;

    if (!file || !path) {
      return new Response(JSON.stringify({ error: '缺少文件或路径参数' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const config: OpenListConfig = {
      apiUrl: process.env.OPENLIST_API_URL || '',
      token: process.env.OPENLIST_TOKEN || '',
      rootPath: `/${business || 'uploads'}`,
    };

    const service = new OpenListService(config);

    // TODO: 实现实际上传逻辑
    const result = {
      success: true,
      id: nanoid(),
      path: path,
      name: file.name || 'unknown',
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: '上传失败', success: false }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
