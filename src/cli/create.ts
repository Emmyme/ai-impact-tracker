import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import { execSync } from 'child_process';

interface CreateOptions {
  template: string;
  yes: boolean;
}

export async function createProject(projectName: string, options: CreateOptions): Promise<void> {
  console.log('Creating AI Sustainability Dashboard project...');
  
  try {
    const projectPath = path.resolve(projectName);
    
    if (await fs.pathExists(projectPath)) {
      console.error('Project directory already exists');
      throw new Error(`Directory ${projectName} already exists. Please choose a different name.`);
    }

    await fs.ensureDir(projectPath);
    
    const config = await getProjectConfig(projectName, options);
    
    await createProjectStructure(projectPath, config);
    
    console.log('Installing dependencies...');
    await installDependencies(projectPath);
    
    console.log('Setting up database...');
    await setupDatabase(projectPath, config);
    
    console.log(`AI Sustainability Dashboard created successfully!`);
    
    showNextSteps(projectName, config);
    
  } catch (error) {
    console.error('Failed to create project');
    throw error;
  }
}

async function getProjectConfig(projectName: string, options: CreateOptions) {
  if (options.yes) {
    return {
      name: projectName,
      description: `AI Sustainability Dashboard for ${projectName}`,
      database: 'sqlite',
      port: 3000,
      template: options.template,
      features: ['energy-tracking', 'carbon-footprint', 'water-usage', 'insights', 'authentication', 'user-management', 'dark-mode', 'real-time-charts']
    };
  }

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'description',
      message: 'Project description:',
      default: `AI Sustainability Dashboard for ${projectName}`
    },
    {
      type: 'list',
      name: 'database',
      message: 'Choose database:',
      choices: [
        { name: 'SQLite (recommended for development)', value: 'sqlite' },
        { name: 'PostgreSQL', value: 'postgres' },
        { name: 'MySQL', value: 'mysql' }
      ],
      default: 'sqlite'
    },
    {
      type: 'number',
      name: 'port',
      message: 'Dashboard port:',
      default: 3000
    },
    {
      type: 'checkbox',
      name: 'features',
      message: 'Select features to include:',
      choices: [
        { name: 'Energy Tracking', value: 'energy-tracking', checked: true },
        { name: 'Carbon Footprint', value: 'carbon-footprint', checked: true },
        { name: 'Water Usage', value: 'water-usage', checked: true },
        { name: 'Sustainability Insights', value: 'insights', checked: true },
        { name: 'User Authentication', value: 'authentication', checked: true },
        { name: 'User Management', value: 'user-management', checked: true },
        { name: 'Dark Mode', value: 'dark-mode', checked: true },
        { name: 'Real-time Charts', value: 'real-time-charts', checked: true },
        { name: 'Team Management', value: 'teams', checked: true },
        { name: 'API Access', value: 'api', checked: true }
      ]
    }
  ]);

  return {
    name: projectName,
    description: answers.description,
    database: answers.database,
    port: answers.port,
    template: options.template,
    features: answers.features
  };
}

