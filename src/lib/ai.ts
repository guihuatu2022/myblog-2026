// =============================================
// AI 服务封装
// 支持 Cloudflare Workers AI（默认）和 第三方 API
// =============================================

export interface AiConfig {
  provider: 'cloudflare' | 'deepseek' | 'kimi' | 'doubao' | 'none';
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface AiRequest {
  prompt: string;
  system?: string;
  temperature?: number;
  maxTokens?: number;
}

// 错别字检测结果
export interface TypoCheckResult {
  hasErrors: boolean;
  errors: {
    line: number;
    original: string;
    suggestion: string;
    reason: string;
  }[];
}

// 标题推荐结果
export interface TitleSuggestion {
  title: string;
  style: 'poetic' | 'direct' | 'question' | 'list';
}

// 标签推荐结果
export interface TagSuggestion {
  tag: string;
  score: number;
}

// 摘要生成结果
export interface SummaryResult {
  summary: string;
  keyPoints: string[];
}

// AI 服务类
export class AiService {
  private config: AiConfig;
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(config: AiConfig) {
    this.config = config;
    this.apiKey = config.apiKey || '';
    this.baseUrl = config.baseUrl || '';
    this.model = config.model || '@cf/meta/llama-2-7b-chat-int8';
  }

  // 检查是否配置
  isConfigured(): boolean {
    if (this.config.provider === 'none') return false;
    if (this.config.provider === 'cloudflare') return true; // Cloudflare AI 不需要 API Key
    return !!this.apiKey;
  }

  // =========================================
  // Cloudflare Workers AI
  // =========================================
  private async cloudflareRequest(messages: { role: string; content: string }[], options: { temperature?: number; maxTokens?: number } = {}): Promise<string> {
    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${this.apiKey}/ai/run/${this.model}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        messages,
        max_tokens: options.maxTokens || 1024,
        temperature: options.temperature || 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`Cloudflare AI 请求失败: ${response.status}`);
    }

