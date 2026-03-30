import { useState, useEffect, useCallback } from "react";
import { useIpCheck } from "@/hooks/useIpCheck";
import {
  fetchCategories,
  fetchPosts,
  createPost,
  deletePost,
  createCategory,
  deleteCategory } from
"@/lib/forumApi";
import CreatePostForm from "@/components/CreatePostForm";
import PostCard from "@/components/PostCard";
import CategoryManager from "@/components/CategoryManager";
import logo from "@/assets/logo.jpg";

const Index = () => {
  const { isOwner, loading: ipLoading } = useIpCheck();
  const [categories, setCategories] = useState<Array<{id: string;name: string;emoji: string;sort_order: number;created_at: string;}>>([]);
  const [posts, setPosts] = useState<any[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    const [cats, p] = await Promise.all([
    fetchCategories(),
    fetchPosts(filter || undefined, search || undefined)]
    );
    setCategories(cats || []);
    setPosts(p || []);
  }, [filter, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreatePost = async (title: string, content: string, categoryId: string | null, hashtags: string[]) => {
    setSubmitting(true);
    try {
      await createPost(title, content, categoryId, hashtags);
      await loadData();
    } catch (e) {
      console.error(e);
    }
    setSubmitting(false);
  };

  const handleDeletePost = async (id: string) => {
    await deletePost(id);
    await loadData();
  };

  const handleCreateCategory = async (name: string, emoji: string) => {
    await createCategory(name, emoji);
    await loadData();
  };

  const handleDeleteCategory = async (id: string) => {
    await deleteCategory(id);
    await loadData();
  };

  const handleHashtagClick = (tag: string) => {
    setSearch(tag);
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <img alt="كورا" className="w-10 h-10 rounded-full object-cover border border-border" src="/lovable-uploads/41c7b859-8b99-4066-9b64-7762e8ed9448.jpg" />
              <div>
                <h1 className="text-xl font-extrabold tracking-tight">منتدى كورا</h1>
                <p className="text-xs text-muted-foreground">محمد · wkroh</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a href="/books" className="px-3 py-1.5 rounded-full text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                📚 كتب كورا
              </a>
              <a href="mailto:wkroh@proton.me" className="text-xs text-muted-foreground hover:text-primary transition-colors hidden sm:inline">
                wkroh@proton.me
              </a>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="🔍 ابحث في المنشورات..."
              className="w-full bg-secondary/50 rounded-lg px-4 py-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-primary/30 transition-all" />
            
            {search &&
            <button
              onClick={() => setSearch("")}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs">
              
                ✕
              </button>
            }
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Owner: Category Manager */}
        {!ipLoading && isOwner &&
        <CategoryManager
          categories={categories}
          onAdd={handleCreateCategory}
          onDelete={handleDeleteCategory} />

        }

        {/* Owner: Create post */}
        {!ipLoading && isOwner &&
        <CreatePostForm
          categories={categories}
          onSubmit={handleCreatePost}
          submitting={submitting} />

        }

        {/* Category filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setFilter(null)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            !filter ?
            "bg-foreground text-background" :
            "bg-secondary text-secondary-foreground hover:bg-secondary/70"}`
            }>
            
            الكل
          </button>
          {categories.map((cat) =>
          <button
            key={cat.id}
            onClick={() => setFilter(cat.id)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
            filter === cat.id ?
            "bg-foreground text-background" :
            "bg-secondary text-secondary-foreground hover:bg-secondary/70"}`
            }>
            
              {cat.emoji} {cat.name}
            </button>
          )}
        </div>

        {/* Posts */}
        {posts.length === 0 ?
        <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-3">🍃</p>
            <p className="text-sm">لا توجد منشورات بعد</p>
          </div> :

        <div className="space-y-3">
            {posts.map((post) =>
          <PostCard
            key={post.id}
            post={post}
            isOwner={isOwner}
            onDelete={handleDeletePost}
            onHashtagClick={handleHashtagClick} />

          )}
          </div>
        }
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-12">
        <div className="max-w-2xl mx-auto px-4 py-4 text-center text-xs text-muted-foreground">
          منتدى كورا · محمد · {new Date().getFullYear()}
        </div>
      </footer>
    </div>);

};

export default Index;