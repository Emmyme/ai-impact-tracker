interface StartOptions {
    project?: string;
    team?: string;
    environment?: string;
    port?: string;
    autoInstall?: boolean;
}
export declare function startSeamless(script: string, options: StartOptions): Promise<void>;
export {};
//# sourceMappingURL=start.d.ts.map