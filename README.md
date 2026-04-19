# vietwork-classic-editor

Reusable classic TinyMCE editor shell for Cloudflare Worker SSR projects.

This package extracts the reusable part of the Vietwork CMS editor:

- Visual and inline source editing
- Fullscreen editing
- Search with hit count and next/previous navigation
- Reusable toolbar actions
- Custom inline formatting such as `linebold_yellow`
- JSON-driven style profile support
- Shared Tailwind-authored content CSS asset for consuming workers

## What stays outside this package

Keep these in each app repo:

- Worker asset hosting and TinyMCE static file delivery
- Tailwind build output (`styles.css`)
- JSON style profile contract
- Media picker modal routes
- Project i18n dictionaries
- Form templates and persistence wiring

## API

```ts
import { createClassicEditor } from '@cicerolms/vietwork-classic-editor';
```

Initialize with:

- `target`
- `textarea`
- `codeTextarea`
- `submitField`
- `tinyMceGlobal`
- `tinymceBaseUrl`
- optional `contentCssUrl` (legacy)
- optional `styleProfile`
- optional `styleProfileUrl`
- optional translated labels

`styleProfile` fields:

- `contentCssUrls`: array of CSS URLs.
- `bodyClass`: TinyMCE `body_class` value.
- `blockFormats`: TinyMCE `block_formats` value.
- `css.self`: editor-only CSS appended through TinyMCE `content_style`.
- `css.base`: shared bare CSS appended for both editor and public rendering.
- `css.extend`: site-specific bare CSS appended last and allowed to override `css.base`.
- `inlineCss` / `contentStyle`: legacy compatibility fields.

## Tailwind integration

The shared repo now owns a Tailwind-authored CSS asset:

- `assets/tailwind.css`: shared TinyMCE/public content source
- `tailwind.preset.cjs`: shared theme tokens for consuming Tailwind builds
- `styles.css`: compiled shared output for immediate reuse

Recommended consuming-worker flow:

1. Import or point your worker Tailwind build at the shared `assets/tailwind.css`.
2. Build your worker-owned `styles.css` during deploy.
3. Serve that built `styles.css` locally from the worker.
4. Link public pages to `styles.css`.
5. Point TinyMCE `contentCssUrls` at the same `styles.css`.
6. Put site-specific editor/public overrides in `editor-style-profile.json` under `css.extend`.

## Worker integration

1. Serve TinyMCE assets from your Worker assets bucket.
2. Bundle this package into your browser entrypoint.
3. Pass the TinyMCE global after your app loads the runtime.
4. Build and serve a worker-owned `styles.css` from the shared Tailwind asset.
5. Pass that local `styles.css` URL in `contentCssUrls`.

## Extraction plan

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).
