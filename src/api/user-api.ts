import { ApiContext } from "./api-types";
import { hashPassword } from "../helpers/password-utils";
import {
  validateEmail,
  validateUsername,
  validatePassword,
  normalizeEmail,
  normalizeUsername,
} from "../helpers/validation-rules";

export function registerUserApi({ app, db }: ApiContext) {
  app.post("/api/users", async (req, res) => {
    const { username, email, password, passwordAgain } = req.body ?? {};

    const errors: Record<string, string> = {};

    const emailErr = validateEmail(email);
    if (emailErr) errors.email = emailErr;

    const usernameErr = validateUsername(username);
    if (usernameErr) errors.username = usernameErr;

    const passwordErr = validatePassword(password);
    if (passwordErr) errors.password = passwordErr;

    if (!passwordAgain) {
      errors.passwordAgain = "Password confirmation is required.";
    } else if (password !== passwordAgain) {
      errors.passwordAgain = "Passwords do not match.";
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

      const roleId = 1;
      const hashedPassword = hashPassword(password);

      await db.run(
        `INSERT INTO "user" (email, username, password, role_id)
         VALUES (?, ?, ?, ?)`,
        [cleanEmail, cleanUsername, hashedPassword, roleId],
      );

      return res.status(201).json({ message: "Registration successful." });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ message: "Internal server error." });
    }
  });
}
