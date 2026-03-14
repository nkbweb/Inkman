import { Router } from "express";
import { supabase } from "@/lib/supabase";
import { requireAuth, optionalAuth, AuthRequest } from "@/middlewares/auth";

const router = Router({ mergeParams: true });

router.get("/", optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { id: postId } = req.params;
    const { data: comments, error } = await supabase
      .from("comments")
      .select(
        `id, content, post_id, created_at,
        profiles!author_id ( id, username, avatar_url )`
      )
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    const formatted = (comments || []).map((c: any) => ({
      id: c.id,
      content: c.content,
      post_id: c.post_id,
      created_at: c.created_at,
      author: c.profiles,
    }));

    res.json(formatted);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id: postId } = req.params;
    const { content } = req.body;

    const { data: comment, error } = await supabase
      .from("comments")
      .insert({ content, post_id: postId, author_id: req.userId })
      .select(
        `id, content, post_id, created_at,
        profiles!author_id ( id, username, avatar_url )`
      )
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    await supabase.rpc("increment_comments", { post_id: postId });

    res.status(201).json({
      ...(comment as any),
      author: (comment as any).profiles,
    });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
