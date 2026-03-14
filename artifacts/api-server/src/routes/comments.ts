import { Router } from "express";
import { supabase } from "@/lib/supabase";
import { requireAuth, AuthRequest } from "@/middlewares/auth";

const router = Router();

router.delete("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { data: existing } = await supabase
      .from("comments")
      .select("author_id")
      .eq("id", id)
      .single();

    if (!existing || existing.author_id !== req.userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const { error } = await supabase.from("comments").delete().eq("id", id);
    if (error) {
      res.status(404).json({ error: error.message });
      return;
    }

    res.status(204).send();
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
