
-- Create categories table
CREATE TABLE public.categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  emoji TEXT NOT NULL DEFAULT '💬',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create posts table
CREATE TABLE public.posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  hashtags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Categories: everyone can read
CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT USING (true);

-- Posts: everyone can read
CREATE POLICY "Anyone can read posts" ON public.posts FOR SELECT USING (true);

-- Create indexes
CREATE INDEX idx_posts_category ON public.posts(category_id);
CREATE INDEX idx_posts_hashtags ON public.posts USING GIN(hashtags);
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default categories
INSERT INTO public.categories (name, emoji, sort_order) VALUES
  ('عام', '💬', 1),
  ('تقنية', '💻', 2),
  ('أفكار', '💡', 3),
  ('يوميات', '📝', 4);
