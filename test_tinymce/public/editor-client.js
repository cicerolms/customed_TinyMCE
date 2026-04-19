import { createClassicEditor } from './editor-lib.js';

function getElement(id) {
  return document.getElementById(id);
}

function escapeText(value) {
  return String(value || '');
}

function resolvePayload(formData) {
  const payload = {};
  for (const [key, value] of formData.entries()) {
    payload[key] = value;
  }
  return payload;
}

async function saveContent(form, statusNode) {
  const formData = new FormData(form);
  const payload = resolvePayload(formData);
  payload.content = payload['editor-submit'] || '';
  payload.title = payload['post-title'] || payload['title'] || '';

  const response = await fetch('/save', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const responseBody = await response.json().catch(() => ({}));

  if (!response.ok || !responseBody.ok) {
    statusNode.textContent = `Save failed: ${JSON.stringify(responseBody)}`;
    return;
  }

  statusNode.textContent = `Saved at ${new Date().toISOString()}\npostId=${responseBody.id}\ncontent=${escapeText(payload.content).slice(0, 250)}`;
}

async function initEditor() {
  const root = document.querySelector('[data-classic-editor]');
  if (!(root instanceof HTMLElement)) return;

  const visualTextarea = root.querySelector('[data-editor-visual]');
  const codeTextarea = root.querySelector('[data-editor-code]');
  const submitField = root.querySelector('[data-editor-submit-field]');
  const initialContent = getElement('initial-content');
  const form = document.getElementById('post-editor-form');
  const statusNode = getElement('save-status');
  const refreshButton = getElement('refresh');

  if (
    !(visualTextarea instanceof HTMLTextAreaElement) ||
    !(codeTextarea instanceof HTMLTextAreaElement) ||
    !(submitField instanceof HTMLTextAreaElement) ||
    !(form instanceof HTMLFormElement) ||
    !(statusNode instanceof HTMLElement)
  ) {
    return;
  }

  if (initialContent instanceof HTMLTextAreaElement && !visualTextarea.value) {
    visualTextarea.value = initialContent.value || '';
  }

  submitField.value = visualTextarea.value || '';
  const tiny = window.tinymce;
  if (!tiny) {
    statusNode.textContent = 'TinyMCE failed to load.';
    return;
  }

  await createClassicEditor({
    target: root,
    textarea: visualTextarea,
    codeTextarea: codeTextarea,
    submitField,
    tinyMceGlobal: tiny,
    tinymceBaseUrl: '/assets/vendor/tinymce',
    styleProfileUrl: '/assets/editor-style-profile.json',
    labels: {
      source: 'Source',
      yellowHighlight: 'Yellow Highlight',
      searchPlaceholder: 'Search text',
      searchPrev: 'Prev',
      searchNext: 'Next',
      noResults: 'No matches',
    },
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    await saveContent(form, statusNode);
  });

  if (refreshButton) {
    refreshButton.addEventListener('click', () => {
      if (window.confirm('Clear editor content?')) {
        visualTextarea.value = '';
        codeTextarea.value = '';
        submitField.value = '';
        statusNode.textContent = 'Editor cleared.';
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initEditor().catch((error) => {
    const node = getElement('save-status');
    if (node) {
      node.textContent = `Editor init failed: ${String(error)}`;
    }
    console.error(error);
  });
});
