# AI Impact Tracker Dashboard

A comprehensive dashboard for tracking environmental impact of AI workloads, built with NextJS frontend and FastAPI backend.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.8+
- Docker (optional)

### Installation

1. **Install dependencies:**

   ```bash
   # Install root dependencies (includes concurrently for running both services)
   npm install

   # Install Python dependencies
   pip install -r requirements.txt
   ```

2. **Configure environment:**

   ```bash
   # Copy example environment file
   cp .env.example .env
   ```

3. **Update configuration:**

   ```env
   # .env (root directory)
   DATABASE_URL=sqlite:///./data/sustainability.db
   SECRET_KEY=your-secret-key-here
   DASHBOARD_USERNAME=your-admin-username
   DASHBOARD_PASSWORD=your-admin-password
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

### Running the Application

**Option 1: Run from project root (recommended):**

```bash
# Start both frontend and backend
npm run dev

# Or start them separately
npm run dev:frontend
npm run dev:backend
```

**Option 2: Run from individual directories:**

```bash
# Backend
cd backend
uvicorn main:app --reload --port 8000

# Frontend (in another terminal)
cd frontend
npm run dev
```

**Access the dashboard:**

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 📊 Features

- **Real-time tracking** of AI training environmental impact
- **Energy consumption** monitoring
- **CO2 emissions** calculation
- **Water usage** estimation
- **Project comparison** and analytics
- **User management** with role-based access
- **Dark mode** support
- **Export capabilities**

## 🔧 Configuration

### Environment Variables

| Variable              | Description                | Default                              |
| --------------------- | -------------------------- | ------------------------------------ |
| `DATABASE_URL`        | Database connection string | `sqlite:///./data/sustainability.db` |
| `SECRET_KEY`          | JWT secret key             | `your-secret-key-here`               |
| `DASHBOARD_USERNAME`  | Admin username             | `(set in .env)`                      |
| `DASHBOARD_PASSWORD`  | Admin password             | `(set in .env)`                      |
| `NEXT_PUBLIC_API_URL` | Backend API URL            | `http://localhost:8000`              |

### Database

- **SQLite** (default): Uses local file-based database
- Database file: `./data/sustainability.db`

## 🐳 Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or run in background
docker-compose up -d

# Stop containers
docker-compose down
```

**Access the application:**

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

**Note:** The Docker setup uses SQLite

## 📈 API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user

### Metrics

- `GET /api/metrics` - Get all metrics
- `POST /api/metrics` - Create new metric

## 🔒 Security

- JWT-based authentication
- Role-based access control
- Environment variable configuration
- Input validation and sanitization

## 📝 License

MIT License - see [LICENSE](LICENSE) for details.

**Built with ❤️ for a sustainable AI future**
