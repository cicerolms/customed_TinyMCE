export type ClassicEditorLabels = {
    addMedia?: string;
    visual?: string;
    code?: string;
    source?: string;
};
export type ClassicEditorI18nConfig = {
    lang?: string;
    t?: (key: string, fallback?: string) => string;
};
export type EditorStyleProfile = {
    bodyClass?: string;
    blockFormats?: string;
};
export type ClassicEditorConfig = {
    target: HTMLElement;
    textarea: HTMLTextAreaElement;
    assetBaseUrl?: string;
    styleProfile?: EditorStyleProfile;
    styleProfileUrl?: string;
    labels?: ClassicEditorLabels;
    i18n?: ClassicEditorI18nConfig;
    primeToolbarOnInit?: boolean;
};
export type ClassicEditorInstance = {
    switchMode(nextMode: "visual" | "code"): Promise<void>;
    getLocale(): string;
    setLocale(nextLocale: string): Promise<void>;
    setI18n(nextI18n: ClassicEditorI18nConfig): Promise<void>;
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
    i18n?: ClassicEditorI18nConfig;
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
export declare function dispatchClassicEditorI18n(nextI18n: ClassicEditorI18nConfig): void;
export declare function createClassicEditor(config: ClassicEditorConfig): Promise<ClassicEditorInstance>;
export declare function bootstrapClassicEditor(config?: SharedEditorBootstrapConfig): Promise<SharedEditorState | null>;
export {};
