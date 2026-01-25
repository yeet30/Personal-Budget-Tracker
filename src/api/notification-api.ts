import type { Express } from "express";
import type { Database } from "sqlite";

export function registerNotificationApi(params: {
  app: Express;
  db: Database;
  requireAuth: (req: any, res: any, next: any) => any;
}) {
  const { app, db, requireAuth } = params;

  app.get("/api/notifications", requireAuth, async (req: any, res) => {
    try {
      res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.setHeader("Surrogate-Control", "no-store");

      const userId = req.user.user_id;
      const unreadOnly = String(req.query?.unreadOnly ?? "") === "1";

      let query = `SELECT notification_id, type, title, message, entity_type, entity_id, is_read, created_at
         FROM notification
         WHERE user_id = ?`;
      const params = [userId];

      if (unreadOnly) {
        query += ` AND is_read = 0`;
      }

      query += ` ORDER BY datetime(created_at) DESC LIMIT 100`;

      const rows = await db.all(query, params);

      return res.json({ notifications: rows });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error." });
    }
  });

  app.patch("/api/notifications/:id/read", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.user_id;
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id." });

      const r = await db.run(
        `UPDATE notification SET is_read = 1 WHERE notification_id = ? AND user_id = ?`,
        [id, userId],
      );

      if (!r.changes) return res.status(404).json({ message: "Notification not found." });

      return res.json({ message: "Notification marked as read." });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error." });
    }
  });

  app.patch("/api/notifications/read-all", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.user_id;
      await db.run(`UPDATE notification SET is_read = 1 WHERE user_id = ? AND is_read = 0`, [
        userId,
      ]);
      return res.json({ message: "All notifications marked as read." });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error." });
    }
  });
}
