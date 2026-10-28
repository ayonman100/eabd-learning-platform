# Edge Function API reference: `extract-document`

Source: `supabase/functions/extract-document/index.ts`.
Shared validation: `supabase/functions/_shared/extraction-schema.ts`.

## Purpose

Reads one uploaded document and stores suggested field values, each with the exact words it
came from. It never writes to the learner record. A person confirms or rejects every
suggestion in the browser.

## Endpoint

```
POST https://<project-ref>.supabase.co/functions/v1/extract-document
```

The browser calls it through `supabase.functions.invoke`, which attaches the session token
automatically. Verify JWT is enabled in `supabase/config.toml`.

## Request

Headers:

| Header | Required | Notes |
| --- | --- | --- |
| `Authorization` | yes | The caller's access token, used to read the document row under row level security |
| `Content-Type` | yes | `application/json` |

Body:

```json
{ "documentId": "0f4c2c8e-5c47-4c2a-9a4e-1f0f0f5c1b2a" }
```

## Responses

Success, status 200:

```json
{
  "documentId": "0f4c2c8e-5c47-4c2a-9a4e-1f0f0f5c1b2a",
  "extraction": {
    "fields": {
      "reported_diagnosis": {
        "value": "Cerebral palsy",
        "evidence": "Diagnosis: cerebral palsy"
      },
      "gmfcs": { "value": 3, "evidence": "GMFCS level III" },
      "macs": { "value": 3, "evidence": "MACS level III" },
      "cfcs": { "value": 2, "evidence": "CFCS level II" },
      "vision": null,
      "fatigue": null,
      "support": null
    }
  }
}
```

Every allowed key is present. A key with no statement in the document is `null`.

Errors:

| Status | Body | Cause |
| --- | --- | --- |
| 400 | `{ "error": "Send a JSON body with documentId." }` | Body missing or not JSON |
| 400 | `{ "error": "documentId is required." }` | No id in the body |
| 401 | `{ "error": "Sign in first." }` | No Authorization header |
| 404 | `{ "error": "That document could not be found." }` | Not found, or not owned by the caller |
| 405 | `{ "error": "Use POST." }` | Wrong method |
| 409 | `{ "error": "That document was discarded." }` | The document was discarded earlier |
| 422 | `{ "error": "There was no readable text in that document." }` | No extractable text |
| 422 | `{ "error": "The suggested answers did not pass validation." }` | Output broke the contract |
| 500 | `{ "error": "The stored file could not be read." }` | Storage download failed |
| 500 | `{ "error": "The suggestions could not be saved." }` | Database update failed |

`OPTIONS` returns `200 ok` with CORS headers for preflight.

## Validation rules

Enforced in `_shared/extraction-schema.ts`:

1. The payload is an object, either `{ fields: {...} }` or the bare field map.
2. Only these keys are allowed: `reported_diagnosis`, `gmfcs`, `macs`, `cfcs`, `vision`,
   `fatigue`, `support`.
3. Each present key is either `null` or an object with `value` and `evidence`.
4. Text fields need a non-empty string value.
5. `gmfcs`, `macs`, and `cfcs` need a whole number from 1 to 5.
6. Any field with a value needs a non-empty `evidence` string.
7. A field with evidence but no value is an error.

If validation fails, nothing is stored as suggestions: the document is marked `failed` with a
short `extraction_error`, and the browser offers to type the answers instead.

## Providers

Selected by the `EXTRACTION_PROVIDER` secret.

| Value | Behaviour |
| --- | --- |
| `mock` (default) | Returns a fixed sample so the whole flow can be rehearsed without a paid provider and without any document being sent anywhere |
| `openai` | Sends readable PDF text to the Chat Completions API with a strict instruction set, then validates the JSON reply |

PDFs are read by decoding the file and keeping readable text runs. Images are accepted for
storage but produce no text without a vision provider, so they end as `failed` with the "no
readable text" message.

## Secrets

| Secret | Needed | Notes |
| --- | --- | --- |
| `SUPABASE_URL` | yes | Provided by the platform |
| `SUPABASE_ANON_KEY` | yes | Provided by the platform, used for the caller-scoped client |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Provided by the platform, used only to download the file |
| `EXTRACTION_PROVIDER` | no | Defaults to `mock` |
| `OPENAI_API_KEY` | only for `openai` | Set with `npx supabase secrets set` |

## Deploying

```bash
npx supabase functions deploy extract-document
npx supabase secrets set EXTRACTION_PROVIDER=mock
```

## Logging rules

The function must never log document text, extracted values, or file names. Only status
transitions reach the database, and the short `extraction_error` text is stored so the
person's browser can explain what happened.

## Changing the contract

If a field is added or removed, change three places in the same commit:

1. `supabase/functions/_shared/extraction-schema.ts`
2. `src/lib/extraction.js`
3. `src/lib/extraction.test.js`, and the `Learner` column in the migration if the field is new
