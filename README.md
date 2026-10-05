# CMIFF 2026 Activity Tracker

Staff-only operations board for the Cape Maclear International Film Festival. Schedule, crew links, incident reports, Telegram messages, and broadcast logs are stored in Convex.

## Backend and access control

The app targets the existing Convex deployment:

```text
https://tremendous-heron-143.convex.cloud
```

Convex Auth provides email/password sign-in. New accounts require an email-specific invitation code. The Convex environment variable `CMIFF_STAFF_INVITES` is a semicolon-separated list of `email=code` pairs (for example, `staff1@example.org=private-code-1;staff2@example.org=private-code-2`). The same list is the staff allowlist; an empty list denies all tracker access.

All data queries, mutations, and Telegram actions check the allowlist in Convex. Keep each invitation code private and distribute it directly to that staff member. This password-only setup does not independently verify email ownership; use email verification or an organizational identity provider if that stronger guarantee is required. Telegram webhook updates are accepted only with the configured webhook secret. Bot tokens, invitation codes, and auth signing keys belong in Convex environment variables, never in this repository.

## Local development

Requirements: Node.js 20.19 or later and npm.

```bash
npm install
npm run dev
```

Set `NEXT_PUBLIC_CONVEX_URL` in the web app environment to the deployment URL above. The app falls back to that URL when the variable is not set.

## Configure the existing Convex deployment

Do this only after reviewing the backend changes. Linking the CLI to a deployment and running `npx convex dev` or `npx convex deploy` can publish functions and update the deployment schema.

1. Log in with the Convex CLI and select the existing deployment `tremendous-heron-143`; do not create a new deployment.
2. Run the Convex Auth initializer against that deployment: `npx @convex-dev/auth`. It provisions `JWT_PRIVATE_KEY` and `JWKS`. If the initializer asks to overwrite existing keys, stop and verify the deployment configuration first.
3. Set `CMIFF_STAFF_INVITES` on that deployment to approved `email=unique-code` pairs separated by semicolons. Generate long, distinct codes and share each only with its staff member. Keep the value empty until invitations are ready; access then remains denied.
4. Set `TELEGRAM_BOT_TOKEN` on the Convex deployment if Telegram sending and crew linking are needed.
5. Publish the Convex code only after review, using the CLI command and deployment target you intend to update.
6. After the first allowlisted staff account signs in, the app seeds the initial schedule and crew records if those tables are empty.

Convex Auth is currently a beta feature and this app uses its client-side React flow; it does not rely on server-side auth in Next.js route handlers.

## Telegram webhook

To store incoming Telegram messages and process `/connect`, set a strong random `TELEGRAM_WEBHOOK_SECRET` in the Convex deployment and configure Telegram to call the Convex HTTP endpoint:

```text
https://tremendous-heron-143.convex.site/telegram/webhook
```

Set Telegram's webhook `secret_token` to the same value. The previous Next.js webhook and local `.data/crew-links.json` routes have been removed; Telegram must be pointed at the Convex endpoint after the backend is published.

## Build and checks

```bash
npm run build
npx tsc --noEmit -p convex/tsconfig.json
```

`convex/_generated/` contains the function and data-model bindings used by the app. Regenerate them with `npx convex codegen` after linking the CLI to the intended deployment.