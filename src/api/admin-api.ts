import { ApiContext } from "./api-types";
import { hashPassword } from "../helpers/password-utils";
import {
  validateEmail,
  validateUsername,
  validatePassword,
  normalizeEmail,
  normalizeUsername,
} from "../helpers/validation-rules";

const ALLOWED_ROLE_IDS = [1, 2, 3] as const; // user, admin, control user

export function registerAdminApi({ app, db, requireAuth, requireAdmin }: ApiContext) {
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

  app.get("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id." });

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
  });

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
    if (!ALLOWED_ROLE_IDS.includes(roleId as any)) {
      errors.role_id =
        "Invalid role_id. Allowed values: 1 (User), 2 (Admin), 3 (Control User).";
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

      await db.run(
        `INSERT INTO "user" (email, username, password, role_id)
         VALUES (?, ?, ?, ?)`,
        [cleanEmail, cleanUsername, hashPassword(password), roleId],
      );

      return res.status(201).json({ message: "User created." });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error." });
    }
  });

  app.put("/api/admin/users/:id", requireAuth, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id." });

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
        const passErr = validatePassword(passStr);
        if (passErr) errors.password = passErr;
      }
    }

    let roleId: number | undefined = undefined;
    if (role_id !== undefined) {
      roleId = Number(role_id);
      if (!Number.isFinite(roleId) || !ALLOWED_ROLE_IDS.includes(roleId as any)) {
        errors.role_id =
          "Invalid role_id. Allowed values: 1 (User), 2 (Admin), 3 (Control User).";
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: "Validation error.", errors });
    }

    const cleanEmail = email !== undefined ? normalizeEmail(email) : undefined;
    const cleanUsername =
      username !== undefined ? normalizeUsername(username) : undefined;

    try {
      const exists = await db.get(
        `SELECT user_id FROM "user" WHERE user_id = ? LIMIT 1`,
        [id],
      );
      if (!exists) return res.status(404).json({ message: "User not found." });

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
          if (cleanEmail !== undefined && conflict.email === cleanEmail)
            conflictErrors.email = "Email is already in use.";
          if (cleanUsername !== undefined && conflict.username === cleanUsername)
            conflictErrors.username = "Username is already taken.";

          return res.status(409).json({
            message: "User already exists.",
            errors: conflictErrors,
          });
        }
      }

      const fields: string[] = [];
      const values: any[] = [];

      if (cleanEmail !== undefined) {
        fields.push("email = ?");
        values.push(cleanEmail);
      }
      if (cleanUsername !== undefined) {
        fields.push("username = ?");
        values.push(cleanUsername);
      }
      if (roleId !== undefined) {
        fields.push("role_id = ?");
        values.push(roleId);
      }

      const passStr = password !== undefined ? String(password ?? "") : "";
      if (password !== undefined && passStr.trim().length > 0) {
        fields.push("password = ?");
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
  });

  app.delete("/api/admin/users/:id", requireAuth, requireAdmin, async (req: any, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id." });

    if (req.user?.user_id === id) {
      return res.status(400).json({ message: "You cannot delete your own account." });
    }

    try {
      const result = await db.run(`DELETE FROM "user" WHERE user_id = ?`, [id]);
      if (result.changes === 0) return res.status(404).json({ message: "User not found." });

      return res.json({ message: "User deleted." });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error." });
    }
  });
}
