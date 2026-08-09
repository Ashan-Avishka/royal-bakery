import "dotenv/config";
import { z } from "zod";

// Supabase / PayHere / SMTP values default to "" so the scaffold runs
// without credentials; code that needs them must check and fail with a
// clear "not configured" error (see lib/supabase.ts).
const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  CLIENT_ORIGIN: z.string().default("http://localhost:3000"),
  SUPABASE_URL: z.string().default(""),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default(""),
  PAYHERE_MERCHANT_ID: z.string().default(""),
  PAYHERE_MERCHANT_SECRET: z.string().default(""),
  PAYHERE_MODE: z.enum(["sandbox", "live"]).default("sandbox"),
  API_PUBLIC_URL: z.string().default("http://localhost:4000"),
  SMTP_HOST: z.string().default(""),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().default(""),
  SMTP_PASS: z.string().default(""),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
