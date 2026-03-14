import { Router } from "express";
import { supabase, supabaseWithAuth } from "@/lib/supabase";
import { requireAuth, optionalAuth, AuthRequest } from "@/middlewares/auth";

const router = Router();

router.get("/", optionalAuth, async (req: AuthRequest, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("posts")
      .select(
        `id, title, content, excerpt, cover_image_url, category, published, created_at, updated_at,
        likes_count, comments_count,
        profiles!author_id ( id, username, avatar_url )`,
        { count: "exact" }
      )
      .eq("published", true)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) query = query.eq("category", category);
    if (search) query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);

    const { data: posts, error, count } = await query;

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    let likedPostIds = new Set<string>();
    if (req.userId) {
      const { data: likes } = await supabase
        .from("post_likes")
        .select("post_id")
        .eq("user_id", req.userId);
      if (likes) likedPostIds = new Set(likes.map((l) => l.post_id));
    }

    res.json({
      posts: (posts || []).map((post: any) => ({
        id: post.id,
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        cover_image_url: post.cover_image_url,
        category: post.category,
        author: post.profiles,
        likes_count: post.likes_count || 0,
        comments_count: post.comments_count || 0,
        is_liked: likedPostIds.has(post.id),
        published: post.published,
        created_at: post.created_at,
        updated_at: post.updated_at,
      })),
      total: count || 0,
      page,
      limit,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { title, content, excerpt, cover_image_url, category, published } = req.body;
    // Use the user's token so RLS auth.uid() resolves correctly
    const db = supabaseWithAuth(req.userToken!);

    const { data: post, error } = await db
      .from("posts")
      .insert({
        title,
        content,
        excerpt: excerpt || null,
        cover_image_url: cover_image_url || null,
        category: category || null,
        published: published ?? false,
        author_id: req.userId,
      })
      .select(
        `id, title, content, excerpt, cover_image_url, category, published, created_at, updated_at,
        likes_count, comments_count,
        profiles!author_id ( id, username, avatar_url )`
      )
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(201).json({
      ...(post as any),
      author: (post as any).profiles,
      likes_count: 0,
      comments_count: 0,
      is_liked: false,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/:id", optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { data: post, error } = await supabase
      .from("posts")
      .select(
        `id, title, content, excerpt, cover_image_url, category, published, created_at, updated_at,
        likes_count, comments_count,
        profiles!author_id ( id, username, avatar_url )`
      )
      .eq("id", id)
      .single();

    if (error || !post) {
      res.status(404).json({ error: "Post not found" });
      return;
    }

    let isLiked = false;
    if (req.userId) {
      const { data: like } = await supabase
        .from("post_likes")
        .select("id")
        .eq("post_id", id)
        .eq("user_id", req.userId)
        .single();
      isLiked = !!like;
    }

    res.json({
      ...(post as any),
      author: (post as any).profiles,
      likes_count: (post as any).likes_count || 0,
      comments_count: (post as any).comments_count || 0,
      is_liked: isLiked,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.patch("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, cover_image_url, category, published } = req.body;
    const db = supabaseWithAuth(req.userToken!);

    const { data: post, error } = await db
      .from("posts")
      .update({
        title,
        content,
        excerpt: excerpt || null,
        cover_image_url: cover_image_url || null,
        category: category || null,
        published,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("author_id", req.userId!)
      .select(
        `id, title, content, excerpt, cover_image_url, category, published, created_at, updated_at,
        likes_count, comments_count,
        profiles!author_id ( id, username, avatar_url )`
      )
      .single();

    if (error) {
      res.status(error.code === "PGRST116" ? 404 : 400).json({ error: error.message });
      return;
    }

    res.json({
      ...(post as any),
      author: (post as any).profiles,
      likes_count: (post as any).likes_count || 0,
      comments_count: (post as any).comments_count || 0,
      is_liked: false,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.delete("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const db = supabaseWithAuth(req.userToken!);

    const { error } = await db
      .from("posts")
      .delete()
      .eq("id", id)
      .eq("author_id", req.userId!);

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(204).send();
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/:id/like", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const db = supabaseWithAuth(req.userToken!);

    const { data: existing } = await supabase
      .from("post_likes")
      .select("id")
      .eq("post_id", id)
      .eq("user_id", req.userId!)
      .single();

    if (existing) {
      await db.from("post_likes").delete().eq("post_id", id).eq("user_id", req.userId!);
      await supabase.rpc("decrement_likes", { post_id: id });
    } else {
      await db.from("post_likes").insert({ post_id: id, user_id: req.userId! });
      await supabase.rpc("increment_likes", { post_id: id });
    }

    const { data: post } = await supabase
      .from("posts")
      .select("likes_count")
      .eq("id", id)
      .single();

    res.json({ liked: !existing, likes_count: post?.likes_count || 0 });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
