"""
Supabase Database Client
"""
from typing import Optional
from supabase import create_client, Client
from functools import lru_cache

from .config import get_settings


@lru_cache()
def get_supabase_client() -> Client:
    """Get cached Supabase client instance"""
    settings = get_settings()
    return create_client(
        settings.supabase_url,
        settings.supabase_service_role_key  # Service role key bypasses RLS
    )


class AnalysisJobRepository:
    """Repository for analysis_jobs table operations"""

    def __init__(self, client: Optional[Client] = None):
        self.client = client or get_supabase_client()

    def get_pending_jobs(self, limit: int = 10) -> list[dict]:
        """Get pending jobs ordered by creation time"""
        response = (
            self.client.table("analysis_jobs")
            .select("*")
            .eq("status", "PENDING")
            .order("created_at", desc=False)
            .limit(limit)
            .execute()
        )
        return response.data

    def claim_job(self, job_id: str) -> Optional[dict]:
        """
        Atomically claim a job by setting status to PROCESSING.
        Returns the job if successfully claimed, None if already taken.
        """
        # Use update with match to ensure we only claim PENDING jobs
        response = (
            self.client.table("analysis_jobs")
            .update({
                "status": "PROCESSING",
                "started_at": "now()"
            })
            .eq("id", job_id)
            .eq("status", "PENDING")  # Only claim if still pending
            .execute()
        )

        if response.data and len(response.data) > 0:
            return response.data[0]
        return None

    def update_progress(self, job_id: str, progress: int) -> None:
        """Update job progress (0-100)"""
        self.client.table("analysis_jobs").update({
            "progress": progress
        }).eq("id", job_id).execute()

    def complete_job(self, job_id: str, result_id: str) -> dict:
        """Mark job as completed with result"""
        response = (
            self.client.table("analysis_jobs")
            .update({
                "status": "COMPLETED",
                "result_id": result_id,
                "progress": 100,
                "completed_at": "now()"
            })
            .eq("id", job_id)
            .execute()
        )
        return response.data[0] if response.data else {}

    def fail_job(self, job_id: str, error_message: str, error_code: str = "ANALYSIS_006") -> dict:
        """Mark job as failed with error info"""
        response = (
            self.client.table("analysis_jobs")
            .update({
                "status": "FAILED",
                "error_message": error_message,
                "error_code": error_code,
                "completed_at": "now()"
            })
            .eq("id", job_id)
            .execute()
        )
        return response.data[0] if response.data else {}

    def refund_credits(self, user_id: str, amount: int, job_id: str) -> None:
        """Refund credits for a failed job using the database function"""
        self.client.rpc(
            "refund_credits",
            {
                "p_user_id": user_id,
                "p_amount": amount,
                "p_description": f"Refund for failed analysis job {job_id}",
                "p_reference_id": job_id
            }
        ).execute()


class AnalysisResultRepository:
    """Repository for analysis_results table operations"""

    def __init__(self, client: Optional[Client] = None):
        self.client = client or get_supabase_client()

    def find_by_video_and_mode(self, video_id: str, mode: str) -> Optional[dict]:
        """Find existing result by video ID and mode"""
        response = (
            self.client.table("analysis_results")
            .select("*")
            .eq("video_id", video_id)
            .eq("mode", mode)
            .limit(1)
            .execute()
        )
        return response.data[0] if response.data else None

    def create_result(
        self,
        video_id: str,
        video_url: str,
        mode: str,
        result_json: dict,
        video_title: Optional[str] = None,
        video_thumbnail: Optional[str] = None,
        video_duration_seconds: Optional[int] = None,
        transcript: Optional[str] = None,
    ) -> dict:
        """Create or update analysis result"""
        data = {
            "video_id": video_id,
            "video_url": video_url,
            "mode": mode,
            "result_json": result_json,
            "video_title": video_title,
            "video_thumbnail": video_thumbnail,
            "video_duration_seconds": video_duration_seconds,
            "transcript": transcript,
        }

        # Check if exists first
        existing = self.find_by_video_and_mode(video_id, mode)

        if existing:
            # Update existing
            response = (
                self.client.table("analysis_results")
                .update(data)
                .eq("id", existing["id"])
                .execute()
            )
        else:
            # Insert new
            response = (
                self.client.table("analysis_results")
                .insert(data)
                .execute()
            )

        return response.data[0] if response.data else {}
