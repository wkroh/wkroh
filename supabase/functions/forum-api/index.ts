import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_IP = "82.167.220.64";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIp = getClientIp(req);
  const url = new URL(req.url);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // GET actions
    if (req.method === "GET") {
      const action = url.searchParams.get("action");
      if (action === "check-ip") {
        return json({ isOwner: clientIp === ALLOWED_IP, ip: clientIp });
      }
      return json({ error: "Unknown action" }, 400);
    }

    // POST actions
    if (req.method === "POST") {
      const body = await req.json();
      const { action } = body;

      // === PUBLIC ACTIONS ===
      if (action === "add-comment") {
        const { post_id, author_name, content } = body;
        if (!post_id || !author_name?.trim() || !content?.trim()) return json({ error: "جميع الحقول مطلوبة" }, 400);
        const { data, error } = await supabase.from("comments").insert({ post_id, author_name: author_name.trim(), content: content.trim() }).select().single();
        if (error) throw error;
        return json(data);
      }

      if (action === "add-novel-comment") {
        const { novel_id, author_name, content, chapter_id } = body;
        if (!novel_id || !author_name?.trim() || !content?.trim()) return json({ error: "جميع الحقول مطلوبة" }, 400);
        const insert: any = { novel_id, author_name: author_name.trim(), content: content.trim() };
        if (chapter_id) insert.chapter_id = chapter_id;
        const { data, error } = await supabase.from("novel_comments").insert(insert).select().single();
        if (error) throw error;
        return json(data);
      }

      // === OWNER-ONLY ACTIONS ===
      if (clientIp !== ALLOWED_IP) {
        return json({ error: "غير مصرح لك بهذا الإجراء" }, 403);
      }

      // --- Forum posts ---
      if (action === "create-post") {
        const { title, content, category_id, hashtags } = body;
        if (!title || !content) return json({ error: "العنوان والمحتوى مطلوبان" }, 400);
        const { data, error } = await supabase.from("posts").insert({ title, content, category_id: category_id || null, hashtags: hashtags || [], author_username: "كورا" }).select().single();
        if (error) throw error;
        return json(data);
      }

      if (action === "edit-post") {
        const { id, title, content, category_id, hashtags } = body;
        if (!id || !title || !content) return json({ error: "العنوان والمحتوى مطلوبان" }, 400);
        const { data, error } = await supabase.from("posts").update({ title, content, category_id: category_id || null, hashtags: hashtags || [] }).eq("id", id).select().single();
        if (error) throw error;
        return json(data);
      }

      if (action === "delete-post") {
        const { error } = await supabase.from("posts").delete().eq("id", body.id);
        if (error) throw error;
        return json({ success: true });
      }

      if (action === "delete-comment") {
        const { error } = await supabase.from("comments").delete().eq("id", body.id);
        if (error) throw error;
        return json({ success: true });
      }

      if (action === "create-category") {
        const { name, emoji } = body;
        if (!name) return json({ error: "اسم القسم مطلوب" }, 400);
        const { data, error } = await supabase.from("categories").insert({ name, emoji: emoji || "💬" }).select().single();
        if (error) throw error;
        return json(data);
      }

      if (action === "delete-category") {
        const { error } = await supabase.from("categories").delete().eq("id", body.id);
        if (error) throw error;
        return json({ success: true });
      }

      if (action === "upload-image") {
        const { base64, filename, content_type } = body;
        if (!base64 || !filename) return json({ error: "الملف مطلوب" }, 400);
        const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
        const path = `${Date.now()}-${filename}`;
        const { error } = await supabase.storage.from("post-images").upload(path, bytes, { contentType: content_type || "image/jpeg" });
        if (error) throw error;
        const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(path);
        return json({ url: urlData.publicUrl });
      }

      // --- Novels ---
      if (action === "create-novel") {
        const { title, description, bio, category, cover_image_url } = body;
        if (!title) return json({ error: "العنوان مطلوب" }, 400);
        const { data, error } = await supabase.from("novels").insert({ title, description: description || "", bio: bio || "", category: category || "رواية", cover_image_url: cover_image_url || "" }).select().single();
        if (error) throw error;
        return json(data);
      }

      if (action === "edit-novel") {
        const { id, title, description, bio, category, cover_image_url } = body;
        if (!id || !title) return json({ error: "العنوان مطلوب" }, 400);
        const { data, error } = await supabase.from("novels").update({ title, description, bio, category, cover_image_url }).eq("id", id).select().single();
        if (error) throw error;
        return json(data);
      }

      if (action === "delete-novel") {
        const { error } = await supabase.from("novels").delete().eq("id", body.id);
        if (error) throw error;
        return json({ success: true });
      }

      // --- Chapters ---
      if (action === "create-chapter") {
        const { novel_id, title, content, chapter_number } = body;
        if (!novel_id || !title) return json({ error: "العنوان مطلوب" }, 400);
        const { data, error } = await supabase.from("chapters").insert({ novel_id, title, content: content || "", chapter_number: chapter_number || 1 }).select().single();
        if (error) throw error;
        return json(data);
      }

      if (action === "edit-chapter") {
        const { id, title, content } = body;
        if (!id || !title) return json({ error: "العنوان مطلوب" }, 400);
        const { data, error } = await supabase.from("chapters").update({ title, content }).eq("id", id).select().single();
        if (error) throw error;
        return json(data);
      }

      if (action === "delete-chapter") {
        const { error } = await supabase.from("chapters").delete().eq("id", body.id);
        if (error) throw error;
        return json({ success: true });
      }

      if (action === "delete-novel-comment") {
        const { error } = await supabase.from("novel_comments").delete().eq("id", body.id);
        if (error) throw error;
        return json({ success: true });
      }

      return json({ error: "Unknown action" }, 400);
    }

    return json({ error: "Method not allowed" }, 405);
  } catch (err) {
    return json({ error: err.message || "خطأ في الخادم" }, 500);
  }
});
