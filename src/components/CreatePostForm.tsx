import { useState } from "react";

const CATEGORIES = ["عام", "تقنية", "أفكار", "يوميات"];

interface CreatePostFormProps {
  onSubmit: (title: string, content: string, category: string) => void;
}

const CreatePostForm = ({ onSubmit }: CreatePostFormProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [open, setOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSubmit(title.trim(), content.trim(), category);
    setTitle("");
    setContent("");
    setCategory(CATEGORIES[0]);
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
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-border bg-card p-5 forum-shadow animate-fade-in space-y-4"
    >
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              category === cat
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {cat}
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

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="اكتب محتوى المنشور هنا..."
        rows={4}
        className="w-full bg-transparent placeholder:text-muted-foreground/50 outline-none resize-none leading-relaxed"
      />

      <div className="flex gap-2 justify-start">
        <button
          type="submit"
          className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
        >
          نشر
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
