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
  const { username, email, password, passwordAgain } = req.body ?? {};

  // ---------- helpers ----------
  const isNonEmptyString = (v: unknown) => typeof v === "string" && v.trim().length > 0;
  const normalizeEmail = (v: string) => v.trim().toLowerCase();
  const normalizeUsername = (v: string) => v.trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const usernameRegex = /^[a-zA-Z0-9._-]{3,50}$/;

  const errors: Record<string, string> = {};

  if (!isNonEmptyString(username)) errors.username = "Username is required.";
  if (!isNonEmptyString(email)) errors.email = "Email is required.";
  if (!isNonEmptyString(password)) errors.password = "Password is required.";
  if (!isNonEmptyString(passwordAgain)) errors.passwordAgain = "Password confirmation is required.";

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      message: "Validation error.",
      errors,
    });
  }

  const cleanEmail = normalizeEmail(email);
  const cleanUsername = normalizeUsername(username);

  if (cleanEmail.length > 100) errors.email = "Email must be at most 100 characters.";
  else if (!emailRegex.test(cleanEmail)) errors.email = "Invalid email format.";

  if (cleanUsername.length > 50) errors.username = "Username must be at most 50 characters.";
  else if (!usernameRegex.test(cleanUsername))
    errors.username = "Username must be 3–50 chars and contain only letters, numbers, dot, underscore, or dash.";

  if (password.length < 8) errors.password = "Password must be at least 8 characters.";
  if (password !== passwordAgain) errors.passwordAgain = "Passwords do not match.";

  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      message: "Validation error.",
      errors,
    });
  }

  try {
    const existing = await db.get<
      { user_id: number; email: string; username: string } | undefined
    >(
      `SELECT user_id, email, username
       FROM "user"
       WHERE email = ? OR username = ?
       LIMIT 1`,
      [cleanEmail, cleanUsername]
    );

    if (existing) {
      const conflictErrors: Record<string, string> = {};
      if (existing.email === cleanEmail) conflictErrors.email = "Email is already in use.";
      if (existing.username === cleanUsername) conflictErrors.username = "Username is already taken.";

      return res.status(409).json({
        message: "User already exists.",
        errors: conflictErrors,
      });
    }

    const roleId = 1;

    await db.run(
      `INSERT INTO "user" (email, username, password, role_id)
       VALUES (?, ?, ?, ?)`,
      [cleanEmail, cleanUsername, password, roleId]
    );

    return res.status(201).json({
      message: "Registration successful.",
    });
  } catch (err: any) {
    if (err?.code === "SQLITE_CONSTRAINT" || err?.code === "SQLITE_CONSTRAINT_UNIQUE") {
      const msg = String(err?.message || "").toLowerCase();

      const conflictErrors: Record<string, string> = {};
      if (msg.includes("user.email") || msg.includes("email")) conflictErrors.email = "Email is already in use.";
      if (msg.includes("user.username") || msg.includes("username"))
        conflictErrors.username = "Username is already taken.";

      return res.status(409).json({
        message: "User already exists.",
        errors: Object.keys(conflictErrors).length ? conflictErrors : undefined,
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
