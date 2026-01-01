"""
Gemini AI Video Analyzer
Uses Google's Gemini API for video content analysis
"""
import os
import json
import logging
from typing import Optional
from dataclasses import dataclass

import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold

from ..core.config import get_settings
from .youtube_service import VideoMetadata, TranscriptResult

logger = logging.getLogger(__name__)


@dataclass
class AnalysisResult:
    """Analysis result matching AnalysisResultJson type"""
    title: str
    summary: str
    key_takeaways: list[str]
    timeline: list[dict]  # [{timestamp, description, details?}]
    keywords: list[str]
    visual_audit: Optional[list[dict]] = None  # Deep Mode only


# System prompts for analysis
STANDARD_ANALYSIS_PROMPT = """You are an expert video content analyst. Analyze the following video transcript and provide a comprehensive analysis.

VIDEO INFORMATION:
- Title: {title}
- Channel: {channel}
- Duration: {duration}

TRANSCRIPT:
{transcript}

Provide your analysis in the following JSON format:
{{
  "title": "A clear, descriptive title summarizing the video content",
  "summary": "A 2-3 paragraph comprehensive summary of the video content",
  "keyTakeaways": ["takeaway 1", "takeaway 2", "takeaway 3", "takeaway 4", "takeaway 5"],
  "timeline": [
    {{"timestamp": "00:00", "description": "Introduction", "details": ["Key point 1", "Key point 2"]}},
    {{"timestamp": "02:30", "description": "Main topic", "details": ["Detail 1", "Detail 2"]}}
  ],
  "keywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}}

IMPORTANT:
- Extract 5-10 key takeaways that capture the main insights
- Create a timeline with major sections/topics (5-10 entries)
- Include 5-10 relevant keywords/tags
- Write in the same language as the transcript
- Be specific and actionable in your takeaways
- Ensure the summary captures the essence of the content

Respond ONLY with valid JSON, no additional text."""

# Fallback prompt when no transcript is available (metadata-only analysis)
METADATA_ANALYSIS_PROMPT = """You are an expert video content analyst. Based on the following video metadata, provide a reasonable analysis based on what you can infer from the title and channel.

VIDEO INFORMATION:
- Title: {title}
- Channel: {channel}
- Duration: {duration}

Since no transcript is available, provide an analysis based on what the title and channel name suggest about the content.

Provide your analysis in the following JSON format:
{{
  "title": "{title}",
  "summary": "A brief analysis based on what the video title and channel suggest about the content. Note that this analysis is based on metadata only as no transcript was available.",
  "keyTakeaways": ["Based on the title, this video likely covers...", "The channel {channel} typically produces..."],
  "timeline": [
    {{"timestamp": "00:00", "description": "Video begins", "details": ["Content based on title: {title}"]}}
  ],
  "keywords": ["keyword1", "keyword2", "keyword3"]
}}

IMPORTANT:
- Be honest that this is a metadata-only analysis
- Infer what you can from the title and channel name
- Keep the analysis brief but informative
- Use the same language as the video title

Respond ONLY with valid JSON, no additional text."""

DEEP_ANALYSIS_PROMPT = """You are an expert video content analyst performing a deep analysis. Analyze the video content thoroughly including visual elements.

VIDEO INFORMATION:
- Title: {title}
- Channel: {channel}
- Duration: {duration}

Provide your analysis in the following JSON format:
{{
  "title": "A clear, descriptive title summarizing the video content",
  "summary": "A comprehensive 3-4 paragraph analysis of the video content including visual context",
  "keyTakeaways": ["takeaway 1", "takeaway 2", ...],
  "timeline": [
    {{"timestamp": "00:00", "description": "Section title", "details": ["Detail 1", "Detail 2"]}}
  ],
  "keywords": ["keyword1", "keyword2", ...],
  "visualAudit": [
    {{"timestamp": "01:30", "detail": "Description of visual element", "type": "Chart"}},
    {{"timestamp": "05:00", "detail": "Code snippet shown", "type": "Code"}}
  ]
}}

Visual Audit Types: "Visual Text", "Chart", "Code", "Product", "Other"

IMPORTANT:
- Provide detailed analysis of visual content (charts, diagrams, code, products shown)
- Extract 10-15 key takeaways
- Create a detailed timeline with 10-20 entries
- Include 10-15 relevant keywords
- Document important visual elements in visualAudit
- Write in Korean if the content is Korean, otherwise match the primary language

Respond ONLY with valid JSON, no additional text."""


