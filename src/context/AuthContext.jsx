import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { isSupabaseConfigured, supabase } from "../lib/supabase.js";

const AuthContext = createContext(null);

const CONFIGURATION_ERROR =
  "Account services are unavailable because Supabase is not configured. Please try again later.";

// WebAuthn only runs on HTTPS or localhost, in browsers that expose PublicKeyCredential.
const passkeysSupported =
  typeof window !== "undefined" &&
  window.isSecureContext &&
  typeof window.PublicKeyCredential === "function";

function unavailable() {
  return {
    data: null,
    error: new Error(CONFIGURATION_ERROR),
  };
}

function isReady() {
  return Boolean(isSupabaseConfigured && supabase);
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  // When Supabase is not configured there is nothing to load, so the app starts settled.
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isReady()) {
      return undefined;
    }

    let mounted = true;

    async function loadSession() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error("Could not load the learner session:", error.message);
        }

        setSession(data?.session ?? null);
      } catch (error) {
        if (mounted) {
          console.error("Could not load the learner session:", error);
          setSession(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) {
        setSession(nextSession);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = useCallback(
    async ({ name, email, password, emailRedirectTo, accountType = "learner" }) => {
      if (!isReady()) {
        return {
          data: null,
          error: new Error(CONFIGURATION_ERROR),
        };
      }

      return supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name, account_type: accountType },
          emailRedirectTo,
        },
      });
    },
    []
  );

  const signIn = useCallback(async ({ email, password }) => {
    if (!isReady()) {
      return {
        data: null,
        error: new Error(CONFIGURATION_ERROR),
      };
    }

    return supabase.auth.signInWithPassword({ email, password });
  }, []);

  const signOut = useCallback(async () => {
    if (!isReady()) {
      return { error: new Error(CONFIGURATION_ERROR) };
    }

    return supabase.auth.signOut();
  }, []);

  const signInWithPasskey = useCallback(async () => {
    if (!isReady()) return unavailable();
    return supabase.auth.signInWithPasskey();
  }, []);

  const registerPasskey = useCallback(async () => {
    if (!isReady()) return unavailable();
    return supabase.auth.registerPasskey();
  }, []);

  const listPasskeys = useCallback(async () => {
    if (!isReady()) return unavailable();
    return supabase.auth.passkey.list();
  }, []);

  const removePasskey = useCallback(async (passkeyId) => {
    if (!isReady()) return unavailable();
    return supabase.auth.passkey.delete({ passkeyId });
  }, []);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      accountType: session?.user?.user_metadata?.account_type ?? "learner",
      loading,
      isSupabaseConfigured,
      passkeysSupported,
      signUp,
      signIn,
      signOut,
      signInWithPasskey,
      registerPasskey,
      listPasskeys,
      removePasskey,
    }),
    [
      session,
      loading,
      signUp,
      signIn,
      signOut,
      signInWithPasskey,
      registerPasskey,
      listPasskeys,
      removePasskey,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }

  return context;
}
