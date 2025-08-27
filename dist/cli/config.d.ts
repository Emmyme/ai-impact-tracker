export interface DashboardConfig {
    dashboard_url: string;
    api_key?: string;
    timeout?: number;
}
export interface CLIConfig {
    dashboard: DashboardConfig;
}
export declare class ConfigManager {
    private configPath;
    private config;
    constructor();
    loadConfig(): Promise<CLIConfig>;
    private loadFromEnvironment;
    private loadFromFile;
    saveConfig(config: Partial<CLIConfig>): Promise<void>;
    getDashboardConfig(): Promise<DashboardConfig>;
    getConfigPath(): string;
}
export declare const configManager: ConfigManager;
//# sourceMappingURL=config.d.ts.map