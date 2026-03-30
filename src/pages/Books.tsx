import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";
import { useIpCheck } from "@/hooks/useIpCheck";
import { fetchNovels, createNovel, deleteNovel } from "@/lib/booksApi";
import { uploadImage } from "@/lib/forumApi";

const CATEGORIES = ["رواية", "مانجا", "مانهوا", "قصة قصيرة", "خيال علمي", "رعب", "رومانسية", "مغامرة"];

function BookCard({ novel, index, isOwner, onDelete }: { novel: any; index: number; isOwner: boolean; onDelete: (id: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setRotateX(-y * 20);
    setRotateY(x * 20);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
    >
      <div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        className="group relative"
        style={{
          perspective: "1000px",
        }}
      >
        <div
          className="relative rounded-2xl overflow-hidden border border-border bg-card transition-all duration-300"
          style={{
            transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(${isHovered ? 1.02 : 1})`,
            transformStyle: "preserve-3d",
            transition: isHovered ? "transform 0.1s ease-out" : "transform 0.4s ease-out",
            boxShadow: isHovered
              ? `${rotateY * 2}px ${-rotateX * 2}px 30px hsl(24 70% 45% / 0.15)`
              : "0 2px 8px hsl(20 20% 15% / 0.06)",
          }}
        >
          {/* Cover */}
          <div className="aspect-[3/4] bg-secondary overflow-hidden relative">
            {novel.cover_image_url ? (
              <img
                src={novel.cover_image_url}
                alt={novel.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-6xl bg-gradient-to-br from-primary/20 to-accent/20">
                📖
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-0 inset-x-0 p-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
              <Link
                to={`/books/${novel.id}`}
                className="block w-full text-center py-2 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:opacity-90"
              >
                اقرأ الآن
              </Link>
            </div>
            {/* Category badge */}
            <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-xs font-medium bg-card/90 backdrop-blur-sm text-foreground">
              {novel.category}
            </span>
          </div>

          {/* Info */}
          <div className="p-4 space-y-1.5" style={{ transform: "translateZ(20px)" }}>
            <Link to={`/books/${novel.id}`}>
              <h3 className="font-bold text-lg leading-snug hover:text-primary transition-colors line-clamp-1">
                {novel.title}
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground line-clamp-2">{novel.description}</p>
          </div>

          {/* Owner delete */}
          {isOwner && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(novel.id); }}
              className="absolute top-3 left-3 w-7 h-7 rounded-full bg-destructive/80 text-destructive-foreground flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

const Books = () => {
  const { isOwner, loading: ipLoading } = useIpCheck();
  const [novels, setNovels] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [bio, setBio] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [coverUrl, setCoverUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  const load = async () => {
    const data = await fetchNovels();
    setNovels(data || []);
  };

  useEffect(() => { load(); }, []);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadImg(file);
      setCoverUrl(url);
    } catch (err) { console.error(err); }
    setUploading(false);
  };

  const handleCreate = async () => {
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      await createNovel(title, description, bio, category, coverUrl);
      await load();
      setTitle(""); setDescription(""); setBio(""); setCoverUrl("");
      setShowCreate(false);
    } catch (e) { console.error(e); }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    await deleteNovel(id);
    await load();
  };

  return (
    <div className="min-h-screen">
      {/* Nav */}
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              المنتدى
            </Link>
            <span className="text-sm font-bold text-primary">📚 كتب كورا</span>
          </div>
          <Link to="/" className="flex items-center gap-2">
            <img src="/lovable-uploads/41c7b859-8b99-4066-9b64-7762e8ed9448.jpg" alt="كورا" className="w-8 h-8 rounded-full object-cover border border-border" />
            <span className="text-sm font-semibold hidden sm:inline">كورا</span>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div ref={heroRef} className="relative overflow-hidden">
        <motion.div
          style={{ y: heroY, opacity: heroOpacity }}
          className="relative py-20 sm:py-32 px-4"
        >
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="text-7xl sm:text-8xl mx-auto"
            >
              📚
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-4xl sm:text-5xl font-extrabold tracking-tight"
            >
              كتب <span className="text-primary">كورا</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              className="text-lg text-muted-foreground max-w-md mx-auto"
            >
              مكتبة الروايات والقصص — اقرأ، استمتع، وعش التجربة
            </motion.p>
          </div>
        </motion.div>
        {/* Decorative */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        </div>
      </div>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 pb-16">
        {/* Owner: Create novel */}
        {!ipLoading && isOwner && (
          <div className="mb-8">
            {!showCreate ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowCreate(true)}
                className="w-full rounded-xl border-2 border-dashed border-border bg-card/50 p-6 text-muted-foreground hover:border-primary/30 hover:text-primary transition-all text-lg"
              >
                ✨ أضف رواية جديدة
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="rounded-xl border border-border bg-card p-6 space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="عنوان الرواية"
                    className="bg-secondary/50 rounded-lg px-4 py-3 text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-primary/30"
                  />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="bg-secondary/50 rounded-lg px-4 py-3 text-sm outline-none focus:ring-1 focus:ring-primary/30"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="وصف مختصر..."
                  rows={2}
                  className="w-full bg-secondary/50 rounded-lg px-4 py-3 text-sm outline-none resize-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-primary/30"
                />
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="قصة / بايو الرواية..."
                  rows={3}
                  className="w-full bg-secondary/50 rounded-lg px-4 py-3 text-sm outline-none resize-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-primary/30"
                />
                {/* Cover upload */}
                <div className="flex items-center gap-3">
                  <label className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm cursor-pointer hover:bg-secondary/80">
                    {uploading ? "⏳ جاري الرفع..." : "📷 صورة الغلاف"}
                    <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                  </label>
                  {coverUrl && <img src={coverUrl} alt="غلاف" className="w-16 h-20 object-cover rounded-lg border border-border" />}
                </div>
                <div className="flex gap-2">
                  <button onClick={handleCreate} disabled={submitting || !title.trim()} className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50">
                    {submitting ? "جاري الإضافة..." : "إضافة"}
                  </button>
                  <button onClick={() => setShowCreate(false)} className="px-5 py-2.5 rounded-lg bg-secondary text-secondary-foreground font-medium hover:bg-secondary/80">
                    إلغاء
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        )}

        {/* Books grid */}
        {novels.length === 0 ? (
          <div className="text-center py-20 text-muted-foreground">
            <p className="text-5xl mb-4">📖</p>
            <p>لا توجد روايات بعد</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {novels.map((novel, i) => (
              <BookCard key={novel.id} novel={novel} index={i} isOwner={isOwner} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 text-center text-xs text-muted-foreground">
          كتب كورا · محمد · {new Date().getFullYear()}
        </div>
      </footer>
    </div>
  );
};

export default Books;
