
import { Link, Route, Routes } from "react-router-dom";
import SiteHeader from "./components/SiteHeader.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Explore from "./pages/Explore.jsx";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import Dashboard from "./pages/Dashboard.jsx";

function NotFound() {
  return (
    <main id="main-content" className="not-found-page" tabIndex="-1">
      <p className="not-found-eyebrow">404 · PAGE NOT FOUND</p>
      <h1>We couldn't find that page.</h1>
      <p>
        The page may have moved, or the link may be incorrect.
        You can return home or explore the available learning pathways.
      </p>

      <div className="not-found-actions">
        <Link to="/" className="not-found-primary">
          Return home
        </Link>
        <Link to="/explore" className="not-found-secondary">
          Explore pathways
        </Link>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <>
      <SiteHeader />

      <Routes>
        {/* Public pages */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/explore" element={<Explore />} />

        {/* Account pages */}
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Learner onboarding */}
        <Route path="/onboarding" element={<Onboarding />} />

        {/* Protected learner pages */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<Dashboard />} />
        </Route>

        {/* Unknown routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
