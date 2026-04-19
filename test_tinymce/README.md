# test_tinymce Worker Site

This is a dedicated Cloudflare Worker test site that consumes `@cicerolms/vietwork-classic-editor`
for an editable page and persists submitted content to D1.

## Routes

- `GET /edit` — render editor screen using shared TinyMCE package
- `POST /save` — persist editor HTML into D1
- `GET /confirm` — read latest saved content from D1 as JSON
- `GET /assets/*` — serve test site assets

## Local quick start

1. Ensure TinyMCE shared package is built:
   - `npm run build`
2. Copy latest package bundle to test assets (already checked in; rerun after changes):
   - `cp dist/index.js test_tinymce/public/editor-lib.js`
3. Create D1 binding:
   - `wrangler d1 create test_tinymce_db`
   - set `database_id` from that output in `test_tinymce/wrangler.toml`
5. Create D1 schema:
   - `wrangler d1 execute test_tinymce_db --file ./migrations/0001_init.sql --local` (local smoke)  
   - `wrangler d1 execute test_tinymce_db --file ./migrations/0001_init.sql` (remote)
6. Run worker:
   - `cd test_tinymce && npm run dev`
7. Open:
  - `http://127.0.0.1:8787/edit`

## Guard

- `npm run guard` in `test_tinymce` starts the worker, writes a Playwright screenshot, and hits `/confirm`.
  Screenshot output: `test_tinymce/.screenshots/edit-page.png`.

## Style profile

- `editor-style-profile.json` mirrors the Vietwork style overrides for H2~H5 and yellow underline.
- The profile is designed to be replaced per host by editing JSON, so the same shared editor package can be reused with different visual standards.
