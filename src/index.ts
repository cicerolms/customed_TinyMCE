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

export type EditorStyleProfile = {
  contentCssUrls?: string[];
  inlineCss?: string;
  bodyClass?: string;
  blockFormats?: string;
  contentStyle?: string;
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
  styleProfile?: EditorStyleProfile;
  styleProfileUrl?: string;
  mediaInsert?: (html: string) => void;
};

export type ClassicEditorInstance = {
  switchMode(nextMode: 'visual' | 'code'): void;
  insertHtml(html: string): void;
  destroy(): Promise<void>;
};

const DEFAULT_EDITOR_STYLE_PROFILE: Required<EditorStyleProfile> = {
  bodyClass: 'cms-editor-content',
  blockFormats: 'Paragraph=p;Heading 1=h1;Heading 2=h2;Heading 3=h3;Heading 4=h4;Heading 5=h5;Heading 6=h6;Preformatted=pre',
  contentCssUrls: [],
  inlineCss: `body.cms-editor-content {\n  box-sizing: border-box;\n  max-width: 100%;\n  margin: 0 auto;\n  padding: 12px 14px;\n  color: #1f2937;\n  font-family: inherit;\n  line-height: 1.6;\n  word-break: break-word;\n  text-align: left;\n}\n\nbody.cms-editor-content .linebold_yellow {\n  font-weight: 700;\n  background-image: linear-gradient(#fff9bf, #fff9bf);\n  background-position: 0% 100%;\n  background-repeat: no-repeat;\n  background-size: 100% 10px;\n}\n\nbody.cms-editor-content .classic-editor-search-match {\n  background: #fff3a3;\n}\n\nbody.cms-editor-content .classic-editor-search-match-current {\n  background: #ffd36b;\n}\n`,
  contentStyle: '',
};

function label(labels: ClassicEditorLabels | undefined, key: keyof ClassicEditorLabels, fallback: string): string {
  return labels?.[key] || fallback;
}

function normalizeCssUrl(url: string): string {
  return url.trim();
}

function mergeProfiles(base: EditorStyleProfile, override?: EditorStyleProfile | null): EditorStyleProfile {
  if (!override) {
    return base;
  }

  return {
    bodyClass: override.bodyClass ?? base.bodyClass,
    blockFormats: override.blockFormats ?? base.blockFormats,
    contentCssUrls: override.contentCssUrls
      ? [...override.contentCssUrls]
      : base.contentCssUrls,
    inlineCss: override.inlineCss ?? base.inlineCss,
    contentStyle: override.contentStyle ?? base.contentStyle,
  };
}

async function loadStyleProfile(profileUrl: string): Promise<EditorStyleProfile> {
  const response = await fetch(profileUrl, {
    credentials: 'same-origin',
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error(`Failed to load editor style profile: ${response.status}`);
  }

  const profile = await response.json();
  if (!profile || typeof profile !== 'object') {
    throw new Error('Invalid editor style profile payload');
  }

  const next: EditorStyleProfile = {};
  if (Array.isArray(profile.contentCssUrls)) {
    next.contentCssUrls = profile.contentCssUrls
      .map((value: unknown) => (typeof value === 'string' ? normalizeCssUrl(value) : ''))
      .filter(Boolean);
  }
  if (typeof profile.inlineCss === 'string') {
    next.inlineCss = profile.inlineCss;
  }
  if (typeof profile.contentStyle === 'string') {
    next.contentStyle = profile.contentStyle;
  }
  if (typeof profile.bodyClass === 'string') {
    next.bodyClass = profile.bodyClass;
  }
  if (typeof profile.blockFormats === 'string') {
    next.blockFormats = profile.blockFormats;
  }

  return next;
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
    styleProfile,
    styleProfileUrl,
    mediaInsert,
  } = config;

  const styleProfiles: EditorStyleProfile[] = [DEFAULT_EDITOR_STYLE_PROFILE];
  if (contentCssUrl) {
    styleProfiles.push({ contentCssUrls: [contentCssUrl] });
  }

  if (styleProfileUrl) {
    try {
      const loaded = await loadStyleProfile(styleProfileUrl);
      styleProfiles.push(loaded);
    } catch (error) {
      console.warn('Failed to load editor style profile, using defaults only', error);
    }
  }

  if (styleProfile) {
    styleProfiles.push(styleProfile);
  }

  const resolvedProfile = styleProfiles.reduce((current, next) => mergeProfiles(current, next), {} as EditorStyleProfile);

  const styleCss = [
    resolvedProfile.contentStyle,
    resolvedProfile.inlineCss,
  ]
    .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
    .join('\n\n');

  const contentCss = (resolvedProfile.contentCssUrls || [])
    .filter((url): url is string => typeof url === 'string' && url.trim().length > 0)
    .map((url) => `${normalizeCssUrl(url)}${tinymceVersion ? `?v=${tinymceVersion}` : ''}`)
    .join(',');

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
    body_class: resolvedProfile.bodyClass,
    block_formats: resolvedProfile.blockFormats,
    ...(contentCss ? { content_css: contentCss } : {}),
    ...(styleCss ? { content_style: styleCss } : {}),
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
      if (!html) return;
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

      if (mediaInsert) {
        mediaInsert(html);
      }
    },
    async destroy() {
      await editor.remove();
    },
  };
}
