export interface AuthConfig {
  apiUrl: string;
  tokenKey: string;
  loginEndpoint: string;
  registerEndpoint: string;
  meEndpoint: string;
  setupPasswordEndpoint: string;
}

export const defaultAuthConfig: AuthConfig = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  tokenKey: 'authToken',
  loginEndpoint: '/api/auth/login',
  registerEndpoint: '/api/auth/register',
  meEndpoint: '/api/auth/me',
  setupPasswordEndpoint: '/api/auth/setup-password'
};

export function getAuthConfig(): AuthConfig {
  // Allow environment variable overrides
  const config = { ...defaultAuthConfig };
  
  if (process.env.NEXT_PUBLIC_API_URL) {
    config.apiUrl = process.env.NEXT_PUBLIC_API_URL;
  }
  
  if (process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY) {
    config.tokenKey = process.env.NEXT_PUBLIC_AUTH_TOKEN_KEY;
  }
  
  return config;
}

export function getApiUrl(endpoint: string): string {
  const config = getAuthConfig();
  return `${config.apiUrl}${endpoint}`;
}

export function getTokenKey(): string {
  const config = getAuthConfig();
  return config.tokenKey;
}
