import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useIpCheck } from "@/hooks/useIpCheck";
import { fetchPost, fetchCategories, deletePost, editPost, uploadImage } from "@/lib/forumApi";
import CommentSection from "@/components/CommentSection";
import MarkdownToolbar from "@/components/MarkdownToolbar";
import { useRef } from "react";

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

const PostDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isOwner } = useIpCheck();
  const [post, setPost] = useState<any>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editCategoryId, setEditCategoryId] = useState<string | null>(null);
  const [editHashtags, setEditHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([fetchPost(id), fetchCategories()]).then(([p, cats]) => {
      setPost(p);
      setCategories(cats || []);
      setLoading(false);
    });
  }, [id]);

  const startEdit = () => {
    setEditTitle(post.title);
    setEditContent(post.content);
    setEditCategoryId(post.category_id);
    setEditHashtags(post.hashtags || []);
    setEditing(true);
  };

  const handleSave = async () => {
    if (!editTitle.trim() || !editContent.trim()) return;
    setSaving(true);
    try {
      await editPost(id!, editTitle, editContent, editCategoryId, editHashtags);
      const updated = await fetchPost(id!);
      setPost(updated);
      setEditing(false);
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    await deletePost(id!);
    navigate("/");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImage(file);
      const textarea = textareaRef.current;
      if (textarea) {
        const pos = textarea.selectionStart;
        const imgMarkdown = `\n![${file.name}](${url})\n`;
        setEditContent((prev) => prev.substring(0, pos) + imgMarkdown + prev.substring(pos));
      } else {
        setEditContent((prev) => prev + `\n![${file.name}](${url})\n`);
      }
    } catch (err) {
      console.error(err);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        جاري التحميل...
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <p className="text-4xl">🍃</p>
        <p>المنشور غير موجود</p>
        <Link to="/" className="text-primary hover:underline text-sm">العودة للرئيسية</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="text-sm text-primary hover:underline flex items-center gap-1">
            → العودة للمنتدى
          </Link>
          {isOwner && (
            <div className="flex gap-2">
              {!editing && (
                <button onClick={startEdit} className="text-xs px-3 py-1 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80">
                  ✏️ تعديل
                </button>
              )}
              <button onClick={handleDelete} className="text-xs px-3 py-1 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20">
                🗑 حذف
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {editing ? (
          <div className="space-y-4 rounded-lg border border-border bg-card p-5">
            {/* Category selector */}
            <div className="flex gap-2 flex-wrap">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setEditCategoryId(cat.id)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    editCategoryId === cat.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                  }`}
                >
                  {cat.emoji} {cat.name}
                </button>
              ))}
            </div>

            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full bg-transparent text-xl font-semibold outline-none border-b border-border pb-2 focus:border-primary transition-colors"
            />

            <MarkdownToolbar textareaRef={textareaRef} value={editContent} onChange={setEditContent} />

            <div className="relative">
              <textarea
                ref={textareaRef}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={10}
                className="w-full bg-transparent outline-none resize-none leading-relaxed text-sm"
              />
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute left-2 bottom-2 px-2 py-1 rounded bg-secondary text-secondary-foreground text-xs hover:bg-secondary/80 disabled:opacity-50"
              >
                {uploading ? "⏳" : "📷 صورة"}
              </button>
            </div>

            {/* Hashtags */}
            <div className="flex gap-2">
              <input
                type="text"
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === ",") {
                    e.preventDefault();
                    const tag = hashtagInput.trim().replace(/^#/, "");
                    if (tag && !editHashtags.includes(tag)) setEditHashtags((p) => [...p, tag]);
                    setHashtagInput("");
                  }
                }}
                placeholder="أضف هاشتاق..."
                className="flex-1 bg-secondary/50 rounded-lg px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-primary/30"
              />
            </div>
            {editHashtags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {editHashtags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
                    onClick={() => setEditHashtags((p) => p.filter((t) => t !== tag))}
                  >
                    #{tag} ✕
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={handleSave} disabled={saving} className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50">
                {saving ? "جاري الحفظ..." : "حفظ"}
              </button>
              <button onClick={() => setEditing(false)} className="px-5 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80">
                إلغاء
              </button>
            </div>
          </div>
        ) : (
          <article>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              {post.categories && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                  {post.categories.emoji} {post.categories.name}
                </span>
              )}
              <span className="text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
            </div>

            <h1 className="text-2xl font-extrabold mb-4 leading-snug">{post.title}</h1>

            <div className="prose-forum text-foreground/85 leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
            </div>

            {post.hashtags && post.hashtags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap mt-4">
                {post.hashtags.map((tag: string) => (
                  <Link
                    key={tag}
                    to={`/?search=${tag}`}
                    className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}
          </article>
        )}

        {/* Comments */}
        <CommentSection postId={id!} isOwner={isOwner} />
      </main>
    </div>
  );
};

export default PostDetail;
