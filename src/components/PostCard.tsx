import { Link } from "react-router-dom";

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
    author_username: string;
    categories: { name: string; emoji: string } | null;
  };
  isOwner: boolean;
  onDelete: (id: string) => void;
  onHashtagClick: (tag: string) => void;
}

function getPreview(content: string, maxLen = 120): string {
  // Strip markdown syntax for preview
  const plain = content.replace(/[#*`>\[\]!_~()\-]/g, "").replace(/\n+/g, " ");
  return plain.length > maxLen ? plain.substring(0, maxLen) + "..." : plain;
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
            <Link to={`/user/${post.author_username}`} className="text-xs text-primary hover:underline">
              @{post.author_username}
            </Link>
            <span className="text-xs text-muted-foreground">
              {timeAgo(post.created_at)}
            </span>
          </div>

          <Link to={`/post/${post.id}`}>
            <h2 className="text-lg font-semibold mb-1.5 leading-snug hover:text-primary transition-colors">{post.title}</h2>
          </Link>

          <p className="text-sm text-muted-foreground mb-2">{getPreview(post.content)}</p>

          <Link to={`/post/${post.id}`} className="text-xs text-primary hover:underline">
            عرض المزيد ←
          </Link>

          {post.hashtags && post.hashtags.length > 0 && (
            <div className="flex gap-1.5 flex-wrap mt-2">
              {post.hashtags.map((tag) => (
                <button
                  key={tag}
                  onClick={(e) => { e.preventDefault(); onHashtagClick(tag); }}
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
