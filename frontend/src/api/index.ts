import axiosClient from './axiosClient';
import type {
  ApiResponse, AuthResponse, LoginPayload, RegisterPayload,
  ArticleDetail, ArticleListItem, Category,
  CreateArticlePayload, UpdateArticlePayload,
  PagedResult, UploadResult,
} from '../types';

const unwrap = <T>(promise: Promise<{ data: ApiResponse<T> }>): Promise<T> =>
  promise.then((r) => r.data.data);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (payload: LoginPayload) =>
    unwrap<AuthResponse>(axiosClient.post('/auth/login', payload)),

  register: (payload: RegisterPayload) =>
    unwrap<AuthResponse>(axiosClient.post('/auth/register', payload)),

  me: () =>
    unwrap(axiosClient.get('/auth/me')),
};

// ── Articles ──────────────────────────────────────────────────────────────────
export const articleApi = {
  /** Public: ดูข่าวที่ Published */
  getAll: (params?: {
    page?: number;
    pageSize?: number;
    categoryId?: number;
    search?: string;
  }) => unwrap<PagedResult<ArticleListItem>>(axiosClient.get('/articles', { params })),

  /** Admin/Editor: ดูทุกสถานะ */
  getAllAdmin: (params?: { page?: number; pageSize?: number; status?: string }) =>
    unwrap<PagedResult<ArticleListItem>>(axiosClient.get('/articles/admin', { params })),

  getBySlug: (slug: string) =>
    unwrap<ArticleDetail>(axiosClient.get(`/articles/${slug}`)),

  create: (payload: CreateArticlePayload) =>
    unwrap<ArticleDetail>(axiosClient.post('/articles', payload)),

  update: (id: number, payload: UpdateArticlePayload) =>
    unwrap<ArticleDetail>(axiosClient.put(`/articles/${id}`, payload)),

  delete: (id: number) =>
    axiosClient.delete(`/articles/${id}`),

  /** ดูบทความของตัวเอง */
  getMine: (params?: { page?: number; pageSize?: number; status?: string }) =>
    unwrap<PagedResult<ArticleListItem>>(axiosClient.get('/articles/mine', { params })),

  publish: (id: number) =>
    axiosClient.patch(`/articles/${id}/publish`),
};

// ── Users (Admin) ────────────────────────────────────────────────────────────
export const usersApi = {
  getAll: (params?: { page?: number; pageSize?: number }) =>
    unwrap<import('../types').UserListResult>(axiosClient.get('/users', { params })),

  changeRole: (id: number, role: string) =>
    unwrap(axiosClient.patch(`/users/${id}/role`, { role })),

  toggleSuspend: (id: number) =>
    unwrap(axiosClient.patch(`/users/${id}/suspend`)),

  impersonate: (id: number) =>
    unwrap<AuthResponse>(axiosClient.post(`/users/${id}/impersonate`)),

  delete: (id: number) =>
    axiosClient.delete(`/users/${id}`),
};

// ── Categories ────────────────────────────────────────────────────────────────
export const categoryApi = {
  getAll: () =>
    unwrap<Category[]>(axiosClient.get('/categories')),
};

// ── Upload ────────────────────────────────────────────────────────────────────
export const uploadApi = {
  uploadImage: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return unwrap<UploadResult>(
      axiosClient.post('/upload/image', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
  },

  uploadArticleFile: (file: File, articleId: number) => {
    const form = new FormData();
    form.append('file', file);
    return unwrap<UploadResult>(
      axiosClient.post(`/upload/article/${articleId}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    );
  },

  uploadMultiple: (files: File[], folder = 'general') => {
    const form = new FormData();
    files.forEach((f) => form.append('fileList', f));
    return unwrap<UploadResult[]>(
      axiosClient.post('/upload/multiple', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        params: { folder },
      }),
    );
  },
};
