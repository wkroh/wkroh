
CREATE TABLE public.novels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  bio text NOT NULL DEFAULT '',
  cover_image_url text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'رواية',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.chapters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id uuid NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL DEFAULT '',
  chapter_number integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.novel_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  novel_id uuid NOT NULL REFERENCES public.novels(id) ON DELETE CASCADE,
  chapter_id uuid REFERENCES public.chapters(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.novels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.novel_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read novels" ON public.novels FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can read chapters" ON public.chapters FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can read novel_comments" ON public.novel_comments FOR SELECT TO public USING (true);

CREATE TRIGGER update_novels_updated_at BEFORE UPDATE ON public.novels FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON public.chapters FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER PUBLICATION supabase_realtime ADD TABLE public.novel_comments;
