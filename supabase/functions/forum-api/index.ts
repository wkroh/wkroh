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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const clientIp = getClientIp(req);
  const url = new URL(req.url);
  const path = url.pathname.split("/").pop() || "";

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    // GET: check-ip — returns whether the caller is the owner
    if (req.method === "GET" && path === "forum-api") {
      const action = url.searchParams.get("action");

      if (action === "check-ip") {
        return new Response(
          JSON.stringify({ isOwner: clientIp === ALLOWED_IP, ip: clientIp }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST: owner-only write operations
    if (req.method === "POST") {
      if (clientIp !== ALLOWED_IP) {
        return new Response(
          JSON.stringify({ error: "غير مصرح لك بهذا الإجراء" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const body = await req.json();
      const { action } = body;

      if (action === "create-post") {
        const { title, content, category_id, hashtags } = body;
        if (!title || !content) {
          return new Response(
            JSON.stringify({ error: "العنوان والمحتوى مطلوبان" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const { data, error } = await supabase
          .from("posts")
          .insert({ title, content, category_id: category_id || null, hashtags: hashtags || [] })
          .select()
          .single();
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "delete-post") {
        const { id } = body;
        const { error } = await supabase.from("posts").delete().eq("id", id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "create-category") {
        const { name, emoji } = body;
        if (!name) {
          return new Response(
            JSON.stringify({ error: "اسم القسم مطلوب" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        const { data, error } = await supabase
          .from("categories")
          .insert({ name, emoji: emoji || "💬" })
          .select()
          .single();
        if (error) throw error;
        return new Response(JSON.stringify(data), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (action === "delete-category") {
        const { id } = body;
        const { error } = await supabase.from("categories").delete().eq("id", id);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "خطأ في الخادم" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
