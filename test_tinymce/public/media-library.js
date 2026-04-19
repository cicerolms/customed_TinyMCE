const MODAL_SELECTOR = '#modal-backdrop';

function getModalBackdrop() {
  return document.querySelector(MODAL_SELECTOR);
}

function closeMediaModal() {
  const backdrop = getModalBackdrop();
  if (!backdrop) return;
  backdrop.classList.add('hidden');
  backdrop.innerHTML = '';
  backdrop.setAttribute('aria-hidden', 'true');
}

async function openMediaModal(url) {
  if (!url) return;
  const backdrop = getModalBackdrop();
  if (!backdrop) return;

  const response = await fetch(url, {
    headers: { 'x-requested-with': 'fetch' },
    cache: 'no-store',
  });
  if (!response.ok) {
    return;
  }

  backdrop.innerHTML = await response.text();
  backdrop.classList.remove('hidden');
  backdrop.setAttribute('aria-hidden', 'false');

  if (window.htmx?.process) {
    window.htmx.process(backdrop);
  }

  const searchInput = backdrop.querySelector('input[name="keyword"]');
  if (searchInput instanceof HTMLInputElement) {
    searchInput.focus();
    searchInput.select();
  }
}

function bindMediaInsert(event) {
  const button = event.target instanceof Element ? event.target.closest('[data-editor-media-insert]') : null;
  if (!(button instanceof HTMLElement)) return;

  event.preventDefault();
  window.dispatchEvent(new CustomEvent('test-tinymce:media-insert', {
    detail: { dataset: { ...button.dataset } },
  }));
  closeMediaModal();
}

function bindMediaOpen(event) {
  const opener = event.target instanceof Element ? event.target.closest('[data-media-modal-open]') : null;
  if (!(opener instanceof HTMLElement)) return;

  event.preventDefault();
  openMediaModal(opener.getAttribute('data-media-modal-url') || '').catch(() => null);
}

function bindMediaClose(event) {
  const closeButton = event.target instanceof Element ? event.target.closest('[data-modal-close]') : null;
  const backdrop = event.target instanceof Element ? event.target.closest(MODAL_SELECTOR) : null;
  if (!closeButton && !backdrop) return;
  event.preventDefault();
  closeMediaModal();
}

document.addEventListener('click', (event) => {
  bindMediaOpen(event);
  bindMediaInsert(event);
  bindMediaClose(event);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeMediaModal();
  }
});
