import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

interface PostCardProps {
  post: {
    id: string;
    title: string;
    content: string;
    hashtags: string[];
    created_at: string;
    categories: { name: string; emoji: string } | null;
  };
  isOwner: boolean;
  onDelete: (id: string) => void;
  onHashtagClick: (tag: string) => void;
}

const PostCard = ({ post, isOwner, onDelete, onHashtagClick }: PostCardProps) => {
  return (
    <article className="rounded-lg border border-border bg-card p-5 forum-shadow transition-all hover:forum-shadow-lg animate-fade-in group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            {post.categories && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                {post.categories.emoji} {post.categories.name}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {timeAgo(post.created_at)}
            </span>
          </div>

          <h2 className="text-lg font-semibold mb-3 leading-snug">{post.title}</h2>

          {/* Markdown content */}
          <div className="prose-forum text-foreground/85 leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
          </div>

          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-3">
              {post.hashtags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => onHashtagClick(tag)}
                  className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
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
