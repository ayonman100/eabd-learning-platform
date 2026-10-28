import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLearner } from "../context/LearnerContext.jsx";

/**
 * Guards a page behind sign-in and waits for the learner record to settle.
 *
 * Waiting matters: a page that renders before the record has loaded would see
 * an empty learner and could then write that emptiness back.
 */
export default function ProtectedRoute() {
  const { user, loading: authLoading } = useAuth();
  const { loading: learnerLoading } = useLearner();
  const location = useLocation();

  if (authLoading || (user && learnerLoading)) {
    return (
      <main id="main-content" className="auth-page" aria-live="polite">
        <p>Checking your sign-in status...</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
