const DEFAULT_ASSET_BASE_URL = "/assets";
const LEGACY_EDITOR_VERSION = "20260411-cms-legacy-wp-editor-v1";
const LEGACY_TOOLBAR_1 = "formatselect,fontsizeselect,bold,italic,removeformat,underline,blockquote,bullist,numlist,alignleft,aligncenter,alignright,link,unlink,undo,redo,pastetext,charmap,wp_more,vietworklinkcard,forecolor,table,vietworkfullscreen";
const LEGACY_VECB_PLUGIN_NAMES = Array.from({ length: 18 }, (_, index) => `vecb_button${index + 1}`);
const LEGACY_TOOLBAR_2 = LEGACY_VECB_PLUGIN_NAMES.join(",");
const LEGACY_PLUGINS = [
    "charmap",
    "colorpicker",
    "hr",
    "lists",
    "link",
    "paste",
    "tabfocus",
    "textcolor",
    "wordpress",
    "advlist",
    "anchor",
    "code",
    "fullscreen",
    "insertdatetime",
    "media",
    "nonbreaking",
    "print",
    "searchreplace",
    "table",
    "visualblocks",
    "visualchars",
    "wptadv",
    ...LEGACY_VECB_PLUGIN_NAMES,
].join(",");
const DEFAULT_EDITOR_STYLE_PROFILE = {
    bodyClass: "cms-editor-content",
    blockFormats: "Paragraph=p;Heading 2=h2;Heading 3=h3;Heading 4=h4;Heading 5=h5;Heading 6=h6;Preformatted=pre",
    contentCssUrls: [],
    inlineCss: "",
    contentStyle: "",
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
function translate(key, fallback) {
    const api = window.__i18n;
    return api?.t?.(key, fallback) || fallback;
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
function defaultContentCssUrls(assetBaseUrl) {
    return [
        `${assetBaseUrl}/vendor/wp-legacy/wp-includes/js/tinymce/skins/lightgray/content.min.css`,
        `${assetBaseUrl}/vendor/wp-legacy/wp-includes/js/tinymce/skins/wordpress/wp-content.css`,
        `${assetBaseUrl}/vendor/wp-legacy/wp-content/plugins/visual-editor-custom-buttons/css/editor-style.css`,
        `${assetBaseUrl}/classic-editor-content.css`,
    ];
}
function legacyPluginSources(assetBaseUrl) {
    const tinyMceBase = `${assetBaseUrl}/vendor/wp-legacy/wp-includes/js/tinymce`;
    const tadvBase = `${assetBaseUrl}/vendor/wp-legacy/wp-content/plugins/tinymce-advanced`;
    const vecbBase = `${assetBaseUrl}/vendor/wp-legacy/wp-content/plugins/visual-editor-custom-buttons`;
    return {
        advlist: `${tadvBase}/mce/advlist/plugin.min.js`,
        anchor: `${tadvBase}/mce/anchor/plugin.min.js`,
        code: `${tadvBase}/mce/code/plugin.min.js`,
        fullscreen: `${tinyMceBase}/plugins/fullscreen/plugin.min.js`,
        insertdatetime: `${tadvBase}/mce/insertdatetime/plugin.min.js`,
        media: `${tinyMceBase}/plugins/media/plugin.min.js`,
        nonbreaking: `${tadvBase}/mce/nonbreaking/plugin.min.js`,
        print: `${tadvBase}/mce/print/plugin.min.js`,
        searchreplace: `${tadvBase}/mce/searchreplace/plugin.min.js`,
        table: `${tadvBase}/mce/table/plugin.min.js`,
        visualblocks: `${tadvBase}/mce/visualblocks/plugin.min.js`,
        visualchars: `${tadvBase}/mce/visualchars/plugin.min.js`,
        wptadv: `${tadvBase}/mce/wptadv/plugin.min.js`,
        ...Object.fromEntries(LEGACY_VECB_PLUGIN_NAMES.map((name, index) => [
            name,
            `${vecbBase}/js/button-1-${index + 1}.js`,
        ])),
    };
}
function normalizeCssUrl(url) {
    return url.trim();
}
function mergeProfiles(base, override) {
    if (!override)
        return base;
    return {
        bodyClass: override.bodyClass ?? base.bodyClass,
        blockFormats: override.blockFormats ?? base.blockFormats,
        contentCssUrls: override.contentCssUrls ? [...override.contentCssUrls] : base.contentCssUrls,
        inlineCss: override.inlineCss ?? base.inlineCss,
        contentStyle: override.contentStyle ?? base.contentStyle,
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
    if (Array.isArray(profile.contentCssUrls)) {
        next.contentCssUrls = profile.contentCssUrls
            .map((value) => (typeof value === "string" ? normalizeCssUrl(value) : ""))
            .filter(Boolean);
    }
    if (typeof profile.inlineCss === "string") {
        next.inlineCss = profile.inlineCss;
    }
    if (typeof profile.contentStyle === "string") {
        next.contentStyle = profile.contentStyle;
    }
    if (typeof profile.bodyClass === "string") {
        next.bodyClass = profile.bodyClass;
    }
    if (typeof profile.blockFormats === "string") {
        next.blockFormats = profile.blockFormats;
    }
    return next;
}
function ensureLegacyWpGlobals(win) {
    if (typeof win.getUserSetting !== "function") {
        win.getUserSetting = (name, fallback = "") => window.localStorage.getItem(`wp-user-setting:${name}`) ?? fallback;
    }
    if (typeof win.setUserSetting !== "function") {
        win.setUserSetting = (name, value) => {
            window.localStorage.setItem(`wp-user-setting:${name}`, String(value));
            return value;
        };
    }
    win.wp = win.wp || {};
    win.wp.editor = win.wp.editor || {};
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
        ensureLegacyWpGlobals(win);
        const tinyMceBaseUrl = `${assetBaseUrl}/vendor/wp-legacy/wp-includes/js/tinymce`;
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
        const pluginSources = legacyPluginSources(assetBaseUrl);
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
function localizeLegacyMenubar(editor) {
    const labels = [
        translate("editor.menu.file", "ファイル"),
        translate("editor.menu.edit", "編集"),
        translate("editor.menu.view", "表示"),
        translate("editor.menu.insert", "挿入"),
        translate("editor.menu.format", "フォーマット"),
        translate("editor.menu.tools", "ツール"),
        translate("editor.menu.table", "テーブル"),
    ];
    const nodes = Array.from(editor.getContainer().querySelectorAll(".mce-menubar .mce-menubtn span"));
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
                window.dispatchEvent(new CustomEvent("cicerolms:media-insert", { detail: { html } }));
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
    const wrap = target.querySelector(".wp-editor-wrap");
    if (!(visualTab instanceof HTMLButtonElement) || !(codeTab instanceof HTMLButtonElement) || !(wrap instanceof HTMLElement)) {
        throw new Error("Classic editor target is missing the legacy WP wrapper structure.");
    }
    const profileStack = [
        {
            ...DEFAULT_EDITOR_STYLE_PROFILE,
            contentCssUrls: defaultContentCssUrls(assetBaseUrl),
        },
    ];
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
    const contentCssUrls = (resolvedProfile.contentCssUrls || [])
        .filter((url) => typeof url === "string" && url.trim().length > 0)
        .map((url) => `${normalizeCssUrl(url)}?v=${LEGACY_EDITOR_VERSION}`);
    const contentStyle = [resolvedProfile.contentStyle, resolvedProfile.inlineCss]
        .filter((value) => typeof value === "string" && value.trim().length > 0)
        .join("\n\n");
    const tinymce = await waitForLegacyTinyMce(assetBaseUrl);
    await loadLegacyPluginScripts(tinymce, assetBaseUrl);
    let editorLang = registerLegacyEditorI18n(tinymce, window.__i18n?.lang || document.documentElement.lang || "ja");
    let editor = null;
    let mode = "visual";
    const editorId = textarea.id;
    const renderMode = () => {
        wrap.classList.toggle("tmce-active", mode === "visual");
        wrap.classList.toggle("html-active", mode === "code");
        visualTab.setAttribute("aria-pressed", String(mode === "visual"));
        codeTab.setAttribute("aria-pressed", String(mode === "code"));
    };
    const getLegacyConfig = () => ({
        selector: `#${editorId}`,
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
        plugins: LEGACY_PLUGINS,
        block_formats: resolvedProfile.blockFormats || DEFAULT_EDITOR_STYLE_PROFILE.blockFormats,
        fontsize_formats: "8pt 10pt 12pt 14pt 18pt 24pt 36pt",
        content_css: contentCssUrls,
        ...(contentStyle ? { content_style: contentStyle } : {}),
        body_class: resolvedProfile.bodyClass || DEFAULT_EDITOR_STYLE_PROFILE.bodyClass,
        wordpress_adv_hidden: false,
        table_toolbar: false,
        table_responsive_width: true,
        menu: {
            file: { title: translate("editor.menu.file", "ファイル"), items: "newdocument | print" },
            edit: { title: translate("editor.menu.edit", "編集"), items: "undo redo | cut copy paste pastetext | selectall | searchreplace" },
            view: { title: translate("editor.menu.view", "表示"), items: "code | visualaid visualchars visualblocks | fullscreen" },
            insert: { title: translate("editor.menu.insert", "挿入"), items: "link media | inserttable charmap hr nonbreaking anchor insertdatetime | vietworkaddmedia wp_more wp_page" },
            format: { title: translate("editor.menu.format", "フォーマット"), items: "bold italic underline strikethrough | superscript subscript codeformat | blockformats align | removeformat | tmaresettablesize tmaremovetablestyles" },
            tools: { title: translate("editor.menu.tools", "ツール"), items: "code" },
            table: { title: translate("editor.menu.table", "テーブル"), items: "inserttable tableprops deletetable | row column cell" },
        },
        init_instance_callback(instance) {
            editor = instance;
            localizeLegacyMenubar(instance);
        },
        setup(instance) {
            instance.addMenuItem("vietworkaddmedia", {
                text: translate("editor.insert.addMedia", label(labels, "addMedia", "メディアを追加")),
                icon: "media",
                context: "insert",
                onclick() {
                    const trigger = target.querySelector(".insert-media[data-media-modal-open]");
                    if (trigger instanceof HTMLElement) {
                        trigger.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, view: window }));
                    }
                },
            });
            instance.addButton("vietworklinkcard", {
                tooltip: translate("editor.linkCard.button", "Insert Linkcard"),
                image: `${assetBaseUrl}/vendor/pz-linkcard/mce-button.png`,
                onclick() {
                    openLinkCardDialog(instance, assetBaseUrl);
                },
            });
            instance.addButton("vietworkfullscreen", {
                tooltip: translate("editor.fullscreen.writer", "Distraction-free writing mode"),
                icon: "fullscreen",
                onclick() {
                    toggleEditorFullscreen(target, instance);
                },
            });
            instance.on("focus", () => {
                window.wpActiveEditor = editorId;
            });
            instance.on("init", () => {
                localizeLegacyMenubar(instance);
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
        const instances = await tinymce.init(getLegacyConfig());
        editor = instances[0] || tinymce.get(editorId) || null;
        return editor;
    };
    const removeVisualEditor = () => {
        const activeEditor = tinymce.get(editorId);
        if (activeEditor) {
            activeEditor.save();
            activeEditor.remove();
        }
        editor = null;
    };
    const refreshEditorLanguage = async (nextLang) => {
        const normalized = registerLegacyEditorI18n(tinymce, String(nextLang || ""));
        if (normalized === editorLang) {
            localizeLegacyMenubar(tinymce.get(editorId) || editor);
            return;
        }
        editorLang = normalized;
        if (mode !== "visual")
            return;
        const activeEditor = tinymce.get(editorId);
        activeEditor?.save();
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
            return;
        }
        mode = "visual";
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
        const nextLang = event instanceof CustomEvent ? event.detail?.lang : "";
        void refreshEditorLanguage(nextLang);
    });
    renderMode();
    await ensureVisualEditor();
    return {
        switchMode,
        insertHtml(html) {
            if (!html)
                return;
            const activeEditor = tinymce.get(editorId);
            if (mode === "visual" && activeEditor) {
                activeEditor.focus();
                activeEditor.selection.setContent(html);
                activeEditor.save();
                return;
            }
            insertAtCaret(textarea, html);
        },
        setContent(html) {
            textarea.value = html;
            const activeEditor = tinymce.get(editorId);
            if (mode === "visual" && activeEditor) {
                activeEditor.setContent(html || "");
                activeEditor.save();
            }
        },
        syncToTextarea() {
            const activeEditor = tinymce.get(editorId);
            activeEditor?.save();
        },
        async destroy() {
            removeVisualEditor();
            target.classList.remove("is-fullscreen");
            document.body.classList.remove("editor-fullscreen-active");
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
        styleProfileUrl: getEndpoint(config.styleProfileUrl, "/editor-style-profile.json"),
        styleProfile: config.styleProfile,
        labels: config.labels,
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
    window.addEventListener("cicerolms:media-insert", (event) => {
        const html = event.detail?.html;
        if (html) {
            state.editor.insertHtml(html);
        }
    });
    return state;
}
if (typeof window !== "undefined" && typeof document !== "undefined" && !window.__cicerolmsLegacyEditorAutoBootDone) {
    window.__cicerolmsLegacyEditorAutoBootDone = true;
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
