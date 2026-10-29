import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

/**
 * Guards the administration area.
 *
 * The real gate is row level security: every admin policy checks the
 * platform_admins table, so a signed-in visitor who guesses this URL sees the
 * "not for you" screen from the page itself and cannot read anything. This
 * component only avoids rendering a page that is certain to be empty.
 */
export default function AdminRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main id="main-content" className="auth-page" aria-live="polite">
        <p>Checking your access...</p>
      </main>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
