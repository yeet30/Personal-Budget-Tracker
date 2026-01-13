import express from "express";
import * as sqlite3 from "sqlite3";
import { open } from "sqlite";
import path from "path";

async function main() {
  const app = express();
  app.use(express.json());

  const dbPath = path.resolve(process.cwd(), "database", "PersonalBudgetDB.sqlite");
  console.log("DB path:", dbPath);

  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
  app.post("/api/users", async (req, res) => {
  const { username, email, password, passwordAgain } = req.body;

  if (!username || !email || !password || !passwordAgain) {
    return res.status(400).json({
      message: "Username, email, password and password confirmation are required.",
    });
  }

  if (password !== passwordAgain) {
    return res.status(400).json({
      message: "Passwords do not match.",
    });
  }

  try {
    const emailExists = await db.get(
      `SELECT 1 FROM "user" WHERE email = ? LIMIT 1`,
      [email]
    );

    if (emailExists) {
      return res.status(409).json({
        message: "A user with this email already exists.",
      });
    }

    const usernameExists = await db.get(
      `SELECT 1 FROM "user" WHERE username = ? LIMIT 1`,
      [username]
    );

    if (usernameExists) {
      return res.status(409).json({
        message: "This username is already taken.",
      });
    }

    const roleId = 1;

    await db.run(
      `INSERT INTO "user" (email, username, password, role_id)
       VALUES (?, ?, ?, ?)`,
      [email, username, password, roleId]
    );

    return res.status(201).json({
      message: "Registration successful.",
    });
  } catch (err: any) {
    if (
      err?.code === "SQLITE_CONSTRAINT" ||
      err?.code === "SQLITE_CONSTRAINT_UNIQUE"
    ) {
      const msg = String(err?.message || "");

      if (msg.includes("user.email")) {
        return res.status(409).json({
          message: "A user with this email already exists.",
        });
      }

      if (msg.includes("user.username")) {
        return res.status(409).json({
          message: "This username is already taken.",
        });
      }

      return res.status(409).json({
        message: "Email or username already exists.",
      });
    }

    console.error(err);
    return res.status(500).json({
      message: "Internal server error.",
    });
  }
});


  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  const angularDistPath = path.join(
    __dirname,
    '../frontend/dist/frontend/browser'
  );

  app.use(express.static(angularDistPath));

  app.get(/^(?!\/api).*$/, (_req, res) => {
    res.sendFile(path.join(angularDistPath, 'index.html'));
  });

  app.listen(3000, () => {
    console.log("Server is running on http://localhost:3000");
  });
}

main().catch((err) => {
  console.error("Error starting server:", err);
});
