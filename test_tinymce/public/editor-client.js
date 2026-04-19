let createClassicEditor;

try {
  ({ createClassicEditor } = await import("/editor-lib.js"));
} catch (error) {
  console.error("Failed to load shared editor package", error);
}

function htmlFromMedia(dataset) {
  const url = String(dataset.mediaUrl || "").trim();
  if (!url) return "";

  const title = String(dataset.mediaTitle || dataset.mediaFilename || "media").trim();
  const alt = String(dataset.mediaAlt || title).trim();
  const mimeType = String(dataset.mediaMime || "").trim();

  const escapedUrl = url.replace(/"/g, "&quot;");
  const escapedTitle = title.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[char] || char));
  const escapedAlt = alt.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char] || char));

  if (mimeType.startsWith("image/")) {
    return `<img src="${escapedUrl}" alt="${escapedAlt}" />`;
  }
  return `<a href="${escapedUrl}">${escapedTitle}</a>`;
}

function getSubmitPayload(form) {
  const formData = new FormData(form);
  const payload = {};
  for (const [key, value] of formData.entries()) {
    payload[key] = String(value || "");
  }
  return payload;
}

async function saveContent(form, statusNode) {
  const payload = getSubmitPayload(form);
  payload.content = payload.content || payload["content-visual"] || payload["content-code"] || payload["content-editor-code"] || "";
  if (!payload.content) {
    statusNode.textContent = "Save blocked: content is empty.";
    return;
  }

  const response = await fetch("/save", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  const responseBody = await response.json().catch(() => ({}));
  if (!response.ok || !responseBody.ok) {
    statusNode.textContent = `Save failed: ${JSON.stringify(responseBody)}`;
    return;
  }

  statusNode.textContent = `Saved at ${new Date().toISOString()}\npostId=${responseBody.id}\nCreatedAt=${responseBody.createdAt}`;
}

async function reloadLatestPost(form, statusNode) {
  const response = await fetch("/confirm", { cache: "no-store" });
  const responseBody = await response.json().catch(() => ({}));
  if (!response.ok || !responseBody.ok || !responseBody.post) {
    statusNode.textContent = `Reload failed: ${JSON.stringify(responseBody)}`;
    return;
  }

  const post = responseBody.post;
  const titleField = form.querySelector("#post-title");
  if (titleField instanceof HTMLInputElement) {
    titleField.value = post.title || "";
  }
  const textarea = form.querySelector("[data-editor-visual], [data-editor-textarea]");
  const codeTextarea = form.querySelector("[data-editor-code]");
  const submitField = form.querySelector("[data-editor-submit-field]");
  if (
    !(textarea instanceof HTMLTextAreaElement)
    || !(codeTextarea instanceof HTMLTextAreaElement)
    || !(submitField instanceof HTMLTextAreaElement)
  ) {
    return;
  }
  textarea.value = post.content || "";
  codeTextarea.value = post.content || "";
  submitField.value = post.content || "";
  statusNode.textContent = `Reloaded latest post id=${post.id}`;
}

function showToast(message, statusNode) {
  const toast = document.getElementById("status-toast");
  if (toast instanceof HTMLElement) {
    toast.textContent = message;
  }
  if (statusNode) {
    statusNode.textContent = message;
  }
}

async function initClassicEditor() {
  const root = document.querySelector("[data-classic-editor]");
  if (!(root instanceof HTMLElement)) return;

  const statusNode = document.getElementById("save-status");
  if (!createClassicEditor) {
    if (statusNode) {
      statusNode.textContent = "Editor bootstrap failed: unable to load shared editor bundle.";
    }
    return;
  }

  const textarea = root.querySelector("[data-editor-visual], [data-editor-textarea]");
  const codeTextarea = root.querySelector("[data-editor-code]");
  const submitField = root.querySelector("[data-editor-submit-field]");
  const visualTab = root.querySelector('[data-editor-tab="visual"]');
  const codeTab = root.querySelector('[data-editor-tab="code"]');
  const form = document.getElementById("post-editor-form");
  const refreshButton = document.getElementById("refresh");
  const confirmButton = document.getElementById("confirm-latest");
  const previewButton = document.getElementById("open-preview");
  if (
    !(textarea instanceof HTMLTextAreaElement)
    || !(codeTextarea instanceof HTMLTextAreaElement)
    || !(submitField instanceof HTMLTextAreaElement)
  ) return;

  if (!window.tinymce) return;

  const editor = await createClassicEditor({
    target: root,
    textarea,
    codeTextarea,
    submitField,
    tinyMceGlobal: window.tinymce,
    tinymceBaseUrl: "https://cdn.jsdelivr.net/npm/tinymce@7.8.0",
    tinymceVersion: "7.8.0",
    styleProfileUrl: "/editor-style-profile.json",
    labels: {
      source: "Source",
      yellowHighlight: "Yellow Highlight",
      searchPlaceholder: "Search text",
      searchPrev: "Prev",
      searchNext: "Next",
      noResults: "No results",
    },
  });

  const selectMode = (mode) => editor.switchMode(mode);

  visualTab?.addEventListener("click", (event) => {
    event.preventDefault();
    selectMode("visual");
  });
  codeTab?.addEventListener("click", (event) => {
    event.preventDefault();
    selectMode("code");
  });

  if (visualTab) {
    visualTab.setAttribute("aria-pressed", "true");
  }
  if (codeTab) {
    codeTab.setAttribute("aria-pressed", "false");
  }
  selectMode("visual");

  window.__testTinymceInsertMedia = (insertDataset) => {
    const html = htmlFromMedia(insertDataset || {});
    if (!html) return;
    editor.insertHtml(html);
  };

  form?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!statusNode || !(form instanceof HTMLFormElement)) return;
    await saveContent(form, statusNode);
  });

  refreshButton?.addEventListener("click", () => {
    if (!window.confirm("Clear editor content?")) {
      return;
    }
    textarea.value = "";
    codeTextarea.value = "";
    submitField.value = "";
    if (statusNode) {
      statusNode.textContent = "Editor cleared.";
    }
  });

  confirmButton?.addEventListener("click", async () => {
    if (!statusNode) {
      return;
    }
    await reloadLatestPost(form, statusNode);
  });

  previewButton?.addEventListener("click", () => {
    const htmlPayload = textarea.value.trim() || codeTextarea.value.trim() || "";
    if (!htmlPayload) {
      showToast("Preview is empty.", statusNode);
      return;
    }
    const encoded = encodeURIComponent(htmlPayload);
    window.open(`data:text/html,${encoded}`, "_blank", "noopener");
    showToast("Opening preview in a new tab.", statusNode);
  });
}

function bindMediaInsertHandler() {
  window.addEventListener("test-tinymce:media-insert", (event) => {
    if (window.__testTinymceInsertMedia && event?.detail?.dataset) {
      window.__testTinymceInsertMedia(event.detail.dataset);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", async () => {
    await initClassicEditor();
    bindMediaInsertHandler();
  });
} else {
  initClassicEditor();
  bindMediaInsertHandler();
}
