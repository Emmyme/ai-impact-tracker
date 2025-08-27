import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
export async function setupDashboard(options) {
    console.log('Setting up AI Sustainability Dashboard for existing project...');
    try {
        const currentDir = process.cwd();
        const config = await getSetupConfig(options);
        await createDirectories(currentDir);
        await copyBackendFiles(currentDir);
        await copyFrontendFiles(currentDir);
        await createConfigFiles(currentDir, config);
        console.log('Installing dependencies...');
        await installDependencies(currentDir);
        console.log('Dashboard setup completed successfully!');
        showSetupNextSteps(config);
    }
    catch (error) {
        console.error('Failed to setup dashboard');
        throw error;
    }
}
async function getSetupConfig(options) {
    const answers = await inquirer.prompt([
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
            type: 'input',
            name: 'secretKey',
            message: 'Secret key for JWT authentication (or press Enter for auto-generated):',
            default: ''
        }
    ]);
    return {
        database: answers.database,
        port: answers.port,
        secretKey: answers.secretKey || generateSecretKey()
    };
}
function generateSecretKey() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
async function createDirectories(currentDir) {
    const dirs = [
        'backend',
        'backend/api',
        'backend/api/routes',
        'backend/api/models',
        'backend/api/schemas',
        'backend/core',
        'backend/core/database',
        'backend/data',
        'frontend',
        'frontend/src',
        'frontend/src/app',
        'frontend/src/components',
        'frontend/src/components/ui',
        'frontend/src/components/auth',
        'frontend/src/contexts',
        'frontend/src/lib',
        'data'
    ];
    for (const dir of dirs) {
        await fs.ensureDir(path.join(currentDir, dir));
    }
}
async function copyBackendFiles(currentDir) {
    const requirementsContent = `# AI Sustainability Dashboard Backend
# Core dependencies
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
pydantic-settings==2.1.0
python-dotenv==1.0.0

# Database
sqlalchemy==2.0.23
alembic==1.13.1

# Authentication & Security
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
email-validator==2.1.0

# AI Sustainability Tracking
codecarbon==2.3.4
carbontracker==1.2.6
psutil==5.9.6
GPUtil==1.4.0

# Utilities
requests==2.31.0
python-multipart==0.0.6
cors==1.0.1
loguru==0.7.2

# Development
pytest==7.4.3
black==23.11.0
flake8==6.1.0
mypy==1.7.1
`;
    await fs.writeFile(path.join(currentDir, 'requirements.txt'), requirementsContent);
    const mainPyContent = `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import auth, metrics

app = FastAPI(title="AI Sustainability Dashboard API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])
app.include_router(metrics.router, prefix="/api/metrics", tags=["metrics"])

@app.get("/")
async def root():
    return {"message": "AI Sustainability Dashboard API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
`;
    await fs.writeFile(path.join(currentDir, 'backend/main.py'), mainPyContent);
    const configPyContent = `import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    database_url: str = "sqlite:///./data/sustainability.db"
    database_type: str = "sqlite"
    
    # Server
    backend_port: int = 8000
    backend_host: str = "0.0.0.0"
    environment: str = "development"
    
    # Authentication
    secret_key: str = "your-secret-key-here-change-in-production"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Energy calculation (for local training)
    energy_provider: str = "local"
    region: str = "local"
    
    # PostgreSQL settings
    postgres_host: Optional[str] = None
    postgres_port: Optional[int] = None
    postgres_db: Optional[str] = None
    postgres_user: Optional[str] = None
    postgres_password: Optional[str] = None
    
    # MySQL settings
    mysql_host: Optional[str] = None
    mysql_port: Optional[int] = None
    mysql_db: Optional[str] = None
    mysql_user: Optional[str] = None
    mysql_password: Optional[str] = None
    
    class Config:
        env_file = ".env"
        case_sensitive = False

settings = Settings()
`;
    await fs.writeFile(path.join(currentDir, 'backend/core/config.py'), configPyContent);
    const databasePyContent = `from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from core.config import settings

# Create database engine
engine = create_engine(
    settings.database_url,
    connect_args={"check_same_thread": False} if settings.database_type == "sqlite" else {}
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create base class for models
Base = declarative_base()

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
`;
    await fs.writeFile(path.join(currentDir, 'backend/core/database/database.py'), databasePyContent);
    const initUsersContent = `#!/usr/bin/env python3
"""
Initialize the database with default users.
Run this script to create the database tables and add default users.

"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from core.database.database import engine, get_db, Base
from core.security import get_password_hash
from api.models.user import User
from sqlalchemy.orm import Session

def create_default_users():
    """Create default users in the database."""
    # Create all tables first
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    
    db = next(get_db())
    
    # Check if users already exist
    existing_admin = db.query(User).filter(User.username == "admin").first()
    if existing_admin:
        print("Default users already exist. Skipping user creation.")
        return
    
    # Create default users
    default_users = [
        {
            "username": "admin",
            "email": "admin@example.com",
            "full_name": "System Administrator",
            "role": "admin",
            "hashed_password": get_password_hash("admin123"),
            "is_active": True,
            "needs_password_setup": False
        },
        {
            "username": "developer",
            "email": "developer@example.com",
            "full_name": "AI Developer",
            "role": "developer",
            "hashed_password": get_password_hash("dev123"),
            "is_active": True,
            "needs_password_setup": False
        },
    ]
    
    for user_data in default_users:
        user = User(**user_data)
        db.add(user)
    
    db.commit()
    print("Default users created successfully!")
    print("Admin: admin / admin123")
    print("Developer: developer / dev123")

if __name__ == "__main__":
    create_default_users()
`;
    await fs.writeFile(path.join(currentDir, 'backend/init_users.py'), initUsersContent);
}
async function copyFrontendFiles(currentDir) {
    const frontendPackageJson = {
        name: "ai-sustainability-dashboard-frontend",
        version: '1.0.0',
        private: true,
        scripts: {
            dev: 'next dev',
            build: 'next build',
            start: 'next start',
            lint: 'next lint'
        },
        dependencies: {
            next: '14.0.4',
            react: '18.2.0',
            'react-dom': '18.2.0',
            '@types/node': '20.10.5',
            '@types/react': '18.2.45',
            '@types/react-dom': '18.2.18',
            typescript: '5.3.3',
            'tailwindcss': '3.3.6',
            'autoprefixer': '10.4.16',
            'postcss': '8.4.32',
            '@radix-ui/react-slot': '1.0.2',
            '@radix-ui/react-select': '2.0.0',
            '@radix-ui/react-dialog': '1.0.5',
            'class-variance-authority': '0.7.0',
            'clsx': '2.0.0',
            'tailwind-merge': '2.2.0',
            'lucide-react': '0.303.0',
            'next-themes': '0.2.1',
            'd3': '7.8.5',
            '@types/d3': '7.4.3'
        },
        devDependencies: {
            eslint: '8.56.0',
            'eslint-config-next': '14.0.4'
        }
    };
    await fs.writeJson(path.join(currentDir, 'frontend/package.json'), frontendPackageJson, { spaces: 2 });
    const nextConfigContent = `/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
  },
}

module.exports = nextConfig
`;
    await fs.writeFile(path.join(currentDir, 'frontend/next.config.js'), nextConfigContent);
    const tailwindConfigContent = `/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
`;
    await fs.writeFile(path.join(currentDir, 'frontend/tailwind.config.js'), tailwindConfigContent);
    const postcssConfigContent = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`;
    await fs.writeFile(path.join(currentDir, 'frontend/postcss.config.js'), postcssConfigContent);
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
    await fs.writeFile(path.join(currentDir, 'frontend/tsconfig.json'), tsconfigContent);
}
async function createConfigFiles(currentDir, config) {
    const envContent = `# Database Configuration
DATABASE_URL=sqlite:///./data/sustainability.db
DATABASE_TYPE=${config.database}

# Backend Configuration
BACKEND_PORT=8000
BACKEND_HOST=0.0.0.0
ENVIRONMENT=development

# Frontend Configuration
FRONTEND_PORT=${config.port}
NEXT_PUBLIC_API_URL=http://localhost:8000

# Authentication Settings
SECRET_KEY=${config.secretKey}
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Energy Calculation Settings
ENERGY_PROVIDER=aws
REGION=us-east-1
`;
    await fs.writeFile(path.join(currentDir, '.env'), envContent);
    const packageJson = {
        name: "ai-sustainability-dashboard",
        version: '1.0.0',
        description: "AI Sustainability Dashboard",
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
    await fs.writeJson(path.join(currentDir, 'package.json'), packageJson, { spaces: 2 });
}
async function installDependencies(currentDir) {
    try {
        console.log('Installing Python dependencies...');
        const { execSync } = await import('child_process');
        execSync('pip install -r requirements.txt', { cwd: currentDir, stdio: 'pipe' });
        console.log('Installing Node.js dependencies...');
        execSync('npm install', { cwd: currentDir, stdio: 'pipe' });
        execSync('npm install', { cwd: path.join(currentDir, 'frontend'), stdio: 'pipe' });
    }
    catch (error) {
        throw new Error('Failed to install dependencies. Please run "pip install -r requirements.txt" and "npm install" manually.');
    }
}
function showSetupNextSteps(config) {
    console.log('\nSetup completed! Next steps:');
    console.log(`1. Initialize the database and create default users:`);
    console.log(`   npm run db:init-users`);
    console.log(`2. Start the dashboard:`);
    console.log(`   npm run dev`);
    console.log(`3. Access the dashboard at:`);
    console.log(`   http://localhost:${config.port}`);
    console.log(`4. Log in with default credentials:`);
    console.log(`   Admin: admin / admin123`);
    console.log(`   Developer: developer / dev123`);
    console.log(`5. Start tracking your AI workloads:`);
    console.log(`   ai-dashboard run python your_ai_script.py`);
    console.log('\nHappy sustainable AI development!');
}
//# sourceMappingURL=setup.js.map