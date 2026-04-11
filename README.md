# vietwork-classic-editor

Reusable classic TinyMCE editor shell for Cloudflare Worker SSR projects.

This package extracts the reusable part of the Vietwork CMS editor:

- Visual and inline source editing
- Fullscreen editing
- Search with hit count and next/previous navigation
- Reusable toolbar actions
- Custom inline formatting such as `linebold_yellow`

## What stays outside this package

Keep these in each app repo:

- Worker asset hosting and TinyMCE static file delivery
- Project-specific content CSS
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
- optional `contentCssUrl`
- optional translated labels

## Worker integration

1. Serve TinyMCE assets from your Worker assets bucket.
2. Bundle this package into your browser entrypoint.
3. Pass the TinyMCE global after your app loads the runtime.
4. Pass a content CSS URL owned by the host project.

## Extraction plan

See [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md).
