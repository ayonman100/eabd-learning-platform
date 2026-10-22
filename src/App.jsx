
import { Link, Route, Routes } from "react-router-dom";
import SiteHeader from "./components/SiteHeader.jsx";
import Home from "./pages/Home.jsx";

function About() {
  return (
    <main id="main-content" tabIndex="-1">
      <h1>About EABD</h1>
      <p>
        The participant chooses the destination. EABD helps identify and
        address the barriers between their current position and that goal.
      </p>
      <Link to="/">Back home</Link>
    </main>
  );
}

function NotFound() {
  return (
    <main id="main-content" tabIndex="-1">
      <h1>Page not found</h1>
      <p>We couldn't find the page you requested.</p>
      <Link to="/">Return home</Link>
    </main>
  );
}

function App() {
  return (
    <>
      <SiteHeader />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
