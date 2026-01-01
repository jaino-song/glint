# Glint Worker

Python-based video analysis job processor using Google Gemini API.

## Overview

The worker polls the `analysis_jobs` table for jobs with `PENDING` status, processes them using the Gemini API, and stores results in the `analysis_results` table.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Job Flow                                │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. User requests analysis → Backend creates PENDING job    │
│                                                              │
│  2. Worker polls for PENDING jobs                           │
│     ↓                                                        │
│  3. Claim job (atomic update to PROCESSING)                 │
│     ↓                                                        │
│  4. Fetch video metadata (yt-dlp)                           │
│     ↓                                                        │
│  5. Get transcript (youtube-transcript-api)                  │
│     ↓                                                        │
│  6. Analyze with Gemini                                      │
│     - Standard: Flash model + transcript                     │
│     - Deep: Pro model + uploaded video file                  │
│     ↓                                                        │
│  7. Save result to analysis_results                          │
│     ↓                                                        │
│  8. Update job status to COMPLETED                           │
│     (or FAILED with credit refund)                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Setup

### Prerequisites

- Python 3.12+
- FFmpeg (for video processing)

### Installation

```bash
cd apps/worker

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows

# Install dependencies
pip install -r requirements.txt
```

### Configuration

Copy `.env.example` to `.env` and fill in the values:

```bash
cp .env.example .env
```

Required environment variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key (bypasses RLS)
- `GEMINI_API_KEY`: Google Gemini API key

### Running

```bash
# Development
uvicorn app.main:app --reload --port 8001

# Production
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Docker

```bash
# Build
docker build -t glint-worker .

# Run
docker run -p 8001:8000 --env-file .env glint-worker

# Or use docker-compose
cd ../../docker
docker-compose -f docker-compose.worker.yml up
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/worker/jobs/{id}` | Get job status (requires API key) |
| POST | `/worker/jobs/{id}/cancel` | Cancel job (requires API key) |

## Analysis Modes

### Standard Mode
- Uses Gemini Flash model
- Analyzes transcript only
- Fast processing (~10-30 seconds)
- Cost: 1 credit

### Deep Mode
- Uses Gemini Pro with video understanding
- Downloads and uploads video for visual analysis
- Includes visual audit (charts, code, products)
- Longer processing (~2-5 minutes)
- Cost: 15 credits per 5 minutes of video

## Output Format

```json
{
  "title": "Video title",
  "summary": "Comprehensive summary...",
  "keyTakeaways": ["Takeaway 1", "Takeaway 2"],
  "timeline": [
    {
      "timestamp": "00:00",
      "description": "Introduction",
      "details": ["Point 1", "Point 2"]
    }
  ],
  "keywords": ["keyword1", "keyword2"],
  "visualAudit": [  // Deep Mode only
    {
      "timestamp": "01:30",
      "detail": "Chart showing growth metrics",
      "type": "Chart"
    }
  ]
}
```

## Monitoring

The worker exposes metrics at `/health`:
- `status`: "healthy" or "unhealthy"
- `active_jobs`: Number of currently processing jobs
- `max_concurrent`: Maximum concurrent job limit

Integrate with:
- **Sentry**: Set `SENTRY_DSN` for error tracking
- **Cloud Run**: Use `/health` for container health checks
