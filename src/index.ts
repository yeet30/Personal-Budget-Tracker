import express from "express";
import * as sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import path from "path";
import fs from "fs";

import session from "express-session";
import SQLiteStoreFactory from "connect-sqlite3";

import passport from "passport";
const { Strategy } = require("passport-json");

import { verifyPassword } from "./helpers/password-utils";

import { registerUserApi } from "./api/user-api";
import { registerAuthApi } from "./api/auth-api";
import { registerAdminApi } from "./api/admin-api";

async function main() {
  const app = express();
  app.use(express.json());

  const projectRoot = path.resolve(__dirname, "..");
  const databaseFolder = path.join(projectRoot, "database");
  fs.mkdirSync(databaseFolder, { recursive: true });

  const dbPath = path.join(databaseFolder, "PersonalBudgetDB.sqlite");
  console.log("DB path:", dbPath);

  const db: Database = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  const SQLiteStore = SQLiteStoreFactory(session);

  app.use(
    session({
      secret: process.env.SECRETKEY || "mysecretkey",
      resave: false,
      saveUninitialized: false,
      store: new SQLiteStore({ db: "sessions.sqlite3", dir: databaseFolder }),
      cookie: { maxAge: 86400000 }, // 1 day
    }),
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new Strategy(async (username: string, password: string, done: any) => {
      try {
        const identifier = String(username || "").trim();
        if (!identifier || !password) {
          return done(null, false, { message: "Missing credentials" });
        }

        const identifierEmail = identifier.toLowerCase();

        const user = await db.get<{
          user_id: number;
          email: string;
          username: string;
          password: string;
          role_id: number;
        }>(
          `SELECT user_id, email, username, password, role_id
           FROM "user"
           WHERE email = ? OR username = ?
           LIMIT 1`,
          [identifierEmail, identifier],
        );

        if (!user) return done(null, false, { message: "Invalid credentials" });

        const ok = verifyPassword(password, user.password);
        if (!ok) return done(null, false, { message: "Invalid credentials" });

        return done(null, {
          user_id: user.user_id,
          email: user.email,
          username: user.username,
          role_id: user.role_id,
        });
      } catch (e) {
        return done(e);
      }
    }),
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.user_id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await db.get(
        `SELECT user_id, email, username, role_id
         FROM "user"
         WHERE user_id = ?
         LIMIT 1`,
        [id],
      );
      done(null, user || false);
    } catch (e) {
      done(e);
    }
  });

  function requireAuth(req: any, res: any, next: any) {
    if (req.isAuthenticated && req.isAuthenticated()) return next();
    return res.status(401).json({ message: "Not authenticated." });
  }

  function requireAdmin(req: any, res: any, next: any) {
    if (req.user?.role_id === 2) return next();
    return res.status(403).json({ message: "Admin access required." });
  }

  const ctx = { app, db, requireAuth, requireAdmin };

  registerUserApi(ctx);
  registerAuthApi(ctx, passport);
  registerAdminApi(ctx);

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  const angularDistPath = path.join(
    projectRoot,
    "frontend",
    "dist",
    "frontend",
    "browser",
  );
  if (fs.existsSync(angularDistPath)) {
    app.use(express.static(angularDistPath));
    app.get(/^(?!\/api).*$/, (_req, res) => {
      res.sendFile(path.join(angularDistPath, "index.html"));
    });
  }

  app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
  });
}

main().catch((err) => {
  console.error("Error starting server:", err);
});
