import { Link, Route, Routes } from "react-router-dom";
import SiteHeader from "./components/SiteHeader.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import SupervisorRoute from "./components/SupervisorRoute.jsx";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Explore from "./pages/Explore.jsx";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";
import OnboardingFlow from "./pages/onboarding/OnboardingFlow.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Profile from "./pages/Profile.jsx";
import LearningJourney from "./pages/LearningJourney.jsx";
import Account from "./pages/Account.jsx";
import SupervisorHome from "./pages/supervisor/SupervisorHome.jsx";
import SupervisorLearner from "./pages/supervisor/SupervisorLearner.jsx";

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

        {/* Signed-in learner pages */}
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<OnboardingFlow />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/learning-journey" element={<LearningJourney />} />
          <Route path="/account" element={<Account />} />
        </Route>

        {/* Supervisor pages */}
        <Route element={<SupervisorRoute />}>
          <Route path="/supervisor" element={<SupervisorHome />} />
          <Route
            path="/supervisor/learners/:learnerId"
            element={<SupervisorLearner />}
          />
        </Route>

        {/* Unknown routes */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
