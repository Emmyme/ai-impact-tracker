import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const TEMPLATE_DIR = path.join(__dirname, "templates");
const TARGET_PROJECT = process.argv[2] || "test13";

if (!TARGET_PROJECT) {
  console.error("Usage: node debug-copy-templates.js <project-name>");
  console.error("Example: node debug-copy-templates.js test");
  process.exit(1);
}

const TARGET_DIR = path.join(__dirname, "..", TARGET_PROJECT);

// Files to copy (only the ones we're debugging)
const filesToCopy = [
  // Backend files
  { src: "backend_main.py", dest: "backend/main.py" },
  {
    src: "backend_core_database_database.py",
    dest: "backend/core/database/database.py",
  },
  { src: "backend_api_routes_auth.py", dest: "backend/api/routes/auth.py" },
  {
    src: "backend_api_routes_metrics.py",
    dest: "backend/api/routes/metrics.py",
  },
  {
    src: "backend_core_database_init.py",
    dest: "backend/core/database/__init__.py",
  },
  { src: "backend_core_init.py", dest: "backend/core/__init__.py" },
  { src: "backend_api_init.py", dest: "backend/api/__init__.py" },
  { src: "backend_api_models_init.py", dest: "backend/api/models/__init__.py" },
  { src: "backend_backend_init.py", dest: "backend/__init__.py" },
  { src: "backend_core_config.py", dest: "backend/core/config.py" },

  // Frontend files that need fixing
  { src: "frontend_package.json", dest: "frontend/package.json" },
  { src: "frontend_tailwind.config.js", dest: "frontend/tailwind.config.js" },
  { src: "frontend_app_page.tsx", dest: "frontend/src/app/page.tsx" },
  {
    src: "frontend_contexts_auth_context.tsx",
    dest: "frontend/src/contexts/auth-context.tsx",
  },
  {
    src: "frontend_components_mode_toggle.tsx",
    dest: "frontend/src/components/mode-toggle.tsx",
  },
  {
    src: "frontend_components_theme_provider.tsx",
    dest: "frontend/src/components/theme-provider.tsx",
  },
  { src: "frontend_app_layout.tsx", dest: "frontend/src/app/layout.tsx" },
];

async function copyTemplates() {
  console.log(`Copying templates to ${TARGET_PROJECT}...`);

  for (const file of filesToCopy) {
    const srcPath = path.join(TEMPLATE_DIR, file.src);
    const destPath = path.join(TARGET_DIR, file.dest);

    if (await fs.pathExists(srcPath)) {
      await fs.copy(srcPath, destPath);
      console.log(`✓ Copied: ${file.src} -> ${file.dest}`);
    } else {
      console.log(`✗ Missing: ${file.src}`);
    }
  }

  console.log("\nTemplates copied! You can now test:");
  console.log(`cd ${TARGET_PROJECT}`);
  console.log("npm run dev:backend");
  console.log("npm run dev:frontend");
}

copyTemplates().catch(console.error);
