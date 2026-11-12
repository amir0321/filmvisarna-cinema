import { z } from "zod";

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return /^https?:\/\//i.test(value)
      && ["http:", "https:"].includes(url.protocol)
      && !url.username && !url.password;
  } catch {
    return false;
  }
}

export const httpUrlSchema = z.string().trim().max(2048).refine(
  isHttpUrl, "URL måste vara en HTTP(S)-URL utan inloggningsuppgifter.",
);

export const imageUrlSchema = z.string().trim().max(2048).refine((value) => {
  if (value.startsWith("/uploads/")) {
    return !value.includes("..") && /^\/uploads\/[A-Za-z0-9_-][A-Za-z0-9._-]*$/.test(value);
  }
  return isHttpUrl(value);
}, "Bild-URL måste vara en HTTP(S)-URL utan inloggningsuppgifter eller en sökväg under /uploads/ utan '..'.");
