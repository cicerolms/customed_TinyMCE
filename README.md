# vietwork-classic-editor

Reusable classic TinyMCE editor shell for Cloudflare Worker SSR projects.

This package extracts the reusable part of the Vietwork CMS editor:

- Visual and inline source editing
- Fullscreen editing
- Search with hit count and next/previous navigation
- Reusable toolbar actions
- Five shared utility toolbar buttons that wrap selection with `utility_1` to `utility_5`
- Custom inline formatting such as `linebold_yellow`
- JSON-driven style profile support
- Shared Tailwind-authored content CSS asset for consuming workers
- Explicit i18n hooks so consuming apps can switch locale in the frontend

## Public repo

- GitHub: `https://github.com/cicerolms/customed_TinyMCE`
- Package name: `@cicerolms/vietwork-classic-editor`

## Quick start

Install the shared editor in your app:

```bash
npm install github:cicerolms/customed_TinyMCE
```

Import it in your browser entry:

```ts
import {
  bootstrapClassicEditor,
  dispatchClassicEditorI18n,
} from "@cicerolms/vietwork-classic-editor";

await bootstrapClassicEditor({
  assetBaseUrl: "/assets",
  styleProfileUrl: "/editor-style-profile.json",
  i18n: {
    lang: "ja",
    t: (key, fallback) => messages.ja?.[key] || fallback || key,
  },
});
```

At minimum, your app needs to provide:

- one editor container with `data-classic-editor`
- one textarea inside it
- TinyMCE legacy assets under `/assets`
- a worker-served `styles.css`
- `/editor-style-self.css`
- `/editor-style-base.css`
- `/editor-style-profile.css`
- `/editor-style-profile.json`

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
import {
  bootstrapClassicEditor,
  createClassicEditor,
  dispatchClassicEditorI18n,
} from '@cicerolms/vietwork-classic-editor';
```

Main exports:

- `createClassicEditor(...)`
- `bootstrapClassicEditor(...)`
- `dispatchClassicEditorI18n(...)`

Initialize with:

- `target`
- `textarea`
- optional `styleProfile`
- optional `styleProfileUrl`
- optional translated labels
- optional `i18n`

`styleProfile` fields:

- `contentCssUrls`: array of CSS URLs.
- `bodyClass`: TinyMCE `body_class` value.
- `blockFormats`: TinyMCE `block_formats` value.
- `extendCssUrl`: worker-local site-specific CSS file loaded after shared base CSS.
- `inlineCss` / `contentStyle`: legacy compatibility fields.

`i18n` fields:

- `lang`: `ja`, `vi`, or `en` for the built-in editor UI translations. Values like `ja-JP`, `vi-VN`, and `en-US` normalize automatically.
- `t(key, fallback)`: host translation function for menu labels and shared button text.

Returned editor instance methods:

- `getLocale()`
- `setLocale(nextLocale)`
- `setI18n({ lang, t })`
- `switchMode(nextMode)`
- `insertHtml(html)`
- `setContent(html)`
- `syncToTextarea()`
- `destroy()`

## Frontend locale switching

The shared editor now has a supported locale API. Do not rely on `window.__i18n` as the primary integration.

Recommended pattern when you own the editor instance:

```ts
const editor = await createClassicEditor({
  target,
  textarea,
  i18n: {
    lang: "ja",
    t: (key, fallback) => messages[currentLocale]?.[key] || fallback || key,
  },
});

languageSelect.addEventListener("change", async (event) => {
  const nextLocale = (event.target as HTMLSelectElement).value;
  await editor.setI18n({
    lang: nextLocale,
    t: (key, fallback) => messages[nextLocale]?.[key] || fallback || key,
  });
});
```

If the editor is bootstrapped elsewhere and the page just needs to broadcast a locale change:

```ts
dispatchClassicEditorI18n({
  lang: "vi",
  t: (key, fallback) => messages.vi?.[key] || fallback || key,
});
```

Compatibility:

- `document.dispatchEvent(new CustomEvent("vietwork:i18n-applied", { detail: { lang } }))` still works.
- `window.__i18n` is still used as a fallback when no explicit `i18n` config is provided.
- The documented contract is now `i18n`, `setLocale`, `setI18n`, and `dispatchClassicEditorI18n`.

## Minimal markup

```html
<form id="post-editor-form" method="post">
  <section data-classic-editor>
    <textarea
      id="content"
      name="content"
      data-editor-textarea
    ></textarea>
  </section>
  <button type="submit">Save</button>
</form>
<div id="save-status"></div>
```

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
6. Expose worker CSS routes for the profile split:
   - `editor-style-self.css` from shared repo `editor-style-self.css`
   - `editor-style-base.css` from shared repo `editor-style-base.css`
   - `editor-style-profile.css` from the worker-local `extendCssUrl`
7. Point TinyMCE `contentCssUrls` at all four worker-served stylesheets in order:
   - `/styles.css`
   - `/editor-style-self.css`
   - `/editor-style-base.css`
   - `/editor-style-profile.css`
8. Link public pages to:
   - `/styles.css`
   - `/editor-style-profile.css`
9. Keep reusable cross-site CSS in shared repo files and keep only the site-specific extend CSS in the worker repo.
10. Use the shared `U1` to `U5` toolbar buttons to apply `.utility_1` to `.utility_5`, then style those classes in the worker-local extend CSS.

Recommended worker style split:

- shared package:
  - `styles.css`
  - `editor-style-self.css`
  - `editor-style-base.css`
- app repo:
  - `editor-style-extend.css`
  - `editor-style-profile.json`

## Worker integration

1. Serve TinyMCE assets from your Worker assets bucket.
2. Bundle this package into your browser entrypoint.
3. Pass `i18n.lang` and `i18n.t` from your frontend locale store when you initialize the editor.
4. Build and serve a worker-owned `styles.css` from the shared Tailwind asset.
5. Serve worker CSS routes for shared `self`, shared `base`, and worker-local `extend`.
6. Pass those local stylesheet URLs in `contentCssUrls` so the editor iframe and public page stay in sync.

Example `editor-style-profile.json`:

```json
{
  "contentCssUrls": [
    "/styles.css",
    "/editor-style-self.css",
    "/editor-style-base.css",
    "/editor-style-profile.css"
  ],
  "blockFormats": "Paragraph=p;Heading 1=h1;Heading 2=h2;Heading 3=h3;Heading 4=h4;Heading 5=h5;Heading 6=h6;Preformatted=pre",
  "bodyClass": "cms-editor-content",
  "extendCssUrl": "/editor-style-extend.css"
}
```

Suggested worker routes:

- `/editor-lib.js` -> shared repo `dist/index.js`
- `/editor-style-self.css` -> shared repo `editor-style-self.css`
- `/editor-style-base.css` -> shared repo `editor-style-base.css`
- `/editor-style-profile.css` -> your app-local `editor-style-extend.css`
- `/styles.css` -> your worker-built Tailwind output

## Utility buttons

The shared toolbar includes `U1` to `U5`.

- `U1` wraps the selected text with `.utility_1`
- `U2` wraps the selected text with `.utility_2`
- `U3` wraps the selected text with `.utility_3`
- `U4` wraps the selected text with `.utility_4`
- `U5` wraps the selected text with `.utility_5`

This lets each consuming app define its own presentation in `editor-style-extend.css` without changing the shared editor runtime.

## Extraction plan

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).
