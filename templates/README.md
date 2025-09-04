# AI Impact Dashboard

Generated dashboard for tracking your AI training environmental impact.

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   pip install -r requirements.txt
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your settings:
   ```env
   DATABASE_URL=sqlite:///./data/sustainability.db
   SECRET_KEY=your-secret-key-here
   DASHBOARD_USERNAME=admin
   DASHBOARD_PASSWORD=your-password
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. **Run the dashboard:**
   ```bash
   npm run dev
   ```

## Access

- Dashboard: http://localhost:3000
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## Usage

Track your training sessions with:
```bash
ai-impact-tracker python your_script.py
```

The metrics will automatically appear in your dashboard.

## Tech Stack

This dashboard is built with:

- **Frontend**: Next.js 14, React, TypeScript
- **Backend**: FastAPI, Python
- **Database**: SQLite (default)
- **UI Components**: shadcn/ui, Tailwind CSS
- **Charts**: D3.js
- **Authentication**: JWT tokens
- **Styling**: Tailwind CSS with dark mode support

## License

MIT License - see [LICENSE](LICENSE) for details.