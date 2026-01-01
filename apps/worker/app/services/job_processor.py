"""
Job Processor
Orchestrates the analysis workflow from job pickup to completion
"""
import logging
import asyncio
from typing import Optional
from dataclasses import asdict

from ..core.database import AnalysisJobRepository, AnalysisResultRepository
from .youtube_service import YouTubeService, extract_video_id
from .gemini_analyzer import GeminiAnalyzer

logger = logging.getLogger(__name__)


class JobProcessor:
    """Processes analysis jobs from PENDING to COMPLETED/FAILED"""

    def __init__(self):
        self.job_repo = AnalysisJobRepository()
        self.result_repo = AnalysisResultRepository()
        self.youtube = YouTubeService()
        self.analyzer = GeminiAnalyzer()

    async def process_job(self, job: dict) -> bool:
        """
        Process a single analysis job.

        Returns True if successful, False if failed.
        """
        job_id = job["id"]
        video_url = job["video_url"]
        video_id = job.get("video_id") or extract_video_id(video_url)
        mode = job["mode"]
        user_id = job["user_id"]
        credits_reserved = job.get("credits_reserved", 0)

        logger.info(f"Processing job {job_id} for video {video_id} in {mode} mode")

        try:
            # Update progress: Starting
            self.job_repo.update_progress(job_id, 10)

            # Step 1: Get video metadata
            logger.info(f"Fetching metadata for video {video_id}")
            metadata = self.youtube.get_video_metadata(video_id)

            if not metadata:
                raise Exception(f"Failed to fetch video metadata for {video_id}")

            self.job_repo.update_progress(job_id, 20)

            # Step 2: Get transcript (required for Standard with full analysis, optional for fallback)
            logger.info(f"Fetching transcript for video {video_id}")
            transcript = self.youtube.get_transcript(video_id)

            self.job_repo.update_progress(job_id, 40)

            # Step 3: Perform analysis
            if mode == "STANDARD":
                if transcript:
                    logger.info(f"Running Standard analysis with transcript for {video_id}")
                    analysis = self.analyzer.analyze_standard(metadata, transcript)
                else:
                    # Fallback to metadata-only analysis
                    logger.info(f"No transcript available, running metadata-only analysis for {video_id}")
                    analysis = self.analyzer.analyze_metadata_only(metadata)
            else:
                # Deep Mode: Download video for visual analysis
                logger.info(f"Downloading video {video_id} for Deep analysis")
                video_path = self.youtube.download_video(video_id)

                if not video_path:
                    raise Exception(f"Failed to download video {video_id}")

                self.job_repo.update_progress(job_id, 60)

                logger.info(f"Running Deep analysis for {video_id}")
                analysis = self.analyzer.analyze_deep(metadata, video_path)

            self.job_repo.update_progress(job_id, 80)

            if not analysis:
                raise Exception("Analysis returned empty result")

            # Step 4: Create analysis result
            logger.info(f"Saving analysis result for {video_id}")
            result_json = {
                "title": analysis.title,
                "summary": analysis.summary,
                "keyTakeaways": analysis.key_takeaways,
                "timeline": analysis.timeline,
                "keywords": analysis.keywords,
            }

            if analysis.visual_audit:
                result_json["visualAudit"] = analysis.visual_audit

            result = self.result_repo.create_result(
                video_id=video_id,
                video_url=video_url,
                mode=mode,
                result_json=result_json,
                video_title=metadata.title,
                video_thumbnail=metadata.thumbnail,
                video_duration_seconds=metadata.duration_seconds,
                transcript=transcript.text if transcript else None
            )

            if not result or "id" not in result:
                raise Exception("Failed to save analysis result")

            # Step 5: Mark job as completed
            self.job_repo.complete_job(job_id, result["id"])
            logger.info(f"Job {job_id} completed successfully with result {result['id']}")

            return True

        except Exception as e:
            error_message = str(e)
            logger.error(f"Job {job_id} failed: {error_message}")

            # Mark job as failed
            self.job_repo.fail_job(job_id, error_message, "ANALYSIS_006")

            # Refund credits
            if credits_reserved > 0:
                try:
                    self.job_repo.refund_credits(user_id, credits_reserved, job_id)
                    logger.info(f"Refunded {credits_reserved} credits to user {user_id}")
                except Exception as refund_error:
                    logger.error(f"Failed to refund credits: {refund_error}")

            return False


class JobRunner:
    """
    Background job runner that polls for pending jobs.
    Can run multiple jobs concurrently.
    """

    def __init__(self, max_concurrent: int = 3, poll_interval: int = 5):
        self.max_concurrent = max_concurrent
        self.poll_interval = poll_interval
        self.processor = JobProcessor()
        self.job_repo = AnalysisJobRepository()
        self.running = False
        self.active_jobs: set[str] = set()

    async def start(self):
        """Start the job runner loop"""
        self.running = True
        logger.info(f"Job runner started (max_concurrent={self.max_concurrent}, poll_interval={self.poll_interval}s)")

        while self.running:
            try:
                await self._poll_and_process()
            except Exception as e:
                logger.error(f"Error in job runner loop: {e}")

            await asyncio.sleep(self.poll_interval)

    def stop(self):
        """Stop the job runner"""
        self.running = False
        logger.info("Job runner stopping...")

    async def _poll_and_process(self):
        """Poll for pending jobs and process them"""
        # Check how many slots are available
        available_slots = self.max_concurrent - len(self.active_jobs)

        if available_slots <= 0:
            return

        # Get pending jobs
        pending_jobs = self.job_repo.get_pending_jobs(limit=available_slots)

        for job in pending_jobs:
            job_id = job["id"]

            # Skip if already being processed
            if job_id in self.active_jobs:
                continue

            # Try to claim the job
            claimed = self.job_repo.claim_job(job_id)

            if claimed:
                self.active_jobs.add(job_id)
                # Process job in background
                asyncio.create_task(self._process_job_wrapper(claimed))

    async def _process_job_wrapper(self, job: dict):
        """Wrapper to process job and clean up tracking"""
        job_id = job["id"]
        try:
            await self.processor.process_job(job)
        finally:
            self.active_jobs.discard(job_id)
