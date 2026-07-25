import { pathToFileURL } from "node:url";
import { getSupabaseAdmin } from "../src/lib/supabase.js";
import { setUserRole } from "../src/services/profileService.js";
import type { Profile } from "../src/types/profile.js";

export async function resolveAndPromoteUserByEmail(
  email: string
): Promise<Profile> {
  const { data, error } = await getSupabaseAdmin().auth.admin.listUsers();
  if (error) {
    throw new Error(`Failed to list users: ${error.message}`);
  }

  const target = email.toLowerCase();
  const user = data.users.find((u) => u.email?.toLowerCase() === target);
  if (!user) {
    throw new Error(
      `No user found with email "${email}". They must sign up through the app first.`
    );
  }

  return setUserRole(user.id, "admin");
}

const isMain =
  process.argv[1] !== undefined &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMain) {
  const emailArg = process.argv[2];
  if (!emailArg) {
    console.error("Usage: tsx scripts/setAdminRole.ts <email>");
    process.exit(1);
  }

  resolveAndPromoteUserByEmail(emailArg)
    .then((profile) => {
      console.log(`Granted admin role to ${emailArg} (profile id: ${profile.id})`);
      process.exit(0);
    })
    .catch((err) => {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    });
}
