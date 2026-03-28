import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/forum-api`;

async function callApi(method: string, body?: Record<string, unknown>, params?: Record<string, string>) {
  const url = new URL(FUNCTION_URL);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }
  const res = await fetch(url.toString(), {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "حدث خطأ");
  return data;
}

export async function checkIsOwner(): Promise<{ isOwner: boolean; ip: string }> {
  return callApi("GET", undefined, { action: "check-ip" });
}

export async function fetchCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchPosts(categoryId?: string, search?: string) {
  let query = supabase
    .from("posts")
    .select("*, categories(name, emoji)")
    .order("created_at", { ascending: false });

  if (categoryId) {
    query = query.eq("category_id", categoryId);
  }
  if (search) {
    query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function createPost(title: string, content: string, categoryId: string | null, hashtags: string[]) {
  return callApi("POST", { action: "create-post", title, content, category_id: categoryId, hashtags });
}

export async function deletePost(id: string) {
  return callApi("POST", { action: "delete-post", id });
}

export async function createCategory(name: string, emoji: string) {
  return callApi("POST", { action: "create-category", name, emoji });
}

export async function deleteCategory(id: string) {
  return callApi("POST", { action: "delete-category", id });
}
