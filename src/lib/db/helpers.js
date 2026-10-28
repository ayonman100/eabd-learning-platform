import { isSupabaseConfigured, supabase } from "../supabase.js";

const CONFIGURATION_ERROR =
  "Account services are unavailable because Supabase is not configured. Please try again later.";

/**
 * Returns the Supabase client, or throws a message that is safe to show.
 */
export function requireSupabaseClient() {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error(CONFIGURATION_ERROR);
  }
  return supabase;
}

/**
 * Logs the raw provider error and throws a plain sentence for the interface.
 * Learner data never reaches the log; only a short label and the error text.
 */
export function raiseUserSafeError(logLabel, userMessage, error) {
  if (error) {
    console.error(`${logLabel}:`, error.message ?? error);
  }
  throw new Error(userMessage);
}

/**
 * Requires a signed-in user and returns their id.
 */
export async function requireUserId() {
  const client = requireSupabaseClient();
  const { data, error } = await client.auth.getUser();

  if (error || !data?.user) {
    raiseUserSafeError(
      "Could not read the signed-in user",
      "Please sign in again to continue.",
      error
    );
  }

  return data.user.id;
}

/**
 * Unwraps a Supabase response, throwing a safe message on failure.
 */
export function unwrap(response, logLabel, userMessage) {
  if (response.error) {
    raiseUserSafeError(logLabel, userMessage, response.error);
  }
  return response.data;
}
