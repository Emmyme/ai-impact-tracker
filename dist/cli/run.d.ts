interface RunOptions {
    project?: string;
    team?: string;
    environment?: string;
    config?: string;
    track?: boolean;
    dryRun?: boolean;
    dashboardUrl?: string;
    apiKey?: string;
}
export declare function runAI(script: string, options: RunOptions): Promise<void>;
export {};
//# sourceMappingURL=run.d.ts.map