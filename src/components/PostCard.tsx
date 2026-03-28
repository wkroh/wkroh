import type { ForumPost } from "@/types/forum";

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

const categoryEmoji: Record<string, string> = {
  "عام": "💬",
  "تقنية": "💻",
  "أفكار": "💡",
  "يوميات": "📝",
};

interface PostCardProps {
  post: ForumPost;
  isOwner: boolean;
  onDelete: (id: string) => void;
}

const PostCard = ({ post, isOwner, onDelete }: PostCardProps) => {
  return (
    <article className="rounded-lg border border-border bg-card p-5 forum-shadow transition-all hover:forum-shadow-lg animate-fade-in group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
              {categoryEmoji[post.category] || "💬"} {post.category}
            </span>
            <span className="text-xs text-muted-foreground">
              {timeAgo(post.createdAt)}
            </span>
          </div>
          <h2 className="text-lg font-semibold mb-2 leading-snug">{post.title}</h2>
          <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">{post.content}</p>
        </div>

        {isOwner && (
          <button
            onClick={() => onDelete(post.id)}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive p-1 shrink-0"
            title="حذف"
          >
            ✕
          </button>
        )}
      </div>
    </article>
  );
};

export default PostCard;
