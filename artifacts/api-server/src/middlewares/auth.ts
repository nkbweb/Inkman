import { Request, Response, NextFunction } from "express";
import { supabase, supabaseWithAuth } from "@/lib/supabase";

export interface AuthRequest extends Request {
  userId?: string;
  userToken?: string;
}

async function ensureProfile(userId: string, token: string) {
  try {
    // Check if profile already exists
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single();

    if (!existing) {
      // Fetch user info from auth to get email/username
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      const email = authUser?.user?.email || "";
      const username =
        authUser?.user?.user_metadata?.username ||
        email.split("@")[0] ||
        `user_${userId.slice(0, 8)}`;

      // Upsert profile using the user's own token so RLS INSERT passes
      const db = supabaseWithAuth(token);
      await db.from("profiles").upsert(
        { id: userId, username, avatar_url: null, bio: null },
        { onConflict: "id" }
      );
    }
  } catch {
    // Non-fatal: profile creation failure shouldn't block the request
  }
}

export async function requireAuth(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }
  req.userId = data.user.id;
  req.userToken = token;

  // Guarantee profile row exists before any write
  await ensureProfile(data.user.id, token);

  next();
}

export async function optionalAuth(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabase.auth.getUser(token);
    if (data.user) {
      req.userId = data.user.id;
      req.userToken = token;
    }
  }
  next();
}
