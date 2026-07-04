import type { Request, Response, NextFunction } from "express";

// Mockup guest mode — all requests run as the persistent "guest" user.
// No authentication is required.
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  (req as any).userId = "guest";
  next();
}
