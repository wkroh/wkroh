import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/forum-api`;

async function callApi(body: Record<string, unknown>) {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "حدث خطأ");
  return data;
}

export async function fetchNovels() {
  const { data, error } = await supabase
    .from("novels")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
}

export async function fetchNovel(id: string) {
  const { data, error } = await supabase
    .from("novels")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchChapters(novelId: string) {
  const { data, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("novel_id", novelId)
    .order("chapter_number", { ascending: true });
  if (error) throw error;
  return data;
}

export async function fetchChapter(id: string) {
  const { data, error } = await supabase
    .from("chapters")
    .select("*")
    .eq("id", id)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchNovelComments(novelId: string) {
  const { data, error } = await supabase
    .from("novel_comments")
    .select("*")
    .eq("novel_id", novelId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return data;
}

export const createNovel = (title: string, description: string, bio: string, category: string, cover_image_url: string) =>
  callApi({ action: "create-novel", title, description, bio, category, cover_image_url });

export const editNovel = (id: string, title: string, description: string, bio: string, category: string, cover_image_url: string) =>
  callApi({ action: "edit-novel", id, title, description, bio, category, cover_image_url });

export const deleteNovel = (id: string) =>
  callApi({ action: "delete-novel", id });

export const createChapter = (novel_id: string, title: string, content: string, chapter_number: number) =>
  callApi({ action: "create-chapter", novel_id, title, content, chapter_number });

export const editChapter = (id: string, title: string, content: string) =>
  callApi({ action: "edit-chapter", id, title, content });

export const deleteChapter = (id: string) =>
  callApi({ action: "delete-chapter", id });

export const addNovelComment = (novel_id: string, author_name: string, content: string, chapter_id?: string) =>
  callApi({ action: "add-novel-comment", novel_id, author_name, content, chapter_id });

export const deleteNovelComment = (id: string) =>
  callApi({ action: "delete-novel-comment", id });

// Reading progress (localStorage)
export function saveReadingProgress(novelId: string, chapterId: string, scrollPercent: number) {
  const key = `reading-progress-${novelId}`;
  const data = { chapterId, scrollPercent, timestamp: Date.now() };
  localStorage.setItem(key, JSON.stringify(data));
}

export function getReadingProgress(novelId: string) {
  const key = `reading-progress-${novelId}`;
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}

// Reading stats
export function getReadingStats() {
  const raw = localStorage.getItem("reading-stats");
  return raw ? JSON.parse(raw) : { pagesRead: 0, timeSpent: 0, streak: 0, lastReadDate: null, level: 1, xp: 0, achievements: [] };
}

export function updateReadingStats(updates: Partial<ReturnType<typeof getReadingStats>>) {
  const current = getReadingStats();
  const merged = { ...current, ...updates };
  localStorage.setItem("reading-stats", JSON.stringify(merged));
  return merged;
}

export function recordReading(pagesRead: number, timeSpentMs: number) {
  const stats = getReadingStats();
  const today = new Date().toDateString();
  const lastDate = stats.lastReadDate;
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  let streak = stats.streak;
  if (lastDate !== today) {
    streak = lastDate === yesterday ? streak + 1 : 1;
  }

  const xp = stats.xp + pagesRead * 10 + Math.floor(timeSpentMs / 60000) * 5;
  const level = Math.floor(xp / 100) + 1;

  const achievements = [...stats.achievements];
  if (stats.pagesRead + pagesRead >= 10 && !achievements.includes("reader_10")) achievements.push("reader_10");
  if (stats.pagesRead + pagesRead >= 50 && !achievements.includes("reader_50")) achievements.push("reader_50");
  if (stats.pagesRead + pagesRead >= 100 && !achievements.includes("reader_100")) achievements.push("reader_100");
  if (streak >= 3 && !achievements.includes("streak_3")) achievements.push("streak_3");
  if (streak >= 7 && !achievements.includes("streak_7")) achievements.push("streak_7");

  return updateReadingStats({
    pagesRead: stats.pagesRead + pagesRead,
    timeSpent: stats.timeSpent + timeSpentMs,
    streak,
    lastReadDate: today,
    level,
    xp,
    achievements,
  });
}

// Reader settings
export function getReaderSettings() {
  const raw = localStorage.getItem("reader-settings");
  return raw ? JSON.parse(raw) : {
    theme: "light",
    fontSize: 18,
    fontFamily: "cairo",
    lineSpacing: 1.8,
    readingMode: "vertical",
    background: "white",
  };
}

export function saveReaderSettings(settings: ReturnType<typeof getReaderSettings>) {
  localStorage.setItem("reader-settings", JSON.stringify(settings));
}
