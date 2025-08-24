from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import metrics, projects, teams, insights, auth
from core.config import settings

app = FastAPI(
    title="AI Sustainability Dashboard",
    description="Track environmental impact of AI workloads",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(metrics.router, prefix="/api/metrics", tags=["metrics"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(teams.router, prefix="/api/teams", tags=["teams"])
app.include_router(insights.router, prefix="/api/insights", tags=["insights"])
app.include_router(auth.router, prefix="/api/auth", tags=["authentication"])

@app.get("/")
async def root():
    return {"message": "AI Sustainability Dashboard API"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
