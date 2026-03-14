import { Request, Response, NextFunction } from "express";
import { supabase } from "@/lib/supabase";

export interface AuthRequest extends Request {
  userId?: string;
  userToken?: string;
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
