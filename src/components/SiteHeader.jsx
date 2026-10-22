
import { useEffect, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Accessibility,
  Contrast,
  Menu,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  X,
  Type,
  Pause,
  Play,
  RotateCcw,
  Minus,
  Plus,
  ALargeSmall,
} from "lucide-react";
import "./Navbar.css";

const DEFAULT_SETTINGS = {
  darkMode: false,
  highContrast: false,
  largeText: false,
  extraSpacing: false,
  reducedMotion: false,
  readingRate: 0.8,
};

function loadSettings() {
  try {
    const saved = localStorage.getItem("eabd-accessibility-settings");
    return saved
      ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
      : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export default function SiteHeader() {
  const [settings, setSettings] = useState(loadSettings);
  const [menuOpen, setMenuOpen] = useState(false);
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const utteranceRef = useRef(null);

  function updateSetting(name, value) {
    setSettings((current) => ({ ...current, [name]: value }));
  }

  useEffect(() => {
  const root = document.documentElement;

  root.dataset.theme = settings.darkMode ? "dark" : "light";
  root.classList.toggle("a11y-high-contrast", settings.highContrast);
  root.classList.toggle("a11y-large-text", settings.largeText);
  root.classList.toggle("a11y-extra-spacing", settings.extraSpacing);
  root.classList.toggle("a11y-reduced-motion", settings.reducedMotion);

  try {
    localStorage.setItem(
      "eabd-accessibility-settings",
      JSON.stringify(settings)
    );
  } catch {
    // Settings remain active for this session.
  }
}, [settings]);

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  function stopReading() {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
    setSpeaking(false);
    setPaused(false);
  }

  function toggleReading() {
    if (!("speechSynthesis" in window)) {
      window.alert("Read Aloud is not supported by this browser.");
      return;
    }

    if (speaking) {
      stopReading();
      return;
    }

    const main = document.querySelector("main");
    const text = main?.innerText?.trim();

    if (!text) {
      window.alert("There is no page content available to read.");
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-NG";
    utterance.rate = settings.readingRate;

    utterance.onend = () => {
      setSpeaking(false);
      setPaused(false);
      utteranceRef.current = null;
    };

    utterance.onerror = () => {
      setSpeaking(false);
      setPaused(false);
      utteranceRef.current = null;
    };

    utteranceRef.current = utterance;
    setSpeaking(true);
    setPaused(false);
    window.speechSynthesis.speak(utterance);
  }

  function togglePause() {
    if (!("speechSynthesis" in window)) return;

    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
    } else if (speaking) {
      window.speechSynthesis.pause();
      setPaused(true);
    }
  }

  function resetSettings() {
    stopReading();
    setSettings(DEFAULT_SETTINGS);
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <div className="header-inner">
        <Link
          to="/"
          className="brand"
          aria-label="EABD home"
          onClick={closeMenu}
        >
          <img
            src="/EABD-LOGO.png"
            alt="EABD, Empowering Ability Beyond Disability"
          />
        </Link>

        <button
          className="mobile-menu-toggle"
          type="button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <nav
          id="primary-navigation"
          className={`primary-navigation${menuOpen ? " is-open" : ""}`}
          aria-label="Main navigation"
        >
          <NavLink to="/" end onClick={closeMenu}>Home</NavLink>
          <NavLink to="/about" onClick={closeMenu}>About</NavLink>
          <NavLink to="/explore" onClick={closeMenu}>Explore</NavLink>
          <NavLink className="nav-cta" to="/signin" onClick={closeMenu}>
            Learner sign in
          </NavLink>
        </nav>

        <div className="header-tools">
          <button
            className="header-tool-button"
            type="button"
            aria-label="Open accessibility settings"
            aria-expanded={accessibilityOpen}
            aria-controls="accessibility-panel"
            onClick={() => setAccessibilityOpen((open) => !open)}
          >
            <Accessibility size={20} aria-hidden="true" />
            <span className="tool-label">Accessibility</span>
          </button>

          <button
            className="header-tool-button theme-toggle"
            type="button"
            aria-label={settings.darkMode ? "Switch to light theme" : "Switch to dark theme"}
            aria-pressed={settings.darkMode}
            onClick={() => updateSetting("darkMode", !settings.darkMode)}
          >
            {settings.darkMode
              ? <Sun size={20} aria-hidden="true" />
              : <Moon size={20} aria-hidden="true" />}
          </button>
        </div>
      </div>

      {accessibilityOpen && (
        <section
          id="accessibility-panel"
          className="accessibility-panel"
          aria-label="Accessibility settings"
        >
          <div className="accessibility-panel-heading">
            <h2>Accessibility settings</h2>
            <button
              type="button"
              className="panel-close"
              aria-label="Close accessibility settings"
              onClick={() => setAccessibilityOpen(false)}
            >
              <X size={19} aria-hidden="true" />
            </button>
          </div>

          <p className="accessibility-section-label">Display and readability</p>

          <button
            type="button"
            className="accessibility-option"
            aria-pressed={settings.largeText}
            onClick={() => updateSetting("largeText", !settings.largeText)}
          >
            <Type size={20} aria-hidden="true" />
            <span>{settings.largeText ? "Use standard text size" : "Increase page text"}</span>
          </button>

          <button
            type="button"
            className="accessibility-option"
            aria-pressed={settings.highContrast}
            onClick={() => updateSetting("highContrast", !settings.highContrast)}
          >
            <Contrast size={20} aria-hidden="true" />
            <span>{settings.highContrast ? "Turn off high contrast" : "High contrast"}</span>
          </button>

          <button
            type="button"
            className="accessibility-option"
            aria-pressed={settings.extraSpacing}
            onClick={() => updateSetting("extraSpacing", !settings.extraSpacing)}
          >
            <ALargeSmall size={20} aria-hidden="true" />
            <span>{settings.extraSpacing ? "Standard text spacing" : "Increase text spacing"}</span>
          </button>

          <button
            type="button"
            className="accessibility-option"
            aria-pressed={settings.reducedMotion}
            onClick={() => updateSetting("reducedMotion", !settings.reducedMotion)}
          >
            <span aria-hidden="true">◌</span>
            <span>{settings.reducedMotion ? "Allow normal motion" : "Reduce animations"}</span>
          </button>

          <p className="accessibility-section-label">Read page aloud</p>

          <div className="reading-controls">
            <button
              type="button"
              className="accessibility-option"
              aria-pressed={speaking}
              onClick={toggleReading}
            >
              {speaking
                ? <VolumeX size={20} aria-hidden="true" />
                : <Volume2 size={20} aria-hidden="true" />}
              <span>{speaking ? "Stop reading" : "Read page aloud"}</span>
            </button>

            {speaking && (
              <button
                type="button"
                className="accessibility-option"
                onClick={togglePause}
                aria-label={paused ? "Resume reading" : "Pause reading"}
              >
                {paused
                  ? <Play size={20} aria-hidden="true" />
                  : <Pause size={20} aria-hidden="true" />}
                <span>{paused ? "Resume reading" : "Pause reading"}</span>
              </button>
            )}
          </div>

          <label className="reading-speed-control" htmlFor="reading-rate">
            Reading speed: {settings.readingRate.toFixed(1)}×
            <input
              id="reading-rate"
              type="range"
              min="0.5"
              max="1.5"
              step="0.1"
              value={settings.readingRate}
              onChange={(event) =>
                updateSetting("readingRate", Number(event.target.value))
              }
            />
            <span className="reading-speed-labels">
              <span>Slower</span>
              <span>Faster</span>
            </span>
            <span className="accessibility-help">
              The selected speed applies when you start reading.
            </span>
          </label>

          <button
            type="button"
            className="accessibility-option reset-option"
            onClick={resetSettings}
          >
            <RotateCcw size={20} aria-hidden="true" />
            <span>Reset all settings</span>
          </button>

          <p className="accessibility-help">
            These options support reading and navigation. Your device's screen
            reader can provide additional assistance.
          </p>
        </section>
      )}
    </header>
  );
}
