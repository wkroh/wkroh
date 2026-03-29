import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchPostsByUser } from "@/lib/forumApi";

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

const UserProfile = () => {
  const { username } = useParams<{ username: string }>();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    fetchPostsByUser(username).then((data) => {
      setPosts(data || []);
      setLoading(false);
    });
  }, [username]);

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <Link to="/" className="text-sm text-primary hover:underline">→ العودة للمنتدى</Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Profile header */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center text-2xl font-bold">
            {username?.[0]}
          </div>
          <div>
            <h1 className="text-xl font-extrabold">@{username}</h1>
            <p className="text-sm text-muted-foreground">{posts.length} منشور</p>
          </div>
        </div>

        {/* Posts */}
        {loading ? (
          <p className="text-center text-muted-foreground py-8">جاري التحميل...</p>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-3">🍃</p>
            <p className="text-sm">لا توجد منشورات لهذا المستخدم</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <Link key={post.id} to={`/post/${post.id}`} className="block">
                <article className="rounded-lg border border-border bg-card p-4 forum-shadow transition-all hover:forum-shadow-lg">
                  <div className="flex items-center gap-2 mb-1.5">
                    {post.categories && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                        {post.categories.emoji} {post.categories.name}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
                  </div>
                  <h2 className="text-base font-semibold mb-1">{post.title}</h2>
                  <p className="text-sm text-muted-foreground line-clamp-2">{post.content.replace(/[#*`>\[\]!_~]/g, "").substring(0, 150)}</p>
                </article>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default UserProfile;
