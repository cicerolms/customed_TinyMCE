# AGENTS.md

## Project Workflow Notes

- This project uses a Cloudflare Worker SSR architecture.
- Keep the visual style business professional.
- After any CSS change, compile the stylesheet output before testing or deploying.
- After making a commit for completed work, push it to the remote branch.

## Frontend Rules

- Use Tailwind for styling.
- Use HTMX for frontend dynamic UI changes.
- Never use inline CSS in HTML templates.
- Load styling through imported `styles.css`.
- Keep all static assets in the `assets` folder.
- All JavaScript must live in ES module files.
- Never place inline JavaScript inside HTML.
- Never place HTML-embedded JavaScript handlers or script blocks in templates.
- For CMS rich-text editing, reuse the shared TinyMCE-based editor and extend that implementation instead of adding a different editor stack.
- The reusable TinyMCE GitHub repo is `cicerolms/customed_TinyMCE`.
- Load HTMX once in the shared base shell instead of repeating HTMX script tags per CMS screen.
- CMS inventory and list pages must use the shared HTMX on-typing search pattern: one GET search form, an input with `hx-trigger="input changed delay:300ms, search"`, server-rendered partial results, and `hx-push-url="true"` so filter state stays in the URL.

## Template Rules

- Use Nunjucks templates as the SSR standard.
- Keep Nunjucks source templates under `assets/templates/`.
- Maintain Nunjucks syntax in templates and partials.
- Prepare `base.njk`, `nav-bar`, and `footer` as the main shared template parts.
- Use precompiled Nunjucks templates for dynamic template delivery when possible.
- Keep only repo-specific concerns in each codebase: template loading, asset binding, route mapping, i18n payload assembly, site-specific transforms, and deployment.
- Keep templates bundled or loaded from trusted local assets rather than fetching arbitrary remote templates per request.
- Keep HTML structure in Nunjucks templates and partials instead of composing inline HTML strings in runtime code.
- For browser-side dynamic UI, do not build HTML with string templates; use DOM APIs or server-rendered partial swaps.

## Internationalization

- Frontend must support multiple languages: `ja`, `vi`, and `en`.
- Default language should follow the browser language when no explicit user choice exists.
- Allow users to choose the language explicitly.
- Persist the chosen language in cookies.
- Use server-side i18n for template labels.
- Resolve labels from i18n JSON by ID during rendering.
- Render dynamic content with the language-specific template payload on the server.

## Architecture Notes

- Treat this repository as a Cloudflare Worker SSR project unless the codebase is updated to document a new architecture.
- For multi-language data in D1, use a main table plus a linked translation table.
- Add new architecture notes here only when they are confirmed by the implemented code.

## Testing And Verification

- After code changes, run the smallest relevant verification available in the current project.
- Deploy every time code changes with global `wrangler deploy`.
- Use the global `wrangler` CLI instead of project-local wrappers such as `npm run deploy`, unless the repo explicitly documents an exception.
- Use the global `playwright` CLI for browser verification when Playwright is needed.
- Prefer the repo-local Python virtualenv when present. Use `.venv/bin/python` and `.venv/bin/pip` instead of system `python`/`pip`.
- After any Tailwind or CSS source change, ensure the compiled CSS output is regenerated.
- If a required build or verification command is not defined in the repo yet, report that clearly instead of guessing.

## JavaScript REPL (Node)

- Use `js_repl` for Node-backed JavaScript with top-level await in a persistent kernel.
- `js_repl` is a freeform/custom tool. Direct `js_repl` calls must send raw JavaScript tool input (optionally with first-line `// codex-js-repl: timeout_ms=15000`). Do not wrap code in JSON, quotes, or markdown code fences.
- Helpers: `codex.cwd`, `codex.homeDir`, `codex.tmpDir`, `codex.tool(name, args?)`, and `codex.emitImage(imageLike)`.
