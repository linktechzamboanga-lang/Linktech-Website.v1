# FLITS website security and deployment notes

## Included in this update
- Shared responsive FLITS design-system stylesheet across the HTML pages and tools.
- Keyboard-visible focus states, reduced-motion support, bounded button sizing and responsive action groups.
- `rel="noopener noreferrer"` on links that open new tabs.
- Corrected malformed HTML found in the download page and accessibility/path typos found in several pages.
- Added the web app manifest referenced by the homepage.

## Important security boundaries
This project is a static GitHub Pages website. HTML, CSS and browser JavaScript are public to visitors. Do not put passwords, API secrets, private access tokens, payment credentials, or administrator secrets in these files or in Git history. Public IDs such as analytics and advertising publisher IDs are identifiers, not authentication secrets.

Any membership, payment approval, admin action, or personal-data access must be authorized and validated on the server (for example, inside the Google Apps Script backend or a Cloudflare Worker). Never rely on hiding an admin button, a client-side role value, or localStorage as authorization. Validate inputs, verify the signed-in user's identity server-side, enforce ownership/role checks on every operation, and avoid returning private sheet data to public endpoints.

## Recommended hosting hardening
Configure these as HTTP response headers in Cloudflare (prefer a Response Header Transform Rule or a Worker route). A static HTML meta tag is not an equivalent substitute for all security headers:
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (enable only after every subdomain supports HTTPS).
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`; adjust only if a feature genuinely needs these permissions.
- `Content-Security-Policy`: deploy in Report-Only first, inventory all required Google, OneSignal, AdSense, Cloudflare and other script/connect/image/frame origins, then enforce a least-privilege policy. Do not copy a generic restrictive policy: it can break existing integrations.

Also enable GitHub two-factor authentication, use least-privilege repository and Cloudflare access, review GitHub Actions permissions, rotate any credential that has ever been committed, and keep the private source repository private. HTTPS does not make frontend source code private.
