# Private website statistics setup

The analytics feature is opt-in and anonymous. Visitors can accept or reject it; accepted browser sessions contribute page views, active time, device class, referring host and download-link clicks. It does not store IP addresses, account IDs, names, email addresses or full referring URLs.

## 1. Create the database objects

Open the Zen Drift Cruise project in Supabase, open **SQL Editor**, paste the contents of `supabase/website-analytics.sql`, and run it once.

## 2. Add server-only values in Render

In the web service's **Environment** settings, add:

- `SUPABASE_SERVICE_ROLE_KEY`: the secret service-role key from Supabase's API settings. Keep this value private; it must never be placed in website code or sent to a browser.
- `WEBSITE_ADMIN_PASSWORD`: a long, unique password used only for the private dashboard.

The existing `SUPABASE_URL` value must also be present. Save the environment changes so Render restarts the web service.

## 3. Open the dashboard

On the home page, click the main “Find your flow” title three times within about two seconds, then enter `WEBSITE_ADMIN_PASSWORD`. The panel shows only visitors who opted into statistics. Visitor sessions are approximate browser sessions, not verified people. Counts for external Mac, Windows and Android files are link clicks, since those downloads are hosted by GitHub and the site cannot confirm that a file finished downloading.

The session cookie is HTTP-only, restricted to the analytics API, and expires after six hours. Failed password attempts are temporarily limited. Statistics are retained for up to 12 months.
