import { supabase } from "@/lib/supabase";

const BASE_URL = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "/api";

async function getHeaders(): Promise<Record<string, string>> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = await getHeaders();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers as Record<string, string> || {}) },
  });
  if (res.status === 204) return undefined as T;
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data as T;
}

export interface Author {
  id: string;
  username: string;
  avatar_url: string | null;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  excerpt: string | null;
  cover_image_url: string | null;
  category: string | null;
  author: Author;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  published: boolean;
  created_at: string;
  updated_at: string;
}

export interface PostsResponse {
  posts: Post[];
  total: number;
  page: number;
  limit: number;
}

export interface Comment {
  id: string;
  content: string;
  author: Author;
  post_id: string;
  created_at: string;
}

export interface Profile {
  id: string;
  username: string;
  email: string;
  avatar_url: string | null;
  bio: string | null;
  posts_count: number;
  created_at: string;
}

export const api = {
  posts: {
    list: (params?: { page?: number; limit?: number; category?: string; search?: string }) => {
      const query = new URLSearchParams();
      if (params?.page) query.set("page", String(params.page));
      if (params?.limit) query.set("limit", String(params.limit));
      if (params?.category) query.set("category", params.category);
      if (params?.search) query.set("search", params.search);
      const qs = query.toString();
      return request<PostsResponse>(`/posts${qs ? `?${qs}` : ""}`);
    },
    get: (id: string) => request<Post>(`/posts/${id}`),
    create: (data: { title: string; content: string; excerpt?: string; cover_image_url?: string; category?: string; published?: boolean }) =>
      request<Post>("/posts", { method: "POST", body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Post>) =>
      request<Post>(`/posts/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
    delete: (id: string) =>
      request<void>(`/posts/${id}`, { method: "DELETE" }),
    like: (id: string) =>
      request<{ liked: boolean; likes_count: number }>(`/posts/${id}/like`, { method: "POST" }),
    comments: {
      list: (postId: string) => request<Comment[]>(`/posts/${postId}/comments`),
      create: (postId: string, content: string) =>
        request<Comment>(`/posts/${postId}/comments`, { method: "POST", body: JSON.stringify({ content }) }),
    },
  },
  comments: {
    delete: (id: string) => request<void>(`/comments/${id}`, { method: "DELETE" }),
  },
  profile: {
    get: () => request<Profile>("/profile"),
    update: (data: Partial<Profile>) =>
      request<Profile>("/profile", { method: "PATCH", body: JSON.stringify(data) }),
    myPosts: () => request<PostsResponse>("/profile/posts"),
  },
};
