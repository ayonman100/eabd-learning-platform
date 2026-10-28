import { useState } from "react";
import { ALLOWED_MIME_TYPES, validateDocumentFile } from "../../lib/db/documents.js";

const MAX_LABEL = "10 MB";

/**
 * Step 2. Optional. Upload a report or letter so suggested answers can be
 * prepared. Nothing is written to the record until the person confirms it in
 * step 3, and the file can be deleted as soon as they confirm.
 */
export default function StepDocument({ onUpload, uploading, skipToNext }) {
  const [file, setFile] = useState(null);
  const [consent, setConsent] = useState(false);
  const [localError, setLocalError] = useState("");

  function handleFileChange(event) {
    const next = event.target.files?.[0] ?? null;
    setLocalError(next ? validateDocumentFile(next) ?? "" : "");
    setFile(next);
  }

  async function handleUpload(event) {
    event.preventDefault();

    if (!file) {
      setLocalError("Choose a PDF, PNG or JPG file first, or skip this step.");
      return;
    }

    const validationError = validateDocumentFile(file);
    if (validationError) {
      setLocalError(validationError);
      return;
    }

    if (!consent) {
      setLocalError("Tick the box to confirm you agree before uploading.");
      return;
    }

    setLocalError("");
    await onUpload(file);
  }

  return (
    <>
      <p>
        If you have a report or letter that describes what helps this person,
        you can add it here. We will suggest answers for the next questions and
        show you the words in the document that each suggestion came from. You
        decide what to keep.
      </p>

      <div className="document-drop">
        <label htmlFor="onboarding-document">
          Choose a document (PDF, PNG or JPG, up to {MAX_LABEL})
        </label>
        <input
          id="onboarding-document"
          type="file"
          accept={ALLOWED_MIME_TYPES.join(",")}
          onChange={handleFileChange}
          disabled={uploading}
        />
        {file && (
          <p className="auth-help" role="status">
            Selected: {file.name}
          </p>
        )}
        <p className="auth-help">
          The file is stored privately. You can have it deleted as soon as you
          confirm the answers.
        </p>
      </div>

      <label className="onboarding-option consent-option">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          disabled={uploading}
        />
        <span>
          <strong>
            I agree to send this document to be read so the app can suggest
            answers. Nothing is saved to the profile until I confirm it.
          </strong>
        </span>
      </label>

      {localError && (
        <p role="alert" className="error-message">
          {localError}
        </p>
      )}

      <div className="onboarding-actions">
        <button
          type="button"
          className="button-quiet"
          onClick={skipToNext}
          disabled={uploading}
        >
          Skip, I will type the answers
        </button>
        <button type="button" onClick={handleUpload} disabled={uploading}>
          {uploading ? "Reading the document..." : "Upload and read"}
        </button>
      </div>
    </>
  );
}
