import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import { env } from "../config/env.js";

export interface SupabaseJwtPayload extends JWTPayload {
  email?: string;
  app_metadata?: { role?: string };
}

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

/**
 * Supabase signs access tokens with the project's asymmetric key (ES256) --
 * verifying against the cached JWKS is a local crypto check, not a network
 * call to the Auth server, on every request after the first key fetch.
 */
function getJWKS() {
  if (!env.SUPABASE_URL) {
    throw new Error(
      "Supabase is not configured: set SUPABASE_URL in server/.env"
    );
  }
  if (!jwks) {
    jwks = createRemoteJWKSet(
      new URL(`${env.SUPABASE_URL}/auth/v1/.well-known/jwks.json`)
    );
  }
  return jwks;
}

export async function verifySupabaseToken(
  token: string
): Promise<SupabaseJwtPayload> {
  const { payload } = await jwtVerify(token, getJWKS(), {
    issuer: `${env.SUPABASE_URL}/auth/v1`,
    audience: "authenticated",
  });
  return payload as SupabaseJwtPayload;
}
