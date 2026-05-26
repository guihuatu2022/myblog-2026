// =============================================
// AI 服务封装
// 支持多种 AI 提供商：DeepSeek / Kimi / 豆包
// =============================================

export interface AiConfig {
  provider: 'deepseek' | 'kimi' | 'doubao' | 'none';
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
    this.model = config.model || 'deepseek-chat';
  }

  // 检查是否配置
  isConfigured(): boolean {
    return this.config.provider !== 'none' && !!this.apiKey;
  }

  // 通用请求
  private async request(messages: { role: string; content: string }[], options: { temperature?: number; maxTokens?: number } = {}): Promise<string> {
    if (!this.isConfigured()) {
      throw new Error('AI 服务未配置');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    let endpoint = '';
    let body: Record<string, unknown> = {
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2000,
    };

    switch (this.config.provider) {
      case 'deepseek':
        headers['Authorization'] = `Bearer ${this.apiKey}`;
        endpoint = `${this.baseUrl || 'https://api.deepseek.com'}/chat/completions`;
        body.model = this.model || 'deepseek-chat';
        break;

      case 'kimi':
        headers['Authorization'] = `Bearer ${this.apiKey}`;
        endpoint = `${this.baseUrl || 'https://api.moonshot.cn/v1'}/chat/completions`;
        body.model = this.model || 'moonshot-v1-8k';
        break;

      case 'doubao':
        headers['Authorization'] = `Bearer ${this.apiKey}`;
        endpoint = `${this.baseUrl || 'https://ark.cn-beijing.volces.com/api/v3'}/chat/completions`;
        body.model = this.model || 'doubao-pro-32k';
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
      const error = await response.text();
      throw new Error(`AI 请求失败: ${error}`);
    }

    const result = await response.json();
    return result.choices?.[0]?.message?.content || '';
  }

  // 错别字检查
  async checkTypo(content: string): Promise<TypoCheckResult> {
    if (!this.isConfigured()) {
      return { hasErrors: false, errors: [] };
    }

    const systemPrompt = `你是一个严谨的中文错别字检查专家。请仔细检查用户提供的文本，找出所有可能的错别字、用词不当、标点错误等问题。

对于每个错误，请提供：
1. 错误所在行号
2. 原文
3. 修正建议
4. 修正原因

请只指出明显的错误，不要过度修改。如果文本没有问题，请明确说明。

请以 JSON 格式返回结果：
{
  "hasErrors": true/false,
  "errors": [
    {
      "line": 1,
      "original": "原文",
      "suggestion": "修正",
      "reason": "原因"
    }
  ]
}`;

    const lines = content.split('\n');
    const userPrompt = `请检查以下文本的错别字：\n\n${lines.map((line, i) => `${i + 1}. ${line}`).join('\n')}`;

    try {
      const result = await this.request([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ], { temperature: 0.3, maxTokens: 1000 });

      // 尝试解析 JSON
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return { hasErrors: false, errors: [] };
    } catch {
      return { hasErrors: false, errors: [] };
    }
  }

  // 标题推荐
  async suggestTitles(content: string, count: number = 5): Promise<TitleSuggestion[]> {
    if (!this.isConfigured()) {
      return [];
    }

    const systemPrompt = `你是一个富有文采的标题策划师。请根据文章内容，生成 ${count} 个吸引人的标题建议。

要求：
1. 标题要有吸引力，能引起读者兴趣
2. 符合博客"岁月静好"的复古风格
3. 长度适中（8-20字）
4. 包含不同风格：诗意、直白、疑问、列表式

请以 JSON 格式返回：
{
  "titles": [
    { "title": "标题1", "style": "poetic" },
    { "title": "标题2", "style": "direct" }
  ]
}`;

    try {
      // 取前500字作为参考
      const excerpt = content.slice(0, 500);
      const result = await this.request([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `文章内容：\n${excerpt}\n\n请生成标题建议。` },
      ], { temperature: 0.8, maxTokens: 500 });

      const jsonMatch = result.match(/\{"[\s\S]*"\}\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.titles || [];
      }

      return [];
    } catch {
      return [];
    }
  }

  // 标签推荐
  async suggestTags(content: string, count: number = 5): Promise<TagSuggestion[]> {
    if (!this.isConfigured()) {
      return [];
    }

    const systemPrompt = `你是一个内容标签专家。请根据文章内容，推荐 ${count} 个最合适的标签。

要求：
1. 标签要准确反映文章主题
2. 使用常见的博客标签词汇
3. 避免过于宽泛或过于小众的标签

请以 JSON 格式返回：
{
  "tags": [
    { "tag": "标签名", "score": 0.95 }
  ]
}`;

    try {
      const excerpt = content.slice(0, 800);
      const result = await this.request([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `文章内容：\n${excerpt}\n\n请推荐标签。` },
      ], { temperature: 0.5, maxTokens: 300 });

      const jsonMatch = result.match(/\{"[\s\S]*"\}\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.tags || [];
      }

      return [];
    } catch {
      return [];
    }
  }

  // 内容摘要
  async summarize(content: string): Promise<SummaryResult> {
    if (!this.isConfigured()) {
      return { summary: '', keyPoints: [] };
    }

    const systemPrompt = `你是一个文章摘要专家。请为用户提供的内容生成简短的摘要。

要求：
1. 摘要简洁有力（50-100字）
2. 概括文章核心内容
3. 提炼 3-5 个关键点

请以 JSON 格式返回：
{
  "summary": "摘要内容",
  "keyPoints": ["要点1", "要点2", "要点3"]
}`;

    try {
      const result = await this.request([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `文章内容：\n${content}\n\n请生成摘要。` },
      ], { temperature: 0.5, maxTokens: 500 });

      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      return { summary: '', keyPoints: [] };
    } catch {
      return { summary: '', keyPoints: [] };
    }
  }

  // 内容润色
  async rewrite(content: string, style: 'elegant' | 'concise' | 'warm' = 'elegant'): Promise<string> {
    if (!this.isConfigured()) {
      return content;
    }

    const stylePrompt = {
      elegant: '优雅文艺，富有文采和诗意',
      concise: '简洁凝练，去除冗余',
      warm: '温暖亲切，如同老友交谈',
    };

    const systemPrompt = `你是一个文笔优美的作家。请将用户提供的文本进行润色，使其更加${stylePrompt[style]}。

要求：
1. 保持原文的核心意思不变
2. 适当使用修辞手法
3. 保持中文写作的韵味
4. 不要添加多余的内容

请直接返回润色后的文本，不要添加解释。`;

    try {
      return await this.request([
        { role: 'system', content: systemPrompt },
        { role: 'user', content },
      ], { temperature: 0.7, maxTokens: 2000 });
    } catch {
      return content;
    }
  }

  // 内容续写
  async continueWriting(content: string, maxLength: number = 500): Promise<string> {
    if (!this.isConfigured()) {
      return '';
    }

    const systemPrompt = `你是一个擅长续写故事的作家。请根据用户提供的文本，自然地续写内容。

要求：
1. 保持原文的风格和语气
2. 续写要自然流畅，不生硬
3. 避免突然改变话题或风格
4. 续写长度：${maxLength} 字左右

请直接返回续写内容，不要添加解释。`;

    try {
      return await this.request([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `已有内容：\n${content}\n\n请续写。` },
      ], { temperature: 0.8, maxTokens: maxLength * 2 });
    } catch {
      return '';
    }
  }
}

// 创建默认 AI 服务（未配置）
export function createAiService(config?: AiConfig): AiService {
  return new AiService(config || { provider: 'none' });
}
