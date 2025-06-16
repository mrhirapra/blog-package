export interface BlogEditorConfig {
  savePath?: string;
  imagePath?: string;
  allowedIPs?: string[];
  maxImageSize?: number; // in bytes
  allowedImageTypes?: string[];
  autoStartServer?: boolean;
  serverOptions?: {
    dbPath?: string;
    port?: number;
    maxPort?: number;
    silent?: boolean;
  };
}

export interface BlogPackageOptions {
  autoStartServer?: boolean;
  dbPath?: string;
  port?: number;
  silent?: boolean;
  maxPort?: number;
}

export interface BlogContent {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  published?: boolean;
  tags?: string[];
  author?: string;
  excerpt?: string;
  featuredImage?: string;
}

export interface ImageData {
  id: string;
  fileName: string;
  base64Data: string;
  createdAt: string;
  size: number;
  type: string;
  width?: number;
  height?: number;
}

export type APIError = {
  message: string;
  code?: string;
  status?: number;
  details?: any;
};

export type BlogEditorProps = {
  config: BlogEditorConfig;
  clientIP?: string;
  onSave?: (content: BlogContent) => void;
  onError?: (error: APIError) => void;
  className?: string;
  initialContent?: Partial<BlogContent>;
  onContentChange?: (content: { title: string; content: string }) => void;
};

export interface BlogServerOptions {
  dbPath?: string;
  port?: number;
  maxPort?: number;
  silent?: boolean;
}
