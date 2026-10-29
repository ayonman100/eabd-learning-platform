import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import {
  Accessibility,
  ChevronDown,
  ClipboardCheck,
  LayoutGrid,
  LogOut,
  Menu,
  Moon,
  Pause,
  Play,
  Route,
  Settings,
  ShieldCheck,
  Sun,
  UserRound,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useLearner } from "../context/LearnerContext.jsx";
import { saveUiSettings } from "../lib/db/learners.js";
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

// Only the display keys belong on the learner record; the reading speed and the
// theme choice stay on the device.
const RECORD_KEYS = Object.keys(DEFAULT_SETTINGS);

function pickDisplaySettings(overrides) {
  const picked = {};
  for (const key of RECORD_KEYS) {
    if (key in overrides) picked[key] = overrides[key];
  }
  return picked;
}

export default function SiteHeader() {
  const { user, signOut } = useAuth();
  const { learner, isSupervisor, isAdmin } = useLearner();

  const [overrides, setOverrides] = useState(loadStoredSettings);
  const [menuOpen, setMenuOpen] = useState(false);
  const [learningMenuOpen, setLearningMenuOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [voicesReady, setVoicesReady] = useState(false);

  const panelRef = useRef(null);
  const toggleRef = useRef(null);
  const menuTriggerRef = useRef(null);
  const menuWrapRef = useRef(null);
  const utteranceRef = useRef(null);

  // The record is the source of truth once it has loaded; local storage keeps
  // the panel working for a visitor who is not signed in.
  const savedFromRecord = useRef(false);
  useEffect(() => {
    if (!learner?.id || savedFromRecord.current) return;
    const stored = learner.ui_settings;
    if (stored && Object.keys(stored).length > 0) {
      setOverrides((current) => ({
        ...current,
        ...stored,
        readingRate: current.readingRate,
      }));
    }
    savedFromRecord.current = true;
  }, [learner?.id, learner?.ui_settings]);

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

    // Dark and high contrast are independent: a person can want both. Forcing
    // "light" here whenever contrast was on is what made the toggle appear dead.
    root.dataset.theme = overrides.darkMode ? "dark" : "light";
  }, [settings, overrides.darkMode]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
    } catch {
      // Settings stay active for this session.
    }
  }, [overrides]);

  // Persist the display choices onto the learner record so they follow the
  // person to another device. Debounced: a slider drag should not save per step.
  const learnerId = learner?.id ?? null;
  useEffect(() => {
    if (!learnerId) return undefined;

    const timer = window.setTimeout(() => {
      saveUiSettings(learnerId, pickDisplaySettings(overrides)).catch(
        (saveError) => {
          console.error("Could not save display settings:", saveError.message);
        }
      );
    }, 800);

    return () => window.clearTimeout(timer);
  }, [learnerId, overrides]);

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
      } else if (learningMenuOpen) {
        setLearningMenuOpen(false);
        menuTriggerRef.current?.focus();
      } else if (menuOpen) {
        setMenuOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [panelOpen, learningMenuOpen, menuOpen]);

  // Only one surface is open at a time. Closing the other inside the click
  // handler keeps the state change in one place instead of two effects that
  // would otherwise fight each other.
  useEffect(() => {
    if (!learningMenuOpen) return undefined;

    function handlePointerDown(event) {
      if (!menuWrapRef.current?.contains(event.target)) {
        setLearningMenuOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [learningMenuOpen]);

  // A click outside the display panel closes it, except on its own trigger,
  // which toggles the panel itself.
  useEffect(() => {
    if (!panelOpen) return undefined;

    function handlePointerDown(event) {
      const panel = panelRef.current;
      const trigger = toggleRef.current;
      if (!panel) return;
      if (panel.contains(event.target)) return;
      if (trigger?.contains(event.target)) return;
      setPanelOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [panelOpen]);

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
    setLearningMenuOpen(false);
  }

  function closeLearningMenu() {
    setLearningMenuOpen(false);
  }

  // Signed-in destinations, grouped behind one menu control so the header stays
  // short. Each entry carries an icon and a one-line hint.
  const learningMenu = [
    { to: "/dashboard", label: "Dashboard", hint: "Your next step", icon: LayoutGrid },
    { to: "/learning-journey", label: "Learning journey", hint: "Weeks and tasks", icon: Route },
    { to: "/profile", label: "Profile", hint: "What helps you learn", icon: UserRound },
    { to: "/account", label: "Account", hint: "Sign-in and devices", icon: Settings },
  ];

  if (isSupervisor) {
    learningMenu.push({
      to: "/supervisor",
      label: "Supervisor",
      hint: "Review learner steps",
      icon: ClipboardCheck,
    });
  }

  if (isAdmin) {
    learningMenu.push({
      to: "/admin",
      label: "Administration",
      hint: "Learners and approvals",
      icon: ShieldCheck,
    });
  }

  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">
        Skip to main content
      </a>

      <div className="header-inner">
        <Link to="/" className="brand" aria-label="EABD home" onClick={closeMenu}>
          <img className="brand-mark" src="/EABD-mark.png" alt="" aria-hidden="true" />
          <span className="brand-words">
            <span className="brand-name">EABD</span>
            <span className="brand-tagline">Empowering Ability</span>
          </span>
        </Link>

        {/* Signed out: the three public pages and one sign-in action. */}
        <nav
          id="primary-navigation"
          className={`primary-navigation${menuOpen ? " is-open" : ""}`}
          aria-label="Main navigation"
        >
          {!user && (
            <>
              <NavLink to="/" end onClick={closeMenu}>
                Home
              </NavLink>
              <NavLink to="/about" onClick={closeMenu}>
                About
              </NavLink>
              <NavLink to="/explore" onClick={closeMenu}>
                Explore
              </NavLink>
            </>
          )}

          {user && (
            <div className="learning-menu-mobile">
              {learningMenu.map((item) => (
                <NavLink key={item.to} to={item.to} onClick={closeMenu}>
                  <item.icon size={18} aria-hidden="true" />
                  {item.label}
                </NavLink>
              ))}
              <button type="button" className="nav-signout" onClick={handleSignOut}>
                <LogOut size={18} aria-hidden="true" />
                Sign out
              </button>
            </div>
          )}
        </nav>

        <div className="header-tools">
          {user ? (
            <div className="learning-menu" ref={menuWrapRef}>
              <button
                ref={menuTriggerRef}
                type="button"
                className="learning-menu-trigger"
                aria-expanded={learningMenuOpen}
                aria-controls="learning-menu-panel"
                aria-haspopup="true"
                onClick={() => {
                  setPanelOpen(false);
                  setLearningMenuOpen((open) => !open);
                }}
              >
                <LayoutGrid size={18} aria-hidden="true" />
                <span className="learning-menu-label">My learning</span>
                <ChevronDown
                  size={16}
                  aria-hidden="true"
                  className={`learning-menu-chevron${learningMenuOpen ? " is-open" : ""}`}
                />
              </button>

              {learningMenuOpen && (
                <div
                  id="learning-menu-panel"
                  className="learning-menu-panel"
                  role="menu"
                  aria-label="My learning"
                >
                  {learningMenu.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      role="menuitem"
                      className="learning-menu-item"
                      onClick={closeLearningMenu}
                    >
                      <item.icon size={18} aria-hidden="true" />
                      <span>
                        <span className="learning-menu-item-label">{item.label}</span>
                        <span className="learning-menu-item-hint">{item.hint}</span>
                      </span>
                    </NavLink>
                  ))}

                  <div className="learning-menu-divider" role="separator" />

                  <button
                    type="button"
                    role="menuitem"
                    className="learning-menu-item learning-menu-signout"
                    onClick={handleSignOut}
                  >
                    <LogOut size={18} aria-hidden="true" />
                    <span>
                      <span className="learning-menu-item-label">Sign out</span>
                    </span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <NavLink className="btn btn-primary nav-cta" to="/signin" onClick={closeMenu}>
              Sign in
            </NavLink>
          )}

          <button
            ref={toggleRef}
            className="header-tool-button"
            type="button"
            aria-label="Accessibility and display settings"
            aria-expanded={panelOpen}
            aria-controls="accessibility-panel"
            onClick={() => {
              setLearningMenuOpen(false);
              setPanelOpen((open) => !open);
            }}
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
        </div>
      </div>

      {panelOpen && (
        <div
          id="accessibility-panel"
          className="display-panel"
          role="dialog"
          aria-modal="false"
          aria-labelledby="display-panel-heading"
          ref={panelRef}
        >
          <div className="display-panel-head">
            <div className="display-panel-title">
              <span className="display-panel-icon" aria-hidden="true">
                <Accessibility size={18} />
              </span>
              <div>
                <h2 id="display-panel-heading">Display settings</h2>
                <p className="display-panel-sub">Saved as you change them</p>
              </div>
            </div>

            <button
              type="button"
              className="panel-close"
              aria-label="Close display settings"
              onClick={() => {
                setPanelOpen(false);
                toggleRef.current?.focus();
              }}
            >
              <X size={20} aria-hidden="true" />
            </button>
          </div>

          <div className="display-panel-body">
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

            <fieldset className="choice-group">
              <legend className="choice-legend">Colour scheme</legend>
              <div className="segmented-options" role="radiogroup" aria-label="Colour scheme">
                <button
                  type="button"
                  role="radio"
                  aria-checked={!overrides.darkMode}
                  className="segmented-option"
                  onClick={() => updateSettings({ darkMode: false })}
                >
                  {!overrides.darkMode && <Sun size={15} aria-hidden="true" />}
                  Light colours
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={Boolean(overrides.darkMode)}
                  className="segmented-option"
                  onClick={() => updateSettings({ darkMode: true })}
                >
                  {overrides.darkMode && <Moon size={15} aria-hidden="true" />}
                  Dark colours
                </button>
              </div>
            </fieldset>

            <fieldset className="choice-group">
              <legend className="choice-legend">Read page aloud</legend>
              <p className="choice-hint">
                Uses your device voice. Reading speed is {Number(overrides.readingRate).toFixed(1)}x.
              </p>

              <div className="reading-controls">
                <button
                  type="button"
                  className="reading-toggle"
                  aria-pressed={speaking}
                  onClick={toggleReading}
                >
                  {speaking ? (
                    <VolumeX size={18} aria-hidden="true" />
                  ) : (
                    <Volume2 size={18} aria-hidden="true" />
                  )}
                  {speaking ? "Stop reading" : "Read page aloud"}
                </button>

                {speaking && (
                  <button
                    type="button"
                    className="reading-toggle"
                    onClick={togglePause}
                    aria-label={paused ? "Resume reading" : "Pause reading"}
                  >
                    {paused ? (
                      <Play size={18} aria-hidden="true" />
                    ) : (
                      <Pause size={18} aria-hidden="true" />
                    )}
                    {paused ? "Resume" : "Pause"}
                  </button>
                )}
              </div>

              <label className="reading-speed" htmlFor="reading-rate">
                <span className="reading-speed-label">Speed</span>
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
                <span className="reading-speed-ends">
                  <span>Slower</span>
                  <span>Faster</span>
                </span>
              </label>
            </fieldset>

            <div className="display-panel-foot">
              <button
                type="button"
                className="btn btn-quiet"
                onClick={resetSettings}
              >
                Reset all
              </button>
              <p className="display-panel-note">
                Saved on this device, and on your record when you are signed in.
              </p>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
