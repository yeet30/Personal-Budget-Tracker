import { ApiContext } from "./api-types";
import { hashPassword } from "../helpers/password-utils";
import {
  validateEmail,
  validateUsername,
  validatePassword,
  normalizeEmail,
  normalizeUsername,
} from "../helpers/validation-rules";

const ALLOWED_ROLE_IDS = [1, 2, 3] as const;

export function registerAdminApi({
  app,
  db,
  requireAuth,
  requireAdmin,
}: ApiContext) {
  app.get("/api/admin/users", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const users = await db.all(
        `SELECT u.user_id, u.email, u.username, u.role_id, r.name as role_name
        FROM "user" u
        JOIN role r ON r.role_id = u.role_id
        ORDER BY u.user_id ASC
        `,
      );
      return res.json({ users });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error." });
    }
  });

  app.get("/api/admin/roles", requireAdmin, async (_req, res) => {
    try {
      const roles = await db.all(
        `SELECT role_id, name
         FROM role
         ORDER BY role_id ASC`,
      );
      return res.json({ roles });
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
      if (!Number.isFinite(id))
        return res.status(400).json({ message: "Invalid id." });

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

  app.put(
    "/api/admin/users/:id",
    requireAuth,
    requireAdmin,
    async (req, res) => {
      const id = Number(req.params.id);
      if (!Number.isFinite(id))
        return res.status(400).json({ message: "Invalid id." });

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
        if (
          !Number.isFinite(roleId) ||
          !ALLOWED_ROLE_IDS.includes(roleId as any)
        ) {
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
        const exists = await db.get(
          `SELECT user_id FROM "user" WHERE user_id = ? LIMIT 1`,
          [id],
        );
        if (!exists)
          return res.status(404).json({ message: "User not found." });

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
            if (
              cleanUsername !== undefined &&
              conflict.username === cleanUsername
            )
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

  app.get("/api/admin/categories", requireAuth, requireAdmin, async (_req, res) => {
    try {
      const categories = await db.all(
        `SELECT category_id, name, description, created_at, category_type FROM category ORDER BY name`
      );
      return res.json({ categories });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error." });
    }
  });

  app.get("/api/categories", requireAuth, async (_req, res) => {
    try {
      const categories = await db.all(
        `SELECT category_id, name, description, created_at, category_type FROM category ORDER BY name`
      );
      return res.json({ categories });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error." });
    }
  });

  app.post("/api/admin/categories", requireAuth, requireAdmin, async (req, res) => {
    const { name, description, category_type } = req.body ?? {};
    const errors: Record<string, string> = {};

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      errors.name = "Category name is required.";
    } else if (name.trim().length > 100) {
      errors.name = "Category name must be 100 characters or less.";
    }

    if (description !== undefined && (typeof description !== 'string' || description.length > 255)) {
      errors.description = "Description must be 255 characters or less.";
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: "Validation error.", errors });
    }

    const cleanName = name.trim();
    const cleanDescription = description?.trim() || null;

    try {
      const existing = await db.get(
        `SELECT category_id FROM category WHERE name = ?`,
        [cleanName]
      );

      if (existing) {
        return res.status(409).json({ message: "Category with this name already exists." });
      }

      const result = await db.run(
        `INSERT INTO category (name, description) VALUES (?, ?)`,
        [cleanName, cleanDescription]
      );

      return res.status(201).json({ 
        message: "Category created.",
        category_id: result.lastID 
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error." });
    }
  });

  app.put("/api/admin/categories/:id", requireAuth, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id))
      return res.status(400).json({ message: "Invalid category ID." });

    const { name, description, category_type } = req.body ?? {};
    const errors: Record<string, string> = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        errors.name = "Category name cannot be empty.";
      } else if (name.trim().length > 100) {
        errors.name = "Category name must be 100 characters or less.";
      }
    }

    if (description !== undefined && (typeof description !== 'string' || description.length > 255)) {
      errors.description = "Description must be 255 characters or less.";
    }

    if (category_type !== undefined) {
      if (typeof category_type !== 'string' || (category_type !== 'INCOME' && category_type !== 'EXPENSE')) {
        errors.category_type = "Category type must be either 'INCOME' or 'EXPENSE'.";
      }
    }

    if (Object.keys(errors).length > 0) {
      return res.status(400).json({ message: "Validation error.", errors });
    }

    const cleanName = name?.trim();
    const cleanDescription = description?.trim() || null;

    try {
      const exists = await db.get(
        `SELECT category_id FROM category WHERE category_id = ?`,
        [id]
      );

      if (!exists) {
        return res.status(404).json({ message: "Category not found." });
      }

      if (cleanName !== undefined) {
        const conflict = await db.get(
          `SELECT category_id FROM category WHERE name = ? AND category_id <> ?`,
          [cleanName, id]
        );

        if (conflict) {
          return res.status(409).json({ message: "Category with this name already exists." });
        }
      }

      const fields: string[] = [];
      const values: any[] = [];

      if (cleanName !== undefined) {
        fields.push("name = ?");
        values.push(cleanName);
      }
      if (description !== undefined) {
        fields.push("description = ?");
        values.push(cleanDescription);
      }

      if (fields.length === 0) {
        return res.status(400).json({ message: "No fields to update." });
      }

      values.push(id);

      await db.run(
        `UPDATE category SET ${fields.join(", ")} WHERE category_id = ?`,
        values
      );

      return res.json({ message: "Category updated." });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error." });
    }
  });

  app.delete("/api/admin/categories/:id", requireAuth, requireAdmin, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id))
      return res.status(400).json({ message: "Invalid category ID." });

    try {
      const inUse = await db.get(
        `SELECT COUNT(*) as count FROM "transaction" WHERE category_id = ?`,
        [id]
      );

      if (inUse.count > 0) {
        return res.status(409).json({ 
          message: "Cannot delete category that is being used in transactions." 
        });
      }

      const inGoals = await db.get(
        `SELECT COUNT(*) as count FROM budget_goal WHERE category_id = ?`,
        [id]
      );

      if (inGoals.count > 0) {
        return res.status(409).json({ 
          message: "Cannot delete category that is being used in budget goals." 
        });
      }

      const result = await db.run(`DELETE FROM category WHERE category_id = ?`, [id]);

      if (result.changes === 0) {
        return res.status(404).json({ message: "Category not found." });
      }

      return res.json({ message: "Category deleted." });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error." });
    }
  });

  app.get("/api/control/budgets", requireAuth, async (_req, res) => {
    try {
      const budgets = await db.all(
        `SELECT b.*, u.username as owner_username
         FROM budget b
         JOIN budget_user bu ON bu.budget_id = b.budget_id AND bu.type = 'OWNER'
         JOIN user u ON u.user_id = bu.user_id
         ORDER BY b.budget_id DESC`,
      );
      return res.json({ budgets });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error." });
    }
  });

  app.get("/api/control/transactions", requireAuth, async (_req, res) => {
    try {
      const transactions = await db.all(
        `SELECT t.*, u.username, b.name as budget_name
         FROM "transaction" t
         JOIN user u ON u.user_id = t.user_id
         JOIN budget b ON b.budget_id = t.budget_id
         ORDER BY t.created_at DESC`,
      );
      return res.json({ transactions });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error." });
    }
  });
}
