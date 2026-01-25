import type { Express } from "express";
import type { Database } from "sqlite";
import { createNotification } from "../helpers/notification-utils";

export function registerInviteApi(params: {
  app: Express;
  db: Database;
  requireAuth: (req: any, res: any, next: any) => any;
}) {
  const { app, db, requireAuth } = params;

  app.get("/api/invites/pending", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.user_id;

      const rows = await db.all(
        `SELECT
           i.invite_id,
           i.budget_id,
           b.name AS budget_name,
           i.invited_by_user_id,
           u.username AS invited_by_username,
           i.created_at
         FROM budget_invite i
         INNER JOIN budget b ON b.budget_id = i.budget_id
         INNER JOIN "user" u ON u.user_id = i.invited_by_user_id
         WHERE i.invited_user_id = ? AND i.status = 'PENDING'
         ORDER BY datetime(i.created_at) DESC`,
        [userId],
      );

      return res.json({ invites: rows });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error." });
    }
  });

  app.get("/api/invites/sent", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.user_id;

      const rows = await db.all(
        `SELECT
           i.invite_id,
           i.budget_id,
           b.name AS budget_name,
           i.invited_user_id,
           u.username AS invited_username,
           u.email AS invited_email,
           i.status,
           i.created_at,
           i.responded_at
         FROM budget_invite i
         INNER JOIN budget b ON b.budget_id = i.budget_id
         INNER JOIN "user" u ON u.user_id = i.invited_user_id
         WHERE i.invited_by_user_id = ?
         ORDER BY datetime(i.created_at) DESC
         LIMIT 100`,
        [userId],
      );

      return res.json({ invites: rows });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error." });
    }
  });

  app.post("/api/invites/:inviteId/respond", requireAuth, async (req: any, res) => {
    try {
      const invitedUserId = req.user.user_id;
      const inviteId = Number(req.params.inviteId);
      if (!Number.isFinite(inviteId)) return res.status(400).json({ message: "Invalid id." });

      const action = String(req.body?.action ?? "").trim().toUpperCase();
      if (action !== "ACCEPT" && action !== "DENY") {
        return res.status(400).json({ message: "Invalid action." });
      }

      const invite = await db.get<{
        invite_id: number;
        budget_id: number;
        invited_user_id: number;
        invited_by_user_id: number;
        status: string;
      }>(
        `SELECT invite_id, budget_id, invited_user_id, invited_by_user_id, status
         FROM budget_invite
         WHERE invite_id = ?
         LIMIT 1`,
        [inviteId],
      );

      if (!invite) return res.status(404).json({ message: "Invite not found." });
      if (invite.invited_user_id !== invitedUserId)
        return res.status(403).json({ message: "Not your invite." });
      if (invite.status !== "PENDING")
        return res.status(409).json({ message: "Invite already responded." });

      const invitedUser = await db.get<{ username: string }>(
        `SELECT username FROM "user" WHERE user_id = ? LIMIT 1`,
        [invitedUserId],
      );
      const budget = await db.get<{ name: string }>(
        `SELECT name FROM budget WHERE budget_id = ? LIMIT 1`,
        [invite.budget_id],
      );

      if (action === "ACCEPT") {
        await db.run("BEGIN");
        try {
          await db.run(
            `UPDATE budget_invite
             SET status = 'ACCEPTED', responded_at = CURRENT_TIMESTAMP
             WHERE invite_id = ?`,
            [inviteId],
          );

          await db.run(
            `INSERT INTO budget_user (budget_id, user_id, type)
             VALUES (?, ?, 'CONTRIBUTOR')`,
            [invite.budget_id, invitedUserId],
          );

          await db.run("COMMIT");
        } catch (e) {
          await db.run("ROLLBACK");
          throw e;
        }

        await createNotification(db, {
          user_id: invite.invited_by_user_id,
          type: "INVITE_ACCEPTED",
          title: "Invite accepted",
          message: `${invitedUser?.username ?? "A user"} accepted your invite to ${budget?.name ?? "a budget"}.`,
          entity_type: "invite",
          entity_id: inviteId,
        });

        return res.json({ message: "Invite accepted.", status: "ACCEPTED" });
      }

      await db.run(
        `UPDATE budget_invite
         SET status = 'DECLINED', responded_at = CURRENT_TIMESTAMP
         WHERE invite_id = ?`,
        [inviteId],
      );

      await createNotification(db, {
        user_id: invite.invited_by_user_id,
        type: "INVITE_DECLINED",
        title: "Invite declined",
        message: `${invitedUser?.username ?? "A user"} declined your invite to ${budget?.name ?? "a budget"}.`,
        entity_type: "invite",
        entity_id: inviteId,
      });

      return res.json({ message: "Invite declined.", status: "DECLINED" });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error." });
    }
  });
}
