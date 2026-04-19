export type LegacyTinyMce = any;

export type LegacyEditorHostWindow = Window & typeof globalThis & {
  tinymce?: LegacyTinyMce;
  wp?: Record<string, unknown>;
  wpActiveEditor?: string;
  classicEditorActiveId?: string;
  getUserSetting?: (name: string, fallback?: string) => string;
  setUserSetting?: (name: string, value: string) => string;
};

export const LEGACY_EDITOR_VERSION = "20260419-classic-editor-shell-v1";
export const LEGACY_TOOLBAR_1 =
  "formatselect,fontsizeselect,bold,italic,removeformat,underline,blockquote,bullist,numlist,alignleft,aligncenter,alignright,link,unlink,undo,redo,pastetext,charmap,wp_more,classiceditorlinkcard,forecolor,table,classiceditorfullscreen";
export const LEGACY_PLUGINS = [
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
].join(",");
export const LEGACY_INSERT_MENU_ITEMS =
  "link media | inserttable charmap hr nonbreaking anchor insertdatetime | classiceditoraddmedia wp_more wp_page";
export const LEGACY_WORDPRESS_ADV_HIDDEN = false;

export function defaultLegacyContentCssUrls(assetBaseUrl: string): string[] {
  return [
    `${assetBaseUrl}/vendor/legacy-classic-editor/wp-includes/js/tinymce/skins/lightgray/content.min.css`,
    `${assetBaseUrl}/vendor/legacy-classic-editor/wp-includes/js/tinymce/skins/wordpress/wp-content.css`,
    `${assetBaseUrl}/vendor/legacy-classic-editor/wp-content/plugins/visual-editor-custom-buttons/css/editor-style.css`,
    "/styles.css",
  ];
}

export function legacyPluginSources(assetBaseUrl: string, vecbPluginNames: string[]): Record<string, string> {
  const tinyMceBase = `${assetBaseUrl}/vendor/legacy-classic-editor/wp-includes/js/tinymce`;
  const tadvBase = `${assetBaseUrl}/vendor/legacy-classic-editor/wp-content/plugins/tinymce-advanced`;
  const vecbBase = `${assetBaseUrl}/vendor/legacy-classic-editor/wp-content/plugins/visual-editor-custom-buttons`;
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
    ...Object.fromEntries(
      vecbPluginNames.map((name, index) => [name, `${vecbBase}/js/button-1-${index + 1}.js`]),
    ),
  };
}

export function ensureLegacyEditorGlobals(win: LegacyEditorHostWindow): void {
  if (typeof win.getUserSetting !== "function") {
    win.getUserSetting = (name: string, fallback = "") =>
      window.localStorage.getItem(`classic-editor-user-setting:${name}`) ?? fallback;
  }
  if (typeof win.setUserSetting !== "function") {
    win.setUserSetting = (name: string, value: string) => {
      window.localStorage.setItem(`classic-editor-user-setting:${name}`, String(value));
      return value;
    };
  }
  win.wp = win.wp || {};
  (win.wp as Record<string, unknown>).editor = (win.wp as Record<string, unknown>).editor || {};
}

export function legacyTinyMceBaseUrl(assetBaseUrl: string): string {
  return `${assetBaseUrl}/vendor/legacy-classic-editor/wp-includes/js/tinymce`;
}

export function resolveLegacyEditorWrap(target: HTMLElement): HTMLElement | null {
  return target.querySelector(".classic-editor-shell-wrap, .wp-editor-wrap");
}

export function markLegacyActiveEditor(win: LegacyEditorHostWindow, editorId: string): void {
  win.wpActiveEditor = editorId;
  win.classicEditorActiveId = editorId;
}