    const data = await response.json();
    return data.result.response;
  }

  // =========================================
  // 第三方 API (DeepSeek / Kimi / 豆包)
  // =========================================
  private async thirdPartyRequest(messages: { role: string; content: string }[], options: { temperature?: number; maxTokens?: number } = {}): Promise<string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    let endpoint = '';
    let body: Record<string, unknown> = {
      messages,
    };

    switch (this.config.provider) {
      case 'deepseek':
        endpoint = `${this.baseUrl}/chat/completions`;
        body = {
          model: this.model || 'deepseek-chat',
          messages,
          max_tokens: options.maxTokens || 1024,
          temperature: options.temperature || 0.7,
        };
        break;
      case 'kimi':
        endpoint = `${this.baseUrl}/v1/chat/completions`;
        headers['Authorization'] = `Bearer ${this.apiKey}`;
        body = {
          model: this.model || 'moonshot-v1-8k',
          messages,
          max_tokens: options.maxTokens || 1024,
          temperature: options.temperature || 0.7,
        };
        break;
      case 'doubao':
        endpoint = `${this.baseUrl}/v1/chat/completions`;
        headers['Authorization'] = `Bearer ${this.apiKey}`;
        body = {
          model: this.model || 'doubao-pro',
          messages,
          max_tokens: options.maxTokens || 1024,
          temperature: options.temperature || 0.7,
        };
        break;
      default:
        throw new Error('不支持的 AI 提供商');
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`AI 请求失败: ${response.status}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  }

  // 通用请求
  async request(messages: { role: string; content: string }[], options: { temperature?: number; maxTokens?: number } = {}): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('AI 服务未配置');
    }

    if (this.config.provider === 'cloudflare') {
      return this.cloudflareRequest(messages, options);
    }

    return this.thirdPartyRequest(messages, options);
  }

  // =========================================
  // 具体功能
  // =========================================

  // 错别字检查
  async checkTypos(content: string): Promise<TypoCheckResult> {
    const systemPrompt = `你是专业的文字校对专家。请检查以下文本中的错别字、标点错误和语法问题。

要求：
1. 只指出真正的错误，不要改变原文风格
2. 对于每个错误，说明原因
3. 如果没有错误，返回 hasErrors: false

请以 JSON 格式返回：
{
  "hasErrors": true/false,
  "errors": [
    {
      "line": 行号,
      "original": "原文",
      "suggestion": "建议修改",
      "reason": "原因说明"
    }
  ]
}`;

    const result = await this.request([
      { role: 'system', content: systemPrompt },
      { role: 'user', content }
    ], { maxTokens: 2048 });

    try {
      const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return { hasErrors: false, errors: [] };
    }
  }

  // 标题推荐
  async suggestTitles(content: string): Promise<TitleSuggestion[]> {
    const systemPrompt = `你是一位资深编辑。请根据以下文章内容，推荐 5 个吸引人的标题。

要求：
1. 标题要有吸引力，能引起读者兴趣
2. 风格多样：诗意、直接、疑问、列举等
3. 长度适中（10-30字）
4. 不要夸大或标题党

请以 JSON 格式返回：
[
  { "title": "标题1", "style": "poetic" },
  { "title": "标题2", "style": "direct" },
  ...
]`;

    const result = await this.request([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `文章内容：\n${content.slice(0, 2000)}` }
    ], { maxTokens: 1024 });

    try {
      const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return [];
    }
  }

  // 内容润色
  async rewrite(content: string, style?: string): Promise<string> {
    const systemPrompt = `你是一位优秀的作家。请优化以下文本，使其更加流畅、优美、有感染力。

要求：
1. 保持原文的核心意思
2. 改善表达方式，使文章更有文采
3. 可以适当添加过渡句
4. 不要添加原文没有的内容

${style ? `风格要求：${style}` : ''}`;

    return this.request([
      { role: 'system', content: systemPrompt },
      { role: 'user', content }
    ], { maxTokens: 2048 });
  }

  // 内容续写
  async continueWriting(content: string): Promise<string> {
    const systemPrompt = `请根据以下文章内容，续写一段文字。保持相同的风格和语气，自然衔接。

要求：
1. 保持与原文一致的风格
2. 自然过渡，不突兀
3. 长度适中（200-500字）
4. 不要添加原文没有的剧情转折`;

    return this.request([
      { role: 'system', content: systemPrompt },
      { role: 'user', content }
    ], { maxTokens: 1024 });
  }

  // 标签推荐
  async suggestTags(content: string): Promise<TagSuggestion[]> {
    const systemPrompt = `请为以下文章推荐 5-8 个相关标签。

要求：
1. 标签要准确反映文章主题
2. 涵盖不同维度：主题、类型、情感等
3. 使用常用词汇，便于检索

请以 JSON 格式返回：
[
  { "tag": "标签1", "score": 0.95 },
  { "tag": "标签2", "score": 0.85 },
  ...
]`;

    const result = await this.request([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `文章内容：\n${content.slice(0, 1500)}` }
    ], { maxTokens: 512 });

    try {
      const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return [];
    }
  }

  // 摘要生成
  async summarize(content: string): Promise<SummaryResult> {
    const systemPrompt = `请为以下文章生成摘要。

要求：
1. 总结文章核心内容（100-200字）
2. 列出 3-5 个关键要点
3. 保持客观，不要添加个人观点

请以 JSON 格式返回：
{
  "summary": "摘要内容",
  "keyPoints": ["要点1", "要点2", "要点3"]
}`;

    const result = await this.request([
      { role: 'system', content: systemPrompt },
      { role: 'user', content }
    ], { maxTokens: 1024 });

    try {
      const cleaned = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      return JSON.parse(cleaned);
    } catch {
      return { summary: '', keyPoints: [] };
    }
  }
}

// 获取 AI 配置
export function getAiConfig(): AiConfig {
  // 优先使用 Cloudflare Workers AI
  const cfAccountId = import.meta.env.CF_ACCOUNT_ID;
  if (cfAccountId) {
    return {
      provider: 'cloudflare',
      apiKey: cfAccountId,
      model: '@cf/meta/llama-2-7b-chat-int8',
    };
  }

  // 备用第三方 API
  const apiKey = import.meta.env.AI_API_KEY;
  const provider = import.meta.env.AI_PROVIDER as AiConfig['provider'] || 'none';

  if (apiKey && provider !== 'none') {
    const baseUrls: Record<string, string> = {
      deepseek: 'https://api.deepseek.com',
      kimi: 'https://api.moonshot.cn',
      doubao: 'https://ark.cn-beijing.volces.com/api/v3',
    };

    return {
      provider,
      apiKey,
      baseUrl: import.meta.env.AI_BASE_URL || baseUrls[provider] || '',
      model: import.meta.env.AI_MODEL,
    };
  }

  return { provider: 'none' };
}
