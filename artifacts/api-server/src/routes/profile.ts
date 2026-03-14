import { Router } from "express";
import { supabase, supabaseWithAuth } from "@/lib/supabase";
import { requireAuth, AuthRequest } from "@/middlewares/auth";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("id, username, avatar_url, bio, created_at")
      .eq("id", req.userId!)
      .single();

    if (error || !profile) {
      res.status(404).json({ error: "Profile not found" });
      return;
    }

    const { data: user } = await supabase.auth.admin.getUserById(req.userId!);
    const { count } = await supabase
      .from("posts")
      .select("id", { count: "exact" })
      .eq("author_id", req.userId!);

    res.json({
      ...profile,
      email: user?.user?.email || "",
      posts_count: count || 0,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.patch("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { username, bio, avatar_url } = req.body;
    // Use authed client so RLS auth.uid() resolves
    const db = supabaseWithAuth(req.userToken!);

    const { data: profile, error } = await db
      .from("profiles")
      .update({ username, bio, avatar_url })
      .eq("id", req.userId!)
      .select("id, username, avatar_url, bio, created_at")
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    const { count } = await supabase
      .from("posts")
      .select("id", { count: "exact" })
      .eq("author_id", req.userId!);

    const { data: user } = await supabase.auth.admin.getUserById(req.userId!);

    res.json({
      ...profile,
      email: user?.user?.email || "",
      posts_count: count || 0,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/posts", requireAuth, async (req: AuthRequest, res) => {
  try {
    const db = supabaseWithAuth(req.userToken!);
    const { data: posts, error, count } = await db
      .from("posts")
      .select(
        `id, title, content, excerpt, cover_image_url, category, published, created_at, updated_at,
        likes_count, comments_count,
        profiles!author_id ( id, username, avatar_url )`,
        { count: "exact" }
      )
      .eq("author_id", req.userId!)
      .order("created_at", { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const { data: likes } = await supabase
      .from("post_likes")
      .select("post_id")
      .eq("user_id", req.userId!);
    const likedPostIds = new Set((likes || []).map((l) => l.post_id));

    res.json({
      posts: (posts || []).map((post: any) => ({
        ...post,
        author: post.profiles,
        is_liked: likedPostIds.has(post.id),
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
      })),
      total: count || 0,
      page: 1,
      limit: 100,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
