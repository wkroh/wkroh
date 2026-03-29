import { useState, useEffect } from "react";
import { addComment, fetchComments, deleteComment } from "@/lib/forumApi";
import { supabase } from "@/integrations/supabase/client";

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diff < 60) return "الآن";
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} دقيقة`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} ساعة`;
  if (diff < 2592000) return `منذ ${Math.floor(diff / 86400)} يوم`;
  return date.toLocaleDateString("ar-SA");
}

interface Comment {
  id: string;
  author_name: string;
  content: string;
  created_at: string;
  post_id: string;
}

interface CommentSectionProps {
  postId: string;
  isOwner: boolean;
}

const CommentSection = ({ postId, isOwner }: CommentSectionProps) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const data = await fetchComments(postId);
    setComments((data as Comment[]) || []);
  };

  useEffect(() => {
    load();

    const channel = supabase
      .channel(`comments-${postId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments", filter: `post_id=eq.${postId}` },
        () => load()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [postId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;
    setSubmitting(true);
    try {
      await addComment(postId, name.trim(), content.trim());
      setContent("");
      await load();
    } catch (err) {
      console.error(err);
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    await deleteComment(id);
    await load();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">💬 التعليقات ({comments.length})</h3>

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-border bg-card p-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="اسمك..."
          className="w-full bg-secondary/50 rounded-lg px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-primary/30"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="اكتب تعليقك..."
          rows={3}
          className="w-full bg-secondary/50 rounded-lg px-3 py-2 text-sm outline-none resize-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-primary/30"
        />
        <button
          type="submit"
          disabled={submitting || !name.trim() || !content.trim()}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {submitting ? "جاري الإرسال..." : "أرسل تعليق"}
        </button>
      </form>

      {/* Comments list */}
      <div className="space-y-3">
        {comments.map((c) => (
          <div key={c.id} className="rounded-lg bg-secondary/30 p-3 group">
            <div className="flex items-center justify-between gap-2 mb-1">
              <div className="flex items-center gap-2">
                <span className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">
                  {c.author_name[0]}
                </span>
                <span className="text-sm font-semibold">{c.author_name}</span>
                <span className="text-xs text-muted-foreground">{timeAgo(c.created_at)}</span>
              </div>
              {isOwner && (
                <button
                  onClick={() => handleDelete(c.id)}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive text-xs transition-opacity"
                >
                  حذف
                </button>
              )}
            </div>
            <p className="text-sm text-foreground/85 pr-9">{c.content}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentSection;
