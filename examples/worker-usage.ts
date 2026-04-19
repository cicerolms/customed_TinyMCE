import { createClassicEditor } from 'classic-editor-shell';

async function boot() {
  const root = document.querySelector('[data-classic-editor]');
  if (!(root instanceof HTMLElement)) return;

  const textarea = root.querySelector('[data-editor-visual]');
  const codeTextarea = root.querySelector('[data-editor-code]');
  const submitField = root.querySelector('[data-editor-submit-field]');

  if (!(textarea instanceof HTMLTextAreaElement) || !(codeTextarea instanceof HTMLTextAreaElement) || !(submitField instanceof HTMLTextAreaElement)) {
    return;
  }

  const tinymce = (window as any).tinymce;
  if (!tinymce) return;

  await createClassicEditor({
    target: root,
    textarea,
    codeTextarea,
    submitField,
    tinyMceGlobal: tinymce,
    tinymceBaseUrl: '/assets/vendor/tinymce',
    styleProfileUrl: '/assets/editor-classic-style-profile.json',
    labels: {
      source: 'Source',
      yellowHighlight: 'Yellow Highlight',
    },
  });
}

boot().catch(() => null);
