import {
  requireSupabaseClient,
  requireUserId,
  raiseUserSafeError,
  unwrap,
} from "./helpers.js";
import { updateLearner } from "./learners.js";

export const DOCUMENT_BUCKET = "learner-documents";
export const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;
export const ALLOWED_MIME_TYPES = ["application/pdf", "image/png", "image/jpeg"];

export function validateDocumentFile(file) {
  if (!file) {
    return "Choose a PDF, PNG or JPG file first.";
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return "That file type is not supported. Use a PDF, PNG or JPG.";
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    return "That file is larger than 10 MB. Choose a smaller file.";
  }
  if (file.size === 0) {
    return "That file appears to be empty. Choose another file.";
  }
  return null;
}

function buildStoragePath(learnerId, fileName) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80);
  return `${learnerId}/${crypto.randomUUID()}-${safeName}`;
}

export async function uploadLearnerDocument(learnerId, file) {
  const client = requireSupabaseClient();
  const userId = await requireUserId();

  const validationError = validateDocumentFile(file);
  if (validationError) {
    raiseUserSafeError("Rejected an invalid document", validationError);
  }

  const storagePath = buildStoragePath(learnerId, file.name);

  const upload = await client.storage
    .from(DOCUMENT_BUCKET)
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (upload.error) {
    raiseUserSafeError(
      "Could not upload the document",
      "We could not upload that file. Please try again.",
      upload.error
    );
  }

  const response = await client
    .from("learner_documents")
    .insert({
      learner_id: learnerId,
      storage_path: storagePath,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      uploaded_by: userId,
      processing_consent_at: new Date().toISOString(),
    })
    .select("*")
    .single();

  return unwrap(
    response,
    "Could not record the document",
    "The file uploaded but we could not record it. Please try again."
  );
}

export async function requestExtraction(documentId) {
  const client = requireSupabaseClient();

  const { data, error } = await client.functions.invoke("extract-document", {
    body: { documentId },
  });

  if (error) {
    raiseUserSafeError(
      "Could not read the document",
      "We could not read that document. You can type the answers instead.",
      error
    );
  }

  if (data?.error) {
    raiseUserSafeError(
      "The extraction function reported an error",
      "We could not read that document. You can type the answers instead.",
      new Error(data.error)
    );
  }

  return data;
}

/**
 * Writes the accepted fields onto the learner, marks the extraction confirmed,
 * and optionally deletes the stored file.
 */
export async function confirmExtraction(
  documentId,
  acceptedFields,
  { deleteFile = true } = {}
) {
  const client = requireSupabaseClient();

  const document = await getDocument(documentId);

  const hasFields =
    acceptedFields && Object.keys(acceptedFields).length > 0;

  // With nothing accepted the learner row is left untouched; the document is
  // still marked confirmed and the file can be removed.
  const learner = hasFields
    ? await updateLearner(document.learner_id, acceptedFields)
    : null;

  const response = await client
    .from("learner_documents")
    .update({
      extraction_status: "confirmed",
      confirmed_at: new Date().toISOString(),
      ...(deleteFile ? { file_deleted_at: new Date().toISOString() } : {}),
    })
    .eq("id", documentId)
    .select("storage_path")
    .single();

  const confirmed = unwrap(
    response,
    "Could not confirm the extraction",
    "We could not save the confirmed answers. Please try again."
  );

  if (deleteFile && confirmed?.storage_path) {
    const removal = await client.storage
      .from(DOCUMENT_BUCKET)
      .remove([confirmed.storage_path]);

    if (removal.error) {
      console.error(
        "Could not delete the confirmed document:",
        removal.error.message
      );
    }
  }

  return learner;
}

export async function getDocument(documentId) {
  const client = requireSupabaseClient();

  const response = await client
    .from("learner_documents")
    .select("id, learner_id, extraction_status, extracted, storage_path")
    .eq("id", documentId)
    .single();

  return unwrap(
    response,
    "Could not load the document",
    "We could not load that document. Please try again."
  );
}

export async function discardExtraction(documentId) {
  const client = requireSupabaseClient();

  const response = await client
    .from("learner_documents")
    .update({
      extraction_status: "discarded",
      file_deleted_at: new Date().toISOString(),
    })
    .eq("id", documentId)
    .select("storage_path")
    .single();

  const discarded = unwrap(
    response,
    "Could not discard the extraction",
    "We could not discard that document. Please try again."
  );

  if (discarded?.storage_path) {
    await client.storage.from(DOCUMENT_BUCKET).remove([discarded.storage_path]);
  }
}
