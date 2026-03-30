import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useIpCheck } from "@/hooks/useIpCheck";
import {
  fetchNovel, fetchChapters, editNovel, deleteNovel,
  createChapter, editChapter, deleteChapter,
  fetchNovelComments, addNovelComment, deleteNovelComment,
  getReadingProgress, getReadingStats,
} from "@/lib/booksApi";
import { uploadImage } from "@/lib/forumApi";
import MarkdownToolbar from "@/components/MarkdownToolbar";

const BookDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isOwner } = useIpCheck();
  const [novel, setNovel] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"chapters" | "comments" | "info">("chapters");

  // Comment form
  const [commentName, setCommentName] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Chapter creation
  const [showNewChapter, setShowNewChapter] = useState(false);
  const [chapterTitle, setChapterTitle] = useState("");
  const [chapterContent, setChapterContent] = useState("");
  const [chapterSubmitting, setChapterSubmitting] = useState(false);
  const chapterTextareaRef = useRef<HTMLTextAreaElement>(null);

  // Edit novel
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editCover, setEditCover] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  // Edit chapter
  const [editingChapter, setEditingChapter] = useState<string | null>(null);
  const [editChTitle, setEditChTitle] = useState("");
  const [editChContent, setEditChContent] = useState("");
  const [editChSaving, setEditChSaving] = useState(false);
  const editChTextareaRef = useRef<HTMLTextAreaElement>(null);

  const progress = id ? getReadingProgress(id) : null;

  const load = async () => {
    if (!id) return;
    const [n, chs, cmts] = await Promise.all([
      fetchNovel(id), fetchChapters(id), fetchNovelComments(id),
    ]);
    setNovel(n);
    setChapters(chs || []);
    setComments(cmts || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const handleDeleteNovel = async () => {
    await deleteNovel(id!);
    navigate("/books");
  };

  const handleEditNovel = async () => {
    setEditSaving(true);
    await editNovel(id!, editTitle, editDesc, editBio, editCategory, editCover);
    await load();
    setEditing(false);
    setEditSaving(false);
  };

  const handleCreateChapter = async () => {
    if (!chapterTitle.trim()) return;
    setChapterSubmitting(true);
    await createChapter(id!, chapterTitle, chapterContent, chapters.length + 1);
    await load();
    setChapterTitle(""); setChapterContent(""); setShowNewChapter(false);
    setChapterSubmitting(false);
  };

  const handleEditChapter = async (chId: string) => {
    setEditChSaving(true);
    await editChapter(chId, editChTitle, editChContent);
    await load();
    setEditingChapter(null);
    setEditChSaving(false);
  };

  const handleDeleteChapter = async (chId: string) => {
    await deleteChapter(chId);
    await load();
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentName.trim() || !commentContent.trim()) return;
    setCommentSubmitting(true);
    await addNovelComment(id!, commentName.trim(), commentContent.trim());
    setCommentContent("");
    await load();
    setCommentSubmitting(false);
  };

  const handleDeleteComment = async (cId: string) => {
    await deleteNovelComment(cId);
    await load();
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await uploadImage(file);
    setEditCover(url);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">جاري التحميل...</div>;
  if (!novel) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-muted-foreground">
      <p className="text-4xl">📖</p>
      <p>الرواية غير موجودة</p>
      <Link to="/books" className="text-primary hover:underline text-sm">العودة للمكتبة</Link>
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-border bg-card/60 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/books" className="text-sm text-primary hover:underline">→ المكتبة</Link>
          {isOwner && (
            <div className="flex gap-2">
              <button onClick={() => { setEditTitle(novel.title); setEditDesc(novel.description); setEditBio(novel.bio); setEditCategory(novel.category); setEditCover(novel.cover_image_url); setEditing(true); }}
                className="text-xs px-3 py-1 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80">✏️ تعديل</button>
              <button onClick={handleDeleteNovel} className="text-xs px-3 py-1 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20">🗑 حذف</button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {/* Novel hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row gap-6">
          {/* Cover */}
          <div className="w-40 sm:w-48 shrink-0 mx-auto sm:mx-0">
            {novel.cover_image_url ? (
              <img src={novel.cover_image_url} alt={novel.title} className="w-full aspect-[3/4] object-cover rounded-xl border border-border forum-shadow-lg" />
            ) : (
              <div className="w-full aspect-[3/4] rounded-xl bg-secondary flex items-center justify-center text-5xl">📖</div>
            )}
          </div>
          <div className="flex-1 space-y-3 text-center sm:text-right">
            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">{novel.category}</span>
            <h1 className="text-3xl font-extrabold">{novel.title}</h1>
            <p className="text-muted-foreground">{novel.description}</p>
            {progress && (
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm">
                📌 كملت لين هنا — <Link to={`/books/${id}/read/${progress.chapterId}`} className="font-bold hover:underline">أكمل القراءة</Link>
              </div>
            )}
            {chapters.length > 0 && (
              <Link to={`/books/${id}/read/${chapters[0].id}`} className="inline-block px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity">
                📖 ابدأ القراءة
              </Link>
            )}
          </div>
        </motion.div>

        {/* Edit modal */}
        {editing && (
          <div className="rounded-xl border border-border bg-card p-5 space-y-4">
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="العنوان" className="w-full bg-secondary/50 rounded-lg px-4 py-2 text-sm outline-none" />
            <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="الوصف" rows={2} className="w-full bg-secondary/50 rounded-lg px-4 py-2 text-sm outline-none resize-none" />
            <textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="القصة / البايو" rows={3} className="w-full bg-secondary/50 rounded-lg px-4 py-2 text-sm outline-none resize-none" />
            <div className="flex items-center gap-3">
              <label className="px-3 py-1.5 rounded-lg bg-secondary text-sm cursor-pointer hover:bg-secondary/80">
                📷 غلاف <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
              </label>
              {editCover && <img src={editCover} alt="غلاف" className="w-12 h-16 object-cover rounded border border-border" />}
            </div>
            <div className="flex gap-2">
              <button onClick={handleEditNovel} disabled={editSaving} className="px-5 py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-50">
                {editSaving ? "جاري الحفظ..." : "حفظ"}
              </button>
              <button onClick={() => setEditing(false)} className="px-5 py-2 rounded-lg bg-secondary text-secondary-foreground">إلغاء</button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border">
          {(["chapters", "comments", "info"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${tab === t ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              {t === "chapters" ? `📑 الفصول (${chapters.length})` : t === "comments" ? `💬 التعليقات (${comments.length})` : "📋 معلومات"}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === "chapters" && (
          <div className="space-y-3">
            {isOwner && (
              <>
                {!showNewChapter ? (
                  <button onClick={() => setShowNewChapter(true)} className="w-full py-3 rounded-lg border-2 border-dashed border-border text-muted-foreground hover:border-primary/30 hover:text-primary transition-all text-sm">
                    ✍️ فصل جديد
                  </button>
                ) : (
                  <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                    <input value={chapterTitle} onChange={(e) => setChapterTitle(e.target.value)} placeholder="عنوان الفصل" className="w-full bg-secondary/50 rounded-lg px-3 py-2 text-sm outline-none" />
                    <MarkdownToolbar textareaRef={chapterTextareaRef} value={chapterContent} onChange={setChapterContent} />
                    <textarea ref={chapterTextareaRef} value={chapterContent} onChange={(e) => setChapterContent(e.target.value)} placeholder="محتوى الفصل..." rows={8} className="w-full bg-secondary/50 rounded-lg px-3 py-2 text-sm outline-none resize-none" />
                    <div className="flex gap-2">
                      <button onClick={handleCreateChapter} disabled={chapterSubmitting} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">
                        {chapterSubmitting ? "جاري الإضافة..." : "إضافة الفصل"}
                      </button>
                      <button onClick={() => setShowNewChapter(false)} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm">إلغاء</button>
                    </div>
                  </div>
                )}
              </>
            )}

            {chapters.map((ch, i) => (
              <motion.div key={ch.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                {editingChapter === ch.id ? (
                  <div className="rounded-lg border border-border bg-card p-4 space-y-3">
                    <input value={editChTitle} onChange={(e) => setEditChTitle(e.target.value)} className="w-full bg-secondary/50 rounded-lg px-3 py-2 text-sm outline-none" />
                    <MarkdownToolbar textareaRef={editChTextareaRef} value={editChContent} onChange={setEditChContent} />
                    <textarea ref={editChTextareaRef} value={editChContent} onChange={(e) => setEditChContent(e.target.value)} rows={8} className="w-full bg-secondary/50 rounded-lg px-3 py-2 text-sm outline-none resize-none" />
                    <div className="flex gap-2">
                      <button onClick={() => handleEditChapter(ch.id)} disabled={editChSaving} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50">حفظ</button>
                      <button onClick={() => setEditingChapter(null)} className="px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm">إلغاء</button>
                    </div>
                  </div>
                ) : (
                  <Link to={`/books/${id}/read/${ch.id}`} className="flex items-center justify-between rounded-lg border border-border bg-card p-4 hover:border-primary/30 hover:forum-shadow transition-all group">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-sm font-bold text-muted-foreground">{ch.chapter_number}</span>
                      <span className="font-medium group-hover:text-primary transition-colors">{ch.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOwner && (
                        <>
                          <button onClick={(e) => { e.preventDefault(); setEditChTitle(ch.title); setEditChContent(ch.content); setEditingChapter(ch.id); }}
                            className="text-xs px-2 py-1 rounded bg-secondary text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">✏️</button>
                          <button onClick={(e) => { e.preventDefault(); handleDeleteChapter(ch.id); }}
                            className="text-xs px-2 py-1 rounded bg-destructive/10 text-destructive opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                        </>
                      )}
                      <span className="text-muted-foreground text-sm">←</span>
                    </div>
                  </Link>
                )}
              </motion.div>
            ))}

            {chapters.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">لا توجد فصول بعد</p>}
          </div>
        )}

        {tab === "comments" && (
          <div className="space-y-4">
            <form onSubmit={handleComment} className="space-y-3 rounded-lg border border-border bg-card p-4">
              <input value={commentName} onChange={(e) => setCommentName(e.target.value)} placeholder="اسمك..." className="w-full bg-secondary/50 rounded-lg px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-primary/30" />
              <textarea value={commentContent} onChange={(e) => setCommentContent(e.target.value)} placeholder="اكتب تعليقك..." rows={3} className="w-full bg-secondary/50 rounded-lg px-3 py-2 text-sm outline-none resize-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-primary/30" />
              <button type="submit" disabled={commentSubmitting || !commentName.trim() || !commentContent.trim()} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
                {commentSubmitting ? "جاري الإرسال..." : "أرسل تعليق"}
              </button>
            </form>
            {comments.map((c) => (
              <div key={c.id} className="rounded-lg bg-secondary/30 p-3 group">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold">{c.author_name[0]}</span>
                    <span className="text-sm font-semibold">{c.author_name}</span>
                  </div>
                  {isOwner && (
                    <button onClick={() => handleDeleteComment(c.id)} className="opacity-0 group-hover:opacity-100 text-xs text-muted-foreground hover:text-destructive transition-opacity">حذف</button>
                  )}
                </div>
                <p className="text-sm text-foreground/85 pr-9">{c.content}</p>
              </div>
            ))}
          </div>
        )}

        {tab === "info" && (
          <div className="prose-forum">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{novel.bio || "لا يوجد وصف مفصل بعد."}</ReactMarkdown>
          </div>
        )}
      </main>
    </div>
  );
};

export default BookDetail;
