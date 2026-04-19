const JSON_HEADERS = { "content-type": "application/json; charset=utf-8" };
const HTML_HEADERS = { "content-type": "text/html; charset=utf-8" };

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

function pageShell({ title = "", content = "" } = {}) {
  const safeTitle = escapeHtml(String(title || ""));
  const safeContent = escapeHtml(String(content || ""));
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>TinyMCE Save Test</title>
    <link rel="stylesheet" href="/assets/editor-style.css" />
  </head>
  <body>
    <main class="page-shell">
      <div class="editor-card">
        <h1>Test TinyMCE Editor</h1>
        <p class="intro">Edit content below and save to D1.</p>

        <form id="post-editor-form" data-classic-editor>
          <div class="classic-editor-fields">
            <label for="post-title">Title</label>
            <input id="post-title" name="post-title" class="title-input" value="${safeTitle}" />

            <label for="editor-visual">Content</label>
            <textarea id="editor-visual" name="editor-visual" data-editor-visual rows="16">${safeContent}</textarea>

            <textarea
              id="editor-code"
              name="editor-code"
              data-editor-code
              hidden
              rows="16"
            ></textarea>

            <textarea
              id="editor-submit"
              name="editor-submit"
              data-editor-submit-field
              hidden
              rows="1"
            ></textarea>
          </div>

          <input id="initial-title" type="hidden" value="${safeTitle}" />
          <textarea id="initial-content" hidden>${safeContent}</textarea>

          <div class="editor-actions">
            <button type="submit" class="btn">Save</button>
            <button type="button" id="refresh" class="btn secondary">Clear</button>
          </div>
        </form>
      </div>

      <section class="status">
        <h2>Save Result</h2>
        <pre id="save-status"></pre>
      </section>
    </main>

    <script src="https://cdn.jsdelivr.net/npm/tinymce@7.8.0/tinymce.min.js" referrerpolicy="origin"></script>
    <script type="module" src="/assets/editor-client.js"></script>
  </body>
</html>`;
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
        const row = idParam ? await fetchPostById(env, Number(idParam)) : await fetchLatestPost(env);
        return htmlResponse(pageShell({
          title: row?.title || "",
          content: row?.content || "",
        }));
      }

      if (pathname === "/save" && request.method === "POST") {
        const payload = await parsePayload(request);
        if (!payload) {
          return jsonResponse({ ok: false, error: "invalid-json" }, 400);
        }

        const title = pickPostedValue(payload, ["title", "post-title", "name"]);
        const content = pickPostedValue(payload, ["content", "editor-submit", "editor-visual"]);

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
        const row = idParam ? await fetchPostById(env, Number(idParam)) : await fetchLatestPost(env);
        if (!row) {
          return jsonResponse({ ok: false, error: "not-found" }, 404);
        }
        return jsonResponse({ ok: true, post: row });
      }

      if (pathname === "/assets" || pathname.startsWith("/assets/") || pathname === "/favicon.ico") {
        if (env.ASSETS) {
          return env.ASSETS.fetch(request);
        }
      }

      return htmlResponse("Not found", 404);
    } catch (error) {
      console.error("test_tinymce.fetch error:", error);
      return jsonResponse({ ok: false, error: String(error) }, 500);
    }
  },
};
