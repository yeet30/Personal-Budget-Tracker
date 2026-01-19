import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64);
  return `${salt}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const parts = stored.split(":");
  if (parts.length !== 2) return false;

  const [salt, storedHex] = parts;
  const derived = scryptSync(password, salt, 64);

  const storedBuf = Buffer.from(storedHex, "hex");
  if (storedBuf.length !== derived.length) return false;

  return timingSafeEqual(storedBuf, derived);
}
