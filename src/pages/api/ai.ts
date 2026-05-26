import type { APIRoute } from 'astro';
import { AiService, getAiConfig } from '../../lib/ai';

export const POST: APIRoute = async ({ request }) => {
  try {
    const config = getAiConfig();
    const ai = new AiService(config);

    if (!ai.isConfigured()) {
      return new Response(JSON.stringify({
        success: false,
        error: 'AI 服务未配置，请联系管理员'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const { action, content } = await request.json();

    if (!content) {
      return new Response(JSON.stringify({
        success: false,
        error: '内容不能为空'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    let result: unknown;

    switch (action) {
      case 'check-typo':
        result = await ai.checkTypos(content);
        break;

      case 'suggest-title':
        result = await ai.suggestTitles(content);
        break;

      case 'rewrite':
        result = { text: await ai.rewrite(content) };
        break;

      case 'continue':
        result = { text: await ai.continueWriting(content) };
        break;

      case 'suggest-tags':
        result = await ai.suggestTags(content);
        break;

      case 'summarize':
        result = await ai.summarize(content);
        break;

      default:
        return new Response(JSON.stringify({
          success: false,
          error: '未知操作'
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
    }

    return new Response(JSON.stringify({
      success: true,
      data: result
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('AI API Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'AI 服务出错，请稍后重试'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
