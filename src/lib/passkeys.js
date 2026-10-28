
export function passkeyErrorMessage(error) {
  if (
    error?.name === "NotAllowedError" ||
    error?.code === "ERROR_CEREMONY_ABORTED"
  ) {
    return "The face or fingerprint check was cancelled or timed out. Try again when you are ready.";
  }

  if (error?.code === "ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED") {
    return "This device is already set up for face or fingerprint sign-in.";
  }

  if (error?.code === "webauthn_challenge_expired") {
    return "That took too long. Please try again.";
  }

  return (
    error?.message ||
    "Face or fingerprint sign-in didn't work. Please try again."
  );
}

export function formatPasskeyDate(value) {
  if (!value) return "";

  return new Date(value).toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
