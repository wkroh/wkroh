import { useState, useRef } from "react";
import MarkdownToolbar from "@/components/MarkdownToolbar";

interface CreatePostFormProps {
  categories: Array<{ id: string; name: string; emoji: string }>;
  onSubmit: (title: string, content: string, categoryId: string | null, hashtags: string[]) => void;
  submitting: boolean;
}

const CreatePostForm = ({ categories, onSubmit, submitting }: CreatePostFormProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(categories[0]?.id || null);
  const [hashtagInput, setHashtagInput] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const addHashtag = () => {
    const tag = hashtagInput.trim().replace(/^#/, "");
    if (tag && !hashtags.includes(tag)) {
      setHashtags((prev) => [...prev, tag]);
    }
    setHashtagInput("");
  };

  const removeHashtag = (tag: string) => {
    setHashtags((prev) => prev.filter((t) => t !== tag));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSubmit(title.trim(), content.trim(), categoryId, hashtags);
    setTitle("");
    setContent("");
    setHashtags([]);
    setHashtagInput("");
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-border bg-card p-4 text-right text-muted-foreground transition-all hover:border-primary/30 hover:forum-shadow-lg cursor-pointer"
      >
        ✍️ اكتب منشور جديد...
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-card p-5 forum-shadow animate-fade-in space-y-4">
      {/* Category selector */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategoryId(cat.id)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              categoryId === cat.id
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
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="عنوان المنشور"
        className="w-full bg-transparent text-xl font-semibold placeholder:text-muted-foreground/50 outline-none border-b border-border pb-2 focus:border-primary transition-colors"
        autoFocus
      />

      {/* Markdown Toolbar */}
      <MarkdownToolbar textareaRef={textareaRef} value={content} onChange={setContent} />

      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="اكتب محتوى المنشور... (يدعم Markdown)"
        rows={6}
        className="w-full bg-transparent placeholder:text-muted-foreground/50 outline-none resize-none leading-relaxed text-sm"
      />

      {/* Hashtags */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={hashtagInput}
            onChange={(e) => setHashtagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addHashtag();
              }
            }}
            placeholder="أضف هاشتاق..."
            className="flex-1 bg-secondary/50 rounded-lg px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-primary/30"
          />
          <button
            type="button"
            onClick={addHashtag}
            className="px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80 transition-colors"
          >
            +
          </button>
        </div>
        {hashtags.length > 0 && (
          <div className="flex gap-1.5 flex-wrap">
            {hashtags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary cursor-pointer hover:bg-primary/20 transition-colors"
                onClick={() => removeHashtag(tag)}
              >
                #{tag} ✕
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-2 justify-start">
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {submitting ? "جاري النشر..." : "نشر"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-5 py-2 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80 transition-colors"
        >
          إلغاء
        </button>
      </div>
    </form>
  );
};

export default CreatePostForm;
