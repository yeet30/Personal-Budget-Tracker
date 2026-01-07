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
      message: "username, email, password i passwordAgain su obavezni.",
    });
  }

  if (password !== passwordAgain) {
    return res.status(400).json({
      message: "Lozinke se ne poklapaju.",
    });
  }

  try {
    const existingUser = await db.get(
      `SELECT user_id FROM "user" WHERE email = ? OR username = ? LIMIT 1`,
      [email, username]
    );

    if (existingUser) {
      return res.status(409).json({
        message: "User with that email already exists!",
      });
    }
    const roleId = 1; 

    await db.run(
      `INSERT INTO "user" (email, username, password, role_id)
       VALUES (?, ?, ?, ?)`,
      [email, username, password, roleId]
    );

    return res.status(201).json({
      message: "Registration success",
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Server error",
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
