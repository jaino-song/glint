"""
Glint Worker - Video Analysis Job Processor
FastAPI application that polls for pending analysis jobs and processes them
"""
import logging
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Depends, Header
from pydantic import BaseModel

from .core.config import get_settings, Settings
from .services.job_processor import JobRunner

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Global job runner instance
job_runner: JobRunner | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global job_runner

    settings = get_settings()

    # Initialize Sentry if configured
    if settings.sentry_dsn:
        try:
            import sentry_sdk
            from sentry_sdk.integrations.fastapi import FastApiIntegration
            sentry_sdk.init(
                dsn=settings.sentry_dsn,
                integrations=[FastApiIntegration()],
                traces_sample_rate=0.1,
            )
            logger.info("Sentry initialized")
        except ImportError:
            logger.warning("Sentry SDK not installed, skipping initialization")

    # Start job runner
    job_runner = JobRunner(
        max_concurrent=settings.max_concurrent_jobs,
        poll_interval=settings.poll_interval_seconds
    )
    runner_task = asyncio.create_task(job_runner.start())
    logger.info("Worker started successfully")

    yield

    # Shutdown
    if job_runner:
        job_runner.stop()
    runner_task.cancel()
    try:
        await runner_task
    except asyncio.CancelledError:
        pass
    logger.info("Worker shutdown complete")


app = FastAPI(
    title="Glint Worker",
    description="Video Analysis Job Processor",
    version="1.0.0",
    lifespan=lifespan
)


# ============================================================================
# Dependencies
# ============================================================================

async def verify_api_key(x_api_key: str = Header(None, alias="X-API-Key")):
    """Verify internal API key for protected endpoints"""
    settings = get_settings()
    if settings.worker_api_key and x_api_key != settings.worker_api_key:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return True


# ============================================================================
# Models
# ============================================================================

class HealthResponse(BaseModel):
    status: str
    version: str
    active_jobs: int
    max_concurrent: int


class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    is_processing: bool


# ============================================================================
# Routes
# ============================================================================

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint for load balancers and monitoring"""
    return HealthResponse(
        status="healthy",
        version="1.0.0",
        active_jobs=len(job_runner.active_jobs) if job_runner else 0,
        max_concurrent=job_runner.max_concurrent if job_runner else 0
    )


@app.get("/worker/jobs/{job_id}", response_model=JobStatusResponse, dependencies=[Depends(verify_api_key)])
async def get_job_status(job_id: str):
    """Get the status of a specific job"""
    is_processing = job_id in (job_runner.active_jobs if job_runner else set())
    return JobStatusResponse(
        job_id=job_id,
        status="processing" if is_processing else "unknown",
        is_processing=is_processing
    )


@app.post("/worker/jobs/{job_id}/cancel", dependencies=[Depends(verify_api_key)])
async def cancel_job(job_id: str):
    """
    Cancel a job.
    Note: This only prevents picking up new jobs, does not interrupt running ones.
    """
    # For now, we don't support cancellation of in-progress jobs
    # This would require more sophisticated job tracking
    if job_runner and job_id in job_runner.active_jobs:
        return {"message": "Job is currently processing, cannot cancel"}

    return {"message": "Job cancellation requested"}


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "Glint Worker",
        "status": "running",
        "docs": "/docs"
    }


# ============================================================================
# Error Handlers
# ============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {exc}")
    return {"error": "Internal server error", "detail": str(exc)}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
