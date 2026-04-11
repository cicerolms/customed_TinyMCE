export type ClassicEditorLabels = {
  source?: string;
  yellowHighlight?: string;
  fullscreenEnter?: string;
  fullscreenExit?: string;
  searchPlaceholder?: string;
  searchPrev?: string;
  searchNext?: string;
  noResults?: string;
};

export type ClassicEditorConfig = {
  target: HTMLElement;
  textarea: HTMLTextAreaElement;
  codeTextarea: HTMLTextAreaElement;
  submitField: HTMLTextAreaElement;
  tinyMceGlobal: any;
  tinymceBaseUrl: string;
  tinymceVersion?: string;
  contentCssUrl?: string;
  labels?: ClassicEditorLabels;
  mediaInsert?: (html: string) => void;
};

export type ClassicEditorInstance = {
  switchMode(nextMode: 'visual' | 'code'): void;
  insertHtml(html: string): void;
  destroy(): Promise<void>;
};

function label(labels: ClassicEditorLabels | undefined, key: keyof ClassicEditorLabels, fallback: string): string {
  return labels?.[key] || fallback;
}

export async function createClassicEditor(config: ClassicEditorConfig): Promise<ClassicEditorInstance> {
  const {
    target,
    textarea,
    codeTextarea,
    submitField,
    tinyMceGlobal,
    tinymceBaseUrl,
    tinymceVersion = '1',
    contentCssUrl,
    labels,
  } = config;

  let mode: 'visual' | 'code' = 'visual';
  let visualFullscreenActive = false;
  let codeFullscreenActive = false;
  const searchState = { query: '', total: 0, currentIndex: 0 };

  const toolbar = document.createElement('div');
  toolbar.className = 'classic-editor-package-toolbar';
  toolbar.innerHTML = `
    <div class="classic-editor-package-search-host"></div>
  `;
  target.prepend(toolbar);
  const searchHost = toolbar.querySelector('.classic-editor-package-search-host') as HTMLElement;

  const createSearchUi = () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'classic-editor-package-search';
    wrapper.innerHTML = `
      <input type="search" class="classic-editor-package-search-input" autocomplete="off" spellcheck="false" />
      <button type="button" data-direction="prev">${label(labels, 'searchPrev', 'Prev')}</button>
      <span class="classic-editor-package-search-status" aria-live="polite"></span>
      <button type="button" data-direction="next">${label(labels, 'searchNext', 'Next')}</button>
    `;
    return {
      wrapper,
      input: wrapper.querySelector('input') as HTMLInputElement,
      status: wrapper.querySelector('.classic-editor-package-search-status') as HTMLElement,
      prev: wrapper.querySelector('[data-direction="prev"]') as HTMLButtonElement,
      next: wrapper.querySelector('[data-direction="next"]') as HTMLButtonElement,
    };
  };

  const visualSearchUi = createSearchUi();
  const codeSearchUi = createSearchUi();
  searchHost.replaceChildren(codeSearchUi.wrapper);

  const updateStatus = (query: string, total: number, currentIndex: number) => {
    if (!query.trim()) {
      visualSearchUi.status.textContent = '';
      codeSearchUi.status.textContent = '';
      return;
    }
    if (!total) {
      visualSearchUi.status.textContent = label(labels, 'noResults', 'No matches');
      codeSearchUi.status.textContent = label(labels, 'noResults', 'No matches');
      return;
    }
    const text = `${currentIndex} / ${total}`;
    visualSearchUi.status.textContent = text;
    codeSearchUi.status.textContent = text;
  };

  const syncInputs = (value: string, source: HTMLInputElement) => {
    searchState.query = value;
    if (visualSearchUi.input !== source) visualSearchUi.input.value = value;
    if (codeSearchUi.input !== source) codeSearchUi.input.value = value;
  };

  const editorList = await tinyMceGlobal.init({
    target: textarea,
    base_url: tinymceBaseUrl,
    suffix: '.min',
    menubar: true,
    promotion: false,
    branding: false,
    relative_urls: false,
    remove_script_host: false,
    convert_urls: false,
    plugins: 'advlist link lists charmap table fullscreen pagebreak',
    toolbar: 'blocks fontsize bold italic removeformat underline yellowhighlight blockquote bullist numlist alignleft aligncenter alignright link unlink undo redo pastetext charmap pagebreak forecolor table fullscreen inlinecode',
    body_class: 'cms-editor-content',
    content_css: contentCssUrl ? `${contentCssUrl}?v=${tinymceVersion}` : undefined,
    setup(instance: any) {
      instance.formatter.register('lineboldyellow', {
        inline: 'span',
        classes: 'linebold_yellow',
        exact: true,
      });
      instance.ui.registry.addToggleButton('yellowhighlight', {
        text: label(labels, 'yellowHighlight', 'Yellow Highlight'),
        tooltip: label(labels, 'yellowHighlight', 'Yellow Highlight'),
        onAction: () => instance.execCommand('mceToggleFormat', false, 'lineboldyellow'),
        onSetup: (api: any) => {
          const handler = (state: boolean) => api.setActive(state);
          instance.formatter.formatChanged('lineboldyellow', handler);
          return () => instance.formatter.formatChanged('lineboldyellow', handler, true);
        },
      });
      instance.ui.registry.addButton('inlinecode', {
        text: label(labels, 'source', 'Source'),
        tooltip: label(labels, 'source', 'Source'),
        onAction: () => switchMode('code'),
      });
      instance.on('init', () => {
        const header = instance.getContainer()?.querySelector('.tox-editor-header');
        if (header && !header.querySelector('.classic-editor-package-search')) {
          header.appendChild(visualSearchUi.wrapper);
        }
      });
      instance.on('FullscreenStateChanged', (event: any) => {
        visualFullscreenActive = Boolean(event.state);
        document.body.classList.toggle('editor-fullscreen-active', visualFullscreenActive || codeFullscreenActive);
      });
      instance.on('change input undo redo keyup SetContent', () => {
        if (mode !== 'visual') return;
        const html = instance.getContent();
        codeTextarea.value = html;
        submitField.value = html;
      });
    },
  });

  const editor = editorList[0];

  const applyVisualSearch = (step: 'first' | 'next' | 'prev') => {
    const query = searchState.query.trim();
    const doc = editor.getDoc();
    const win = editor.getWin();
    if (!query || !doc?.body || !win) {
      updateStatus('', 0, 0);
      return;
    }
    const total = ((doc.body.innerText || doc.body.textContent || '').toLowerCase().match(new RegExp(query.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    if (!total) {
      updateStatus(query, 0, 0);
      return;
    }
    if (step === 'first') searchState.currentIndex = 1;
    if (step === 'next') searchState.currentIndex = searchState.currentIndex >= total ? 1 : searchState.currentIndex + 1;
    if (step === 'prev') searchState.currentIndex = searchState.currentIndex <= 1 ? total : searchState.currentIndex - 1;
    win.find(query, false, step === 'prev', true, false, false, false);
    updateStatus(query, total, searchState.currentIndex);
  };

  const applyCodeSearch = (step: 'first' | 'next' | 'prev') => {
    const query = searchState.query.trim();
    if (!query) {
      updateStatus('', 0, 0);
      return;
    }
    const matches = Array.from(codeTextarea.value.matchAll(new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')));
    if (!matches.length) {
      updateStatus(query, 0, 0);
      return;
    }
    if (step === 'first') searchState.currentIndex = 1;
    if (step === 'next') searchState.currentIndex = searchState.currentIndex >= matches.length ? 1 : searchState.currentIndex + 1;
    if (step === 'prev') searchState.currentIndex = searchState.currentIndex <= 1 ? matches.length : searchState.currentIndex - 1;
    const active = matches[searchState.currentIndex - 1];
    codeTextarea.setSelectionRange(active.index ?? 0, (active.index ?? 0) + active[0].length);
    updateStatus(query, matches.length, searchState.currentIndex);
  };

  const applySearch = (step: 'first' | 'next' | 'prev' = 'first') => {
    if (mode === 'visual') {
      applyVisualSearch(step);
      return;
    }
    applyCodeSearch(step);
  };

  const bindSearchUi = (ui: ReturnType<typeof createSearchUi>) => {
    ui.input.placeholder = label(labels, 'searchPlaceholder', 'Search editor');
    const sync = () => {
      syncInputs(ui.input.value, ui.input);
      applySearch('first');
    };
    ui.input.addEventListener('input', sync);
    ui.input.addEventListener('change', sync);
    ui.prev.addEventListener('click', () => applySearch('prev'));
    ui.next.addEventListener('click', () => applySearch('next'));
  };

  bindSearchUi(visualSearchUi);
  bindSearchUi(codeSearchUi);

  function switchMode(nextMode: 'visual' | 'code') {
    if (nextMode === mode) return;
    if (nextMode === 'code') {
      codeTextarea.value = editor.getContent();
      submitField.value = codeTextarea.value;
      if (visualFullscreenActive) {
        editor.execCommand('mceFullScreen');
      }
      textarea.closest('.classic-editor-panel')?.classList.add('hidden');
      codeTextarea.closest('.classic-editor-panel')?.classList.remove('hidden');
      searchHost.classList.remove('hidden');
      mode = 'code';
      applySearch('first');
      return;
    }
    if (codeFullscreenActive) {
      codeFullscreenActive = false;
      document.body.classList.toggle('editor-fullscreen-active', visualFullscreenActive);
    }
    editor.setContent(codeTextarea.value || '', { format: 'raw' });
    submitField.value = codeTextarea.value || '';
    codeTextarea.closest('.classic-editor-panel')?.classList.add('hidden');
    textarea.closest('.classic-editor-panel')?.classList.remove('hidden');
    searchHost.classList.add('hidden');
    mode = 'visual';
    applySearch('first');
  }

  return {
    switchMode,
    insertHtml(html: string) {
      if (mode === 'code') {
        const start = codeTextarea.selectionStart ?? codeTextarea.value.length;
        const end = codeTextarea.selectionEnd ?? codeTextarea.value.length;
        codeTextarea.setRangeText(html, start, end, 'end');
        submitField.value = codeTextarea.value;
        return;
      }
      editor.insertContent(html);
      const current = editor.getContent();
      codeTextarea.value = current;
      submitField.value = current;
    },
    async destroy() {
      await editor.remove();
    },
  };
}