async function createProjectStructure(projectPath: string, config: any): Promise<void> {

  const dirs = [
    'backend',
    'backend/api',
    'backend/api/routes',
    'backend/api/models',
    'backend/api/schemas',
    'backend/api/services',
    'backend/core',
    'backend/core/database',
    'backend/core/config',
    'backend/utils',
    'frontend',
    'frontend/src',
    'frontend/src/app',
    'frontend/src/components',
    'frontend/src/components/ui',
    'frontend/src/components/auth',
    'frontend/src/contexts',
    'frontend/src/lib',
    'frontend/src/pages',
    'frontend/src/utils',
    'frontend/public',
    'data',
    'docker',
    'scripts',
    'tests'
  ];

  for (const dir of dirs) {
    await fs.ensureDir(path.join(projectPath, dir));
  }

  // Find templates directory - try multiple possible locations
  let templateDir = '';
  
  console.log(`Current working directory: ${process.cwd()}`);
  
  // Try current working directory first
  const cwdTemplates = path.join(process.cwd(), 'templates');
  console.log(`Checking CWD templates: ${cwdTemplates}`);
  if (await fs.pathExists(cwdTemplates)) {
    templateDir = cwdTemplates;
    console.log(`Found templates in CWD: ${templateDir}`);
  } else {
    console.log(`Templates not found in CWD`);
    
    // Try relative to the CLI tool's location
    const currentFileUrl = new URL(import.meta.url);
    const currentFilePath = currentFileUrl.pathname;
    const cliDir = path.dirname(currentFilePath);
    console.log(`CLI directory: ${cliDir}`);
    
    // Convert Unix-style path to Windows path if needed
    let normalizedCliDir = cliDir;
    if (cliDir.startsWith('/')) {
      normalizedCliDir = cliDir.substring(1).replace(/\//g, '\\');
    }
    console.log(`Normalized CLI directory: ${normalizedCliDir}`);
    
    // Try different relative paths
    const possiblePaths = [
      path.join(normalizedCliDir, '..', 'templates'), // For global install: dist/../templates
      path.join(normalizedCliDir, '..', '..', 'templates'), // For local development: dist/cli/../../templates
      path.join(normalizedCliDir, '..', '..', '..', 'templates'), // For local development: dist/cli/../../../templates
      path.join(normalizedCliDir, 'templates'),
      path.join(process.cwd(), '..', 'templates'),
      path.join(process.cwd(), '..', '..', 'templates')
    ];
    
    console.log('Checking possible paths:');
    for (const possiblePath of possiblePaths) {
      console.log(`  ${possiblePath} - exists: ${await fs.pathExists(possiblePath)}`);
      if (await fs.pathExists(possiblePath)) {
        templateDir = possiblePath;
        console.log(`Found templates at: ${templateDir}`);
        break;
      }
    }
  }
  
  if (!templateDir) {
    throw new Error('Could not find templates directory. Please ensure the CLI tool is properly installed.');
  }
  
  console.log(`Final template directory: ${templateDir}`);
  console.log(`Template directory exists: ${await fs.pathExists(templateDir)}`);

  const backendTemplates = [
    { src: 'backend_main.py', dest: 'backend/main.py' },
    { src: 'backend_core_config.py', dest: 'backend/core/config.py' },
    { src: 'backend_core_database_database.py', dest: 'backend/core/database/database.py' },
    { src: 'backend_core_database_models.py', dest: 'backend/core/database/models.py' },
    { src: 'backend_core_security.py', dest: 'backend/core/security.py' },
    { src: 'backend_api_models_user.py', dest: 'backend/api/models/user.py' },
    { src: 'backend_api_models_metric.py', dest: 'backend/api/models/metric.py' },
    { src: 'backend_api_routes_init.py', dest: 'backend/api/routes/__init__.py' },
    { src: 'backend_api_routes_auth.py', dest: 'backend/api/routes/auth.py' },
    { src: 'backend_api_routes_metrics.py', dest: 'backend/api/routes/metrics.py' },
    { src: 'backend_api_schemas_init.py', dest: 'backend/api/schemas/__init__.py' },
    { src: 'backend_api_schemas_user.py', dest: 'backend/api/schemas/user.py' },
    { src: 'backend_api_schemas_metrics.py', dest: 'backend/api/schemas/metrics.py' },
    { src: 'backend_init_users.py', dest: 'backend/init_users.py' },
    { src: 'requirements.txt', dest: 'requirements.txt' }
  ];

  for (const template of backendTemplates) {
    const srcPath = path.join(templateDir, template.src);
    const destPath = path.join(projectPath, template.dest);
    
    if (await fs.pathExists(srcPath)) {
      await fs.copy(srcPath, destPath);
    }
  }

  const frontendTemplates = [
    { src: 'frontend_package.json', dest: 'frontend/package.json' },
    { src: 'frontend_tailwind.config.js', dest: 'frontend/tailwind.config.js' },
    { src: 'frontend_components.json', dest: 'frontend/components.json' },
    { src: 'frontend_globals.css', dest: 'frontend/src/app/globals.css' },
    { src: 'frontend_lib_utils.ts', dest: 'frontend/src/lib/utils.ts' },
    { src: 'frontend_app_page.tsx', dest: 'frontend/src/app/page.tsx' },
    { src: 'frontend_app_layout.tsx', dest: 'frontend/src/app/layout.tsx' },
    { src: 'frontend_components_theme_provider.tsx', dest: 'frontend/src/components/theme-provider.tsx' },
    { src: 'frontend_components_mode_toggle.tsx', dest: 'frontend/src/components/mode-toggle.tsx' },
    { src: 'frontend_components_auth_login_form.tsx', dest: 'frontend/src/components/auth/login-form.tsx' },
    { src: 'frontend_components_auth_protected_route.tsx', dest: 'frontend/src/components/auth/protected-route.tsx' },
    { src: 'frontend_components_auth_password_setup.tsx', dest: 'frontend/src/components/auth/password-setup.tsx' },
    { src: 'frontend_components_auth_user_management.tsx', dest: 'frontend/src/components/auth/user-management.tsx' },
    { src: 'frontend_contexts_auth_context.tsx', dest: 'frontend/src/contexts/auth-context.tsx' },
    { src: 'frontend_config_auth.ts', dest: 'frontend/src/config/auth.ts' },
    { src: 'frontend_components_ui_button.tsx', dest: 'frontend/src/components/ui/button.tsx' },
    { src: 'frontend_components_ui_card.tsx', dest: 'frontend/src/components/ui/card.tsx' },
    { src: 'frontend_components_ui_input.tsx', dest: 'frontend/src/components/ui/input.tsx' },
    { src: 'frontend_components_ui_label.tsx', dest: 'frontend/src/components/ui/label.tsx' },
    { src: 'frontend_components_ui_alert.tsx', dest: 'frontend/src/components/ui/alert.tsx' },
    { src: 'frontend_components_ui_badge.tsx', dest: 'frontend/src/components/ui/badge.tsx' },
    { src: 'frontend_components_ui_modal.tsx', dest: 'frontend/src/components/ui/modal.tsx' },
    { src: 'frontend_components_ui_select.tsx', dest: 'frontend/src/components/ui/select.tsx' }
  ];

  const envTemplates = [
    { src: 'backend_env_example', dest: '.env.example' }
  ];

  const otherTemplates = [
    { src: 'LICENSE', dest: 'LICENSE' }
  ];

  const dockerTemplates = [
    { src: 'docker_compose_yml', dest: 'docker-compose.yml' },
    { src: 'docker_backend_dockerfile', dest: 'docker/backend.Dockerfile' },
    { src: 'docker_frontend_dockerfile', dest: 'docker/frontend.Dockerfile' }
  ];

  for (const template of frontendTemplates) {
    const srcPath = path.join(templateDir, template.src);
    const destPath = path.join(projectPath, template.dest);
    
    if (await fs.pathExists(srcPath)) {
      await fs.copy(srcPath, destPath);
    }
  }

  // Copy environment files
  for (const template of envTemplates) {
    const srcPath = path.join(templateDir, template.src);
    const destPath = path.join(projectPath, template.dest);
    
    if (await fs.pathExists(srcPath)) {
      await fs.copy(srcPath, destPath);
    }
  }

  // Copy Docker files
  for (const template of dockerTemplates) {
    const srcPath = path.join(templateDir, template.src);
    const destPath = path.join(projectPath, template.dest);
    
    if (await fs.pathExists(srcPath)) {
      await fs.copy(srcPath, destPath);
    }
  }

  // Copy other files
  for (const template of otherTemplates) {
    const srcPath = path.join(templateDir, template.src);
    const destPath = path.join(projectPath, template.dest);
    
    if (await fs.pathExists(srcPath)) {
      await fs.copy(srcPath, destPath);
    }
  }

  await createAdditionalFiles(projectPath, config);
}

async function createAdditionalFiles(projectPath: string, config: any): Promise<void> {

  const packageJson = {
    name: config.name,
    version: '1.0.0',
    description: config.description,
    scripts: {
      'dev:backend': 'uvicorn backend.main:app --reload --port 8000',
      'dev:frontend': 'cd frontend && npm run dev',
      'dev': 'concurrently "npm run dev:backend" "npm run dev:frontend"',
      'build:frontend': 'cd frontend && npm run build',
      'start:backend': 'uvicorn backend.main:app --host 0.0.0.0 --port 8000',
      'start:frontend': 'cd frontend && npm start',
      'db:init-users': 'python backend/init_users.py',
      'test:backend': 'pytest',
      'test:frontend': 'cd frontend && npm test',
      'lint:backend': 'black backend && flake8 backend',
      'lint:frontend': 'cd frontend && npm run lint',
      'format:backend': 'black backend',
      'format:frontend': 'cd frontend && npm run format'
    },
    devDependencies: {
      concurrently: '^8.2.2'
    }
  };
  await fs.writeJson(path.join(projectPath, 'package.json'), packageJson, { spaces: 2 });

  const nextConfigContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
}

module.exports = nextConfig
`;
  await fs.writeFile(path.join(projectPath, 'frontend/next.config.js'), nextConfigContent);

  const postcssConfigContent = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;
  await fs.writeFile(path.join(projectPath, 'frontend/postcss.config.js'), postcssConfigContent);

  const tsconfigContent = `{
  "compilerOptions": {
    "target": "es5",
    "lib": ["dom", "dom.iterable", "es6"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`;
  await fs.writeFile(path.join(projectPath, 'frontend/tsconfig.json'), tsconfigContent);

  const readmeContent = `# ${config.name}

${config.description}

## Features

${config.features.map((feature: string) => `- ${feature}`).join('\n')}

## Quick Start

1. Install Python dependencies:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`

2. Install Node.js dependencies:
   \`\`\`bash
   npm install
   cd frontend && npm install
   \`\`\`

3. Copy environment file:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

4. Initialize the database and create default users:
   \`\`\`bash
   npm run db:init-users
   \`\`\`

5. Start the development servers:
   \`\`\`bash
   npm run dev
   \`\`\`

6. Access the dashboard at http://localhost:3000

## Default Users

After running \`npm run db:init-users\`, you can log in with:

- **Admin**: username=\`admin\`, password=\`admin123\`
- **Developer**: username=\`developer\`, password=\`dev123\`
- **Manager**: username=\`manager\`, password=\`manager123\`

## Track AI Workloads

\`\`\`bash
# Track a Python AI script
ai-dashboard run python train_model.py

# Track with project and team
ai-dashboard run --project "image-classification" --team "ml-team" python train_model.py
\`\`\`

## Architecture

- **Backend**: Python FastAPI with SQLAlchemy and JWT authentication
- **Database**: ${config.database} (SQLite/PostgreSQL/MySQL)
- **Frontend**: Next.js 14 with React, TypeScript, and Tailwind CSS
- **AI Tracking**: CodeCarbon and CarbonTracker libraries
- **Authentication**: JWT-based with role-based access control
- **UI Components**: shadcn/ui with dark mode support
- **Charts**: D3.js for interactive data visualization

## API Endpoints

- \`POST /api/auth/login\` - User authentication
- \`POST /api/auth/register\` - User registration (admin/developer only)
- \`GET /api/metrics\` - Get sustainability metrics
- \`POST /api/metrics\` - Add new metrics
- \`GET /api/auth/me\` - Get current user info

## Development

\`\`\`bash
# Backend development
npm run dev:backend

# Frontend development
npm run dev:frontend

# Run tests
npm run test:backend
npm run test:frontend

# Format code
npm run format:backend
npm run format:frontend
\`\`\`

For more information, see the [main documentation](https://github.com/your-username/ai-sustainability-dashboard).
`;
  await fs.writeFile(path.join(projectPath, 'README.md'), readmeContent);
}

async function installDependencies(projectPath: string): Promise<void> {
  try {
    execSync('npm install', { cwd: projectPath, stdio: 'pipe' });
    execSync('npm install', { cwd: path.join(projectPath, 'frontend'), stdio: 'pipe' });
  } catch (error) {
    throw new Error('Failed to install dependencies. Please run "npm install" manually in both root and frontend directories.');
  }
}

async function setupDatabase(projectPath: string, config: any): Promise<void> {
  // Create data directory for SQLite
  if (config.database === 'sqlite') {
    await fs.ensureDir(path.join(projectPath, 'data'));
    await fs.ensureDir(path.join(projectPath, 'backend/data'));
  }
  
  // TODO: Initialize database schema
  // This will be implemented when we create the database models
}

function showNextSteps(projectName: string, config: any): void {
  console.log('\n🎉 Next steps:');
  console.log(`1. Navigate to your project:`);
  console.log(`   cd ${projectName}`);
  console.log(`2. Copy the environment file:`);
  console.log(`   cp .env.example .env`);
  console.log(`3. Initialize the database and create default users:`);
  console.log(`   npm run db:init-users`);
  console.log(`4. Start the dashboard:`);
  console.log(`   npm run dev`);
  console.log(`5. Access the dashboard at:`);
  console.log(`   http://localhost:${config.port}`);
  console.log(`6. Log in with default credentials:`);
  console.log(`   Admin: admin / admin123`);
  console.log(`   Developer: developer / dev123`);
  console.log(`   Manager: manager / manager123`);
  console.log(`7. Start tracking your AI workloads:`);
  console.log(`   ai-dashboard run python your_ai_script.py`);
  console.log('\nHappy sustainable AI development! 🌱');
}
