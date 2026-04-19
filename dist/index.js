function resolveNode(node) {
    if (!node)
        return null;
    if (typeof node === 'string') {
        if (typeof document === 'undefined')
            return null;
        return document.querySelector(node);
    }
    return node;
}
function toTextArea(node) {
    const element = resolveNode(node);
    return element instanceof HTMLTextAreaElement ? element : null;
}
function getEndpoint(url, fallback) {
    return String(url || '').trim() || fallback;
}
function toHtmlFromMedia(dataset) {
    const url = String(dataset.mediaUrl || '').trim();
    if (!url)
        return "";
    const title = String(dataset.mediaTitle || dataset.mediaFilename || "media").trim();
    const alt = String(dataset.mediaAlt || title).trim();
    const mimeType = String(dataset.mediaMime || '').trim();
    const escapedUrl = url.replace(/"/g, "&quot;");
    const escapedTitle = title.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[char] || char));
    const escapedAlt = alt.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[char] || char));
    if (mimeType.startsWith("image/")) {
        return `<img src="${escapedUrl}" alt="${escapedAlt}" />`;
    }
    return `<a href="${escapedUrl}">${escapedTitle}</a>`;
}
function getPayload(form) {
    const payload = {};
    const controls = Array.from(form.querySelectorAll("input, textarea, select, button"));
    for (const control of controls) {
        if (!(control instanceof HTMLInputElement) && !(control instanceof HTMLTextAreaElement) && !(control instanceof HTMLSelectElement)) {
            continue;
        }
        const fieldName = control.name;
        if (!fieldName || control.disabled)
            continue;
        if (control instanceof HTMLInputElement && control.type === "file")
            continue;
        payload[fieldName] = String(control.value || "");
    }
    return payload;
}
function pickFirstString(...values) {
    for (const value of values) {
        if (typeof value === "string" && value.trim().length > 0) {
            return value.trim();
        }
    }
    return "";
}
async function saveEditorContent(form, statusNode, saveUrl) {
    const payload = getPayload(form);
    payload.content = pickFirstString(payload.content, payload["content-visual"], payload["content-code"], payload["content-editor-code"], payload["content-editor"]);
    if (!payload.content) {
        const status = "Save blocked: content is empty.";
        statusNode.textContent = status;
        return { status, error: true };
    }
    const response = await fetch(saveUrl, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
    });
    const responseBody = await response.json().catch(() => ({}));
    if (!response.ok || !responseBody.ok) {
        const status = `Save failed: ${JSON.stringify(responseBody)}`;
        statusNode.textContent = status;
        return { status, error: true };
    }
    const status = `Saved at ${new Date().toISOString()}\npostId=${responseBody.id}\nCreatedAt=${responseBody.createdAt}`;
    statusNode.textContent = status;
    return { status, error: false };
}
async function loadLatestPost(confirmUrl, form, statusNode) {
    const response = await fetch(confirmUrl, { cache: "no-store" });
    const responseBody = await response.json().catch(() => ({}));
    if (!response.ok || !responseBody.ok || !responseBody.post) {
        const status = `Reload failed: ${JSON.stringify(responseBody)}`;
        statusNode.textContent = status;
        return { status, error: true };
    }
    const post = responseBody.post;
    const titleField = form.querySelector("#post-title");
    const textArea = form.querySelector("[data-editor-visual], [data-editor-textarea]");
    const codeTextarea = form.querySelector("[data-editor-code]");
    const submitField = form.querySelector("[data-editor-submit-field]");
    if (titleField instanceof HTMLInputElement) {
        titleField.value = post.title || "";
    }
    if (textArea instanceof HTMLTextAreaElement) {
        textArea.value = post.content || "";
    }
    if (codeTextarea instanceof HTMLTextAreaElement) {
        codeTextarea.value = post.content || "";
    }
    if (submitField instanceof HTMLTextAreaElement) {
        submitField.value = post.content || "";
    }
    const status = `Reloaded latest post id=${post.id}`;
    statusNode.textContent = status;
    return { status };
}
function openMediaModal(backdrop, mediaUrl) {
    if (!mediaUrl || !backdrop || typeof fetch !== 'function')
        return;
    fetch(mediaUrl, {
        headers: { "x-requested-with": "fetch" },
        cache: "no-store",
    }).then(async (response) => {
        if (!response.ok)
            return;
        backdrop.innerHTML = await response.text();
        backdrop.classList.remove("hidden");
        backdrop.setAttribute("aria-hidden", "false");
        const htmx = window.htmx;
        if (htmx?.process) {
            htmx.process(backdrop);
        }
        const searchInput = backdrop.querySelector('input[name="keyword"]');
        if (searchInput instanceof HTMLInputElement) {
            searchInput.focus();
            searchInput.select();
        }
    });
}
function closeMediaModal(backdrop) {
    backdrop.classList.add("hidden");
    backdrop.innerHTML = '';
    backdrop.setAttribute("aria-hidden", "true");
}
function bindMediaDelegates(backdrop) {
    document.addEventListener("click", (event) => {
        const opener = event.target instanceof Element ? event.target.closest("[data-media-modal-open]") : null;
        if (opener instanceof HTMLElement) {
            event.preventDefault();
            openMediaModal(backdrop, opener.getAttribute("data-media-modal-url") || "");
            return;
        }
        const insertButton = event.target instanceof Element ? event.target.closest("[data-editor-media-insert]") : null;
        if (insertButton instanceof HTMLElement && insertButton.dataset) {
            event.preventDefault();
            const html = toHtmlFromMedia(insertButton.dataset);
            if (html) {
                window.dispatchEvent(new CustomEvent("test-tinymce:media-insert", {
                    detail: { html },
                }));
            }
            closeMediaModal(backdrop);
            return;
        }
        const close = event.target instanceof Element ? event.target.closest(".modal-close,[data-modal-close]") : null;
        if (close) {
            closeMediaModal(backdrop);
            return;
        }
        if (event.target instanceof HTMLElement && event.target.classList.contains("hidden")) {
            closeMediaModal(backdrop);
        }
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMediaModal(backdrop);
        }
    });
}
export async function bootstrapClassicEditor(config = {}) {
    if (typeof document === 'undefined') {
        return null;
    }
    const target = resolveNode(config.target || "[data-classic-editor]");
    if (!(target instanceof HTMLElement)) {
        return null;
    }
    const tinyMceGlobal = config.tinyMceGlobal || (typeof window !== 'undefined' ? window.tinymce : null);
    if (!tinyMceGlobal) {
        const fallback = document.querySelector("#save-status") || null;
        if (fallback instanceof HTMLElement) {
            fallback.textContent = "Editor bootstrap failed: missing TinyMCE global.";
        }
        return null;
    }
    const textarea = target.querySelector("[data-editor-visual], [data-editor-textarea]");
    const codeTextarea = target.querySelector("[data-editor-code]");
    const submitField = target.querySelector("[data-editor-submit-field]");
    const visualTab = target.querySelector('[data-editor-tab="visual"]');
    const codeTab = target.querySelector('[data-editor-tab="code"]');
    const formElement = resolveNode(config.form || "#post-editor-form");
    if (!(textarea instanceof HTMLTextAreaElement)
        || !(codeTextarea instanceof HTMLTextAreaElement)
        || !(submitField instanceof HTMLTextAreaElement)
        || !(formElement instanceof HTMLFormElement)) {
        return null;
    }
    const statusNode = resolveNode(config.statusNode || "#save-status");
    const statusTarget = statusNode instanceof HTMLElement ? statusNode : null;
    if (!statusTarget) {
        return null;
    }
    const editor = await createClassicEditor({
        target,
        textarea,
        codeTextarea,
        submitField,
        tinyMceGlobal,
        tinymceBaseUrl: getEndpoint(config.tinymceBaseUrl, "https://cdn.jsdelivr.net/npm/tinymce@7.8.0"),
        tinymceVersion: getEndpoint(config.tinymceVersion, "7.8.0") || "7.8.0",
        styleProfileUrl: getEndpoint(config.styleProfileUrl, "/editor-style-profile.json"),
        styleProfile: config.styleProfile,
        labels: {
            source: "Source",
            yellowHighlight: "Yellow Highlight",
            searchPlaceholder: "Search text",
            searchPrev: "Prev",
            searchNext: "Next",
            noResults: "No results",
            ...config.labels,
        },
        mediaInsert: (html) => {
            window.dispatchEvent(new CustomEvent("test-tinymce:media-insert", {
                detail: { html },
            }));
        },
    });
    const state = {
        editor,
        form: formElement,
        target,
        textArea: textarea,
        codeTextArea: codeTextarea,
        submitField,
        statusNode: statusTarget,
    };
    const selectMode = (mode) => editor.switchMode(mode);
    visualTab?.addEventListener("click", (event) => {
        event.preventDefault();
        selectMode("visual");
    });
    codeTab?.addEventListener("click", (event) => {
        event.preventDefault();
        selectMode("code");
    });
    if (visualTab instanceof HTMLElement) {
        visualTab.setAttribute("aria-pressed", "true");
    }
    if (codeTab instanceof HTMLElement) {
        codeTab.setAttribute("aria-pressed", "false");
    }
    selectMode("visual");
    const backdrop = resolveNode(config.backdropId ? `#${config.backdropId}` : "#modal-backdrop");
    if (backdrop instanceof HTMLElement) {
        bindMediaDelegates(backdrop);
    }
    state.form.addEventListener("submit", async (event) => {
        event.preventDefault();
        await saveEditorContent(state.form, state.statusNode, getEndpoint(config.saveUrl, "/save"));
    });
    resolveNode(config.refreshButton || "#refresh")?.addEventListener("click", () => {
        textarea.value = "";
        codeTextarea.value = "";
        submitField.value = "";
        statusTarget.textContent = "Editor cleared.";
    });
    const confirmButton = resolveNode(config.confirmButton || "#confirm-latest");
    confirmButton?.addEventListener("click", async () => {
        await loadLatestPost(getEndpoint(config.confirmUrl, "/confirm"), state.form, state.statusNode);
    });
    const previewButton = resolveNode(config.previewButton || "#open-preview");
    previewButton?.addEventListener("click", () => {
        const htmlPayload = textarea.value.trim() || codeTextarea.value.trim() || "";
        if (!htmlPayload) {
            state.statusNode.textContent = "Preview is empty.";
            return;
        }
        const encoded = encodeURIComponent(htmlPayload);
        window.open(`data:text/html,${encoded}`, "_blank", "noopener");
        state.statusNode.textContent = "Opening preview in a new tab.";
    });
    window.addEventListener("test-tinymce:media-insert", (event) => {
        const html = event?.detail?.html;
        if (!html)
            return;
        editor.insertHtml(html);
    });
    return state;
}
if (typeof window !== 'undefined' && typeof document !== 'undefined' && !window.__cicerolmsClassicEditorAutoBootDone) {
    window.__cicerolmsClassicEditorAutoBootDone = true;
    const boot = async () => {
        if (!document.querySelector("[data-classic-editor]"))
            return;
        if (!window.tinymce) {
            return;
        }
        await bootstrapClassicEditor({
            tinyMceGlobal: window.tinymce,
        });
    };
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => {
            void boot();
        }, { once: true });
    }
    else {
        void boot();
    }
}
const DEFAULT_EDITOR_STYLE_PROFILE = {
    bodyClass: 'cms-editor-content',
    blockFormats: 'Paragraph=p;Heading 1=h1;Heading 2=h2;Heading 3=h3;Heading 4=h4;Heading 5=h5;Heading 6=h6;Preformatted=pre',
    contentCssUrls: [],
    inlineCss: `body.cms-editor-content {\n  box-sizing: border-box;\n  max-width: 100%;\n  margin: 0 auto;\n  padding: 12px 14px;\n  color: #1f2937;\n  font-family: inherit;\n  line-height: 1.6;\n  word-break: break-word;\n  text-align: left;\n}\n\nbody.cms-editor-content .linebold_yellow {\n  font-weight: 700;\n  background-image: linear-gradient(#fff9bf, #fff9bf);\n  background-position: 0% 100%;\n  background-repeat: no-repeat;\n  background-size: 100% 10px;\n}\n\nbody.cms-editor-content .classic-editor-search-match {\n  background: #fff3a3;\n}\n\nbody.cms-editor-content .classic-editor-search-match-current {\n  background: #ffd36b;\n}\n`,
    contentStyle: '',
};
function label(labels, key, fallback) {
    return labels?.[key] || fallback;
}
function normalizeCssUrl(url) {
    return url.trim();
}
function mergeProfiles(base, override) {
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
async function loadStyleProfile(profileUrl) {
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
    const next = {};
    if (Array.isArray(profile.contentCssUrls)) {
        next.contentCssUrls = profile.contentCssUrls
            .map((value) => (typeof value === 'string' ? normalizeCssUrl(value) : ''))
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
export async function createClassicEditor(config) {
    const { target, textarea, codeTextarea, submitField, tinyMceGlobal, tinymceBaseUrl, tinymceVersion = '1', contentCssUrl, labels, styleProfile, styleProfileUrl, mediaInsert, } = config;
    const styleProfiles = [DEFAULT_EDITOR_STYLE_PROFILE];
    if (contentCssUrl) {
        styleProfiles.push({ contentCssUrls: [contentCssUrl] });
    }
    if (styleProfileUrl) {
        try {
            const loaded = await loadStyleProfile(styleProfileUrl);
            styleProfiles.push(loaded);
        }
        catch (error) {
            console.warn('Failed to load editor style profile, using defaults only', error);
        }
    }
    if (styleProfile) {
        styleProfiles.push(styleProfile);
    }
    const resolvedProfile = styleProfiles.reduce((current, next) => mergeProfiles(current, next), {});
    const styleCss = [
        resolvedProfile.contentStyle,
        resolvedProfile.inlineCss,
    ]
        .filter((value) => typeof value === 'string' && value.trim().length > 0)
        .join('\n\n');
    const contentCss = (resolvedProfile.contentCssUrls || [])
        .filter((url) => typeof url === 'string' && url.trim().length > 0)
        .map((url) => `${normalizeCssUrl(url)}${tinymceVersion ? `?v=${tinymceVersion}` : ''}`)
        .join(',');
    let mode = 'visual';
    let visualFullscreenActive = false;
    let codeFullscreenActive = false;
    const searchState = { query: '', total: 0, currentIndex: 0 };
    const toolbar = document.createElement('div');
    toolbar.className = 'classic-editor-package-toolbar';
    toolbar.innerHTML = `
    <div class="classic-editor-package-search-host"></div>
  `;
    target.prepend(toolbar);
    const searchHost = toolbar.querySelector('.classic-editor-package-search-host');
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
            input: wrapper.querySelector('input'),
            status: wrapper.querySelector('.classic-editor-package-search-status'),
            prev: wrapper.querySelector('[data-direction="prev"]'),
            next: wrapper.querySelector('[data-direction="next"]'),
        };
    };
    const visualSearchUi = createSearchUi();
    const codeSearchUi = createSearchUi();
    searchHost.replaceChildren(codeSearchUi.wrapper);
    const updateStatus = (query, total, currentIndex) => {
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
    const syncInputs = (value, source) => {
        searchState.query = value;
        if (visualSearchUi.input !== source)
            visualSearchUi.input.value = value;
        if (codeSearchUi.input !== source)
            codeSearchUi.input.value = value;
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
        setup(instance) {
            instance.formatter.register('lineboldyellow', {
                inline: 'span',
                classes: 'linebold_yellow',
                exact: true,
            });
            instance.ui.registry.addToggleButton('yellowhighlight', {
                text: label(labels, 'yellowHighlight', 'Yellow Highlight'),
                tooltip: label(labels, 'yellowHighlight', 'Yellow Highlight'),
                onAction: () => instance.execCommand('mceToggleFormat', false, 'lineboldyellow'),
                onSetup: (api) => {
                    const handler = (state) => api.setActive(state);
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
            instance.on('FullscreenStateChanged', (event) => {
                visualFullscreenActive = Boolean(event.state);
                document.body.classList.toggle('editor-fullscreen-active', visualFullscreenActive || codeFullscreenActive);
            });
            instance.on('change input undo redo keyup SetContent', () => {
                if (mode !== 'visual')
                    return;
                const html = instance.getContent();
                codeTextarea.value = html;
                submitField.value = html;
            });
        },
    });
    const editor = editorList[0];
    const applyVisualSearch = (step) => {
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
        if (step === 'first')
            searchState.currentIndex = 1;
        if (step === 'next')
            searchState.currentIndex = searchState.currentIndex >= total ? 1 : searchState.currentIndex + 1;
        if (step === 'prev')
            searchState.currentIndex = searchState.currentIndex <= 1 ? total : searchState.currentIndex - 1;
        win.find(query, false, step === 'prev', true, false, false, false);
        updateStatus(query, total, searchState.currentIndex);
    };
    const applyCodeSearch = (step) => {
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
        if (step === 'first')
            searchState.currentIndex = 1;
        if (step === 'next')
            searchState.currentIndex = searchState.currentIndex >= matches.length ? 1 : searchState.currentIndex + 1;
        if (step === 'prev')
            searchState.currentIndex = searchState.currentIndex <= 1 ? matches.length : searchState.currentIndex - 1;
        const active = matches[searchState.currentIndex - 1];
        codeTextarea.setSelectionRange(active.index ?? 0, (active.index ?? 0) + active[0].length);
        updateStatus(query, matches.length, searchState.currentIndex);
    };
    const applySearch = (step = 'first') => {
        if (mode === 'visual') {
            applyVisualSearch(step);
            return;
        }
        applyCodeSearch(step);
    };
    const bindSearchUi = (ui) => {
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
    function switchMode(nextMode) {
        if (nextMode === mode)
            return;
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
        insertHtml(html) {
            if (!html)
                return;
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
