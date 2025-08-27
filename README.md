# AI Impact Tracker 🌱

A CLI tool that automatically tracks the environmental impact of your local AI training runs and stores the data in a dashboard.

## What It Does

This CLI tool automatically measures the environmental impact of your local AI training runs. Instead of manually setting up tracking libraries, just wrap your command:

```bash
# Before: Just run your training
python train.py

# After: Automatically track energy, CO2, and water usage
ai-impact-tracker python train.py
```

**That's it!** The tool will:

- ✅ Install required tracking libraries (codecarbon, carbontracker, requests)
- ✅ Use codecarbon to measure energy consumption and CO2 emissions
- ✅ Calculate water usage estimates from energy data
- ✅ Display metrics in the terminal
- ✅ Store data in your dashboard database

## Quick Start

### 1. Install the CLI

```bash
# Install directly from GitHub
npm install -g https://github.com/emmyme/ai-impact-tracker

# Or clone and install locally
git clone https://github.com/emmyme/ai-impact-tracker
cd ai-impact-tracker
npm install
npm run build
npm install -g .
```

### 2. Create a Dashboard

```bash
# Generate a complete dashboard project
ai-impact-tracker create my-dashboard

# Start it (required for data storage)
cd my-dashboard
npm install
pip install -r requirements.txt
npm run dev
```

### 3. Track Your AI Training

```bash
# Basic usage (will prompt for project/team/environment)
ai-impact-tracker python train.py

# With project metadata (skips prompts)
ai-impact-tracker --project "ai-finetuning" --team "team1" python train.py
```

## Features

### 🚀 Zero Configuration

- No code changes needed to your existing scripts
- Automatic dependency installation
- Interactive prompts for missing options

### 📊 Comprehensive Tracking

- **Energy consumption** (kWh)
- **CO2 emissions** (g)
- **Water usage** estimates (L)
- **Duration** tracking
- **Project/team/environment** metadata

### 🎯 Smart Integration

- Works with any Python AI training script
- Supports PyTorch, TensorFlow, HuggingFace, etc.
- Real-time output streaming
- Preserves original script behavior
- **Local training only** (cloud/remote training not supported)

### 📈 Beautiful Dashboard

- Modern Next.js + FastAPI stack
- Real-time metrics visualization
- Project comparison charts
- Export capabilities
- JWT authentication

### Environment Configuration

Create a `.env` file:

```env
DASHBOARD_URL=http://localhost:8000
DASHBOARD_USERNAME=your-username
DASHBOARD_PASSWORD=your-password
```

## CLI Commands

```bash
# Main command: Track AI training
ai-impact-tracker <script> [options]

# Generate dashboard project
ai-impact-tracker create <project-name>

# Show help
ai-impact-tracker --help
```

### Options

- `--project <name>` - Project name
- `--team <name>` - Team name
- `--environment <env>` - Environment (development/staging/production)
- `--dashboard-url <url>` - Dashboard API URL

## How It Works

1. **Dependency Check** - Automatically installs codecarbon, carbontracker, and requests.
2. **Process Wrapping** - Wraps your script in a Python environment with tracking
3. **Environmental Monitoring** - Uses codecarbon to measure energy consumption and CO2 emissions
4. **Data Processing** - Calculates water usage estimates and formats metrics
5. **Dashboard Integration** - Sends metrics via HTTP to your dashboard
6. **Clean Exit** - Preserves your script's original behavior

## Dashboard

After running your training, view results at `http://localhost:3000`:

- 📊 Real-time energy consumption charts
- 🌱 CO2 emissions tracking
- 💧 Water usage estimates
- 📈 Project comparison analytics
- 👥 Team performance metrics
- 📤 Export capabilities

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Your Script   │───▶│  AI Impact CLI   │───▶│   Dashboard     │
│   (train.py)    │    │  (Tracking)      │    │  (Next.js+API)  │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## Acknowledgments

- **[CodeCarbon](https://codecarbon.io/)**
- **[CarbonTracker](https://carbontracker.info/)**
- **[Next.js](https://nextjs.org/)**
- **[FastAPI](https://fastapi.tiangolo.com/)**
- **[Commander.js](https://github.com/tj/commander.js)**
- **[Tailwind CSS](https://tailwindcss.com/)**

## License

MIT License - see [LICENSE](LICENSE) for details.

---

**Built with ❤️ for a sustainable AI future**
