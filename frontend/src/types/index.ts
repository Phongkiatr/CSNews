export type UserRole = 'Reader' | 'Editor' | 'Admin';

export interface User {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  profileImage?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface LoginPayload    { email: string; password: string; }
export interface RegisterPayload { username: string; email: string; password: string; }

export interface ArticleListItem {
  id: number;
  title: string;
  slug: string;
  summary: string;
  thumbnailUrl?: string;
  status: 'Draft' | 'Published' | 'Archived';
  viewCount: number;
  isFeatured: boolean;
  categoryId: number;
  categoryName: string;
  authorUsername: string;
  createdAt: string;
  publishedAt?: string;
  tags: string[];
}

export interface ArticleDetail extends ArticleListItem {
  content: string;
  author: User;
  files: ArticleFile[];
}

export interface CreateArticlePayload {
  title: string;
  summary: string;
  content: string;
  categoryId: number;
  tags?: string[];
  isFeatured?: boolean;
}

export interface UpdateArticlePayload extends CreateArticlePayload {
  status: 'Draft' | 'Published' | 'Archived';
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  articleCount: number;
}

export interface ArticleFile {
  id: number;
  fileName: string;
  originalFileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
}

export interface UploadResult {
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export type PageName =
  | 'home' | 'detail' | 'login' | 'register'
  | 'create' | 'edit' | 'admin' | 'unauthorized';
