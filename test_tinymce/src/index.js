const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };
const HTML_HEADERS = { "content-type": "text/html; charset=utf-8" };
const JS_HEADERS = { "content-type": "text/javascript; charset=utf-8" };

const DEFAULT_EDITOR_LIB_URL = "https://raw.githubusercontent.com/cicerolms/customed_TinyMCE/refs/heads/main/dist/index.js";

const EDITOR_MEDIA_LIBRARY = [
  {
    id: 1,
    title: "Vietwork sample image 01",
    fileName: "hero-lake.jpg",
    mimeType: "image/jpeg",
    uploadedAtLabel: "2026-03-28 10:00",
    previewUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80",
    insertUrl: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80",
    altText: "Lake scene",
  },
  {
    id: 2,
    title: "Vietwork sample image 02",
    fileName: "editor-layout.png",
    mimeType: "image/png",
    uploadedAtLabel: "2026-03-28 10:10",
    previewUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=800&q=80",
    insertUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1600&q=80",
    altText: "Team working layout",
  },
  {
    id: 3,
    title: "Vietwork sample pdf",
    fileName: "reference-guide.pdf",
    mimeType: "application/pdf",
    uploadedAtLabel: "2026-03-29 09:20",
    previewUrl: "",
    insertUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    altText: "Reference guide",
  },
];

function jsonResponse(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: JSON_HEADERS,
  });
}

