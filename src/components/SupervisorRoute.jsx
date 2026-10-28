import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLearner } from "../context/LearnerContext.jsx";

/**
 * Guards the supervisor pages: signed in and holding the supervisor role.
 */
export default function SupervisorRoute() {
  const { user, loading: authLoading } = useAuth();
  const { loading: learnerLoading, isSupervisor } = useLearner();
  const location = useLocation();

  if (authLoading || (user && learnerLoading)) {
    return (
      <main id="main-content" className="auth-page" aria-live="polite">
        <p>Checking your supervisor access...</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  if (!isSupervisor) {
    return (
      <main id="main-content" className="auth-page">
        <section className="auth-card" aria-labelledby="not-supervisor-heading">
          <h1 id="not-supervisor-heading">This area is for supervisors</h1>
          <p>
            Your account does not have supervisor access. Ask the EABD team if
            you should be reviewing a learner's steps.
          </p>
          <p>
            <a href="/dashboard">Go to your dashboard</a>
          </p>
        </section>
      </main>
    );
  }

  return <Outlet />;
}
