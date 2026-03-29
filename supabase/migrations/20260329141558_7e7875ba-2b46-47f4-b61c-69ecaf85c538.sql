
-- Add author_username to posts
ALTER TABLE posts ADD COLUMN author_username text NOT NULL DEFAULT 'كورا';

-- Create comments table
CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read comments" ON comments FOR SELECT TO public USING (true);

-- Create storage bucket for post images
INSERT INTO storage.buckets (id, name, public) VALUES ('post-images', 'post-images', true);

CREATE POLICY "Public read post images" ON storage.objects FOR SELECT TO public USING (bucket_id = 'post-images');

-- Enable realtime for comments
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
