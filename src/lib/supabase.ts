import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function createBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Supabase environment variables are not configured.");
  }

  browserClient ??= createBrowserClient(url, key);
  return browserClient;
}

export async function createAuthenticatedBrowserClient() {
  const supabase = createBrowserSupabaseClient();
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  let user = sessionData.session?.user;
  if (!user) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      throw new Error(
        "Anonymous sign-in is not enabled for this Supabase project.",
        { cause: error },
      );
    }
    user = data.user ?? undefined;
  }
  if (!user) throw new Error("Could not start a private Supabase session.");

  return { supabase, user };
}

