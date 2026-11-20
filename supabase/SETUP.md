# Cloud saves setup

Cloud saves use Supabase Auth and a Postgres table protected by row-level security.
Only the public project URL and publishable/anon key are used by the game; never
put a `service_role` key in the browser or in this repository.

1. Create a Supabase project.
2. In **SQL Editor**, run `game_saves.sql`.
3. In **Project Settings → API**, copy the Project URL and publishable key
   (or legacy anon key).
4. Add these environment variables to the Render web service and redeploy:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
5. In **Authentication → URL Configuration**, set the site URL to
   `https://zen-drift-cruise-online.onrender.com` and add
   `https://zen-drift-cruise-online.onrender.com/play` to the redirect allowlist.
6. In **Authentication → Sign In / Providers**, enable Email. For Google,
   create a Web OAuth client in Google Cloud, add the game site's origin to
   Google's authorized JavaScript origins, and register the callback URL shown
   on Supabase's Google provider page as an authorized redirect URI. Put that
   client ID and secret in Supabase's Google provider settings and enable it.
7. Add the game's `/play` URL to Supabase's redirect allowlist so confirmation,
   Google sign-in and password-reset links return to the game.

No Supabase `service_role` key is needed. Database row policies restrict each
signed-in player to their own save. Until the two Render variables are set, the
game keeps local saves and shows cloud accounts as unavailable. The project
uses Supabase's hosted Auth and database APIs; it does not write user data to
Render's local filesystem.
