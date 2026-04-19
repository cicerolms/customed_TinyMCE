# test_tinymce Worker Site

This is a dedicated Cloudflare Worker test site that consumes the shared editor bundle from `cicerolms/customed_TinyMCE`
for an editable page and persists submitted content to D1.

## Routes

- `GET /edit` — render editor screen using shared TinyMCE package
- `POST /save` — persist editor HTML into D1
- `GET /confirm` — read latest saved content from D1 as JSON
- `GET /assets/*` — serve test site assets

## Local quick start

1. The test worker serves a worker route `/editor-lib.js` that fetches the shared editor bundle from:
   - `https://raw.githubusercontent.com/cicerolms/customed_TinyMCE/main/dist/index.js`
   with a private GitHub token.
2. Configure private token (required):
   - `wrangler secret put CICEROLMS_GH_TOKEN`
   - The token must have repository read access for `cicerolms/customed_TinyMCE`.
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

## Guard

- `npm run guard` in `test_tinymce` starts the worker, writes a Playwright screenshot, and hits `/confirm`.
  Screenshot output: `test_tinymce/.screenshots/edit-page.png`.

## Style profile

- `editor-style-profile.json` mirrors the Vietwork style overrides for H2~H5 and yellow underline.
- The profile is designed to be replaced per host by editing JSON, so the same shared editor package can be reused with different visual standards.
