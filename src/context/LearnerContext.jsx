import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useAuth } from "./AuthContext.jsx";
import { getMyLearner, updateLearner } from "../lib/db/learners.js";
import { isSupervisor } from "../lib/db/supervisors.js";
import { isPlatformAdmin } from "../lib/db/admin.js";

const LearnerContext = createContext(null);

const EMPTY_RECORD = {
  userId: null,
  learner: null,
  supervisor: false,
  admin: false,
  error: "",
};

/**
 * Loads the signed-in account's learner record once per session, after auth has
 * finished resolving.
 *
 * Signed-out and still-loading states are derived from the current user and the
 * loaded record rather than written in an effect. That way a page never sees an
 * empty learner while a saved record is still on its way, which is what used to
 * let a late session clear saved progress.
 */
export function LearnerProvider({ children }) {
  const { user, loading: authLoading, isSupabaseConfigured } = useAuth();

  const [record, setRecord] = useState(EMPTY_RECORD);

  const userId = user?.id ?? null;

  useEffect(() => {
    if (authLoading || !userId || !isSupabaseConfigured) {
      return undefined;
    }

    let active = true;

    Promise.all([getMyLearner(), isSupervisor(), isPlatformAdmin()])
      .then(([nextLearner, nextSupervisor, nextAdmin]) => {
        if (!active) return;
        setRecord({
          userId,
          learner: nextLearner,
          supervisor: nextSupervisor,
          admin: nextAdmin,
          error: "",
        });
      })
      .catch((loadError) => {
        if (!active) return;
        setRecord({
          userId,
          learner: null,
          supervisor: false,
          admin: false,
          error: loadError.message,
        });
      });

    return () => {
      active = false;
    };
  }, [userId, authLoading, isSupabaseConfigured]);

  const isCurrentUser = Boolean(userId) && record.userId === userId;

  const learner = isCurrentUser ? record.learner : null;
  const error = isCurrentUser ? record.error : "";
  const supervisor = isCurrentUser ? record.supervisor : false;
  const admin = isCurrentUser ? record.admin : false;
  const loading = authLoading || (Boolean(userId) && !isCurrentUser);

  const refresh = useCallback(async () => {
    if (!userId) return null;

    try {
      const [nextLearner, nextSupervisor, nextAdmin] = await Promise.all([
        getMyLearner(),
        isSupervisor(),
        isPlatformAdmin(),
      ]);
      setRecord({
        userId,
        learner: nextLearner,
        supervisor: nextSupervisor,
        admin: nextAdmin,
        error: "",
      });
      return nextLearner;
    } catch (loadError) {
      setRecord({
        userId,
        learner: null,
        supervisor: false,
        admin: false,
        error: loadError.message,
      });
      return null;
    }
  }, [userId]);

  const learnerId = learner?.id ?? null;

  const save = useCallback(
    async (patch) => {
      if (!learnerId) {
        throw new Error("Your learner record is not ready yet.");
      }
      const updated = await updateLearner(learnerId, patch);
      setRecord((current) => ({ ...current, learner: updated, error: "" }));
      return updated;
    },
    [learnerId]
  );

  const value = useMemo(
    () => ({
      learner,
      loading,
      error,
      refresh,
      save,
      isSupervisor: supervisor,
      isAdmin: admin,
    }),
    [learner, loading, error, refresh, save, supervisor, admin]
  );

  return (
    <LearnerContext.Provider value={value}>{children}</LearnerContext.Provider>
  );
}

export function useLearner() {
  const context = useContext(LearnerContext);

  if (!context) {
    throw new Error("useLearner must be used inside a LearnerProvider.");
  }

  return context;
}
