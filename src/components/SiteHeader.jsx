
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
  Pause,
  Play,
  RotateCcw,
  ALargeSmall,
} from "lucide-react";
import "./Navbar.css";

const DEFAULT_SETTINGS = {
  darkMode: false,
  highContrast: false,
  textSize: "normal",
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
  root.classList.toggle("a11y-text-large", settings.textSize === "large");
  root.classList.toggle("a11y-text-larger", settings.textSize === "larger");
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

  function startReading(text, rate) {
    const utterance = new window.SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const englishVoices = voices.filter((voice) =>
      /^en([_-]|$)/i.test(voice.lang)
    );

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
        window.alert("Read Aloud could not start. Check your browser sound settings and try again.");
      }
    };

    utteranceRef.current = utterance;
    setSpeaking(true);
    setPaused(false);
    window.speechSynthesis.speak(utterance);
  }

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

    window.speechSynthesis.cancel();
    startReading(text, settings.readingRate);
  }

  function changeReadingRate(value) {
    const rate = Number(value);
    updateSetting("readingRate", rate);

    if (!speaking || !("speechSynthesis" in window)) return;

    const text = document.querySelector("main")?.innerText?.trim();
    if (!text) return;

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

          <div className="text-size-control">
            <span className="text-size-heading">Text size</span>
            <div className="text-size-options" role="group" aria-label="Page text size">
              {[
                { value: "normal", label: "Normal" },
                { value: "large", label: "Large" },
                { value: "larger", label: "Larger" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className="text-size-button"
                  aria-pressed={settings.textSize === option.value}
                  onClick={() => updateSetting("textSize", option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

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
            <RotateCcw size={20} aria-hidden="true" />
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
              onChange={(event) => changeReadingRate(event.target.value)}
            />
            <span className="reading-speed-labels">
              <span>Slower</span>
              <span>Faster</span>
            </span>
            <span className="accessibility-help">
              Changing speed during playback restarts the page at the selected speed.
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
