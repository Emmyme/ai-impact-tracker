// Authentication Configuration
// Companies can customize these settings for their self-hosted deployment

export interface AuthConfig {
  // Enable/disable authentication
  enabled: boolean;
  
  // Authentication method
  method: 'simple' | 'ldap' | 'oauth' | 'saml';
  
  // Session settings
  sessionTimeout: number; // minutes
  rememberMe: boolean;
  
  // User roles and permissions
  roles: {
    admin: string[];
    viewer: string[];
    developer: string[];
  };
  
  // Default users (for simple auth method)
  defaultUsers: Array<{
    username: string;
    password: string;
    role: 'admin' | 'viewer' | 'developer';
    name: string;
    email?: string;
  }>;
  
  // LDAP settings (if using LDAP)
  ldap?: {
    server: string;
    port: number;
    baseDN: string;
    bindDN: string;
    bindPassword: string;
  };
  
  // OAuth settings (if using OAuth)
  oauth?: {
    provider: 'google' | 'github' | 'azure' | 'okta';
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
}

// Default configuration - companies should override this
export const defaultAuthConfig: AuthConfig = {
  enabled: true,
  method: 'simple',
  sessionTimeout: 480, // 8 hours
  rememberMe: true,
  
  roles: {
    admin: ['read', 'write', 'delete', 'manage_users', 'view_analytics'],
    viewer: ['read', 'view_analytics'],
    developer: ['read', 'write', 'view_analytics'],
  },
  
  defaultUsers: [
    {
      username: 'admin',
      password: 'admin123',
      role: 'admin',
      name: 'System Administrator',
      email: 'admin@company.com',
    },
    {
      username: 'manager',
      password: 'manager123',
      role: 'viewer',
      name: 'Project Manager',
      email: 'manager@company.com',
    },
    {
      username: 'developer',
      password: 'dev123',
      role: 'developer',
      name: 'AI Developer',
      email: 'developer@company.com',
    },
  ],
};

// Environment-based configuration
export function getAuthConfig(): AuthConfig {
  // Companies can override this by setting environment variables
  const config = { ...defaultAuthConfig };
  
  // Override with environment variables if present
  if (process.env.NEXT_PUBLIC_AUTH_ENABLED !== undefined) {
    config.enabled = process.env.NEXT_PUBLIC_AUTH_ENABLED === 'true';
  }
  
  if (process.env.NEXT_PUBLIC_AUTH_METHOD) {
    config.method = process.env.NEXT_PUBLIC_AUTH_METHOD as any;
  }
  
  if (process.env.NEXT_PUBLIC_SESSION_TIMEOUT) {
    config.sessionTimeout = parseInt(process.env.NEXT_PUBLIC_SESSION_TIMEOUT);
  }
  
  return config;
}
