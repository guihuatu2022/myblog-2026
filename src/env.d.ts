/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly D1_DATABASE_ID: string;
  readonly SITE_TITLE: string;
  readonly SITE_SUBTITLE: string;
  readonly BLOG_AUTHOR: string;
  readonly BLOG_EMAIL: string;
  readonly OPENLIST_API_URL: string;
  readonly OPENLIST_TOKEN: string;
  readonly AI_API_URL: string;
  readonly AI_API_KEY: string;
  readonly AI_MODEL: string;
  readonly JWT_SECRET: string;
  readonly MAX_FILE_SIZE: string;
  readonly ALLOWED_FILE_TYPES: string;
  readonly ENABLE_AI: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
