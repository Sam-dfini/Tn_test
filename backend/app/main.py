from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import asyncio
from datetime import datetime
from .core.config import settings
from .api.routes import router as api_router
from .api.ws import router as ws_router
from .orchestrator import orchestrator
# from .services.rss_service import rss_service


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start background tasks
    with open("backend_startup.log", "a") as f:
        f.write(f"Backend lifespan starting at {datetime.now().isoformat()}\n")
    print("Starting automated backend data pipeline (Cron Scrapers & Intelligence Mode)...")
    
    # Start the orchestrator's continuous loop in the background (runs every 10 minutes)
    task = asyncio.create_task(orchestrator.start_continuous_intelligence(interval_seconds=600))
    
    yield
    
    # Shutdown: Clean up task
    print("Stopping automated backend data pipeline...")
    orchestrator.stop_continuous_intelligence()
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

# Initialize FastAPI application
app = FastAPI(
    title="TUNISIAINTEL Backend",
    version="2.0",
    debug=settings.DEBUG,
    lifespan=lifespan
)

# Include routers
app.include_router(api_router, prefix="/api")
app.include_router(ws_router)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # TODO: Restrict to frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """
    Root endpoint.
    """
    return {
        "message": "TUNISIAINTEL Backend is running",
        "app_name": settings.APP_NAME
    }

@app.get("/health")
async def health_check():
    """
    Health check endpoint.
    """
    return {
        "status": "ok",
        "debug": settings.DEBUG
    }

if __name__ == "__main__":
    import uvicorn
    # Run the application
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=settings.DEBUG)
