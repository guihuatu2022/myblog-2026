// =============================================
// OpenList API 封装
// 支持文件上传、下载、目录管理等
// =============================================

export interface OpenListConfig {
  apiUrl: string;
  token: string;
  rootPath?: string;
}

export interface OpenListFile {
  name: string;
  path: string;
  size: number;
  isDir: boolean;
  modified: string;
  sign: string;
}

export interface OpenListStorageInfo {
  used: number;
  total: number;
}

export interface UploadResult {
  success: boolean;
  path?: string;
  name?: string;
  size?: number;
  error?: string;
}

export class OpenListService {
  private apiUrl: string;
  private token: string;
  private rootPath: string;

  constructor(config: OpenListConfig) {
    this.apiUrl = config.apiUrl.replace(/\/$/, '');
    this.token = config.token;
    this.rootPath = config.rootPath || '/';
  }

  // 获取完整路径
  private getFullPath(path: string): string {
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.rootPath}${cleanPath}`.replace(/\/+/g, '/');
  }

  // 通用请求
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${this.token}`,
      ...((options.headers as Record<string, string>) || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenList 请求失败: ${error}`);
    }

    return response.json();
  }

  // 测试连接
  async testConnection(): Promise<boolean> {
    try {
      await this.request('/Fs/list', {
        method: 'POST',
        body: JSON.stringify({ path: '/', page: 1, per: 1 }),
      });
      return true;
    } catch {
      return false;
    }
  }

  // 获取存储信息
  async getStorageInfo(): Promise<OpenListStorageInfo | null> {
    try {
      const result = await this.request<{ used: number; total: number }>('/Fs/storage');
      return result;
    } catch {
      return null;
    }
  }

  // 列出目录
  async listDirectory(path: string = '/', page: number = 1, per: number = 100): Promise<{
    objects: OpenListFile[];
    total: number;
    page: number;
    per: number;
  }> {
    const fullPath = this.getFullPath(path);
    
    return this.request('/Fs/list', {
      method: 'POST',
      body: JSON.stringify({ path: fullPath, page, per }),
    });
  }

  // 创建目录
  async createDirectory(path: string): Promise<boolean> {
    try {
      const fullPath = this.getFullPath(path);
      await this.request('/Fs/mkdir', {
        method: 'POST',
        body: JSON.stringify({ path: fullPath }),
      });
      return true;
    } catch {
      return false;
    }
  }

  // 上传文件
  async uploadFile(
    file: File | ArrayBuffer,
    destPath: string,
    fileName: string
  ): Promise<UploadResult> {
    try {
      const fullPath = this.getFullPath(`${destPath}/${fileName}`);
      
      let body: BodyInit;
      let headers: Record<string, string> = {
        'Authorization': `Bearer ${this.token}`,
      };

      if (file instanceof File) {
        body = new FormData();
        (body as FormData).append('file', file);
        (body as FormData).append('path', fullPath);
      } else {
        // ArrayBuffer 转 base64
        const base64 = this.arrayBufferToBase64(file);
        body = JSON.stringify({
          path: fullPath,
          content: base64,
          encoding: 'base64',
        });
        headers['Content-Type'] = 'application/json';
      }

      const response = await fetch(`${this.apiUrl}/Fs/upload`, {
        method: 'POST',
        headers,
        body,
      });

      if (!response.ok) {
        const error = await response.text();
        return { success: false, error };
      }

      const result = await response.json();
      return {
        success: true,
        path: fullPath,
        name: fileName,
        size: file.size || 0,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : '上传失败',
      };
    }
  }

  // ArrayBuffer 转 Base64
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // 删除文件
  async deleteFile(path: string): Promise<boolean> {
    try {
      const fullPath = this.getFullPath(path);
      await this.request('/Fs/delete', {
        method: 'POST',
        body: JSON.stringify({ path: fullPath }),
      });
      return true;
    } catch {
      return false;
    }
  }

  // 重命名文件
  async renameFile(oldPath: string, newPath: string): Promise<boolean> {
    try {
      const fullOldPath = this.getFullPath(oldPath);
      const fullNewPath = this.getFullPath(newPath);
      await this.request('/Fs/move', {
        method: 'POST',
        body: JSON.stringify({
          src: fullOldPath,
          dst: fullNewPath,
        }),
      });
      return true;
    } catch {
      return false;
    }
  }

  // 复制文件
  async copyFile(srcPath: string, dstPath: string): Promise<boolean> {
    try {
      const fullSrc = this.getFullPath(srcPath);
      const fullDst = this.getFullPath(dstPath);
      await this.request('/Fs/copy', {
        method: 'POST',
        body: JSON.stringify({
          src: fullSrc,
          dst: fullDst,
        }),
      });
      return true;
    } catch {
      return false;
    }
  }

  // 获取文件直链
  async getDirectLink(path: string): Promise<string | null> {
    try {
      const fullPath = this.getFullPath(path);
      const result = await this.request<{ sign: string }>('/Fs/sign', {
        method: 'POST',
        body: JSON.stringify({ path: fullPath }),
      });
      return `${this.apiUrl}/Fs/get${result.sign}`;
    } catch {
      return null;
    }
  }

  // 搜索文件
  async search(keyword: string, path: string = '/'): Promise<OpenListFile[]> {
    try {
      const fullPath = this.getFullPath(path);
      const result = await this.request<{ objects: OpenListFile[] }>('/Fs/search', {
        method: 'POST',
        body: JSON.stringify({
          path: fullPath,
          keyword,
        }),
      });
      return result.objects || [];
    } catch {
      return [];
    }
  }

  // 获取文件信息
  async getFileInfo(path: string): Promise<OpenListFile | null> {
    try {
      const fullPath = this.getFullPath(path);
      const result = await this.request<{ object: OpenListFile }>('/Fs/info', {
        method: 'POST',
        body: JSON.stringify({ path: fullPath }),
      });
      return result.object;
    } catch {
      return null;
    }
  }
}

// 创建 OpenList 服务实例
export function createOpenListService(config: OpenListConfig): OpenListService {
  return new OpenListService(config);
}

// 根据业务类型获取默认路径
export function getDefaultPath(business: 'post' | 'album' | 'drive' | 'nav', subPath?: string): string {
  const basePaths = {
    post: '/posts',
    album: '/albums',
    drive: '/drive',
    nav: '/images',
  };

  const base = basePaths[business];
  
  if (subPath) {
    return `${base}${subPath.startsWith('/') ? subPath : `/${subPath}`}`;
  }
  
  return base;
}

// 根据日期生成路径
export function generateDatePath(prefix: string = ''): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  if (prefix) {
    return `${prefix}/${year}/${month}/${day}`;
  }
  
  return `${year}/${month}/${day}`;
}

// 获取文件 MIME 类型
export function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  
  const mimeTypes: Record<string, string> = {
    // 图片
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    svg: 'image/svg+xml',
    bmp: 'image/bmp',
    ico: 'image/x-icon',
    
    // 视频
    mp4: 'video/mp4',
    webm: 'video/webm',
    avi: 'video/x-msvideo',
    mov: 'video/quicktime',
    
    // 音频
    mp3: 'audio/mpeg',
    wav: 'audio/wav',
    ogg: 'audio/ogg',
    flac: 'audio/flac',
    
    // 文档
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint',
    pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    
    // 文本
    txt: 'text/plain',
    html: 'text/html',
    css: 'text/css',
    js: 'application/javascript',
    json: 'application/json',
    xml: 'text/xml',
    md: 'text/markdown',
    
    // 压缩包
    zip: 'application/zip',
    rar: 'application/x-rar-compressed',
    '7z': 'application/x-7z-compressed',
    tar: 'application/x-tar',
    gz: 'application/gzip',
  };
  
  return mimeTypes[ext] || 'application/octet-stream';
}

// 格式化文件大小
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${units[i]}`;
}

// 判断是否为图片
export function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/');
}

// 判断是否为视频
export function isVideo(mimeType: string): boolean {
  return mimeType.startsWith('video/');
}
