
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  isSupabaseConfigured,
  supabase,
} from "../lib/supabase.js";

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

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setSession(null);
      setLoading(false);
      return undefined;
    }

    let mounted = true;

    async function loadSession() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error(
            "Could not load the learner session:",
            error.message
          );
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

  async function signUp({ name, email, password, emailRedirectTo }) {
    if (!isSupabaseConfigured || !supabase) {
      return {
        data: null,
        error: new Error(CONFIGURATION_ERROR),
      };
    }

    return supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo,
      },
    });
  }

  async function signIn({ email, password }) {
    if (!isSupabaseConfigured || !supabase) {
      return {
        data: null,
        error: new Error(CONFIGURATION_ERROR),
      };
    }

    return supabase.auth.signInWithPassword({ email, password });
  }

  async function signOut() {
    if (!isSupabaseConfigured || !supabase) {
      return {
        error: new Error(CONFIGURATION_ERROR),
      };
    }

    return supabase.auth.signOut();
  }

  async function signInWithPasskey() {
    if (!isSupabaseConfigured || !supabase) return unavailable();
    return supabase.auth.signInWithPasskey();
  }

  async function registerPasskey() {
    if (!isSupabaseConfigured || !supabase) return unavailable();
    return supabase.auth.registerPasskey();
  }

  async function listPasskeys() {
    if (!isSupabaseConfigured || !supabase) return unavailable();
    return supabase.auth.passkey.list();
  }

  async function removePasskey(passkeyId) {
    if (!isSupabaseConfigured || !supabase) return unavailable();
    return supabase.auth.passkey.delete({ passkeyId });
  }

  const value = {
    session,
    user: session?.user ?? null,
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside an AuthProvider.");
  }

  return context;
}
