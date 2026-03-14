import { Router } from "express";
import { supabaseWithAuth } from "@/lib/supabase";
import { requireAuth, AuthRequest } from "@/middlewares/auth";

const router = Router();

router.delete("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    // Use authed client so RLS auth.uid() resolves
    const db = supabaseWithAuth(req.userToken!);

    const { error } = await db
      .from("comments")
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

export default router;
