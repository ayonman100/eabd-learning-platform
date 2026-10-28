/**
 * extract-document
 *
 * Reads one uploaded document and stores suggested field values with the exact
 * words they came from. It never writes to the learner record: a person confirms
 * each suggestion in the browser before anything is saved to their profile.
 *
 * Request:  POST { documentId: string } with the caller's Authorization header.
 * Response: { documentId, extraction: { fields } } on success,
 *           { error: string } with a 4xx or 5xx status on failure.
 *
 * Environment:
 *   SUPABASE_URL                 set by the platform
 *   SUPABASE_SERVICE_ROLE_KEY    set by the platform, used only to read the stored file
 *   EXTRACTION_PROVIDER          "mock" (default) or "openai" once a provider is chosen
 *   OPENAI_API_KEY               only needed when EXTRACTION_PROVIDER is openai
 *
 * Safety rules, enforced here and in _shared/extraction-schema.ts:
 *   - Only the seven allowed keys are returned.
 *   - Every value needs a quoted piece of the document as evidence.
 *   - Function levels are whole numbers from 1 to 5 and are never inferred
 *     from a diagnosis.
 *   - Document text and extracted values are never logged.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import {
  EXTRACTABLE_FIELDS,
  validateExtraction,
} from "../_shared/extraction-schema.ts";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const INSTRUCTIONS = `You read one document about a young person and suggest a small number of fields.

Rules:
1. Use only the document. Do not use outside knowledge.
2. For every field you return, copy a short quote from the document as "evidence".
3. If a field is not explicitly stated, return null for it.
4. Never work out GMFCS, MACS, or CFCS from a diagnosis. Only use a level if the document states it.
5. Return only these keys: ${EXTRACTABLE_FIELDS.join(", ")}.
6. Levels are whole numbers from 1 to 5.
7. Reply with JSON only, in the shape {"fields": {"<key>": {"value": ..., "evidence": "..."} | null}}.`;

// A fixed sample so the whole flow can be rehearsed without a paid provider.
const MOCK_EXTRACTION = {
  fields: {
    reported_diagnosis: {
      value: "Cerebral palsy",
      evidence: "Diagnosis: cerebral palsy",
    },
    gmfcs: { value: 3, evidence: "GMFCS level III" },
    macs: { value: 3, evidence: "MACS level III" },
    cfcs: { value: 2, evidence: "CFCS level II" },
    vision: null,
    fatigue: null,
    support: null,
  },
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
  });
}

function decodeBase64(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function readDocumentText(bytes: Uint8Array, mimeType: string) {
  // Only PDFs are read. Images are accepted for storage but cannot be turned
  // into text reliably without a paid vision provider, so they return nothing.
  if (mimeType !== "application/pdf") return "";

  const decoded = new TextDecoder("latin1").decode(bytes);
  const chunks = decoded.match(/[ -~]{24,}/g) ?? [];

  // Strip the PDF structure and keep readable runs of text.
  return chunks
    .filter((chunk) => /[a-z]{4}/i.test(chunk))
    .join("\n")
    .slice(0, 12000);
}

async function extractWithOpenAI(text: string) {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    return {
      ok: false,
      error: "The extraction provider is not configured.",
    } as const;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: INSTRUCTIONS },
        { role: "user", content: text },
      ],
    }),
  });

  if (!response.ok) {
    return { ok: false, error: "The extraction provider did not respond." } as const;
  }

  const payload = await response.json();
  const content = payload?.choices?.[0]?.message?.content;

  try {
    return { ok: true, data: JSON.parse(content) } as const;
  } catch {
    return { ok: false, error: "The extraction provider returned invalid JSON." } as const;
  }
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  if (request.method !== "POST") {
    return json({ error: "Use POST." }, 405);
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader) {
    return json({ error: "Sign in first." }, 401);
  }

  let documentId: string | undefined;
  try {
    const body = await request.json();
    documentId = body?.documentId;
  } catch {
    return json({ error: "Send a JSON body with documentId." }, 400);
  }

  if (!documentId) {
    return json({ error: "documentId is required." }, 400);
  }

  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // A client built from the caller's header proves ownership through RLS.
  const userClient = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: document, error: documentError } = await userClient
    .from("learner_documents")
    .select("id, storage_path, mime_type, extraction_status")
    .eq("id", documentId)
    .maybeSingle();

  if (documentError || !document) {
    return json({ error: "That document could not be found." }, 404);
  }

  if (document.extraction_status === "discarded") {
    return json({ error: "That document was discarded." }, 409);
  }

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false },
  });

  const { data: file, error: downloadError } = await admin.storage
    .from("learner-documents")
    .download(document.storage_path);

  if (downloadError || !file) {
    await userClient
      .from("learner_documents")
      .update({
        extraction_status: "failed",
        extraction_error: "The stored file could not be read.",
      })
      .eq("id", document.id);

    return json({ error: "The stored file could not be read." }, 500);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  const text = await readDocumentText(bytes, document.mime_type);

  const provider = Deno.env.get("EXTRACTION_PROVIDER") ?? "mock";

  let candidate: unknown;
  let providerError: string | undefined;

  if (provider === "mock") {
    candidate = MOCK_EXTRACTION;
  } else if (!text) {
    providerError = "There was no readable text in that document.";
  } else {
    const outcome = await extractWithOpenAI(text);
    if (outcome.ok) candidate = outcome.data;
    else providerError = outcome.error;
  }

  if (providerError) {
    await userClient
      .from("learner_documents")
      .update({
        extraction_status: "failed",
        extraction_error: providerError,
      })
      .eq("id", document.id);

    return json({ error: providerError }, 422);
  }

  const validated = validateExtraction(candidate);

  if (!validated.ok) {
    await userClient
      .from("learner_documents")
      .update({
        extraction_status: "failed",
        extraction_error: "The suggested answers did not pass validation.",
      })
      .eq("id", document.id);

    return json({ error: "The suggested answers did not pass validation." }, 422);
  }

  const { error: saveError } = await userClient
    .from("learner_documents")
    .update({
      extraction_status: "extracted",
      extracted: validated.result,
      extracted_at: new Date().toISOString(),
      extraction_error: null,
    })
    .eq("id", document.id);

  if (saveError) {
    return json({ error: "The suggestions could not be saved." }, 500);
  }

  return json({ documentId: document.id, extraction: validated.result });
});
