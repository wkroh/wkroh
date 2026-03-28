import { useState, useEffect } from "react";
import type { ForumPost } from "@/types/forum";

const STORAGE_KEY = "forum_posts";

function loadPosts(): ForumPost[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function savePosts(posts: ForumPost[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

export function usePosts() {
  const [posts, setPosts] = useState<ForumPost[]>(loadPosts);

  useEffect(() => {
    savePosts(posts);
  }, [posts]);

  const addPost = (title: string, content: string, category: string) => {
    const newPost: ForumPost = {
      id: crypto.randomUUID(),
      title,
      content,
      createdAt: new Date().toISOString(),
      category,
    };
    setPosts((prev) => [newPost, ...prev]);
  };

  const deletePost = (id: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  return { posts, addPost, deletePost };
}
