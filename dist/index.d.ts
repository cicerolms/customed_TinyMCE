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
type OptionalNode = string | HTMLElement | null;
export type SharedEditorBootstrapConfig = {
    target?: OptionalNode;
    form?: OptionalNode;
    saveUrl?: string;
    confirmUrl?: string;
    statusNode?: OptionalNode;
    refreshButton?: OptionalNode;
    confirmButton?: OptionalNode;
    previewButton?: OptionalNode;
    tinymceBaseUrl?: string;
    tinymceVersion?: string;
    styleProfileUrl?: string;
    styleProfile?: EditorStyleProfile;
    labels?: ClassicEditorLabels;
    mediaEndpoint?: string;
    mediaResultsEndpoint?: string;
    backdropId?: string;
    tinyMceGlobal?: any;
};
type SharedEditorState = {
    editor: ClassicEditorInstance;
    form: HTMLFormElement;
    target: HTMLElement;
    textArea: HTMLTextAreaElement;
    codeTextArea: HTMLTextAreaElement;
    submitField: HTMLTextAreaElement;
    statusNode: HTMLElement;
};
export declare function bootstrapClassicEditor(config?: SharedEditorBootstrapConfig): Promise<SharedEditorState | null>;
export declare function createClassicEditor(config: ClassicEditorConfig): Promise<ClassicEditorInstance>;
export {};
