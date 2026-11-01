# Optional cloud checkpoint setup

Status: adapter, sign-in/transfer UI and migration prepared. No live project is connected. No schema changes, email sends or paid resources were made during this build.

1. Choose a dedicated Supabase game project. Inspect its current schema before applying `migrations/202611010001_last_tether_saves.sql`; do not apply this blindly to an unrelated application database.
2. Apply the migration once. It creates an account-owned JSON checkpoint table, enables RLS and restricts select/insert/update/delete to the row's authenticated owner. Unauthenticated clients receive no table privileges. A trigger sets the server timestamp.
3. Enable email authentication. Keep the default magic-link template. Configure the production Site URL and permitted local/preview redirect origins. Production email delivery needs a functioning provider; delivery was not tested here.
4. Copy `.env.example` to `.env.local`; supply the project URL and **publishable** key. Never expose a service-role or secret key in a `VITE_` variable. Restart Vite. For Vercel, configure the same two build environment variables and rebuild.
5. Open **Cloud checkpoint** at camp. Sign in using the email link, then choose an explicit upload or download. Existing checkpoint replacement is confirmed before transfer. There is no background sync and no automatic conflict merge. The last confirmed upload wins if two devices upload concurrently.

Required live validation before calling cloud saves ready:

- Sign in on two browsers to the same account; upload on one and download on the other. Resume the intended completed encounter checkpoint.
- Use a second account and confirm it cannot read or overwrite the first account's row, including direct API attempts with the first account's `user_id`.
- Verify anonymous requests fail, expired sessions require sign-in, and sign-out revokes the client session.
- Test invalid checkpoint JSON, network loss and overwrite cancellation. Local progress must survive all failures.
- Review Supabase security advisors after migration and verify email redirects in the actual deployment.

Daily times and ghost recordings remain local. Do not add a public ranking table that trusts client-supplied finish times. A competitive extension needs versioned courses, bounded recordings, validation and a policy for suspicious runs. Live multiplayer is outside this chapter.

References checked during implementation: [Supabase passwordless email sign-in](https://supabase.com/docs/guides/auth/auth-email-passwordless), [row-level security](https://supabase.com/docs/guides/database/postgres/row-level-security). The browser uses Supabase's supported JS client; authentication and database behaviour still require live verification for the chosen project.
