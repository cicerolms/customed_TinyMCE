# test_tinymce Worker Site

This is a dedicated Cloudflare Worker test site that consumes the shared editor bundle from `cicerolms/customed_TinyMCE`
for an editable page and persists submitted content to D1.

It also demonstrates the consumer pattern for shared styling:

- compile worker-local `public/styles.css` from the shared Tailwind asset
- use that same `styles.css` for public rendering and TinyMCE content CSS
- keep Vietwork-specific overrides in `editor-style-profile.json`

## Routes

- `GET /edit` — render editor screen using shared TinyMCE package
- `POST /save` — persist editor HTML into D1
- `GET /confirm` — read latest saved content from D1 as JSON
- `GET /view` — render saved HTML with the same built stylesheet used by TinyMCE
- `GET /assets/*` — serve test site assets

## Local quick start

1. The test worker serves a worker route `/editor-lib.js` that fetches the shared editor bundle from:
   - `https://raw.githubusercontent.com/cicerolms/customed_TinyMCE/refs/heads/main/dist/index.js`
   (public URL; token not required).
2. Optional: configure private mirror token (only needed if using private GitHub repo):
   - `wrangler secret put CICEROLMS_GH_TOKEN`
   - The token should have repository read access for `cicerolms/customed_TinyMCE`.
3. Create D1 binding:
   - `wrangler d1 create test_tinymce_db`
   - set `database_id` from that output in `test_tinymce/wrangler.toml`
4. Create D1 schema:
   - `wrangler d1 execute test_tinymce_db --file ./migrations/0001_init.sql --local` (local smoke)  
   - `wrangler d1 execute test_tinymce_db --file ./migrations/0001_init.sql` (remote)
5. Run worker:
   - `cd test_tinymce && npm run dev`
6. Open:
  - `http://127.0.0.1:8787/edit`

## Tailwind build

- `npm run build:styles` in `test_tinymce` compiles `public/styles.css`
- the build input is the shared asset `../assets/tailwind.css`
- `wrangler deploy` runs that build automatically through `wrangler.toml`

## Guard

- `npm run guard` in `test_tinymce` starts the worker, writes a Playwright screenshot, and hits `/confirm`.
  Screenshot output: `test_tinymce/.screenshots/edit-page.png`.

## Style profile

- `editor-style-profile.json` now uses raw CSS buckets:
  - `css.self`: editor-only CSS
  - `css.base`: shared bare CSS
  - `css.extend`: site-specific override CSS
- In the current prod profile, `base` is intentionally minimal and `extend` carries the Vietwork H1~H5 and yellow underline styling.
