import { useState } from "react";
import { useIpCheck } from "@/hooks/useIpCheck";
import { usePosts } from "@/hooks/usePosts";
import CreatePostForm from "@/components/CreatePostForm";
import PostCard from "@/components/PostCard";

const CATEGORIES = ["الكل", "عام", "تقنية", "أفكار", "يوميات"];

const Index = () => {
  const { isOwner, loading } = useIpCheck();
  const { posts, addPost, deletePost } = usePosts();
  const [filter, setFilter] = useState("الكل");

  const filtered = filter === "الكل" ? posts : posts.filter((p) => p.category === filter);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">المنتدى</h1>
            <p className="text-xs text-muted-foreground">مساحتي الخاصة</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm">
            🪶
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Owner: Create post */}
        {loading ? null : isOwner && <CreatePostForm onSubmit={addPost} />}

        {/* Category filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                filter === cat
                  ? "bg-foreground text-background"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/70"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Posts */}
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-3">🍃</p>
            <p className="text-sm">لا توجد منشورات بعد</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isOwner={isOwner}
                onDelete={deletePost}
              />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="max-w-2xl mx-auto px-4 py-4 text-center text-xs text-muted-foreground">
          منتدى خاص · {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};

export default Index;
