import type { Express } from "express";
import type { Database } from "sqlite";
import { createNotification } from "../helpers/notification-utils";

function isIsoDate(v: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(v);
}

export function registerBudgetApi(params: {
  app: Express;
  db: Database;
  requireAuth: (req: any, res: any, next: any) => any;
}) {
  const { app, db, requireAuth } = params;

  app.get("/api/budgets", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.user_id;

      const budgets = await db.all(
        `SELECT b.budget_id, b.name, b.currency, b.start_date, b.end_date,
                bu.type
         FROM budget b
         INNER JOIN budget_user bu ON bu.budget_id = b.budget_id
         WHERE bu.user_id = ?
         ORDER BY b.budget_id DESC`,
        [userId],
      );

      return res.json({ budgets });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error." });
    }
  });

  app.post("/api/budgets", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.user_id;

      const name = String(req.body?.name ?? "").trim();
      const currency = String(req.body?.currency ?? "")
        .trim()
        .toUpperCase();
      const start_date = String(req.body?.start_date ?? "").trim();
      const end_date = String(req.body?.end_date ?? "").trim();

      const errors: Record<string, string> = {};

      if (!name) errors.name = "Budget name is required.";
      if (name.length > 50)
        errors.name = "Budget name must be <= 50 characters.";

      if (!currency) errors.currency = "Currency is required.";
      else if (!/^[A-Z]{3}$/.test(currency))
        errors.currency = "Currency must be a 3-letter code (e.g. EUR).";

      if (!start_date) errors.start_date = "Start date is required.";
      else if (!isIsoDate(start_date))
        errors.start_date = "Start date must be yyyy-mm-dd.";

      if (!end_date) errors.end_date = "End date is required.";
      else if (!isIsoDate(end_date))
        errors.end_date = "End date must be yyyy-mm-dd.";

      if (!errors.start_date && !errors.end_date) {
        if (start_date > end_date) {
          errors.end_date = "End date must be after start date.";
        }
      }

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ message: "Validation error.", errors });
      }

      const insert = await db.run(
        `INSERT INTO budget (name, currency, start_date, end_date)
         VALUES (?, ?, ?, ?)`,
        [name, currency, start_date, end_date],
      );

      const budgetId = insert.lastID;

      await db.run(
        `INSERT INTO budget_user (budget_id, user_id, type)
         VALUES (?, ?, 'OWNER')`,
        [budgetId, userId],
      );

      return res.status(201).json({
        message: "Budget created.",
        budget: { budget_id: budgetId, name, currency, start_date, end_date },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error." });
    }
  });

  app.delete('/api/budgets', (req, res) => {
  const id = Number(req.query.id);
  console.log(id)
  if (!id) {
    return res.status(400).json({ message: 'Budget id is required' });
  }
    db.run(
    'DELETE FROM budget WHERE budget_id = ?',
    [id],
    function (err: Error | null) {
      if (err) {
        return res.status(500).json({ message: err.message });
      }

      return res.status(204).send();
    });
  });

  app.get("/api/budgets/:id", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.user_id;
      const id = Number(req.params.id);
      if (!Number.isFinite(id))
        return res.status(400).json({ message: "Invalid id." });

      const budget = await db.get(
        `SELECT b.budget_id, b.name, b.currency, b.start_date, b.end_date, b.created_at, bu.type
         FROM budget b
         INNER JOIN budget_user bu ON bu.budget_id = b.budget_id
         WHERE b.budget_id = ? AND bu.user_id = ?
         LIMIT 1`,
        [id, userId],
      );

      if (!budget)
        return res.status(404).json({ message: "Budget not found." });

      return res.json({ budget });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error." });
    }
  });
  app.post("/api/budgets/:id/users", requireAuth, async (req: any, res) => {
    try {
      const ownerId = req.user.user_id;
      const budgetId = Number(req.params.id);
      if (!Number.isFinite(budgetId))
        return res.status(400).json({ message: "Invalid id." });

      const isOwner = await db.get(
        `SELECT 1 FROM budget_user WHERE budget_id = ? AND user_id = ? AND type = 'OWNER' LIMIT 1`,
        [budgetId, ownerId],
      );
      if (!isOwner)
        return res
          .status(403)
          .json({ message: "Only the owner can add users." });

      const identifier = String(req.body?.identifier ?? "")
        .trim()
        .toLowerCase();
      if (!identifier) {
        return res
          .status(400)
          .json({
            message: "Validation error.",
            errors: { identifier: "Email or username is required." },
          });
      }

      const user = await db.get<{
        user_id: number;
        email: string;
        username: string;
      }>(
        `SELECT user_id, email, username FROM "user"
       WHERE lower(email) = ? OR lower(username) = ?
       LIMIT 1`,
        [identifier, identifier],
      );
      if (!user) return res.status(404).json({ message: "User not found." });

      const existing = await db.get(
        `SELECT 1 FROM budget_user WHERE budget_id = ? AND user_id = ? LIMIT 1`,
        [budgetId, user.user_id],
      );
      if (existing) {
        return res
          .status(409)
          .json({ message: "User is already in this budget." });
      }

      const existingInvite = await db.get(
        `SELECT 1 FROM budget_invite WHERE budget_id = ? AND invited_user_id = ? AND status = 'PENDING' LIMIT 1`,
        [budgetId, user.user_id],
      );
      if (existingInvite) {
        return res
          .status(409)
          .json({ message: "Invite already sent to this user." });
      }

      const inviteInsert = await db.run(
        `INSERT INTO budget_invite (budget_id, invited_user_id, invited_by_user_id, status)
         VALUES (?, ?, ?, 'PENDING')`,
        [budgetId, user.user_id, ownerId],
      );
      const inviteId = inviteInsert.lastID;

      const budget = await db.get<{ name: string }>(
        `SELECT name FROM budget WHERE budget_id = ?`,
        [budgetId],
      );

      await createNotification(db, {
        user_id: user.user_id,
        type: "BUDGET_INVITE",
        title: "Budget invite",
        message: `You have been invited to join the budget "${budget?.name ?? 'Unknown'}"`,
        entity_type: "invite",
        entity_id: inviteId,
      });

      return res.status(201).json({
        message: "Invite sent to user.",
        invited: {
          user_id: user.user_id,
          email: user.email,
          username: user.username,
        },
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error." });
    }
  });
  app.get("/api/budgets/:id/users", requireAuth, async (req: any, res) => {
  try {
    const userId = req.user.user_id;
    const budgetId = Number(req.params.id);
    if (!Number.isFinite(budgetId)) return res.status(400).json({ message: "Invalid id." });

    const member = await db.get(
      `SELECT 1 FROM budget_user WHERE budget_id = ? AND user_id = ? LIMIT 1`,
      [budgetId, userId],
    );
    if (!member) return res.status(403).json({ message: "Access denied." });

    const users = await db.all(
      `SELECT u.user_id, u.email, u.username, bu.type
       FROM budget_user bu
       INNER JOIN "user" u ON u.user_id = bu.user_id
       WHERE bu.budget_id = ?
       ORDER BY CASE bu.type WHEN 'OWNER' THEN 0 ELSE 1 END, u.username ASC`,
      [budgetId],
    );

    return res.json({ users });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal server error." });
  }
});

}