class GeminiAnalyzer:
    """Gemini-based video content analyzer"""

    def __init__(self):
        self.settings = get_settings()
        genai.configure(api_key=self.settings.gemini_api_key)

        # Model configurations
        self.flash_model = genai.GenerativeModel(
            model_name="gemini-2.0-flash-exp",
            generation_config={
                "temperature": 0.3,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 8192,
            },
            safety_settings={
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
            }
        )

        self.pro_model = genai.GenerativeModel(
            model_name="gemini-2.0-flash-thinking-exp-01-21",
            generation_config={
                "temperature": 0.4,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 16384,
            },
            safety_settings={
                HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
                HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
            }
        )

    def analyze_standard(
        self,
        metadata: VideoMetadata,
        transcript: TranscriptResult
    ) -> Optional[AnalysisResult]:
        """
        Perform Standard Mode analysis using transcript only.
        Uses Gemini Flash for fast processing.
        """
        try:
            # Format duration
            duration_str = self._format_duration(metadata.duration_seconds)

            prompt = STANDARD_ANALYSIS_PROMPT.format(
                title=metadata.title,
                channel=metadata.channel,
                duration=duration_str,
                transcript=transcript.text[:50000]  # Limit transcript length
            )

            response = self.flash_model.generate_content(prompt)

            if not response.text:
                logger.error("Empty response from Gemini Flash")
                return None

            return self._parse_response(response.text)

        except Exception as e:
            logger.error(f"Standard analysis failed: {e}")
            return None

    def analyze_metadata_only(
        self,
        metadata: VideoMetadata
    ) -> Optional[AnalysisResult]:
        """
        Fallback analysis when no transcript is available.
        Uses just the video title and channel to provide basic insights.
        """
        try:
            duration_str = self._format_duration(metadata.duration_seconds)

            prompt = METADATA_ANALYSIS_PROMPT.format(
                title=metadata.title,
                channel=metadata.channel,
                duration=duration_str
            )

            response = self.flash_model.generate_content(prompt)

            if not response.text:
                logger.error("Empty response from Gemini Flash (metadata-only)")
                return None

            return self._parse_response(response.text)

        except Exception as e:
            logger.error(f"Metadata-only analysis failed: {e}")
            return None

    def analyze_deep(
        self,
        metadata: VideoMetadata,
        video_path: str
    ) -> Optional[AnalysisResult]:
        """
        Perform Deep Mode analysis using actual video file.
        Uses Gemini Pro with video understanding capabilities.
        """
        try:
            # Upload video to Gemini
            logger.info(f"Uploading video for deep analysis: {video_path}")
            video_file = genai.upload_file(path=video_path)

            # Wait for file to be processed
            import time
            while video_file.state.name == "PROCESSING":
                time.sleep(5)
                video_file = genai.get_file(video_file.name)

            if video_file.state.name == "FAILED":
                logger.error("Video upload failed")
                return None

            # Format duration
            duration_str = self._format_duration(metadata.duration_seconds)

            prompt = DEEP_ANALYSIS_PROMPT.format(
                title=metadata.title,
                channel=metadata.channel,
                duration=duration_str
            )

            # Generate analysis with video
            response = self.pro_model.generate_content([video_file, prompt])

            # Clean up uploaded file
            try:
                genai.delete_file(video_file.name)
            except Exception:
                pass  # Ignore cleanup errors

            if not response.text:
                logger.error("Empty response from Gemini Pro")
                return None

            return self._parse_response(response.text, include_visual=True)

        except Exception as e:
            logger.error(f"Deep analysis failed: {e}")
            return None
        finally:
            # Clean up local video file
            if os.path.exists(video_path):
                try:
                    os.remove(video_path)
                except Exception:
                    pass

    def _parse_response(self, text: str, include_visual: bool = False) -> Optional[AnalysisResult]:
        """Parse JSON response from Gemini"""
        try:
            # Clean up response - remove markdown code blocks if present
            cleaned = text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            cleaned = cleaned.strip()

            data = json.loads(cleaned)

            return AnalysisResult(
                title=data.get("title", ""),
                summary=data.get("summary", ""),
                key_takeaways=data.get("keyTakeaways", []),
                timeline=data.get("timeline", []),
                keywords=data.get("keywords", []),
                visual_audit=data.get("visualAudit") if include_visual else None
            )
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini response: {e}")
            logger.debug(f"Raw response: {text[:1000]}")
            return None

    def _format_duration(self, seconds: int) -> str:
        """Format seconds to MM:SS or HH:MM:SS"""
        if seconds >= 3600:
            hours = seconds // 3600
            minutes = (seconds % 3600) // 60
            secs = seconds % 60
            return f"{hours:02d}:{minutes:02d}:{secs:02d}"
        else:
            minutes = seconds // 60
            secs = seconds % 60
            return f"{minutes:02d}:{secs:02d}"
