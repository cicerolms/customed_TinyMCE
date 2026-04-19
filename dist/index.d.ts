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
export declare function createClassicEditor(config: ClassicEditorConfig): Promise<ClassicEditorInstance>;
