export type ClassicEditorLabels = {
    addMedia?: string;
    visual?: string;
    code?: string;
    source?: string;
};
export type EditorStyleProfileCss = {
    self?: string;
    base?: string;
    extend?: string;
};
export type EditorStyleProfile = {
    contentCssUrls?: string[];
    inlineCss?: string;
    bodyClass?: string;
    blockFormats?: string;
    contentStyle?: string;
    extendCssUrl?: string;
    css?: EditorStyleProfileCss;
};
export type ClassicEditorConfig = {
    target: HTMLElement;
    textarea: HTMLTextAreaElement;
    assetBaseUrl?: string;
    styleProfile?: EditorStyleProfile;
    styleProfileUrl?: string;
    labels?: ClassicEditorLabels;
};
export type ClassicEditorInstance = {
    switchMode(nextMode: "visual" | "code"): Promise<void>;
    insertHtml(html: string): void;
    setContent(html: string): void;
    syncToTextarea(): void;
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
    styleProfileUrl?: string;
    styleProfile?: EditorStyleProfile;
    labels?: ClassicEditorLabels;
    backdropId?: string;
    assetBaseUrl?: string;
};
type SharedEditorState = {
    editor: ClassicEditorInstance;
    form: HTMLFormElement;
    target: HTMLElement;
    textArea: HTMLTextAreaElement;
    statusNode: HTMLElement;
};
export declare function createClassicEditor(config: ClassicEditorConfig): Promise<ClassicEditorInstance>;
export declare function bootstrapClassicEditor(config?: SharedEditorBootstrapConfig): Promise<SharedEditorState | null>;
export {};
