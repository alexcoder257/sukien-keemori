import { SPECIAL_RE } from "@/constants";

export type PasswordStrength = 0 | 1 | 2 | 3 | 4;

/**
 * Cheap client-side strength estimate (0–4) driving the wireframe's 4-bar meter.
 * Not a security control — the backend must enforce the real password policy.
 */
export function passwordStrength(password: string): PasswordStrength {
  if (!password) return 0;
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (SPECIAL_RE.test(password)) score++;
  return Math.min(score, 4) as PasswordStrength;
}