function htmlResponse(content, status = 200) {
  return new Response(content, {
    status,
    headers: HTML_HEADERS,
  });
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function ensureD1Binding(env) {
  if (!env?.DB) {
    throw new Error("D1 binding DB is missing");
  }
}

async function parsePayload(request) {
  const contentType = request.headers.get("content-type") || "";
  const bodyText = await request.text();
  if (contentType.includes("application/json")) {
    try {
      return JSON.parse(bodyText || "{}");
    } catch (_error) {
      return null;
    }
  }

  const params = new URLSearchParams(bodyText);
  const payload = {};
  for (const [key, value] of params.entries()) {
    payload[key] = value;
  }
  return payload;
}

function pickPostedValue(payload, keys) {
  for (const key of keys) {
    const value = payload[key];
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return "";
}

function normalizeKeyword(value) {
  return String(value || "").trim().toLowerCase();
}

async function fetchSharedEditorLib(env) {
  const editorLibUrl = env?.CICEROLMS_EDITOR_LIB_URL || DEFAULT_EDITOR_LIB_URL;
  if (!editorLibUrl) {
    return jsonResponse({ ok: false, error: "missing-editor-lib-url" }, 500);
  }

  const token = env?.CICEROLMS_GH_TOKEN;
  const headers = {
    "User-Agent": "test-tinymce-editor",
    Accept: "application/octet-stream",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(editorLibUrl, {
    headers,
    cache: "no-store",
  });
  if (!response.ok) {
    if (!token && response.status === 404) {
      return jsonResponse({ ok: false, error: `failed-editor-lib-fetch:${response.status} (check shared URL branch/path or visibility)` }, response.status);
    }
    if (!token && response.status === 403) {
      return jsonResponse({ ok: false, error: `failed-editor-lib-fetch:${response.status} (access denied, ensure URL is public or set CICEROLMS_GH_TOKEN)` }, response.status);
    }
    return jsonResponse({ ok: false, error: `failed-editor-lib-fetch:${response.status}` }, response.status);
  }

  const code = await response.text();
  return new Response(code, {
    status: 200,
    headers: JS_HEADERS,
  });
}

function mediaPickerFilterItems(keyword) {
  if (!keyword) {
    return EDITOR_MEDIA_LIBRARY;
  }
  return EDITOR_MEDIA_LIBRARY.filter((item) => {
    const haystack = `${item.title} ${item.fileName} ${item.mimeType} ${item.altText || ""}`.toLowerCase();
    return haystack.includes(keyword);
  });
}

function mediaPickerItemResultHtml(item) {
  return `
    <article class="media-picker-card">
      ${item.previewUrl
    ? `<div class="media-picker-preview"><img src="${escapeHtml(item.previewUrl)}" alt="${escapeHtml(item.altText || item.title)}" loading="lazy" /></div>`
    : `<div class="media-picker-preview-fallback"><span>${escapeHtml(item.mimeType)}</span></div>`
  }
      <div class="media-picker-meta">
        <h4>${escapeHtml(item.title)}</h4>
        <p>${escapeHtml(item.fileName)}</p>
        <p>${escapeHtml(item.mimeType)}</p>
        <p>${escapeHtml(item.uploadedAtLabel || "-")}</p>
      </div>
      <button
        type="button"
        class="primary-btn"
        data-editor-media-insert
        data-media-url="${escapeHtml(item.insertUrl)}"
        data-media-title="${escapeHtml(item.title)}"
        data-media-filename="${escapeHtml(item.fileName)}"
        data-media-mime="${escapeHtml(item.mimeType)}"
        data-media-alt="${escapeHtml(item.altText || item.title)}"
      >Insert</button>
    </article>
  `;
}

function renderMediaPickerResultsHtml(request) {
  const url = new URL(request.url);
  const keyword = normalizeKeyword(url.searchParams.get("keyword"));
  const items = mediaPickerFilterItems(keyword);
  if (!items.length) {
    return `<p class="modal-message">No media files found.</p>`;
  }

  return `
    <div class="media-picker-grid">
      ${items.map((item) => mediaPickerItemResultHtml(item)).join("")}
    </div>
  `;
}

function renderMediaPickerModal(request) {
  const url = new URL(request.url);
  const keyword = (url.searchParams.get("keyword") || "").trim();
  return `
    <div class="modal-layer">
      <article class="modal-card media-picker-modal-card">
        <header class="modal-head">
          <h3>Add Media</h3>
          <button type="button" class="secondary-btn" data-modal-close>Cancel</button>
        </header>

        <form
          id="editor-media-picker-search-form"
          class="search-form"
          method="get"
          action="/cms/editor/media-picker-modal"
          hx-get="/api/cms/editor/media-picker"
          hx-target="#editor-media-picker-results"
          hx-swap="innerHTML"
        >
          <label class="search-label">
            Search media
            <input
              type="text"
              name="keyword"
              value="${escapeHtml(keyword)}"
              placeholder="Search media"
              hx-get="/api/cms/editor/media-picker"
              hx-trigger="input changed delay:300ms, search"
              hx-target="#editor-media-picker-results"
              hx-swap="innerHTML"
              hx-include="#editor-media-picker-search-form"
            />
          </label>
        </form>

        <div id="editor-media-picker-results">
          ${renderMediaPickerResultsHtml(request)}
        </div>
      </article>
    </div>
  `;
}

function renderClassicEditorHtml(initialValue) {
  const safeContent = escapeHtml(String(initialValue || "").replace(/<\/textarea/gi, "&lt;/textarea"));
  return `
    <div
      class="classic-editor legacy-wp-editor"
      data-classic-editor
      data-editor-id="content-editor"
      data-editor-field-name="content"
      data-editor-media-modal-url="/cms/editor/media-picker-modal"
    >
      <div id="wp-content-editor-wrap" class="wp-core-ui wp-editor-wrap tmce-active">
        <div id="wp-content-editor-editor-tools" class="wp-editor-tools hide-if-no-js">
          <div id="wp-content-editor-media-buttons" class="wp-media-buttons">
            <button
              type="button"
              class="button insert-media add_media"
              data-media-modal-open
              data-media-modal-url="/cms/editor/media-picker-modal"
            >
              Add Media
            </button>
          </div>
          <div class="wp-editor-tabs">
            <button
              type="button"
              id="content-editor-tmce"
              class="wp-switch-editor switch-tmce"
              data-editor-tab="visual"
              aria-pressed="true"
            >Visual</button>
            <button
              type="button"
              id="content-editor-html"
              class="wp-switch-editor switch-html"
              data-editor-tab="code"
              aria-pressed="false"
            >Text</button>
          </div>
        </div>

        <div id="wp-content-editor-editor-container" class="wp-editor-container">
          <div class="classic-editor-panel">
          <textarea
            id="content-editor"
            name="content-visual"
            class="wp-editor-area"
            rows="20"
            cols="40"
            autocomplete="off"
            data-editor-visual
            data-editor-textarea
          >${safeContent}</textarea>
        </div>
        <textarea
          id="content-editor-code"
          name="content-code"
          class="classic-editor-panel hidden"
          autocomplete="off"
          rows="20"
          cols="40"
          data-editor-code
        ></textarea>
        <textarea
          id="content-editor-submit"
          name="content"
          class="classic-editor-panel hidden"
          data-editor-submit-field
        ></textarea>
        </div>
      </div>
    </div>
  </div>
`;
}

function pageShell({ title = "", content = "" } = {}) {
  const safeTitle = escapeHtml(String(title || ""));
  const safeContent = String(content || "");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>TinyMCE Save Test</title>
    <link rel="stylesheet" href="/editor-style.css" />
    <script defer src="https://unpkg.com/htmx.org@2.0.6/dist/htmx.min.js"></script>
  </head>
  <body>
    <main class="page-shell">
      <section class="editor-card">
        <h1>TinyMCE Editor</h1>
        <p class="intro">This route mirrors the Vietwork CMS editor wrapper and media insert flow.</p>

        <form id="post-editor-form" method="post" action="/save">
          <div class="classic-editor-fields">
            <label for="post-title">Title</label>
            <input id="post-title" name="post-title" class="title-input" value="${safeTitle}" />

            <label for="content-editor">Content</label>
            ${renderClassicEditorHtml(safeContent)}
          </div>

          <input id="initial-title" type="hidden" value="${safeTitle}" />
          <textarea id="initial-content" hidden>${escapeHtml(safeContent)}</textarea>

          <div class="editor-actions">
            <button type="submit" class="btn primary-btn">Save</button>
            <button type="button" id="refresh" class="btn secondary-btn">Clear</button>
          </div>
        </form>
      </section>

      <section class="status">
        <h2>Save Result</h2>
        <pre id="save-status"></pre>
      </section>
    </main>

    <div id="modal-backdrop" class="modal-backdrop hidden" aria-hidden="true"></div>

    <script src="https://cdn.jsdelivr.net/npm/tinymce@7.8.0/tinymce.min.js" referrerpolicy="origin"></script>
    <script type="module" src="/media-library.js"></script>
    <script type="module" src="/editor-client.js"></script>
  </body>
</html>`;
}

async function insertPost(env, title, content) {
  ensureD1Binding(env);
  const createdAt = new Date().toISOString();
  const result = await env.DB.prepare(
    "INSERT INTO posts (title, content, created_at) VALUES (?1, ?2, ?3)",
  )
    .bind(title, content, createdAt)
    .run();

  return {
    id: result.meta.last_row_id,
    createdAt,
  };
}

async function fetchPostById(env, id) {
  ensureD1Binding(env);
  const row = await env.DB.prepare(
    "SELECT id, title, content, created_at FROM posts WHERE id = ?1 LIMIT 1",
  )
    .bind(id)
    .first();
  return row || null;
}

async function fetchLatestPost(env) {
  ensureD1Binding(env);
  const row = await env.DB.prepare(
    "SELECT id, title, content, created_at FROM posts ORDER BY id DESC LIMIT 1",
  ).first();
  return row || null;
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url);
      const pathname = url.pathname.replace(/\/+$/, "") || "/";

      if (!env?.ASSETS || !env?.DB) {
        return jsonResponse({
          ok: false,
          error: "worker-missing-bindings",
          detail: "assets or DB binding is not configured",
        }, 500);
      }

      if (pathname === "/") {
        return Response.redirect(new URL("/edit", request.url), 302);
      }

      if (pathname === "/edit") {
        const idParam = url.searchParams.get("id");
        const row = idParam
          ? await fetchPostById(env, Number(idParam))
          : await fetchLatestPost(env);
        return htmlResponse(pageShell({
          title: row?.title || "",
          content: row?.content || "",
        }));
      }

      if (pathname === "/cms/editor/media-picker-modal" && request.method === "GET") {
        return htmlResponse(renderMediaPickerModal(request));
      }

      if (pathname === "/api/cms/editor/media-picker" && request.method === "GET") {
        return htmlResponse(renderMediaPickerResultsHtml(request));
      }

      if (pathname === "/save" && request.method === "POST") {
        const payload = await parsePayload(request);
        if (!payload) {
          return jsonResponse({ ok: false, error: "invalid-json" }, 400);
        }

        const title = pickPostedValue(payload, ["title", "post-title", "name"]);
        const content = pickPostedValue(payload, ["content", "editor-submit", "content-editor-code", "content-editor", "content-visual", "content-html"]);

        if (!content) {
          return jsonResponse({ ok: false, error: "content-required" }, 400);
        }

        const saved = await insertPost(env, title, content);
        return jsonResponse({
          ok: true,
          ...saved,
        });
      }

      if (pathname === "/confirm" && request.method === "GET") {
        const idParam = url.searchParams.get("id");
        const row = idParam
          ? await fetchPostById(env, Number(idParam))
          : await fetchLatestPost(env);
        if (!row) {
          return jsonResponse({ ok: false, error: "not-found" }, 404);
        }
        return jsonResponse({ ok: true, post: row });
      }

      if (pathname === "/editor-lib.js" && request.method === "GET") {
        return fetchSharedEditorLib(env);
      }

      if (pathname === "/assets" || pathname.startsWith("/assets/") || pathname === "/favicon.ico") {
        return env.ASSETS.fetch(request);
      }

      return htmlResponse("Not found", 404);
    } catch (error) {
      console.error("test_tinymce.fetch error:", error);
      return jsonResponse({ ok: false, error: String(error) }, 500);
    }
  },
};
