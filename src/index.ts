import express from "express";
import * as sqlite3 from "sqlite3";
import { open, Database } from "sqlite";
import path from "path";
import fs from "fs";
import session from "express-session";
import SQLiteStoreFactory from "connect-sqlite3";
import passport from "passport";
const { Strategy } = require("passport-json");
import { hashPassword, verifyPassword } from "./helpers/password-utils";
import {
  validateEmail,
  validateUsername,
  validatePassword,
  normalizeEmail,
  normalizeUsername,
} from "./helpers/validation-rules";

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
    if (req.isAuthenticated && req.isAuthenticated()) {
      return next();
    }
    return res.status(401).json({ message: "Not authenticated." });
  }

  function requireAdmin(req: any, res: any, next: any) {
    if (req.user?.role_id === 2) {
      return next();
    }
    return res.status(403).json({ message: "Admin access required." });
  }

  app.post("/api/users", async (req, res) => {
    const { username, email, password, passwordAgain } = req.body ?? {};

    const errors: Record<string, string> = {};

    const emailErr = validateEmail(email);
    if (emailErr) errors.email = emailErr;

    const usernameErr = validateUsername(username);
    if (usernameErr) errors.username = usernameErr;

    const passwordErr = validatePassword(password);
    if (passwordErr) errors.password = passwordErr;

    if (!passwordAgain) {
      errors.passwordAgain = "Password confirmation is required.";
    } else if (password !== passwordAgain) {
      errors.passwordAgain = "Passwords do not match.";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({
        message: "Validation error.",
        errors,
      });
    }

    const cleanEmail = normalizeEmail(email);
    const cleanUsername = normalizeUsername(username);

    try {
      const existing = await db.get<{
        user_id: number;
        email: string;
        username: string;
      }>(
        `SELECT user_id, email, username
       FROM "user"
       WHERE email = ? OR username = ?
       LIMIT 1`,
        [cleanEmail, cleanUsername],
      );

      if (existing) {
        const conflictErrors: Record<string, string> = {};
        if (existing.email === cleanEmail) {
          conflictErrors.email = "Email is already in use.";
        }
        if (existing.username === cleanUsername) {
          conflictErrors.username = "Username is already taken.";
        }

        return res.status(409).json({
          message: "User already exists.",
          errors: conflictErrors,
        });
      }

      const roleId = 1;
      const hashedPassword = hashPassword(password);

      await db.run(
        `INSERT INTO "user" (email, username, password, role_id)
       VALUES (?, ?, ?, ?)`,
        [cleanEmail, cleanUsername, hashedPassword, roleId],
      );

      return res.status(201).json({
        message: "Registration successful.",
      });
    } catch (err: any) {
      console.error(err);
      return res.status(500).json({
        message: "Internal server error.",
      });
    }
  });

  app.post("/api/auth", passport.authenticate("json"), (req, res) => {
    res.json({
      message: "Logged in successfully",
      user: req.user,
    });
  });

  app.get("/api/auth", (req, res) => {
    if (req.isAuthenticated && req.isAuthenticated()) {
      return res.json({ user: req.user });
    }
    return res.json({ user: null });
  });

  app.delete("/api/auth", (req, res, next) => {
    (req as any).logout((err: any) => {
      if (err) return next(err);
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/admin/users", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const users = await db.all(
        `SELECT user_id, email, username, role_id
       FROM "user"
       ORDER BY user_id ASC`,
      );
      return res.json({ users });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error." });
    }
  });

  app.get(
    "/api/admin/users/:id",
    requireAuth,
    requireAdmin,
    async (req, res) => {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) {
        return res.status(400).json({ message: "Invalid id." });
      }

      try {
        const user = await db.get(
          `SELECT user_id, email, username, role_id
       FROM "user"
       WHERE user_id = ?
       LIMIT 1`,
          [id],
        );

        if (!user) return res.status(404).json({ message: "User not found." });
        return res.json({ user });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error." });
      }
    },
  );

  app.post("/api/admin/users", requireAuth, requireAdmin, async (req, res) => {
    const { email, username, password, role_id } = req.body ?? {};

    const errors: Record<string, string> = {};

    const emailErr = validateEmail(email);
    if (emailErr) errors.email = emailErr;

    const usernameErr = validateUsername(username);
    if (usernameErr) errors.username = usernameErr;

    const passwordErr = validatePassword(password);
    if (passwordErr) errors.password = passwordErr;

    const roleId = Number(role_id ?? 1);
    if (![1, 2, 3].includes(roleId)) {
      errors.role_id = "Invalid role_id. Allowed values: 1 (User), 2 (Admin), 3 (Control User).";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: "Validation error.", errors });
    }

    const cleanEmail = normalizeEmail(email);
    const cleanUsername = normalizeUsername(username);

    try {
      const existing = await db.get<{
        user_id: number;
        email: string;
        username: string;
      }>(
        `SELECT user_id, email, username
       FROM "user"
       WHERE email = ? OR username = ?
       LIMIT 1`,
        [cleanEmail, cleanUsername],
      );

      if (existing) {
        const conflictErrors: Record<string, string> = {};
        if (existing.email === cleanEmail)
          conflictErrors.email = "Email is already in use.";
        if (existing.username === cleanUsername)
          conflictErrors.username = "Username is already taken.";

        return res.status(409).json({
          message: "User already exists.",
          errors: conflictErrors,
        });
      }

      const hashed = hashPassword(password);

      await db.run(
        `INSERT INTO "user" (email, username, password, role_id)
       VALUES (?, ?, ?, ?)`,
        [cleanEmail, cleanUsername, hashed, roleId],
      );

      return res.status(201).json({ message: "User created." });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error." });
    }
  });

  app.put(
    "/api/admin/users/:id",
    requireAuth,
    requireAdmin,
    async (req, res) => {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) {
        return res.status(400).json({ message: "Invalid id." });
      }

      const { email, username, password, role_id } = req.body ?? {};

      const errors: Record<string, string> = {};

      if (email !== undefined) {
        const emailErr = validateEmail(email);
        if (emailErr) errors.email = emailErr;
      }

      if (username !== undefined) {
        const usernameErr = validateUsername(username);
        if (usernameErr) errors.username = usernameErr;
      }

      if (password !== undefined) {
        const passStr = String(password ?? "");
        if (passStr.trim().length > 0) {
          const passwordErr = validatePassword(passStr);
          if (passwordErr) errors.password = passwordErr;
        }
      }

      let roleId: number | undefined = undefined;
      if (role_id !== undefined) {
        roleId = Number(role_id);
        if (!Number.isFinite(roleId) || ![1, 2, 3].includes(roleId)) {
          errors.role_id =
            "Invalid role_id. Allowed values: 1 (User), 2 (Admin), 3 (Control User).";
        }
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ message: "Validation error.", errors });
      }

      const cleanEmail =
        email !== undefined ? normalizeEmail(email) : undefined;
      const cleanUsername =
        username !== undefined ? normalizeUsername(username) : undefined;

      try {
        const exists = await db.get<{ user_id: number }>(
          `SELECT user_id FROM "user" WHERE user_id = ? LIMIT 1`,
          [id],
        );

        if (!exists) {
          return res.status(404).json({ message: "User not found." });
        }

        if (cleanEmail !== undefined || cleanUsername !== undefined) {
          const conflict = await db.get<{
            user_id: number;
            email: string;
            username: string;
          }>(
            `SELECT user_id, email, username
         FROM "user"
         WHERE (email = ? OR username = ?) AND user_id <> ?
         LIMIT 1`,
            [cleanEmail ?? "", cleanUsername ?? "", id],
          );

          if (conflict) {
            const conflictErrors: Record<string, string> = {};
            if (cleanEmail !== undefined && conflict.email === cleanEmail) {
              conflictErrors.email = "Email is already in use.";
            }
            if (
              cleanUsername !== undefined &&
              conflict.username === cleanUsername
            ) {
              conflictErrors.username = "Username is already taken.";
            }

            return res.status(409).json({
              message: "User already exists.",
              errors: conflictErrors,
            });
          }
        }

        const fields: string[] = [];
        const values: any[] = [];

        if (cleanEmail !== undefined) {
          fields.push(`email = ?`);
          values.push(cleanEmail);
        }

        if (cleanUsername !== undefined) {
          fields.push(`username = ?`);
          values.push(cleanUsername);
        }

        if (roleId !== undefined) {
          fields.push(`role_id = ?`);
          values.push(roleId);
        }

        const passStr = password !== undefined ? String(password ?? "") : "";
        if (password !== undefined && passStr.trim().length > 0) {
          fields.push(`password = ?`);
          values.push(hashPassword(passStr));
        }

        if (fields.length === 0) {
          return res.status(400).json({ message: "No fields to update." });
        }

        values.push(id);

        await db.run(
          `UPDATE "user" SET ${fields.join(", ")} WHERE user_id = ?`,
          values,
        );

        return res.json({ message: "User updated." });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error." });
      }
    },
  );

  app.delete(
    "/api/admin/users/:id",
    requireAuth,
    requireAdmin,
    async (req: any, res) => {
      const id = Number(req.params.id);
      if (!Number.isFinite(id))
        return res.status(400).json({ message: "Invalid id." });

      if (req.user?.user_id === id) {
        return res
          .status(400)
          .json({ message: "You cannot delete your own account." });
      }

      try {
        const result = await db.run(`DELETE FROM "user" WHERE user_id = ?`, [
          id,
        ]);
        if (result.changes === 0)
          return res.status(404).json({ message: "User not found." });

        return res.json({ message: "User deleted." });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error." });
      }
    },
  );

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
