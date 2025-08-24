# AI Sustainability Impact Dashboard

An open-source dashboard designed to help companies measure, track, and reduce the environmental impact of their AI workloads. This tool provides visibility into AI training and inference energy usage, CO₂ emissions, and water footprint, enabling teams to make data-driven sustainability decisions.

## 🌱 Why This Matters

AI workloads consume significant energy, water, and produce carbon emissions. Smaller companies often lack tools to monitor and optimize their AI's environmental impact. This dashboard provides a simple, open-source solution to encourage sustainable AI practices without adding additional AI overhead.

## ✨ Key Features

### 📊 Metrics Collection

- Tracks GPU/CPU usage, runtime, energy consumption (kWh), CO₂ emissions, and water usage
- Wraps Python AI scripts (PyTorch, TensorFlow, JAX) via CLI
- Works automatically for local AI training jobs
- Captures almost all AI runs without modifying existing code

### 📈 Dashboard & Visualization

- Self-hosted database (SQLite by default, optional Postgres/MySQL)
- Historical views: per-project, per-team, and company-wide trends
- Aggregated metrics, comparisons, and efficiency rankings
- Interactive D3.js charts for energy consumption, CO₂ emissions, and water usage
- Dark mode support for better user experience

### 🔐 User Management & Authentication

- Role-based access control (Admin, Developer, Viewer)
- Secure JWT-based authentication
- User registration and password management
- Admin panel for user management

### 🛠️ Developer-Friendly Setup

- CLI-based setup: `ai-impact-tracker create my-dashboard`
- Docker container for easy deployment
- Automatic DB setup and migrations
- Minimal configuration required

### 💡 Sustainability Insights

- Actionable, non-AI recommendations
- Highlights high-energy jobs or inefficient runs
- Historical trends for tracking progress

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.8+ (for AI script tracking)
- Docker (optional, for containerized deployment)

### Installation

```bash
# Install the CLI tool globally
npm install -g ai-sustainability-dashboard

# Create a new dashboard project
ai-impact-tracker create my-dashboard

# Navigate to your project
cd my-dashboard

# Set up the development environment
ai-impact-tracker setup
```

### Access the Dashboard

After setup, the dashboard will be available at:

- **Frontend Dashboard**: http://localhost:3000
- **Backend API**: http://localhost:8000

### Default Login Credentials

The setup creates default users for testing:

- **Admin**: `admin` / `admin123`
- **Developer**: `developer` / `dev123`
- **Manager**: `manager` / `manager123`

### Track Your AI Workloads

```bash
# Track a Python AI script
ai-impact-tracker run python train_model.py

# Track with specific project name
ai-impact-tracker run --project "image-classification" python train_model.py

# Track with team assignment
ai-impact-tracker run --team "ml-team" --project "nlp-model" python fine_tune.py
```

## 📁 Project Structure

```
my-dashboard/
├── frontend/          # Next.js React dashboard
│   ├── src/
│   │   ├── app/       # Next.js app router
│   │   ├── components/ # UI components (shadcn/ui)
│   │   ├── contexts/  # React contexts (auth)
│   │   └── config/    # Configuration files
│   ├── package.json
│   └── next.config.js
├── backend/           # FastAPI Python backend
│   ├── api/          # API routes and schemas
│   ├── core/         # Core functionality (database, security)
│   ├── requirements.txt
│   └── main.py
├── data/             # SQLite database (created automatically)
└── docker-compose.yml # Docker configuration
```

## 🔧 Configuration

The dashboard uses environment variables for configuration. The CLI tool automatically creates a `.env.example` file in your project root. Copy it to `.env` and modify as needed:

```bash
# Copy the example environment file
cp .env.example .env
```

### Environment Variables

```env
# Database
DATABASE_URL=sqlite:///./data/sustainability.db
DATABASE_TYPE=sqlite

# Server
BACKEND_PORT=8000
BACKEND_HOST=0.0.0.0
ENVIRONMENT=development

# Security (CHANGE IN PRODUCTION!)
SECRET_KEY=your-secret-key-here-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Energy calculation settings
ENERGY_PROVIDER=local  # local, aws, gcp, azure, or custom
REGION=local

# Development
DEBUG=true
LOG_LEVEL=info
```

### Database Options

- **SQLite** (default): `DATABASE_URL=sqlite:///./data/sustainability.db`
- **PostgreSQL**: `DATABASE_URL=postgresql://user:pass@localhost:5432/sustainability`
- **MySQL**: `DATABASE_URL=mysql://user:pass@localhost:3306/sustainability`

## 📊 Dashboard Features

### Energy Tracking

- Real-time GPU/CPU power consumption
- Historical energy usage trends with interactive line charts
- Project comparison charts

### Carbon Footprint

- CO₂ emissions calculation based on energy usage
- Environmental impact trends visualization

### Water Usage

- Water consumption for data center cooling
- Water usage tracking and visualization

### User Management

- Role-based access control
- User registration and management
- Password setup for new users

### Dark Mode

- Toggle between light and dark themes
- Consistent theming across all components

### Insights & Recommendations

- High-energy job identification
- Historical performance tracking
- Project comparisons with pagination

## 🐳 Docker Deployment

```bash
# Build and run with Docker
docker-compose up -d

# Access dashboard at http://localhost:3000
# Access API at http://localhost:8000
```

## 🔌 API Endpoints

The dashboard provides a REST API for programmatic access:

### Authentication

```bash
# Login
POST /api/auth/login

# Get current user
GET /api/auth/me

# Register new user (admin/developer only)
POST /api/auth/register

# Setup password for new users
POST /api/auth/setup-password
```

### Metrics

```bash
# Get all metrics
GET /api/metrics

# Create new metric
POST /api/metrics

# Generate sample data
POST /api/metrics/generate-sample-data

# Get metrics summary
GET /api/metrics/summary
```

## 🤝 Contributing

Contributions are welcome!

### Development Setup

```bash
# Clone the repository
git clone https://github.com/your-username/ai-impact-tracker.git

# Install dependencies
npm install

# Build the CLI tool
npm run build

# Install CLI globally for development
npm install -g .

# Start development
npm run dev
```

### Project Structure for Contributors

- `src/cli/` - CLI tool implementation
- `templates/` - Template files for project generation
- `frontend/` - Next.js dashboard application
- `backend/` - FastAPI backend application

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [CodeCarbon](https://github.com/mlco2/codecarbon) - Carbon tracking library
- [CarbonTracker](https://github.com/lfwa/carbontracker) - Energy monitoring
- [shadcn/ui](https://ui.shadcn.com/) - UI components
- [D3.js](https://d3js.org/) - Data visualization
- [FastAPI](https://fastapi.tiangolo.com/) - Python web framework
- [Next.js](https://nextjs.org/) - React framework

---

**Made with ❤️ for a sustainable AI future**
