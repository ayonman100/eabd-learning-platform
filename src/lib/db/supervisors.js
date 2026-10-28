import { requireSupabaseClient, requireUserId } from "./helpers.js";

/**
 * Whether the signed-in account holds the supervisor role. Reads only the
 * caller's own supervisors row, which the policy allows.
 */
export async function isSupervisor() {
  const client = requireSupabaseClient();
  const userId = await requireUserId();

  const { data, error } = await client
    .from("supervisors")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.error("Could not check the supervisor role:", error.message);
    return false;
  }

  return Boolean(data);
}
