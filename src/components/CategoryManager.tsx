import { useState } from "react";

interface CategoryManagerProps {
  categories: Array<{ id: string; name: string; emoji: string }>;
  onAdd: (name: string, emoji: string) => void;
  onDelete: (id: string) => void;
}

const CategoryManager = ({ categories, onAdd, onDelete }: CategoryManagerProps) => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("💬");

  const handleAdd = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), emoji);
    setName("");
    setEmoji("💬");
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">الأقسام</span>
        <button
          onClick={() => setOpen(!open)}
          className="text-xs px-2 py-1 rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          {open ? "إغلاق" : "+ قسم جديد"}
        </button>
      </div>

      {open && (
        <div className="flex gap-2 animate-fade-in">
          <input
            type="text"
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            className="w-12 bg-secondary/50 rounded-lg px-2 py-1.5 text-center text-sm outline-none"
            maxLength={2}
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسم القسم"
            className="flex-1 bg-secondary/50 rounded-lg px-3 py-1.5 text-sm outline-none placeholder:text-muted-foreground/50"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <button
            onClick={handleAdd}
            className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm"
          >
            إضافة
          </button>
        </div>
      )}

      <div className="flex gap-1.5 flex-wrap">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="group inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-secondary text-secondary-foreground"
          >
            {cat.emoji} {cat.name}
            <button
              onClick={() => onDelete(cat.id)}
              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity mr-0.5"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CategoryManager;
