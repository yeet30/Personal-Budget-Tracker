import type { Express } from "express";
import type { Database } from "sqlite";

export type ApiContext = {
  app: Express;
  db: Database;

  requireAuth: (req: any, res: any, next: any) => any;
  requireAdmin: (req: any, res: any, next: any) => any;
};
