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
    timeline: list[dict]  # [{timestamp, title, summary, points?}]
    keywords: list[str]
    full_analysis: Optional[str] = None  # Detailed markdown analysis
    visual_audit: Optional[list[dict]] = None  # Deep Mode only


# System prompts for analysis
STANDARD_ANALYSIS_PROMPT = """당신은 IT 및 기술 콘텐츠를 전문적으로 정리하는 '수석 테크니컬 라이터'입니다. 제공된 동영상 스크립트를 분석하여 핵심 내용과 세부 사항이 빠짐없이 포함된 구조화된 보고서를 작성해야 합니다.

VIDEO INFORMATION:
- Title: {title}
- Channel: {channel}
- Duration: {duration}

TRANSCRIPT:
{transcript}

## 출력 형식

JSON 형식으로 응답하되, fullAnalysis 필드에는 아래 구조의 마크다운을 작성하세요:

### fullAnalysis 마크다운 구조:
1. **제목**: 스크립트의 핵심 주제를 반영한 제목 (H1)
2. **챕터 (H3)**: `### 숫자. 소제목 (원문 영어 소제목)`
3. **내용 계층 구조**:
   - **레벨 1 (`-`)**: 해당 챕터의 핵심 주장이나 사건 (타임스탬프 `[00:00]` 형식 포함)
   - **레벨 2 (`  -`)**: 레벨 1에 대한 구체적인 설명, 이유, 배경, 논리적 근거
   - **레벨 3 (`    -`)**: 적용 예시(Application Example), 구체적인 프롬프트 예시, 사용된 도구의 실제 사용 사례

### JSON 응답 형식:
{{
  "title": "영상 제목 (한국어)",
  "summary": "3-5문장의 핵심 요약",
  "keyTakeaways": ["핵심 포인트 1", "핵심 포인트 2", "핵심 포인트 3", ...],
  "timeline": [
    {{"timestamp": "00:00", "title": "섹션 제목", "summary": "섹션 요약", "points": [{{"timestamp": "00:30", "content": "세부 내용"}}]}}
  ],
  "keywords": ["키워드1", "키워드2", ...],
  "fullAnalysis": "# 제목\\n\\n### 1. 첫 번째 챕터 (Chapter Title)\\n\\n- [00:00] 핵심 주장\\n  - 구체적 설명...\\n    - 적용 예시:..."
}}

## 작성 규칙

1. **언어**: 한국어로 작성 (전문 용어는 괄호 안에 영문 병기)
2. **완전성**: 정보 누락 없이 모든 명령어, 프롬프트 내용, 인물 이름, 도구 이름 정확히 기록
3. **가독성**: 명료하고 전문적인 어조("~함", "~임" 체)
4. **fullAnalysis**:
   - 모든 챕터와 세부 내용을 계층적으로 작성
   - 타임스탬프를 활용해 영상 위치 명시
   - 적용 예시와 구체적 사례 포함

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

        # Model configurations - Gemini 3.0 (2025.12 release)
        self.flash_model = genai.GenerativeModel(
            model_name="gemini-3-flash-preview",
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
            model_name="gemini-3-pro-preview",
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
                full_analysis=data.get("fullAnalysis"),
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
