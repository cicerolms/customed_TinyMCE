import { ensureLegacyEditorGlobals, LEGACY_EDITOR_VERSION, LEGACY_INSERT_MENU_ITEMS, LEGACY_PLUGINS, LEGACY_TOOLBAR_1, LEGACY_WORDPRESS_ADV_HIDDEN, legacyPluginSources, legacyTinyMceBaseUrl, markLegacyActiveEditor, resolveLegacyEditorWrap, } from "./legacy-adapter.js";
const DEFAULT_ASSET_BASE_URL = "/assets";
const LEGACY_VECB_PLUGIN_NAMES = Array.from({ length: 18 }, (_, index) => `vecb_button${index + 1}`);
const LEGACY_UTILITY_BUTTON_NAMES = Array.from({ length: 5 }, (_, index) => `utility_${index + 1}`);
const LEGACY_TOOLBAR_2 = [...LEGACY_VECB_PLUGIN_NAMES, ...LEGACY_UTILITY_BUTTON_NAMES].join(",");
const LEGACY_PLUGIN_LIST = [LEGACY_PLUGINS, ...LEGACY_VECB_PLUGIN_NAMES].join(",");
const DEFAULT_EDITOR_STYLE_PROFILE = {
    bodyClass: "cms-editor-content",
    blockFormats: "Paragraph=p;Heading 2=h2;Heading 3=h3;Heading 4=h4;Heading 5=h5;Heading 6=h6;Preformatted=pre",
};
const LEGACY_EDITOR_UI_TRANSLATIONS = {
    ja: {
        "New document": "新規ドキュメント",
        Print: "印刷",
        Undo: "元に戻す",
        Redo: "やり直す",
        Cut: "切り取り",
        Copy: "コピー",
        Paste: "貼り付け",
        "Paste as text": "テキストとして貼り付け",
        "Select all": "すべて選択",
        "Find and replace": "検索と置換",
        "Source code": "ソースコード",
        "Visual aids": "表示補助",
        "Show invisible characters": "不可視文字を表示",
        "Show blocks": "ブロックを表示",
        Fullscreen: "全画面",
        "Insert/edit link": "リンクの挿入/編集",
        "Insert/edit media": "メディア",
        Table: "テーブル",
        "Special character": "特殊文字",
        "Horizontal line": "横ライン",
        "Nonbreaking space": "改行なしスペース",
        Anchor: "アンカー",
        "Date/time": "日付/時間",
        "Insert More tag": "「続きを読む」タグを挿入",
        "Page break": "改ページ",
        Bold: "太字",
        Italic: "斜体",
        Underline: "下線",
        Strikethrough: "取り消し線",
        Superscript: "上付き",
        Subscript: "下付き",
        Formats: "書式",
        Align: "配置",
        "Clear formatting": "書式をクリア",
        "Reset table size": "テーブルサイズをリセット",
        "Remove table styling": "テーブル装飾を削除",
        "Table properties": "テーブルのプロパティ",
        "Delete table": "テーブルを削除",
        Row: "行",
        Column: "列",
        Cell: "セル",
        Insert: "挿入",
        Format: "フォーマット",
        Tools: "ツール",
        View: "表示",
        Edit: "編集",
        File: "ファイル",
    },
    vi: {
        "New document": "Tài liệu mới",
        Print: "In",
        Undo: "Hoàn tác",
        Redo: "Làm lại",
        Cut: "Cắt",
        Copy: "Sao chép",
        Paste: "Dán",
        "Paste as text": "Dán dạng văn bản",
        "Select all": "Chọn tất cả",
        "Find and replace": "Tìm và thay thế",
        "Source code": "Mã nguồn",
        "Visual aids": "Hỗ trợ hiển thị",
        "Show invisible characters": "Hiện ký tự ẩn",
        "Show blocks": "Hiện khối",
        Fullscreen: "Toàn màn hình",
        "Insert/edit link": "Chèn/sửa liên kết",
        "Insert/edit media": "Media",
        Table: "Bảng",
        "Special character": "Ký tự đặc biệt",
        "Horizontal line": "Đường ngang",
        "Nonbreaking space": "Khoảng trắng không ngắt",
        Anchor: "Neo",
        "Date/time": "Ngày/giờ",
        "Insert More tag": "Chèn thẻ More",
        "Page break": "Ngắt trang",
        Bold: "Đậm",
        Italic: "Nghiêng",
        Underline: "Gạch chân",
        Strikethrough: "Gạch ngang",
        Superscript: "Chỉ số trên",
        Subscript: "Chỉ số dưới",
        Formats: "Định dạng",
        Align: "Căn chỉnh",
        "Clear formatting": "Xóa định dạng",
        "Reset table size": "Đặt lại kích thước bảng",
        "Remove table styling": "Xóa kiểu bảng",
        "Table properties": "Thuộc tính bảng",
        "Delete table": "Xóa bảng",
        Row: "Hàng",
        Column: "Cột",
        Cell: "Ô",
        Insert: "Chèn",
        Format: "Định dạng",
        Tools: "Công cụ",
        View: "Xem",
        Edit: "Chỉnh sửa",
        File: "Tệp",
    },
};
const tinyMceLoaderCache = new Map();
const legacyPluginLoaderCache = new Map();
const registeredEditorI18n = new Set();
function resolveNode(node) {
    if (!node)
        return null;
    if (typeof node === "string") {
        return typeof document === "undefined" ? null : document.querySelector(node);
    }
    return node;
}
function getEndpoint(url, fallback) {
    return String(url || "").trim() || fallback;
}
function resolveEditorI18n(explicit) {
    const globalI18n = window.__i18n;
    const nextLang = explicit?.lang ?? globalI18n?.lang ?? document.documentElement.lang ?? "ja";
    return {
        lang: normalizeEditorLang(nextLang),
        t: explicit?.t ?? globalI18n?.t,
    };
}
function translate(key, fallback, i18n) {
    return resolveEditorI18n(i18n).t?.(key, fallback) || fallback;
}
function normalizeEditorLang(input) {
    const value = String(input || "").toLowerCase();
    if (value === "jp")
        return "ja";
    if (value.startsWith("ja"))
        return "ja";
    if (value.startsWith("vi"))
        return "vi";
    if (value.startsWith("en"))
        return "en";
    return "ja";
}
function label(labels, key, fallback) {
    return labels?.[key] || fallback;
}
function readEditorI18nDetail(event) {
    if (!(event instanceof CustomEvent) || typeof event.detail !== "object" || event.detail === null) {
        return {};
    }
    const detail = event.detail;
    return {
        lang: typeof detail.lang === "string" ? detail.lang : "",
        t: typeof detail.t === "function" ? detail.t : undefined,
    };
}
export function dispatchClassicEditorI18n(nextI18n) {
    if (typeof document === "undefined") {
        return;
    }
    document.dispatchEvent(new CustomEvent("classic-editor:i18n-change", { detail: nextI18n }));
}
function mergeProfiles(base, override) {
    if (!override)
        return base;
    return {
        bodyClass: override.bodyClass ?? base.bodyClass,
        blockFormats: override.blockFormats ?? base.blockFormats,
    };
}
async function loadStyleProfile(profileUrl) {
    const response = await fetch(profileUrl, {
        credentials: "same-origin",
        cache: "no-store",
    });
    if (!response.ok) {
        throw new Error(`Failed to load editor style profile: ${response.status}`);
    }
    const profile = await response.json();
    if (!profile || typeof profile !== "object") {
        throw new Error("Invalid editor style profile payload");
    }
    const next = {};
    if (typeof profile.bodyClass === "string") {
        next.bodyClass = profile.bodyClass;
    }
    if (typeof profile.blockFormats === "string") {
        next.blockFormats = profile.blockFormats;
    }
    return next;
}
function resolveReviewBodyClass(profile) {
    return String(profile.bodyClass || DEFAULT_EDITOR_STYLE_PROFILE.bodyClass)
        .split(/\s+/)
        .map((value) => value.trim())
        .filter(Boolean)
        .join(" ");
}
function ensureEditorFragmentHost(target, textarea, className) {
    const existing = target.querySelector("[data-editor-fragment]");
    const fragment = existing instanceof HTMLElement ? existing : document.createElement("div");
    if (!(existing instanceof HTMLElement)) {
        fragment.setAttribute("data-editor-fragment", "true");
        fragment.setAttribute("aria-label", "Visual editor");
        fragment.className = "classic-editor-fragment";
        textarea.insertAdjacentElement("afterend", fragment);
    }
    const mergedClasses = new Set(["classic-editor-fragment", ...className.split(/\s+/).filter(Boolean)]);
    fragment.className = Array.from(mergedClasses).join(" ");
    fragment.hidden = true;
    return fragment;
}
function ensureToolbarHost(target, fragment) {
    const existing = target.querySelector("[data-editor-toolbar-host]");
    const host = existing instanceof HTMLElement ? existing : document.createElement("div");
    if (!(existing instanceof HTMLElement)) {
        host.setAttribute("data-editor-toolbar-host", "true");
        host.className = "classic-editor-toolbar-host";
        fragment.insertAdjacentElement("beforebegin", host);
    }
    const mergedClasses = new Set(["classic-editor-toolbar-host", ...host.className.split(/\s+/).filter(Boolean)]);
    host.className = Array.from(mergedClasses).join(" ");
    return host;
}
function ensureElementId(element, fallbackId) {
    if (!element.id) {
        element.id = fallbackId;
    }
    return element.id;
}
async function loadScript(url) {
    const response = await fetch(`${url}?v=${LEGACY_EDITOR_VERSION}`, {
        cache: "no-store",
        credentials: "same-origin",
    });
    if (!response.ok) {
        throw new Error(`Failed to load legacy editor asset: ${response.status} ${url}`);
    }
    const code = await response.text();
    window.eval(`${code}\n//# sourceURL=${url}`);
}
async function waitForLegacyTinyMce(assetBaseUrl) {
    const cached = tinyMceLoaderCache.get(assetBaseUrl);
    if (cached) {
        return cached;
    }
    const promise = (async () => {
        const win = window;
        if (win.tinymce)
            return win.tinymce;
        ensureLegacyEditorGlobals(win);
        const tinyMceBaseUrl = legacyTinyMceBaseUrl(assetBaseUrl);
        await loadScript(`${tinyMceBaseUrl}/wp-tinymce.js`);
        if (!win.tinymce) {
            throw new Error("Legacy TinyMCE did not initialize");
        }
        win.tinymce.baseURL = tinyMceBaseUrl;
        win.tinymce.baseURI = new URL(`${tinyMceBaseUrl}/`, window.location.origin).toString();
        win.tinymce.suffix = ".min";
        return win.tinymce;
    })().catch((error) => {
        tinyMceLoaderCache.delete(assetBaseUrl);
        throw error;
    });
    tinyMceLoaderCache.set(assetBaseUrl, promise);
    return promise;
}
async function loadLegacyPluginScripts(tinymce, assetBaseUrl) {
    const cached = legacyPluginLoaderCache.get(assetBaseUrl);
    if (cached) {
        return cached;
    }
    const promise = (async () => {
        const pluginSources = legacyPluginSources(assetBaseUrl, LEGACY_VECB_PLUGIN_NAMES);
        for (const [name, source] of Object.entries(pluginSources)) {
            const basePath = source
                .replace(/\/plugin(?:\.min)?\.js$/, "")
                .replace(/\/button-\d+-\d+\.js$/, "/");
            if (tinymce.PluginManager.urls) {
                tinymce.PluginManager.urls[name] = basePath;
            }
            if (tinymce.PluginManager.lookup?.[name]) {
                continue;
            }
            await loadScript(source);
        }
    })().catch((error) => {
        legacyPluginLoaderCache.delete(assetBaseUrl);
        throw error;
    });
    legacyPluginLoaderCache.set(assetBaseUrl, promise);
    return promise;
}
function registerLegacyEditorI18n(tinymce, lang) {
    const normalized = normalizeEditorLang(lang);
    if (registeredEditorI18n.has(normalized)) {
        return normalized;
    }
    if (normalized !== "en") {
        tinymce.addI18n(normalized, LEGACY_EDITOR_UI_TRANSLATIONS[normalized] || {});
    }
    registeredEditorI18n.add(normalized);
    return normalized;
}
function localizeLegacyMenubar(editor, i18n) {
    const container = editor?.getContainer?.();
    if (!(container instanceof HTMLElement)) {
        return;
    }
    const labels = [
        translate("editor.menu.file", "ファイル", i18n),
        translate("editor.menu.edit", "編集", i18n),
        translate("editor.menu.view", "表示", i18n),
        translate("editor.menu.insert", "挿入", i18n),
        translate("editor.menu.format", "フォーマット", i18n),
        translate("editor.menu.tools", "ツール", i18n),
        translate("editor.menu.table", "テーブル", i18n),
    ];
    const nodes = Array.from(container.querySelectorAll(".mce-menubar .mce-menubtn span"));
    nodes.forEach((node, index) => {
        if (!(node instanceof HTMLElement))
            return;
        if (!labels[index])
            return;
        node.textContent = labels[index];
    });
}
function selectionUrl(editor) {
    const selected = String(editor?.selection?.getContent?.({ format: "text" }) || "").trim();
    const match = selected.match(/((https?|file|ftp|data|ogg):\/\/[^ "<,]+)/i);
    return match ? match[1] : "";
}
function openLinkCardDialog(editor, assetBaseUrl) {
    const initialUrl = selectionUrl(editor);
    const promptValue = window.prompt("Linkcard URL", initialUrl);
    if (!promptValue)
        return;
    editor.focus();
    editor.selection.setContent(`<p>[blogcard url="${editor.dom.encode(String(promptValue).trim())}"]</p>`);
    editor.windowManager?.close?.();
    void assetBaseUrl;
}
function toggleEditorFullscreen(root, editor) {
    if (!editor?.settings?.inline && typeof editor?.execCommand === "function") {
        editor.execCommand("mceFullScreen");
        return;
    }
    const isActive = root.classList.toggle("is-fullscreen");
    document.body.classList.toggle("editor-fullscreen-active", isActive);
    editor.fire("ResizeEditor");
}
function insertAtCaret(textarea, value) {
    const start = textarea.selectionStart ?? textarea.value.length;
    const end = textarea.selectionEnd ?? textarea.value.length;
    textarea.setRangeText(value, start, end, "end");
    textarea.dispatchEvent(new Event("input", { bubbles: true }));
}
function wrapSelectionWithClass(editor, className) {
    const selectedHtml = String(editor?.selection?.getContent?.() || "").trim();
    const content = selectedHtml || className;
    editor.focus();
    editor.selection.setContent(`<span class="${className}">${content}</span>`);
}
function buildInsertHtml(dataset) {
    const url = String(dataset.mediaUrl || "").trim();
    if (!url)
        return "";
    const title = String(dataset.mediaTitle || dataset.mediaFilename || "media").trim();
    const alt = String(dataset.mediaAlt || title).trim();
    const mimeType = String(dataset.mediaMime || "").trim();
    const escapedUrl = url.replace(/"/g, "&quot;");
    const escapedTitle = title.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[char] || char));
    const escapedAlt = alt.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;" }[char] || char));
    if (mimeType.startsWith("image/")) {
        return `<img src="${escapedUrl}" alt="${escapedAlt}">`;
    }
    return `<a href="${escapedUrl}">${escapedTitle}</a>`;
}
function getPayload(form) {
    const payload = {};
    const controls = Array.from(form.querySelectorAll("input, textarea, select"));
    controls.forEach((control) => {
        if (!(control instanceof HTMLInputElement) && !(control instanceof HTMLTextAreaElement) && !(control instanceof HTMLSelectElement)) {
            return;
        }
        if (!control.name || control.disabled)
            return;
        if (control instanceof HTMLInputElement && control.type === "file")
            return;
        payload[control.name] = String(control.value || "");
    });
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
    payload.content = pickFirstString(payload.content, payload["content-visual"], payload["content-code"], payload["content-editor"], payload["content-html"]);
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
    const textarea = form.querySelector("[data-editor-textarea], [data-editor-visual], textarea[name='content']");
    if (titleField instanceof HTMLInputElement) {
        titleField.value = post.title || "";
    }
    if (textarea instanceof HTMLTextAreaElement) {
        textarea.value = post.content || "";
    }
    const status = `Reloaded latest post id=${post.id}`;
    statusNode.textContent = status;
    return { status, content: post.content || "" };
}
function openMediaModal(backdrop, mediaUrl) {
    if (!mediaUrl)
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
        htmx?.process?.(backdrop);
        const searchInput = backdrop.querySelector('input[name="keyword"]');
        if (searchInput instanceof HTMLInputElement) {
            searchInput.focus();
            searchInput.select();
        }
    });
}
function closeMediaModal(backdrop) {
    backdrop.classList.add("hidden");
    backdrop.innerHTML = "";
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
        if (insertButton instanceof HTMLElement) {
            event.preventDefault();
            const html = buildInsertHtml(insertButton.dataset);
            if (html) {
                window.dispatchEvent(new CustomEvent("classic-editor:media-insert", { detail: { html } }));
            }
            closeMediaModal(backdrop);
            return;
        }
        const closeButton = event.target instanceof Element ? event.target.closest(".modal-close,[data-modal-close]") : null;
        if (closeButton) {
            event.preventDefault();
            closeMediaModal(backdrop);
            return;
        }
        if (event.target instanceof HTMLElement && event.target.classList.contains("modal-backdrop")) {
            closeMediaModal(backdrop);
        }
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            closeMediaModal(backdrop);
        }
    });
}
export async function createClassicEditor(config) {
    const { target, textarea, styleProfile, styleProfileUrl, labels } = config;
    const assetBaseUrl = getEndpoint(config.assetBaseUrl, DEFAULT_ASSET_BASE_URL);
    const visualTab = target.querySelector('[data-editor-tab="visual"]');
    const codeTab = target.querySelector('[data-editor-tab="code"]');
    const wrap = resolveLegacyEditorWrap(target) || target;
    const shouldPrimeToolbarOnInit = config.primeToolbarOnInit !== false;
    if (!(visualTab instanceof HTMLButtonElement) || !(codeTab instanceof HTMLButtonElement)) {
        throw new Error("Classic editor target is missing the visual/code tab buttons.");
    }
    const profileStack = [{ ...DEFAULT_EDITOR_STYLE_PROFILE }];
    if (styleProfileUrl) {
        try {
            profileStack.push(await loadStyleProfile(styleProfileUrl));
        }
        catch (error) {
            console.warn("Failed to load editor style profile, using defaults only", error);
        }
    }
    if (styleProfile) {
        profileStack.push(styleProfile);
    }
    const resolvedProfile = profileStack.reduce((current, next) => mergeProfiles(current, next), {});
    const editorBodyClass = resolveReviewBodyClass(resolvedProfile);
    const editorId = ensureElementId(textarea, `classic-editor-${Math.random().toString(36).slice(2, 10)}`);
    const fragment = ensureEditorFragmentHost(target, textarea, editorBodyClass);
    const toolbarHost = ensureToolbarHost(target, fragment);
    const toolbarHostId = ensureElementId(toolbarHost, `${editorId}-toolbar-host`);
    const fragmentId = ensureElementId(fragment, `${editorId}-visual`);
    const tinymce = await waitForLegacyTinyMce(assetBaseUrl);
    await loadLegacyPluginScripts(tinymce, assetBaseUrl);
    let activeI18n = resolveEditorI18n(config.i18n);
    let editorLang = registerLegacyEditorI18n(tinymce, activeI18n.lang);
    let editor = null;
    let mode = "visual";
    let toolbarPrimed = false;
    const syncTextareaFromEditor = () => {
        if (mode !== "visual" || !editor || editor.removed) {
            return;
        }
        textarea.value = String(editor.getContent?.() || fragment.innerHTML || "");
    };
    const syncTextareaFromCode = () => {
        if (mode === "code") {
            textarea.dispatchEvent(new Event("input", { bubbles: true }));
        }
    };
    const syncFragmentFromTextarea = () => {
        fragment.innerHTML = textarea.value || "";
    };
    const renderMode = () => {
        wrap.classList.toggle("tmce-active", mode === "visual");
        wrap.classList.toggle("html-active", mode === "code");
        visualTab.setAttribute("aria-pressed", String(mode === "visual"));
        codeTab.setAttribute("aria-pressed", String(mode === "code"));
        fragment.hidden = mode !== "visual";
        textarea.hidden = mode === "visual";
    };
    const getLegacyConfig = () => ({
        target: fragment,
        inline: true,
        hidden_input: false,
        toolbar_persist: true,
        fixed_toolbar_container: `#${toolbarHostId}`,
        language: editorLang,
        theme: "modern",
        skin: "lightgray",
        menubar: "file edit view insert format tools table",
        statusbar: true,
        resize: true,
        branding: false,
        browser_spellcheck: true,
        convert_urls: false,
        relative_urls: false,
        remove_script_host: false,
        document_base_url: `${window.location.origin}/`,
        height: 520,
        toolbar1: LEGACY_TOOLBAR_1,
        toolbar2: LEGACY_TOOLBAR_2,
        toolbar3: "",
        toolbar4: "",
        plugins: LEGACY_PLUGIN_LIST,
        block_formats: resolvedProfile.blockFormats || DEFAULT_EDITOR_STYLE_PROFILE.blockFormats,
        fontsize_formats: "8pt 10pt 12pt 14pt 18pt 24pt 36pt",
        body_class: editorBodyClass,
        wordpress_adv_hidden: LEGACY_WORDPRESS_ADV_HIDDEN,
        table_toolbar: false,
        table_responsive_width: true,
        menu: {
            file: { title: translate("editor.menu.file", "ファイル", activeI18n), items: "newdocument | print" },
            edit: { title: translate("editor.menu.edit", "編集", activeI18n), items: "undo redo | cut copy paste pastetext | selectall | searchreplace" },
            view: {
                title: translate("editor.menu.view", "表示", activeI18n),
                items: "code | visualaid visualchars visualblocks | classiceditorfullscreen",
            },
            insert: { title: translate("editor.menu.insert", "挿入", activeI18n), items: LEGACY_INSERT_MENU_ITEMS },
            format: { title: translate("editor.menu.format", "フォーマット", activeI18n), items: "bold italic underline strikethrough | superscript subscript codeformat | blockformats align | removeformat | tmaresettablesize tmaremovetablestyles" },
            tools: { title: translate("editor.menu.tools", "ツール", activeI18n), items: "code" },
            table: { title: translate("editor.menu.table", "テーブル", activeI18n), items: "inserttable tableprops deletetable | row column cell" },
        },
        init_instance_callback(instance) {
            editor = instance;
            syncTextareaFromEditor();
            localizeLegacyMenubar(instance, activeI18n);
            if (!toolbarPrimed && shouldPrimeToolbarOnInit) {
                toolbarPrimed = true;
                window.setTimeout(() => {
                    if (mode !== "visual" || editor?.removed || document.activeElement !== document.body) {
                        return;
                    }
                    try {
                        instance.focus();
                    }
                    catch {
                        // Ignore focus failures during boot; the toolbar host will still exist.
                    }
                }, 150);
            }
        },
        setup(instance) {
            instance.addMenuItem("classiceditoraddmedia", {
                text: translate("editor.insert.addMedia", label(labels, "addMedia", "メディアを追加"), activeI18n),
                icon: "media",
                context: "insert",
                onclick() {
                    const trigger = target.querySelector(".insert-media[data-media-modal-open]");
                    if (trigger instanceof HTMLElement) {
                        trigger.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
                    }
                },
            });
            instance.addButton("classiceditorlinkcard", {
                tooltip: translate("editor.linkCard.button", "Insert Linkcard", activeI18n),
                image: `${assetBaseUrl}/vendor/pz-linkcard/mce-button.png`,
                onclick() {
                    openLinkCardDialog(instance, assetBaseUrl);
                },
            });
            instance.addButton("classiceditorfullscreen", {
                tooltip: translate("editor.fullscreen.writer", "Distraction-free writing mode", activeI18n),
                icon: "fullscreen",
                onclick() {
                    toggleEditorFullscreen(target, instance);
                },
            });
            instance.addMenuItem("classiceditorfullscreen", {
                text: translate("editor.fullscreen.writer", "Distraction-free writing mode", activeI18n),
                icon: "fullscreen",
                context: "view",
                onclick() {
                    toggleEditorFullscreen(target, instance);
                },
            });
            LEGACY_UTILITY_BUTTON_NAMES.forEach((buttonName, index) => {
                const utilityClass = `utility_${index + 1}`;
                instance.addButton(buttonName, {
                    text: `U${index + 1}`,
                    tooltip: `Apply ${utilityClass}`,
                    onclick() {
                        wrapSelectionWithClass(instance, utilityClass);
                    },
                });
            });
            instance.on("focus", () => {
                markLegacyActiveEditor(window, editorId);
            });
            instance.on("change input undo redo setcontent paste keyup", () => {
                syncTextareaFromEditor();
            });
            instance.on("init", () => {
                syncTextareaFromEditor();
                localizeLegacyMenubar(instance, activeI18n);
            });
            instance.on("remove", () => {
                target.classList.remove("is-fullscreen");
                document.body.classList.remove("editor-fullscreen-active");
            });
        },
    });
    const ensureVisualEditor = async () => {
        if (editor && !editor.removed) {
            return editor;
        }
        syncFragmentFromTextarea();
        const instances = await tinymce.init(getLegacyConfig());
        editor = instances[0] || tinymce.get(fragmentId) || null;
        return editor;
    };
    const removeVisualEditor = () => {
        syncTextareaFromEditor();
        const activeEditor = tinymce.get(fragmentId);
        if (activeEditor) {
            activeEditor.remove();
        }
        editor = null;
    };
    const applyI18n = async (nextI18n) => {
        activeI18n = resolveEditorI18n(nextI18n);
        const normalized = registerLegacyEditorI18n(tinymce, activeI18n.lang);
        if (normalized === editorLang) {
            localizeLegacyMenubar(tinymce.get(fragmentId) || editor, activeI18n);
            return;
        }
        editorLang = normalized;
        if (mode !== "visual")
            return;
        removeVisualEditor();
        await ensureVisualEditor();
    };
    const switchMode = async (nextMode) => {
        if (nextMode === mode)
            return;
        if (nextMode === "code") {
            removeVisualEditor();
            mode = "code";
            renderMode();
            textarea.focus();
            syncTextareaFromCode();
            return;
        }
        mode = "visual";
        syncFragmentFromTextarea();
        renderMode();
        await ensureVisualEditor();
        editor?.focus?.();
    };
    visualTab.addEventListener("click", () => {
        void switchMode("visual");
    });
    codeTab.addEventListener("click", () => {
        void switchMode("code");
    });
    document.addEventListener("vietwork:i18n-applied", (event) => {
        const nextI18n = readEditorI18nDetail(event);
        void applyI18n(nextI18n);
    });
    document.addEventListener("classic-editor:i18n-change", (event) => {
        const nextI18n = readEditorI18nDetail(event);
        void applyI18n(nextI18n);
    });
    renderMode();
    await ensureVisualEditor();
    return {
        switchMode,
        getLocale() {
            return editorLang;
        },
        async setLocale(nextLocale) {
            await applyI18n({ ...activeI18n, lang: nextLocale });
        },
        async setI18n(nextI18n) {
            await applyI18n({ ...activeI18n, ...nextI18n });
        },
        insertHtml(html) {
            if (!html)
                return;
            const activeEditor = tinymce.get(fragmentId);
            if (mode === "visual" && activeEditor) {
                activeEditor.focus();
                activeEditor.selection.setContent(html);
                syncTextareaFromEditor();
                return;
            }
            insertAtCaret(textarea, html);
        },
        setContent(html) {
            textarea.value = html;
            const activeEditor = tinymce.get(fragmentId);
            if (mode === "visual" && activeEditor) {
                activeEditor.setContent(html || "");
                syncTextareaFromEditor();
                return;
            }
            syncFragmentFromTextarea();
        },
        syncToTextarea() {
            if (mode === "visual") {
                syncTextareaFromEditor();
                return;
            }
            syncTextareaFromCode();
        },
        async destroy() {
            removeVisualEditor();
            target.classList.remove("is-fullscreen");
            document.body.classList.remove("editor-fullscreen-active");
            fragment.hidden = true;
            textarea.hidden = false;
        },
    };
}
export async function bootstrapClassicEditor(config = {}) {
    if (typeof document === "undefined") {
        return null;
    }
    const target = resolveNode(config.target || "[data-classic-editor]");
    const formElement = resolveNode(config.form || "#post-editor-form");
    const statusTarget = resolveNode(config.statusNode || "#save-status");
    if (!(target instanceof HTMLElement) || !(formElement instanceof HTMLFormElement) || !(statusTarget instanceof HTMLElement)) {
        return null;
    }
    const textarea = target.querySelector("[data-editor-textarea], [data-editor-visual], textarea[name='content']");
    if (!(textarea instanceof HTMLTextAreaElement)) {
        return null;
    }
    const editor = await createClassicEditor({
        target,
        textarea,
        assetBaseUrl: getEndpoint(config.assetBaseUrl, DEFAULT_ASSET_BASE_URL),
        styleProfileUrl: config.styleProfileUrl ? getEndpoint(config.styleProfileUrl, "/editor-style-profile.json") : undefined,
        styleProfile: config.styleProfile,
        labels: config.labels,
        i18n: config.i18n,
    });
    const state = {
        editor,
        form: formElement,
        target,
        textArea: textarea,
        statusNode: statusTarget,
    };
    const backdrop = resolveNode(config.backdropId ? `#${config.backdropId}` : "#modal-backdrop");
    if (backdrop instanceof HTMLElement) {
        bindMediaDelegates(backdrop);
    }
    state.form.addEventListener("submit", async (event) => {
        event.preventDefault();
        state.editor.syncToTextarea();
        await saveEditorContent(state.form, state.statusNode, getEndpoint(config.saveUrl, "/save"));
    });
    resolveNode(config.refreshButton || "#refresh")?.addEventListener("click", () => {
        state.editor.setContent("");
        state.statusNode.textContent = "Editor cleared.";
    });
    resolveNode(config.confirmButton || "#confirm-latest")?.addEventListener("click", async () => {
        const result = await loadLatestPost(getEndpoint(config.confirmUrl, "/confirm"), state.form, state.statusNode);
        if (typeof result.content === "string") {
            state.editor.setContent(result.content);
        }
    });
    resolveNode(config.previewButton || "#open-preview")?.addEventListener("click", () => {
        state.editor.syncToTextarea();
        const htmlPayload = state.textArea.value.trim();
        if (!htmlPayload) {
            state.statusNode.textContent = "Preview is empty.";
            return;
        }
        const encoded = encodeURIComponent(htmlPayload);
        window.open(`data:text/html,${encoded}`, "_blank", "noopener");
        state.statusNode.textContent = "Opening preview in a new tab.";
    });
    window.addEventListener("classic-editor:media-insert", (event) => {
        const html = event.detail?.html;
        if (html) {
            state.editor.insertHtml(html);
        }
    });
    return state;
}
if (typeof window !== "undefined" && typeof document !== "undefined" && !window.__classicEditorAutoBootDone) {
    window.__classicEditorAutoBootDone = true;
    const boot = async () => {
        if (!document.querySelector("[data-classic-editor]"))
            return;
        await bootstrapClassicEditor();
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
