import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Accessibility,
  Contrast,
  Menu,
  Moon,
  Pause,
  Play,
  Sun,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useLearner } from "../context/LearnerContext.jsx";
import {
  DEFAULT_SETTINGS,
  deriveAdaptations,
  resolveSettings,
  settingsToClasses,
} from "../lib/adaptations.js";
import DisplaySettingsFields from "./fields/DisplaySettingsFields.jsx";
import "./Navbar.css";

const STORAGE_KEY = "eabd-accessibility-settings";

// The panel settings use the same keys as the adaptation settings, with
// readingRate kept alongside them for the Read Aloud control.
function loadStoredSettings() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved
      ? { ...DEFAULT_SETTINGS, readingRate: 0.8, ...JSON.parse(saved) }
      : { ...DEFAULT_SETTINGS, readingRate: 0.8 };
  } catch {
    return { ...DEFAULT_SETTINGS, readingRate: 0.8 };
  }
}

export default function SiteHeader() {
  const { user, signOut } = useAuth();
  const { learner, isSupervisor } = useLearner();

  const [overrides, setOverrides] = useState(loadStoredSettings);
  const [menuOpen, setMenuOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [voicesReady, setVoicesReady] = useState(false);

  const panelRef = useRef(null);
  const toggleRef = useRef(null);
  const utteranceRef = useRef(null);

  const settings = useMemo(
    () => resolveSettings(deriveAdaptations(learner), overrides),
    [learner, overrides]
  );

  // Apply the resolved settings to the document root, and remember the person's
  // own choices so the panel keeps working before sign-in.
  useEffect(() => {
    const root = document.documentElement;

    for (const className of [
      "a11y-text-large",
      "a11y-text-larger",
      "a11y-text-default",
      "a11y-high-contrast",
      "a11y-extra-spacing",
      "a11y-reduced-motion",
      "a11y-targets-large",
      "a11y-targets-xl",
      "a11y-one-thing",
      "a11y-extra-time",
    ]) {
      root.classList.remove(className);
    }

    for (const className of settingsToClasses(settings)) {
      root.classList.add(className);
    }

    root.dataset.theme = settings.highContrast
      ? "light"
      : overrides.darkMode
        ? "dark"
        : "light";
  }, [settings, overrides.darkMode]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    } catch {
      // Settings stay active for this session.
    }
  }, [overrides]);

  // Voices arrive asynchronously in most browsers.
  useEffect(() => {
    if (!("speechSynthesis" in window)) return undefined;

    function markReady() {
      if (window.speechSynthesis.getVoices().length > 0) setVoicesReady(true);
    }

    markReady();
    window.speechSynthesis.addEventListener("voiceschanged", markReady);

    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", markReady);
      window.speechSynthesis.cancel();
    };
  }, []);

  // Escape closes whichever surface is open and returns focus to its trigger.
  useEffect(() => {
    function handleKeyDown(event) {
      if (event.key !== "Escape") return;

      if (panelOpen) {
        setPanelOpen(false);
        toggleRef.current?.focus();
      } else if (menuOpen) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [panelOpen, menuOpen]);

  const stopReading = useCallback(() => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setSpeaking(false);
    setPaused(false);
  }, []);

  const startReading = useCallback(
    (text, rate) => {
      const utterance = new window.SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      const englishVoices = voices.filter((voice) => /^en([_-]|$)/i.test(voice.lang));

      const voice =
        englishVoices.find((item) => /^en[-_]NG$/i.test(item.lang)) ||
        englishVoices.find((item) => /^en[-_]GB$/i.test(item.lang)) ||
        englishVoices.find((item) => /^en[-_]US$/i.test(item.lang)) ||
        englishVoices[0];

      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = "en-NG";
      }

      utterance.rate = rate;
      utterance.onend = () => {
        if (utteranceRef.current !== utterance) return;
        utteranceRef.current = null;
        setSpeaking(false);
        setPaused(false);
      };
      utterance.onerror = (event) => {
        if (utteranceRef.current !== utterance) return;
        utteranceRef.current = null;
        setSpeaking(false);
        setPaused(false);

        if (event.error && !["canceled", "interrupted"].includes(event.error)) {
          window.alert(
            "Read Aloud could not start. Check your browser sound settings and try again."
          );
        }
      };

      utteranceRef.current = utterance;
      setSpeaking(true);
      setPaused(false);
      window.speechSynthesis.speak(utterance);
    },
    []
  );

  function toggleReading() {
    if (
      !("speechSynthesis" in window) ||
      typeof window.SpeechSynthesisUtterance === "undefined"
    ) {
      window.alert("Read Aloud is not supported by this browser.");
      return;
    }

    if (speaking) {
      stopReading();
      return;
    }

    const text = document.querySelector("main")?.innerText?.trim();
    if (!text) {
      window.alert("There is no page content available to read.");
      return;
    }

    const rate = speaking || voicesReady ? overrides.readingRate : 0.8;
    window.speechSynthesis.cancel();
    startReading(text, rate);
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

  function updateSettings(next) {
    setOverrides((current) => ({ ...current, ...next }));
  }

  function resetSettings() {
    stopReading();
    setOverrides({ ...DEFAULT_SETTINGS, readingRate: 0.8 });
  }

  async function handleSignOut() {
    setMenuOpen(false);
    await signOut();
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  const learnerLinks = user ? (
    <>
      <NavLink to="/dashboard" onClick={closeMenu}>
        Dashboard
      </NavLink>
      <NavLink to="/learning-journey" onClick={closeMenu}>
        Journey
      </NavLink>
      <NavLink to="/profile" onClick={closeMenu}>
        Profile
      </NavLink>
      <NavLink to="/account" onClick={closeMenu}>
        Account
      </NavLink>
      {isSupervisor && (
        <NavLink to="/supervisor" onClick={closeMenu}>
          Supervisor
        </NavLink>
      )}
      <button type="button" className="nav-signout" onClick={handleSignOut}>
        Sign out
      </button>
    </>
  ) : (
    <NavLink className="nav-cta" to="/signin" onClick={closeMenu}>
      Learner sign in
    </NavLink>
  );

  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <div className="header-inner">
        <Link to="/" className="brand" aria-label="EABD home" onClick={closeMenu}>
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
          <NavLink to="/" end onClick={closeMenu}>
            Home
          </NavLink>
          <NavLink to="/about" onClick={closeMenu}>
            About
          </NavLink>
          <NavLink to="/explore" onClick={closeMenu}>
            Explore
          </NavLink>
          {learnerLinks}
        </nav>

        <div className="header-tools">
          <button
            ref={toggleRef}
            className="header-tool-button"
            type="button"
            aria-label="Accessibility and display settings"
            aria-expanded={panelOpen}
            aria-controls="accessibility-panel"
            onClick={() => setPanelOpen((open) => !open)}
          >
            <Accessibility size={20} aria-hidden="true" />
            <span className="tool-label">Display</span>
          </button>

          <button
            className="header-tool-button theme-toggle"
            type="button"
            aria-label={
              overrides.darkMode ? "Switch to light theme" : "Switch to dark theme"
            }
            aria-pressed={overrides.darkMode}
            onClick={() => updateSettings({ darkMode: !overrides.darkMode })}
          >
            {overrides.darkMode ? (
              <Sun size={20} aria-hidden="true" />
            ) : (
              <Moon size={20} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {panelOpen && (
        <section
          id="accessibility-panel"
          className="accessibility-panel"
          aria-label="Accessibility and display settings"
          ref={panelRef}
        >
          <div className="accessibility-panel-heading">
            <h2>Display settings</h2>
            <button
              type="button"
              className="panel-close"
              aria-label="Close display settings"
              onClick={() => {
                setPanelOpen(false);
                toggleRef.current?.focus();
              }}
            >
              <X size={19} aria-hidden="true" />
            </button>
          </div>

          <DisplaySettingsFields
            value={settings}
            onChange={(next) => {
              // Persist only the keys the person actually changed.
              const changed = {};
              for (const key of Object.keys(DEFAULT_SETTINGS)) {
                if (next[key] !== settings[key]) changed[key] = next[key];
              }
              updateSettings(changed);
            }}
            idPrefix="header-display"
          />

          <div className="accessibility-extra">
            <button
              type="button"
              className="accessibility-option"
              aria-pressed={overrides.darkMode}
              onClick={() => updateSettings({ darkMode: !overrides.darkMode })}
            >
              <Contrast size={20} aria-hidden="true" />
              <span>{overrides.darkMode ? "Use light colours" : "Use dark colours"}</span>
            </button>

            <p className="accessibility-section-label">Read page aloud</p>

            <div className="reading-controls">
              <button
                type="button"
                className="accessibility-option"
                aria-pressed={speaking}
                onClick={toggleReading}
              >
                {speaking ? (
                  <VolumeX size={20} aria-hidden="true" />
                ) : (
                  <Volume2 size={20} aria-hidden="true" />
                )}
                <span>{speaking ? "Stop reading" : "Read page aloud"}</span>
              </button>

              {speaking && (
                <button
                  type="button"
                  className="accessibility-option"
                  onClick={togglePause}
                  aria-label={paused ? "Resume reading" : "Pause reading"}
                >
                  {paused ? (
                    <Play size={20} aria-hidden="true" />
                  ) : (
                    <Pause size={20} aria-hidden="true" />
                  )}
                  <span>{paused ? "Resume reading" : "Pause reading"}</span>
                </button>
              )}
            </div>

            <label className="reading-speed-control" htmlFor="reading-rate">
              Reading speed: {Number(overrides.readingRate).toFixed(1)}x
              <input
                id="reading-rate"
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={overrides.readingRate}
                onChange={(event) =>
                  updateSettings({ readingRate: Number(event.target.value) })
                }
              />
              <span className="reading-speed-labels">
                <span>Slower</span>
                <span>Faster</span>
              </span>
            </label>

            <button
              type="button"
              className="accessibility-option reset-option"
              onClick={resetSettings}
            >
              Reset all settings
            </button>

            <p className="accessibility-help">
              Your choices are saved on this device, and on your record when you
              are signed in. Your device's screen reader can provide additional
              assistance.
            </p>
          </div>
        </section>
      )}
    </header>
  );
}
