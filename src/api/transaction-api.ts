import type { Express } from "express";
import type { Database } from "sqlite";

export type TransactionRow = {
  transaction_id: number;
  category_id: number;
  budget_id: number;
  user_id: number;
  amount: number;
  currency: string;
  type: 'INCOME' | 'EXPENSE';
  date: string;
  description: string | null;
  created_at: string;
  username: string;
};

export type CategoryRow = {
  category_id: number;
  name: string;
  description: string | null;
  created_at: string;
};

export function registerTransactionApi(params: {
  app: Express;
  db: Database;
  requireAuth: (req: any, res: any, next: any) => any;
}) {
  const { app, db, requireAuth } = params;

  app.get("/api/budgets/:budgetId/transactions", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.user_id;
      const budgetId = parseInt(req.params.budgetId);

      if (isNaN(budgetId)) {
        return res.status(400).json({ message: "Invalid budget ID." });
      }

      const budgetUser = await db.get(
        `SELECT type FROM budget_user WHERE budget_id = ? AND user_id = ?`,
        [budgetId, userId]
      );

      if (!budgetUser) {
        return res.status(403).json({ message: "Access denied." });
      }

      const transactions = await db.all(
        `SELECT t.transaction_id, t.user_id, t.category_id, c.name as category_name, t.amount, t.currency, t.type, t.date, t.description, t.created_at, u.username
         FROM "transaction" t
         INNER JOIN category c ON c.category_id = t.category_id
         INNER JOIN "user" u ON u.user_id = t.user_id
         WHERE t.budget_id = ?
         ORDER BY t.date DESC, t.created_at DESC`,
        [budgetId]
      );

      return res.json({ transactions });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error." });
    }
  });

  app.post("/api/budgets/:budgetId/transactions", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.user_id;
      const budgetId = parseInt(req.params.budgetId);

      if (isNaN(budgetId)) {
        return res.status(400).json({ message: "Invalid budget ID." });
      }

      const budgetUser = await db.get(
        `SELECT type FROM budget_user WHERE budget_id = ? AND user_id = ?`,
        [budgetId, userId]
      );

      if (!budgetUser) {
        return res.status(403).json({ message: "Access denied." });
      }

      const categoryName = String(req.body?.category ?? "").trim();
      const amount = parseFloat(req.body?.amount);
      const currency = String(req.body?.currency ?? "").trim().toUpperCase();
      const type = String(req.body?.type ?? "").toUpperCase();
      const date = String(req.body?.date ?? "").trim();
      const description = req.body?.description ? String(req.body?.description).trim() : null;

      const errors: Record<string, string> = {};

      if (!categoryName) errors.category = "Category is required.";
      if (isNaN(amount) || amount <= 0) errors.amount = "Amount must be a positive number.";
      if (!currency) errors.currency = "Currency is required.";
      else if (!/^[A-Z]{3}$/.test(currency)) errors.currency = "Currency must be a 3-letter code.";
      if (type !== 'INCOME' && type !== 'EXPENSE') errors.type = "Type must be INCOME or EXPENSE.";
      if (!date) errors.date = "Date is required.";
      else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.date = "Date must be yyyy-mm-dd.";

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ message: "Validation error.", errors });
      }

      let category = await db.get(`SELECT category_id FROM category WHERE name = ?`, [categoryName]);
      if (!category) {
        const insert = await db.run(`INSERT INTO category (name) VALUES (?)`, [categoryName]);
        category = { category_id: insert.lastID };
      }

      const insert = await db.run(
        `INSERT INTO "transaction" (category_id, budget_id, user_id, amount, currency, type, date, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [category.category_id, budgetId, userId, amount, currency, type, date, description]
      );

      const transactionId = insert.lastID;

      const user = await db.get(`SELECT username FROM "user" WHERE user_id = ?`, [userId]);

      return res.status(201).json({
        message: "Transaction created.",
        transaction: {
          transaction_id: transactionId,
          category_id: category.category_id,
          category_name: categoryName,
          budget_id: budgetId,
          user_id: userId,
          amount,
          currency,
          type,
          date,
          description,
          created_at: new Date().toISOString(),
          username: user.username
        }
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error." });
    }
  });

  app.get("/api/categories", requireAuth, async (req: any, res) => {
    try {
      const categories = await db.all(
        `SELECT category_id, name, description FROM category ORDER BY name`
      );

      return res.json({ categories });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error." });
    }
  });

  app.delete("/api/budgets/:budgetId/transactions/:transactionId", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.user_id;
      const budgetId = parseInt(req.params.budgetId);
      const transactionId = parseInt(req.params.transactionId);

      if (isNaN(budgetId) || isNaN(transactionId)) {
        return res.status(400).json({ message: "Invalid budget or transaction ID." });
      }

      const budgetUser = await db.get(
        `SELECT type FROM budget_user WHERE budget_id = ? AND user_id = ?`,
        [budgetId, userId]
      );

      if (!budgetUser) {
        return res.status(403).json({ message: "Access denied to this budget." });
      }

      const transaction = await db.get(
        `SELECT user_id FROM "transaction" WHERE transaction_id = ? AND budget_id = ?`,
        [transactionId, budgetId]
      );

      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found." });
      }

      const isOwner = budgetUser.type === 'OWNER';
      const isCreator = transaction.user_id === userId;

      if (!isOwner && !isCreator) {
        return res.status(403).json({ message: "You can only delete your own transactions or be a budget owner." });
      }

      await db.run(`DELETE FROM "transaction" WHERE transaction_id = ?`, [transactionId]);

      return res.status(200).json({ message: "Transaction deleted." });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error." });
    }
  });

  app.put("/api/budgets/:budgetId/transactions/:transactionId", requireAuth, async (req: any, res) => {
    try {
      const userId = req.user.user_id;
      const budgetId = parseInt(req.params.budgetId);
      const transactionId = parseInt(req.params.transactionId);

      if (isNaN(budgetId) || isNaN(transactionId)) {
        return res.status(400).json({ message: "Invalid budget or transaction ID." });
      }

      const budgetUser = await db.get(
        `SELECT type FROM budget_user WHERE budget_id = ? AND user_id = ?`,
        [budgetId, userId]
      );

      if (!budgetUser) {
        return res.status(403).json({ message: "Access denied to this budget." });
      }

      const existingTransaction = await db.get(
        `SELECT user_id, category_id, amount, currency, type, date, description 
         FROM "transaction" WHERE transaction_id = ? AND budget_id = ?`,
        [transactionId, budgetId]
      );

      if (!existingTransaction) {
        return res.status(404).json({ message: "Transaction not found." });
      }

      const isOwner = budgetUser.type === 'OWNER';
      const isCreator = existingTransaction.user_id === userId;

      if (!isOwner && !isCreator) {
        return res.status(403).json({ message: "You can only edit your own transactions or be a budget owner." });
      }

      const categoryName = String(req.body?.category ?? "").trim();
      const amount = parseFloat(req.body?.amount);
      const currency = String(req.body?.currency ?? "").trim().toUpperCase();
      const type = String(req.body?.type ?? "").toUpperCase();
      const date = String(req.body?.date ?? "").trim();
      const description = req.body?.description ? String(req.body?.description).trim() : null;

      const errors: Record<string, string> = {};

      if (!categoryName) errors.category = "Category is required.";
      if (isNaN(amount) || amount <= 0) errors.amount = "Amount must be a positive number.";
      if (!currency) errors.currency = "Currency is required.";
      else if (!/^[A-Z]{3}$/.test(currency)) errors.currency = "Currency must be a 3-letter code.";
      if (type !== 'INCOME' && type !== 'EXPENSE') errors.type = "Type must be INCOME or EXPENSE.";
      if (!date) errors.date = "Date is required.";
      else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) errors.date = "Date must be yyyy-mm-dd.";

      if (Object.keys(errors).length > 0) {
        return res.status(400).json({ message: "Validation error.", errors });
      }

      let category = await db.get(`SELECT category_id FROM category WHERE name = ?`, [categoryName]);
      if (!category) {
        const insert = await db.run(`INSERT INTO category (name) VALUES (?)`, [categoryName]);
        category = { category_id: insert.lastID };
      }

      await db.run(
        `UPDATE "transaction" SET category_id = ?, amount = ?, currency = ?, type = ?, date = ?, description = ?
         WHERE transaction_id = ?`,
        [category.category_id, amount, currency, type, date, description, transactionId]
      );

      const updatedTransaction = await db.get(
        `SELECT t.transaction_id, t.category_id, c.name as category_name, t.amount, t.currency, t.type, t.date, t.description, t.created_at, u.username
         FROM "transaction" t
         INNER JOIN category c ON c.category_id = t.category_id
         INNER JOIN "user" u ON u.user_id = t.user_id
         WHERE t.transaction_id = ?`,
        [transactionId]
      );

      return res.status(200).json({
        message: "Transaction updated.",
        transaction: updatedTransaction
      });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error." });
    }
  });
}
