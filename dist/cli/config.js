import fs from 'fs-extra';
import path from 'path';
import os from 'os';
const DEFAULT_CONFIG = {
    dashboard: {
        dashboard_url: 'http://localhost:8000',
        timeout: 5000
    }
};
export class ConfigManager {
    constructor() {
        this.configPath = path.join(os.homedir(), '.ai-dashboard', 'config.json');
        this.config = { ...DEFAULT_CONFIG };
    }
    async loadConfig() {
        this.loadFromEnvironment();
        await this.loadFromFile();
        return this.config;
    }
    loadFromEnvironment() {
        const envUrl = process.env.AI_DASHBOARD_URL;
        const envApiKey = process.env.AI_DASHBOARD_API_KEY;
        const envTimeout = process.env.AI_DASHBOARD_TIMEOUT;
        if (envUrl) {
            this.config.dashboard.dashboard_url = envUrl;
        }
        if (envApiKey) {
            this.config.dashboard.api_key = envApiKey;
        }
        if (envTimeout) {
            this.config.dashboard.timeout = parseInt(envTimeout, 10);
        }
    }
    async loadFromFile() {
        try {
            if (await fs.pathExists(this.configPath)) {
                const fileConfig = await fs.readJson(this.configPath);
                this.config = { ...this.config, ...fileConfig };
            }
        }
        catch (error) {
            console.warn('Warning: Could not load config file:', error);
        }
    }
    async saveConfig(config) {
        try {
            await fs.ensureDir(path.dirname(this.configPath));
            this.config = { ...this.config, ...config };
            await fs.writeJson(this.configPath, this.config, { spaces: 2 });
        }
        catch (error) {
            throw new Error(`Failed to save config: ${error}`);
        }
    }
    async getDashboardConfig() {
        const config = await this.loadConfig();
        return config.dashboard;
    }
    getConfigPath() {
        return this.configPath;
    }
}
export const configManager = new ConfigManager();
//# sourceMappingURL=config.js.map