import type { Database } from "sqlite";

export async function createNotification(
  db: Database,
  params: {
    user_id: number;
    type: string;
    title: string;
    message: string;
    entity_type?: string | null;
    entity_id?: number | null;
  },
) {
  const { user_id, type, title, message } = params;
  const entity_type = params.entity_type ?? null;
  const entity_id = params.entity_id ?? null;

  await db.run(
    `INSERT INTO notification (user_id, type, title, message, entity_type, entity_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [user_id, type, title, message, entity_type, entity_id],
  );
}
