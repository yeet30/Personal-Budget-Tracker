export const VALIDATION = {
  USERNAME: {
    MIN: 3,
    MAX: 50,
    REGEX: /^[a-zA-Z0-9._-]{3,50}$/,
  },
  EMAIL: {
    MAX: 100,
    REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  PASSWORD: {
    MIN: 8,
    HAS_NUMBER_REGEX: /\d/,
  }
} as const;

export function normalizeEmail(v: unknown) {
  return String(v ?? "")
    .trim()
    .toLowerCase();
}

export function normalizeUsername(v: unknown) {
  return String(v ?? "").trim();
}

export function isNonEmptyString(v: unknown) {
  return typeof v === "string" && v.trim().length > 0;
}

export function validateEmail(emailRaw: unknown): string | null {
  const email = normalizeEmail(emailRaw);

  if (!email) return "Email is required.";
  if (email.length > VALIDATION.EMAIL.MAX)
    return `Email must be at most ${VALIDATION.EMAIL.MAX} characters.`;
  if (!VALIDATION.EMAIL.REGEX.test(email)) return "Invalid email format.";

  return null;
}

export function validateUsername(usernameRaw: unknown): string | null {
  const username = normalizeUsername(usernameRaw);

  if (!username) return "Username is required.";
  if (username.length < VALIDATION.USERNAME.MIN)
    return `Username must be at least ${VALIDATION.USERNAME.MIN} characters.`;
  if (username.length > VALIDATION.USERNAME.MAX)
    return `Username must be at most ${VALIDATION.USERNAME.MAX} characters.`;
  if (!VALIDATION.USERNAME.REGEX.test(username))
    return "Username may contain only letters, numbers, dot, underscore, or dash.";

  return null;
}

export function validatePassword(passwordRaw: unknown): string | null {
  const password = String(passwordRaw ?? "");

  if (!password) return "Password is required.";
  if (password.length < VALIDATION.PASSWORD.MIN)
    return `Password must be at least ${VALIDATION.PASSWORD.MIN} characters.`;
  if (!VALIDATION.PASSWORD.HAS_NUMBER_REGEX.test(password))
    return "Password must contain at least one number.";

  return null;
}
