import type { APIRoute } from 'astro';
import { uploadToOpenList } from '../../../lib/openlist';
import { nanoid } from 'nanoid';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const business = formData.get('business') as string || 'posts';
    const path = formData.get('path') as string || '';

    if (!file) {
      return new Response(JSON.stringify({ error: '请选择文件' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 检查文件大小 (限制 100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return new Response(JSON.stringify({ error: '文件大小不能超过 100MB' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 上传到 OpenList
    const result = await uploadToOpenList(buffer, {
      filename: file.name,
      business,
      path,
    });

    return new Response(JSON.stringify({
      success: true,
      data: {
        id: nanoid(),
        filename: file.name,
        size: file.size,
        mimeType: file.type,
        ...result,
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: '上传失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return new Response(JSON.stringify({ error: '文件路径不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // TODO: 从 OpenList 删除文件
    // await deleteFromOpenList(path);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Delete error:', error);
    return new Response(JSON.stringify({ error: '删除失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
