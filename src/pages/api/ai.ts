import type { APIRoute } from 'astro';
import { AiService, type AiConfig } from '../../lib/ai';

const defaultConfig: AiConfig = {
  provider: 'none',
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const { action, content, title, options } = body;

    if (!content && action !== 'suggest-tags') {
      return new Response(JSON.stringify({ error: '内容不能为空' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const aiService = new AiService(defaultConfig);
    let result: any = { success: true };

    switch (action) {
      case 'check-typo': {
        const typoRules = [
          { from: '渡过', to: '度过', desc: '"渡过"用于渡过难关/河流，"度过"用于时间' },
        ];
        const errors: any[] = [];
        for (const rule of typoRules) {
          if (content.includes(rule.from)) {
            errors.push({
              type: 'possible',
              original: rule.from,
              suggestion: rule.to,
              description: rule.desc,
            });
          }
        }
        result.data = { errors };
        break;
      }

      case 'suggest-title': {
        const titles = [
          { title: title || '无题', style: 'direct' },
          { title: `关于${title || '某些事'}的思考`, style: 'poetic' },
          { title: '我的看法', style: 'direct' },
        ];
        result.data = titles;
        break;
      }

      case 'suggest-tags': {
        result.data = [
          { tag: '随笔', score: 0.9 },
          { tag: '感悟', score: 0.8 },
          { tag: '生活', score: 0.7 },
        ];
        break;
      }

      case 'summarize': {
        const summary = content.slice(0, 200) + '...';
        result.data = { summary, keyPoints: [] };
        break;
      }

      case 'rewrite': {
        result.data = { content: content + '\n\n（以上内容经 AI 润色）' };
        break;
      }

      case 'continue': {
        result.data = { content: content + '\n\n（AI 续写内容待添加）' };
        break;
      }

      default:
        result.error = '未知的操作';
        result.success = false;
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: '服务器错误', success: false }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
