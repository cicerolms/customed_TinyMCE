import { createClassicEditor, dispatchClassicEditorI18n } from "classic-editor-shell";

async function boot() {
  const root = document.querySelector("[data-classic-editor]");
  if (!(root instanceof HTMLElement)) return;

  const textarea = root.querySelector("[data-editor-textarea]");
  if (!(textarea instanceof HTMLTextAreaElement)) return;

  const editor = await createClassicEditor({
    target: root,
    textarea,
    assetBaseUrl: "/assets",
    styleProfileUrl: "/editor-style-profile.json",
    i18n: {
      lang: "ja",
      t: (key, fallback) => fallback || key,
    },
  });

  const localeSelect = document.querySelector("[data-editor-locale]");
  localeSelect?.addEventListener("change", (event) => {
    const nextLocale = (event.target as HTMLSelectElement).value;
    dispatchClassicEditorI18n({ lang: nextLocale });
  });

  const previewButton = document.querySelector("[data-editor-preview]");
  previewButton?.addEventListener("click", () => {
    editor.syncToTextarea();
    window.open(`data:text/html,${encodeURIComponent(textarea.value)}`, "_blank", "noopener");
  });
}

void boot();
