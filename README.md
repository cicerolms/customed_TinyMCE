# classic-editor-shell

Reusable classic TinyMCE editor shell for Cloudflare Worker SSR projects.

This package provides a reusable classic TinyMCE editing stack for SSR projects:

- Inline visual review/editing plus source editing
- Fullscreen editing
- TinyMCE search and replace through the legacy plugin menu
- Reusable toolbar actions
- Five shared utility toolbar buttons that wrap selection with `utility_1` to `utility_5`
- Custom inline formatting hooks
- JSON-driven style profile support
- Shared Tailwind-authored app CSS asset for consuming workers
- Explicit i18n hooks so consuming apps can switch locale in the frontend

## Package

- Package name: `classic-editor-shell`

## Quick start

Install the shared editor in your app:

```bash
npm install github:your-org/classic-editor-shell
```

Import it in your browser entry:

```ts
import {
  bootstrapClassicEditor,
  dispatchClassicEditorI18n,
} from "classic-editor-shell";

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

## What stays outside this package

Keep these in each app repo:

- Worker asset hosting and TinyMCE static file delivery
- Tailwind build output (`styles.css`)
- Page/review presentation CSS for rendered article content
- Media picker modal routes
- Project i18n dictionaries
- Form templates and persistence wiring

## API

```ts
import {
  bootstrapClassicEditor,
  createClassicEditor,
  dispatchClassicEditorI18n,
} from 'classic-editor-shell';
```

Main exports:

- `createClassicEditor(...)`
- `bootstrapClassicEditor(...)`
- `dispatchClassicEditorI18n(...)`

Package asset exports:

- `classic-editor-shell/styles.css`
- `classic-editor-shell/editor-style-self.css`
- `classic-editor-shell/tailwind.css`
- `classic-editor-shell/tailwind-preset`

Initialize with:

- `target`
- `textarea`
- optional `styleProfile`
- optional `styleProfileUrl`
- optional translated labels
- optional `i18n`

`styleProfile` fields:

- `bodyClass`: classes applied to the inline review fragment container. Default: `cms-editor-content`.
- `blockFormats`: TinyMCE `block_formats` value.

Rule of thumb:

- style the review surface through normal page CSS loaded by your app
- treat shared package CSS as runtime/shared app styling, not as the source of article-body presentation

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

- `window.__i18n` is still used as a fallback when no explicit `i18n` config is provided.
- The documented contract is now `i18n`, `setLocale`, `setI18n`, and `dispatchClassicEditorI18n`.

## Minimal markup

```html
<form id="post-editor-form" method="post">
  <section data-classic-editor>
    <button type="button" data-editor-tab="visual">Visual</button>
    <button type="button" data-editor-tab="code">Code</button>
    <textarea
      id="content"
      name="content"
      data-editor-textarea
    ></textarea>
    <div data-editor-fragment class="cms-editor-content"></div>
  </section>
  <button type="submit">Save</button>
</form>
<div id="save-status"></div>
```

The `[data-editor-fragment]` container is the inline visual review surface. If you omit it, the package creates one next to the textarea automatically.

`bootstrapClassicEditor()` also auto-runs on page load when `[data-classic-editor]` is present, so a host app can either call it explicitly or rely on the built-in auto-boot path.

## Tailwind integration

The shared repo now owns a Tailwind-authored CSS asset:

- `assets/tailwind.css`: shared app/source stylesheet
- `tailwind.preset.cjs`: shared theme tokens for consuming Tailwind builds
- `styles.css`: compiled shared output for immediate reuse

Recommended consuming-worker flow:

1. Import or point your worker Tailwind build at the shared `assets/tailwind.css`.
2. Build your worker-owned `styles.css` during deploy.
3. Serve that built `styles.css` locally from the worker.
4. Link public pages to `styles.css` and your own article/review CSS.
5. Style the inline review fragment with normal page selectors such as `.cms-editor-content`.
6. Keep reusable shared app CSS in the package and keep article-body/editor presentation in the worker repo.
7. Use the shared `U1` to `U5` toolbar buttons to apply `.utility_1` to `.utility_5`, then style those classes in your app CSS.

Recommended worker style split:

- shared package:
  - `styles.css`
- app repo:
  - article/review presentation CSS
  - optional `editor-style-profile.json` for `blockFormats` and fragment classes

## Worker integration

1. Serve TinyMCE assets from your Worker assets bucket.
2. Bundle this package into your browser entrypoint.
3. Pass `i18n.lang` and `i18n.t` from your frontend locale store when you initialize the editor.
4. Build and serve a worker-owned `styles.css` from the shared Tailwind asset.
5. Load your normal article/review CSS on the page so the inline fragment renders with production-like styles.
6. If you keep `styleProfileUrl`, use it for `blockFormats` and fragment classes, not for iframe stylesheet loading.

Example `editor-style-profile.json`:

```json
{
  "blockFormats": "Paragraph=p;Heading 1=h1;Heading 2=h2;Heading 3=h3;Heading 4=h4;Heading 5=h5;Heading 6=h6;Preformatted=pre",
  "bodyClass": "cms-editor-content article-body"
}
```

Suggested worker routes:

- `/editor-lib.js` -> shared repo `dist/index.js`
- `/styles.css` -> your worker-built Tailwind output

The important integration point is the inline fragment class hook, not an iframe stylesheet list. The package renders HTML directly into the page, so the review surface picks up whatever CSS your app already ships for `.cms-editor-content` or your custom `bodyClass` value.

## Utility buttons

The shared toolbar includes `U1` to `U5`.

- `U1` wraps the selected text with `.utility_1`
- `U2` wraps the selected text with `.utility_2`
- `U3` wraps the selected text with `.utility_3`
- `U4` wraps the selected text with `.utility_4`
- `U5` wraps the selected text with `.utility_5`

This lets each consuming app define its own presentation in normal page CSS without changing the shared editor runtime.

## Extraction plan

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).
