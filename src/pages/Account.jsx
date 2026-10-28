
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Fingerprint, LogOut, Trash2 } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { formatPasskeyDate, passkeyErrorMessage } from "../lib/passkeys.js";

export default function Account() {
  const {
    user,
    passkeysSupported,
    registerPasskey,
    listPasskeys,
    removePasskey,
    signOut,
  } = useAuth();
  const navigate = useNavigate();

  const [passkeys, setPasskeys] = useState([]);
  const [loadingPasskeys, setLoadingPasskeys] = useState(passkeysSupported);
  const [reloadCount, setReloadCount] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const name =
    user?.user_metadata?.full_name ||
    user?.email?.split("@")[0] ||
    "Learner";

  useEffect(() => {
    if (!passkeysSupported) return undefined;

    let active = true;

    listPasskeys().then(({ data, error: listError }) => {
      if (!active) return;

      if (listError) {
        setError(passkeyErrorMessage(listError));
      } else {
        setPasskeys(data ?? []);
      }

      setLoadingPasskeys(false);
    });

    return () => {
      active = false;
    };
  }, [passkeysSupported, reloadCount, listPasskeys]);

  async function handleAdd() {
    setError("");
    setMessage("");
    setBusy(true);

    const { error: registerError } = await registerPasskey();

    setBusy(false);

    if (registerError) {
      setError(passkeyErrorMessage(registerError));
      return;
    }

    setMessage("Face or fingerprint sign-in is set up on this device.");
    setReloadCount((count) => count + 1);
  }

  async function handleRemove(passkey) {
    const confirmed = window.confirm(
      "Remove this device? You can still sign in with your email and password."
    );

    if (!confirmed) return;

    setError("");
    setMessage("");
    setBusy(true);

    const { error: removeError } = await removePasskey(passkey.id);

    setBusy(false);

    if (removeError) {
      setError(passkeyErrorMessage(removeError));
      return;
    }

    setMessage("That device can no longer sign in to your account.");
    setReloadCount((count) => count + 1);
  }

  async function handleSignOut() {
    await signOut();
    navigate("/", { replace: true });
  }

  return (
    <main id="main-content" className="auth-page" tabIndex="-1">
      <section className="auth-card" aria-labelledby="account-heading">
        <p className="auth-eyebrow">YOUR ACCOUNT</p>
        <h1 id="account-heading">{name}</h1>
        <p>{user?.email}</p>

        {message && <p role="status">{message}</p>}
        {error && <p className="auth-error" role="alert">{error}</p>}

        <section
          className="account-section"
          aria-labelledby="passkey-heading"
        >
          <h2 id="passkey-heading">Face or fingerprint sign-in</h2>
          <p>
            Your phone or computer checks your face or fingerprint.
            EABD never receives it.
          </p>

          {!passkeysSupported ? (
            <p>
              This browser can't do this. Try Chrome, Safari or Edge on a
              phone or laptop with face unlock or a fingerprint reader.
            </p>
          ) : (
            <>
              {loadingPasskeys ? (
                <p aria-live="polite">Loading your devices...</p>
              ) : passkeys.length > 0 ? (
                <ul className="account-passkeys">
                  {passkeys.map((passkey) => (
                    <li key={passkey.id}>
                      <div>
                        <strong>{passkey.friendly_name || "Passkey"}</strong>
                        <small>
                          Added {formatPasskeyDate(passkey.created_at)}
                          {passkey.last_used_at &&
                            ` · Last used ${formatPasskeyDate(passkey.last_used_at)}`}
                        </small>
                      </div>
                      <button
                        type="button"
                        className="account-remove"
                        onClick={() => handleRemove(passkey)}
                        disabled={busy}
                        aria-label={`Remove ${passkey.friendly_name || "passkey"} added ${formatPasskeyDate(passkey.created_at)}`}
                      >
                        <Trash2 aria-hidden="true" size={18} />
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No device is set up yet.</p>
              )}

              <button
                type="button"
                className="auth-passkey-button"
                onClick={handleAdd}
                disabled={busy}
              >
                <Fingerprint aria-hidden="true" size={22} />
                {busy ? "Waiting for your device..." : "Set up this device"}
              </button>
            </>
          )}
        </section>

        <div className="account-actions">
          <Link to="/dashboard">
            <ArrowLeft aria-hidden="true" size={16} />
            Back to dashboard
          </Link>
          <button
            type="button"
            className="account-signout"
            onClick={handleSignOut}
          >
            <LogOut aria-hidden="true" size={18} />
            Sign out
          </button>
        </div>
      </section>
    </main>
  );
}
