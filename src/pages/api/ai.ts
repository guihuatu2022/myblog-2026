import type { APIRoute } from 'astro';
import { callAI, AI_PROMPTS } from '../../../lib/ai';

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

    let result: any = { success: true };

    switch (action) {
      case 'check-typo': {
        // 错别字检查
        // TODO: 实现本地错别字检查 + AI 辅助
        const typoRules = [
          { from: '渡过', to: '度过', desc: '"渡过"用于渡过难关/河流，"度过"用于时间' },
          { from: '的地得', to: 'de', desc: '注意区分"的/地/得"的用法' },
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

        // 如果本地没检测到，调用 AI
        if (errors.length === 0) {
          const aiResult = await callAI(content, 'check-typo');
          result.data = aiResult;
        } else {
          result.data = { errors };
        }
        break;
      }

      case 'suggest-title': {
        // 标题推荐
        const titles = await callAI(content, 'suggest-title');
        result.data = titles;
        break;
      }

      case 'suggest-tags': {
        // 标签推荐
        const tags = await callAI(content, 'suggest-tags');
        result.data = tags;
        break;
      }

      case 'summarize': {
        // 内容摘要
        const summary = await callAI(content, 'summarize');
        result.data = { summary };
        break;
      }

      case 'rewrite': {
        // 内容润色
        const rewritten = await callAI(content, 'rewrite', options?.tone);
        result.data = { content: rewritten };
        break;
      }

      case 'continue': {
        // 内容续写
        const continued = await callAI(content, 'continue');
        result.data = { content: continued };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: '未知操作' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('AI error:', error);
    return new Response(JSON.stringify({ error: 'AI 服务调用失败' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
