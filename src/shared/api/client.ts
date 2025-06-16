import axios, { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios';
import { BlogContent, ImageData, APIError } from '../types';

class ApiClient {
  private instance: AxiosInstance;
  private static defaultPort = 3001;

  constructor(port?: number) {
    const baseURL = `http://localhost:${port || ApiClient.defaultPort}`;

    this.instance = axios.create({
      baseURL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor for adding auth tokens if needed
    this.instance.interceptors.request.use((config) => {
      // You can add authentication tokens here if needed
      // config.headers.Authorization = `Bearer ${token}`;
      return config;
    });

    // Response interceptor for error handling
    this.instance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const apiError: APIError = {
          message: error.message,
          status: error.response?.status,
          code: error.code,
          details: error.response?.data,
        };

        if (error.response) {
          // Server responded with a status outside 2xx
          apiError.message = (error.response.data as any)?.message || error.message;
        } else if (error.request) {
          // Request was made but no response received
          apiError.message = 'No response received from server';
        }

        return Promise.reject(apiError);
      }
    );
  }

  // Posts API
  async addPost(content: Omit<BlogContent, 'id'>): Promise<BlogContent> {
    const response = await this.instance.post<BlogContent>('/posts', {
      ...content,
      id: this.generateId(),
      published: content.published || false,
    });
    return response.data;
  }

  async getPost(postId: string): Promise<BlogContent> {
    const response = await this.instance.get<BlogContent>(`/posts/${postId}`);
    return response.data;
  }

  async updatePost(postId: string, updatedContent: Partial<BlogContent>): Promise<BlogContent> {
    const response = await this.instance.patch<BlogContent>(`/posts/${postId}`, updatedContent);
    return response.data;
  }

  async deletePost(postId: string): Promise<void> {
    await this.instance.delete(`/posts/${postId}`);
  }

  async listPosts(options?: {
    published?: boolean;
    limit?: number;
    offset?: number
  }): Promise<BlogContent[]> {
    const params: any = {};
    if (options?.published !== undefined) params.published = options.published;
    if (options?.limit) params._limit = options.limit;
    if (options?.offset) params._start = options.offset;

    const response = await this.instance.get<BlogContent[]>('/posts', {
      params,
      paramsSerializer: { indexes: null } // Properly handle array params
    });
    return response.data;
  }

  // Images API
  async uploadImage(fileName: string, base64Data: string): Promise<ImageData> {
    const response = await this.instance.post<ImageData>('/images', {
      id: this.generateId(),
      fileName,
      base64Data,
      createdAt: new Date().toISOString(),
      size: Math.ceil(base64Data.length * 0.75), // Approximate byte size
      type: `image/${fileName.split('.').pop()}`,
    });
    return response.data;
  }

  async getImage(imageId: string): Promise<ImageData> {
    const response = await this.instance.get<ImageData>(`/images/${imageId}`);
    return response.data;
  }

  async deleteImage(imageId: string): Promise<void> {
    await this.instance.delete(`/images/${imageId}`);
  }

  async listImages(): Promise<ImageData[]> {
    const response = await this.instance.get<ImageData[]>('/images');
    return response.data;
  }

  // Utility method
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
}

let apiClientInstance: ApiClient | null = null;
let currentPort: number | undefined;

/**
 * Get or create an API client instance
 * @param port Optional port number
 * @returns ApiClient instance
 */
export function getApiClient(port?: number): ApiClient {
  if (!apiClientInstance || port !== currentPort) {
    apiClientInstance = new ApiClient(port);
    currentPort = port;
  }
  return apiClientInstance;
}

// Default instance with default port
export const apiClient = new ApiClient();
