import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  fetchNovel, fetchChapters, fetchChapter,
  getReaderSettings, saveReaderSettings,
  saveReadingProgress, recordReading, getReadingStats,
} from "@/lib/booksApi";

const FONTS: Record<string, string> = {
  cairo: '"Cairo", sans-serif',
  noto: '"Noto Naskh Arabic", serif',
  amiri: '"Amiri", serif',
  system: 'system-ui, sans-serif',
};

const BACKGROUNDS: Record<string, { bg: string; text: string; label: string }> = {
  white: { bg: "#faf8f5", text: "#1a1510", label: "أبيض" },
  dark: { bg: "#1a1a2e", text: "#e8e8e8", label: "ليلي" },
  sepia: { bg: "#f4ecd8", text: "#3d3322", label: "بيج" },
  black: { bg: "#0a0a0a", text: "#d0d0d0", label: "أسود" },
  green: { bg: "#1a2e1a", text: "#c8e6c8", label: "أخضر" },
};

const ChapterReader = () => {
  const { bookId, chapterId } = useParams<{ bookId: string; chapterId: string }>();
  const navigate = useNavigate();
  const [novel, setNovel] = useState<any>(null);
  const [chapter, setChapter] = useState<any>(null);
  const [chapters, setChapters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState(getReaderSettings());
  const [showSettings, setShowSettings] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showUI, setShowUI] = useState(true);
  const [stats, setStats] = useState(getReadingStats());
  const contentRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef(Date.now());
  const uiTimeoutRef = useRef<any>(null);

  // Swipe
  const dragX = useMotionValue(0);
  const dragOpacity = useTransform(dragX, [-200, 0, 200], [0.5, 1, 0.5]);

  const currentIndex = chapters.findIndex((c) => c.id === chapterId);
  const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;

  useEffect(() => {
    if (!bookId || !chapterId) return;
    Promise.all([fetchNovel(bookId), fetchChapters(bookId), fetchChapter(chapterId)]).then(([n, chs, ch]) => {
      setNovel(n);
      setChapters(chs || []);
      setChapter(ch);
      setLoading(false);
      window.scrollTo(0, 0);
    });
    startTimeRef.current = Date.now();
  }, [bookId, chapterId]);

  // Save progress on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!bookId || !chapterId) return;
      const scrollPercent = window.scrollY / (document.body.scrollHeight - window.innerHeight) * 100;
      saveReadingProgress(bookId, chapterId, scrollPercent);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [bookId, chapterId]);

  // Record reading on leave
  useEffect(() => {
    return () => {
      const timeSpent = Date.now() - startTimeRef.current;
      if (timeSpent > 5000) {
        const newStats = recordReading(1, timeSpent);
        setStats(newStats);
      }
    };
  }, [chapterId]);

  // Auto-hide UI in focus mode
  useEffect(() => {
    if (!focusMode) { setShowUI(true); return; }
    const handleMove = () => {
      setShowUI(true);
      clearTimeout(uiTimeoutRef.current);
      uiTimeoutRef.current = setTimeout(() => setShowUI(false), 2500);
    };
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("touchstart", handleMove);
    uiTimeoutRef.current = setTimeout(() => setShowUI(false), 2500);
    return () => {
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("touchstart", handleMove);
      clearTimeout(uiTimeoutRef.current);
    };
  }, [focusMode]);

  const updateSetting = useCallback((key: string, value: any) => {
    setSettings((prev: any) => {
      const next = { ...prev, [key]: value };
      saveReaderSettings(next);
      return next;
    });
  }, []);

  const goToChapter = (ch: any) => {
    if (ch) navigate(`/books/${bookId}/read/${ch.id}`);
  };

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.x > 100 && nextChapter) goToChapter(nextChapter);
    else if (info.offset.x < -100 && prevChapter) goToChapter(prevChapter);
  };

  // Keyboard nav
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && prevChapter) goToChapter(prevChapter);
      if (e.key === "ArrowRight" && nextChapter) goToChapter(nextChapter);
      if (e.key === "Escape") setFocusMode(false);
      if (e.key === "f" || e.key === "F") setFocusMode((p) => !p);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [prevChapter, nextChapter]);

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ background: BACKGROUNDS[settings.background]?.bg }}>جاري التحميل...</div>;
  if (!chapter || !novel) return <div className="min-h-screen flex items-center justify-center">غير موجود</div>;

  const bg = BACKGROUNDS[settings.background] || BACKGROUNDS.white;

  return (
    <div className="min-h-screen transition-colors duration-300" style={{ background: bg.bg, color: bg.text }}>
      {/* Header */}
      <AnimatePresence>
        {showUI && (
          <motion.header
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -60, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed top-0 inset-x-0 z-30 backdrop-blur-md border-b"
            style={{ background: `${bg.bg}ee`, borderColor: `${bg.text}15` }}
          >
            <div className="max-w-3xl mx-auto px-4 py-2.5 flex items-center justify-between">
              <Link to={`/books/${bookId}`} className="text-sm opacity-70 hover:opacity-100 transition-opacity">→ {novel.title}</Link>
              <span className="text-xs opacity-50">{chapter.title}</span>
              <div className="flex gap-2">
                <button onClick={() => setFocusMode((p) => !p)} className="text-sm px-2 py-1 rounded-lg opacity-60 hover:opacity-100" title="وضع التركيز">
                  {focusMode ? "🧘" : "🎯"}
                </button>
                <button onClick={() => setShowSettings((p) => !p)} className="text-sm px-2 py-1 rounded-lg opacity-60 hover:opacity-100">⚙️</button>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, x: -300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -300 }}
            className="fixed top-0 right-0 bottom-0 w-80 z-40 p-6 overflow-y-auto border-l"
            style={{ background: bg.bg, borderColor: `${bg.text}15` }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg">⚙️ إعدادات القراءة</h3>
              <button onClick={() => setShowSettings(false)} className="text-xl opacity-60 hover:opacity-100">✕</button>
            </div>

            <div className="space-y-6">
              {/* Background */}
              <div>
                <label className="text-sm font-medium mb-2 block opacity-70">🎨 الخلفية</label>
                <div className="flex gap-2 flex-wrap">
                  {Object.entries(BACKGROUNDS).map(([key, val]) => (
                    <button key={key} onClick={() => updateSetting("background", key)}
                      className={`w-10 h-10 rounded-full border-2 transition-all ${settings.background === key ? "scale-110 ring-2 ring-offset-2" : "opacity-70 hover:opacity-100"}`}
                      style={{ background: val.bg, borderColor: val.text + "30", ringColor: val.text }}
                      title={val.label} />
                  ))}
                </div>
              </div>

              {/* Font size */}
              <div>
                <label className="text-sm font-medium mb-2 block opacity-70">🔠 حجم الخط: {settings.fontSize}px</label>
                <input type="range" min="14" max="32" value={settings.fontSize} onChange={(e) => updateSetting("fontSize", +e.target.value)}
                  className="w-full accent-current" />
              </div>

              {/* Font family */}
              <div>
                <label className="text-sm font-medium mb-2 block opacity-70">🔤 نوع الخط</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(FONTS).map(([key, font]) => (
                    <button key={key} onClick={() => updateSetting("fontFamily", key)}
                      className={`px-3 py-2 rounded-lg text-sm border transition-all ${settings.fontFamily === key ? "border-current opacity-100" : "border-transparent opacity-60 hover:opacity-80"}`}
                      style={{ fontFamily: font }}>
                      {key === "cairo" ? "كايرو" : key === "noto" ? "نسخ" : key === "amiri" ? "أميري" : "نظام"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Line spacing */}
              <div>
                <label className="text-sm font-medium mb-2 block opacity-70">📏 تباعد السطور: {settings.lineSpacing}</label>
                <input type="range" min="1.4" max="3" step="0.1" value={settings.lineSpacing} onChange={(e) => updateSetting("lineSpacing", +e.target.value)}
                  className="w-full accent-current" />
              </div>

              {/* Reading mode */}
              <div>
                <label className="text-sm font-medium mb-2 block opacity-70">📖 وضع القراءة</label>
                <div className="flex gap-2">
                  <button onClick={() => updateSetting("readingMode", "vertical")}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm border transition-all ${settings.readingMode === "vertical" ? "border-current opacity-100" : "border-transparent opacity-60"}`}>
                    عمودي ↕️
                  </button>
                  <button onClick={() => updateSetting("readingMode", "horizontal")}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm border transition-all ${settings.readingMode === "horizontal" ? "border-current opacity-100" : "border-transparent opacity-60"}`}>
                    أفقي ↔️
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="pt-4 border-t" style={{ borderColor: `${bg.text}15` }}>
                <h4 className="text-sm font-medium mb-3 opacity-70">📊 إحصائياتك</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg p-3 text-center" style={{ background: `${bg.text}08` }}>
                    <p className="text-2xl font-bold">{stats.pagesRead}</p>
                    <p className="text-xs opacity-60">صفحة</p>
                  </div>
                  <div className="rounded-lg p-3 text-center" style={{ background: `${bg.text}08` }}>
                    <p className="text-2xl font-bold">🔥 {stats.streak}</p>
                    <p className="text-xs opacity-60">streak</p>
                  </div>
                  <div className="rounded-lg p-3 text-center" style={{ background: `${bg.text}08` }}>
                    <p className="text-2xl font-bold">⭐ {stats.level}</p>
                    <p className="text-xs opacity-60">المستوى</p>
                  </div>
                  <div className="rounded-lg p-3 text-center" style={{ background: `${bg.text}08` }}>
                    <p className="text-2xl font-bold">{stats.xp}</p>
                    <p className="text-xs opacity-60">XP</p>
                  </div>
                </div>
                {stats.achievements.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {stats.achievements.includes("reader_10") && <span className="px-2 py-1 rounded-full text-xs" style={{ background: `${bg.text}10` }}>📚 قارئ مبتدئ</span>}
                    {stats.achievements.includes("reader_50") && <span className="px-2 py-1 rounded-full text-xs" style={{ background: `${bg.text}10` }}>📖 قارئ متقدم</span>}
                    {stats.achievements.includes("reader_100") && <span className="px-2 py-1 rounded-full text-xs" style={{ background: `${bg.text}10` }}>🏆 قارئ محترف</span>}
                    {stats.achievements.includes("streak_3") && <span className="px-2 py-1 rounded-full text-xs" style={{ background: `${bg.text}10` }}>🔥 3 أيام متتالية</span>}
                    {stats.achievements.includes("streak_7") && <span className="px-2 py-1 rounded-full text-xs" style={{ background: `${bg.text}10` }}>💎 أسبوع كامل</span>}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay for settings */}
      {showSettings && <div className="fixed inset-0 z-30 bg-black/30" onClick={() => setShowSettings(false)} />}

      {/* Content */}
      <motion.div
        ref={contentRef}
        drag={settings.readingMode === "horizontal" ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        style={{ x: dragX, opacity: dragOpacity }}
        onDragEnd={handleDragEnd}
        className="max-w-3xl mx-auto px-6 sm:px-10 pt-20 pb-32"
      >
        {/* Chapter title */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center">
          <span className="text-xs opacity-40 block mb-2">الفصل {chapter.chapter_number}</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold">{chapter.title}</h1>
        </motion.div>

        {/* Chapter content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="prose-forum selection:bg-current/20"
          style={{
            fontSize: `${settings.fontSize}px`,
            fontFamily: FONTS[settings.fontFamily] || FONTS.cairo,
            lineHeight: settings.lineSpacing,
          }}
        >
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{chapter.content}</ReactMarkdown>
        </motion.div>
      </motion.div>

      {/* Bottom nav */}
      <AnimatePresence>
        {showUI && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            className="fixed bottom-0 inset-x-0 z-30 backdrop-blur-md border-t"
            style={{ background: `${bg.bg}ee`, borderColor: `${bg.text}15` }}
          >
            <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
              <button
                onClick={() => goToChapter(nextChapter)}
                disabled={!nextChapter}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-20"
                style={{ background: `${bg.text}10` }}
              >
                → الفصل التالي
              </button>
              <span className="text-xs opacity-40">
                {currentIndex + 1} / {chapters.length}
              </span>
              <button
                onClick={() => goToChapter(prevChapter)}
                disabled={!prevChapter}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-opacity disabled:opacity-20"
                style={{ background: `${bg.text}10` }}
              >
                الفصل السابق ←
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Touch zones for mobile navigation */}
      <div className="fixed top-0 bottom-0 right-0 w-12 z-20 sm:hidden" onClick={() => goToChapter(prevChapter)} />
      <div className="fixed top-0 bottom-0 left-0 w-12 z-20 sm:hidden" onClick={() => goToChapter(nextChapter)} />
    </div>
  );
};

export default ChapterReader;
