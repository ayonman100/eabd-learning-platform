# Enabling passkeys on a project

Passkeys are off by default. Until they are enabled, every passkey call fails with
`error_code: passkey_disabled`, and the Account page shows a red "Passkeys are
disabled" banner. That banner is Supabase's own error text, not ours.

This project hit exactly that. Confirmed with an unauthenticated probe:

```bash
curl -s -X POST \
  "https://<ref>.supabase.co/auth/v1/passkeys/registration/options" \
  -H "apikey: <publishable key>"
# {"code":404,"error_code":"passkey_disabled","msg":"Passkeys are disabled"}
```

## What must be set

Three things, and all three are required:

| Setting | Value for development | Notes |
| --- | --- | --- |
| Passkeys enabled | on | Off by default |
| Relying party ID | `localhost` | Bare domain. No scheme, no port, no path |
| Relying party origins | `http://localhost:8080`, `http://localhost:5173` | HTTPS required except loopback |

For production the RP ID becomes the real domain, for example `eabd.example.org`,
with origins such as `https://eabd.example.org`.

**The RP ID must be chosen before anyone enrols, then left alone.** A passkey is
cryptographically bound to it, so changing the ID later invalidates every passkey
already registered.

## How to set it

**Dashboard, which is the simplest route.** Authentication, then Passkeys. Turn on
"Enable Passkey authentication" and fill in the three fields. The dashboard
pre-fills them from the Site URL and project name, so check them rather than
accepting them.

**Management API**, for scripted setup. Needs an access token with project admin
rights:

```bash
curl -X PATCH "https://api.supabase.com/v1/projects/$PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "passkey_enabled": true,
    "webauthn_rp_display_name": "EABD",
    "webauthn_rp_id": "localhost",
    "webauthn_rp_origins": "http://localhost:8080,http://localhost:5173"
  }'
```

**Not through `supabase config push`.** The CLI version this project uses ignores
`[auth.passkey]` and `[auth.webauthn]` in `config.toml`, even though the Supabase
documentation shows them: `supabase config diff` reports no change when they are
added. The keys are committed to `supabase/config.toml` anyway, so the intended
values are recorded in the repository, but the dashboard or the Management API is
what actually applies them.

## Verifying

After setting it, the same probe returns a challenge:

```bash
curl -s -X POST "https://<ref>.supabase.co/auth/v1/passkeys/authentication/options" \
  -H "apikey: <publishable key>" | head -c 200
```

Then open the Account page. The red banner disappears and "Set up this device"
appears. Register a passkey, sign out, and sign back in with it.

## Other reasons a passkey can fail to register

- **Not a secure context.** WebAuthn only runs on HTTPS or loopback. The app hides
  the control rather than showing it broken, so if no control appears, the page is
  not in a secure context.
- **No authenticator.** A browser without a platform authenticator, or a device with
  no screen lock, cannot create a passkey.
- **The account is unconfirmed.** Registering a passkey requires a confirmed account.
  During local testing confirmation is switched off, so this only matters on a
  project where it is on.
- **The client must opt in.** Older Supabase JS clients required
  `auth.experimental.passkey`. In `@supabase/supabase-js` 2.118 the flag is accepted
  but ignored, and passkeys are enabled by default, so this project does not need it.

## Why the app cannot fix this itself

The toggle lives on the auth service, not in the database. A migration cannot set
it, and the publishable key cannot change it. That is deliberate: allowing an
application to enable its own authentication methods would be a security hole.

So this is the one part of the passkey feature that needs a person with project
admin rights to act, once, before the feature works.
