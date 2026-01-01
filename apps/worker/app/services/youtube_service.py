"""
YouTube Video Service
Handles video metadata extraction and transcript retrieval with rate limit resilience.

Rate Limit Strategy:
1. Disposable sessions - New YouTubeTranscriptApi instance per request
2. Rotating proxy support - Configurable proxy for production
3. Jittered exponential backoff - Randomized retry delays
4. Dual-method fallback - youtube-transcript-api → yt-dlp
"""
import re
import os
import logging
import random
import time
from typing import Optional
from dataclasses import dataclass

import yt_dlp
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.proxies import WebshareProxyConfig
from youtube_transcript_api._errors import (
    TranscriptsDisabled,
    NoTranscriptFound,
    VideoUnavailable,
)

from ..core.config import get_settings

logger = logging.getLogger(__name__)


@dataclass
class VideoMetadata:
    """Video metadata container"""
    video_id: str
    title: str
    thumbnail: str
    duration_seconds: int
    channel: str
    upload_date: Optional[str] = None


@dataclass
class TranscriptResult:
    """Transcript result container"""
    text: str
    language: str
    is_auto_generated: bool


def extract_video_id(url: str) -> Optional[str]:
    """
    Extract YouTube video ID from various URL formats.

    Supports:
    - https://www.youtube.com/watch?v=VIDEO_ID
    - https://youtu.be/VIDEO_ID
    - https://www.youtube.com/embed/VIDEO_ID
    - https://www.youtube.com/shorts/VIDEO_ID
    """
    patterns = [
        r'(?:youtube\.com/watch\?v=|youtu\.be/|youtube\.com/embed/|youtube\.com/shorts/)([a-zA-Z0-9_-]{11})',
        r'(?:youtube\.com/watch\?.*?v=)([a-zA-Z0-9_-]{11})',
    ]

    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)

    return None


class RateLimitError(Exception):
    """Raised when YouTube rate limits the request"""
    pass


class YouTubeService:
    """
    Service for YouTube video operations with rate limit resilience.

    Key Design Decisions:
    - No global YouTubeTranscriptApi instance (prevents session poisoning)
    - Rotating proxy support for production deployments
    - Dual-method transcript fetching with automatic fallback
    """

    def __init__(self):
        self.settings = get_settings()
        # Proxy config from environment (for production)
        # Format: "webshare:username:password" or "http://user:pass@host:port"
        self._proxy_url = getattr(self.settings, 'youtube_proxy_url', None)

    def _create_transcript_api(self) -> YouTubeTranscriptApi:
        """
        Create a fresh YouTubeTranscriptApi instance (disposable session pattern).

        CRITICAL: Always create a new instance per request to avoid session poisoning.
        A single reused instance accumulates cookies/fingerprints that get flagged.
        """
        if self._proxy_url:
            # Parse proxy config
            if self._proxy_url.startswith('webshare:'):
                # Webshare rotating proxy format: webshare:username:password
                parts = self._proxy_url.split(':')
                if len(parts) >= 3:
                    proxy_config = WebshareProxyConfig(
                        proxy_username=parts[1],
                        proxy_password=':'.join(parts[2:])  # Password might contain ':'
                    )
                    return YouTubeTranscriptApi(proxy_config=proxy_config)
            else:
                # Standard HTTP proxy format
                # Note: youtube-transcript-api v1.x uses requests Session internally
                # We can inject proxy via environment or custom session
                pass

        return YouTubeTranscriptApi()

    def _jittered_backoff(self, attempt: int, base: float = 2.0, max_delay: float = 60.0) -> float:
        """
        Calculate jittered exponential backoff delay.

        Formula: min(max_delay, (base^attempt) + random(0, 2))

        The randomness breaks the robotic pattern signature that triggers
        YouTube's rate limiter.
        """
        exponential_delay = min(max_delay, base ** attempt)
        jitter = random.uniform(0, 2)
        return exponential_delay + jitter

    def _random_pre_delay(self, min_sec: float = 0.5, max_sec: float = 2.0):
        """
        Add random delay before request to appear more human-like.

        YouTube's rate limiter looks for consistent timing patterns.
        """
        delay = random.uniform(min_sec, max_sec)
        time.sleep(delay)

    def get_video_metadata(self, video_id: str) -> Optional[VideoMetadata]:
        """
        Fetch video metadata using yt-dlp.
        Does not download the actual video.
        """
        url = f"https://www.youtube.com/watch?v={video_id}"

        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': False,
            'skip_download': True,
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)

                if not info:
                    return None

                return VideoMetadata(
                    video_id=video_id,
                    title=info.get('title', 'Untitled'),
                    thumbnail=info.get('thumbnail', f"https://img.youtube.com/vi/{video_id}/maxresdefault.jpg"),
                    duration_seconds=info.get('duration', 0),
                    channel=info.get('channel', info.get('uploader', 'Unknown')),
                    upload_date=info.get('upload_date'),
                )
        except Exception as e:
            logger.error(f"Failed to get video metadata for {video_id}: {e}")
            return None

    def get_transcript(
        self,
        video_id: str,
        preferred_languages: list[str] = ["ko", "en", "ja"],
        max_retries: int = 3
    ) -> Optional[TranscriptResult]:
        """
        Get video transcript with rate limit resilience.

        Strategy:
        1. Try youtube-transcript-api with fresh instance (faster, simpler API)
        2. Fallback to yt-dlp subtitles (more robust, different session)

        Both methods hit YouTube's timedtext API, but using different
        sessions/methods increases resilience.
        """
        # Method 1: youtube-transcript-api with retry
        result = self._fetch_transcript_with_retry(
            video_id,
            preferred_languages,
            max_retries
        )

        if result:
            return result

        # Method 2: Fallback to yt-dlp
        logger.info(f"Falling back to yt-dlp for transcript: {video_id}")
        return self._fetch_transcript_ytdlp(video_id, preferred_languages)

    def _fetch_transcript_with_retry(
        self,
        video_id: str,
        preferred_languages: list[str],
        max_retries: int
    ) -> Optional[TranscriptResult]:
        """
        Fetch transcript using youtube-transcript-api with retry logic.

        Each retry uses a FRESH API instance to avoid session poisoning.
        """
        last_error = None

        for attempt in range(max_retries):
            try:
                # Pre-request delay (human-like behavior)
                if attempt > 0:
                    backoff = self._jittered_backoff(attempt)
                    logger.info(f"Retry {attempt + 1}/{max_retries} for {video_id}, waiting {backoff:.1f}s")
                    time.sleep(backoff)
                else:
                    self._random_pre_delay()

                # CRITICAL: Create fresh instance per request
                ytt = self._create_transcript_api()

                # Fetch transcript with language preferences
                transcript = ytt.fetch(video_id, languages=preferred_languages)

                # Format the transcript
                formatted_text = self._format_transcript_entries(transcript)

                # Determine if auto-generated (heuristic: check for language suffix)
                # youtube-transcript-api doesn't expose this directly in v1.x
                is_auto = False

                return TranscriptResult(
                    text=formatted_text,
                    language=preferred_languages[0] if transcript else 'unknown',
                    is_auto_generated=is_auto
                )

            except (TranscriptsDisabled, NoTranscriptFound, VideoUnavailable) as e:
                # These are permanent errors, no point retrying
                logger.warning(f"Transcript not available for {video_id}: {e}")
                return None

            except Exception as e:
                error_str = str(e).lower()
                last_error = e

                # Check for rate limit indicators
                if '429' in error_str or 'too many requests' in error_str or 'rate' in error_str:
                    logger.warning(f"Rate limited on attempt {attempt + 1} for {video_id}")
                    continue

                # Other errors - log and retry
                logger.warning(f"Transcript fetch attempt {attempt + 1} failed for {video_id}: {e}")
                continue

        logger.error(f"All {max_retries} attempts failed for {video_id}: {last_error}")
        return None

    def _format_transcript_entries(self, transcript_list) -> str:
        """Format transcript entries from youtube-transcript-api v1.x"""
        formatted_lines = []

        for entry in transcript_list:
            # v1.x returns list of dicts with 'text', 'start', 'duration'
            start = entry.get('start', 0)
            text = entry.get('text', '').strip()

            if text:
                minutes = int(start // 60)
                seconds = int(start % 60)
                timestamp = f"[{minutes:02d}:{seconds:02d}]"
                formatted_lines.append(f"{timestamp} {text}")

        return "\n".join(formatted_lines)

    def _fetch_transcript_ytdlp(
        self,
        video_id: str,
        preferred_languages: list[str]
    ) -> Optional[TranscriptResult]:
        """
        Fallback transcript fetching using yt-dlp.

        Uses a completely different session and request method,
        which may succeed even when youtube-transcript-api is rate limited.
        """
        url = f"https://www.youtube.com/watch?v={video_id}"

        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'skip_download': True,
            'writesubtitles': True,
            'writeautomaticsub': True,
            'subtitleslangs': preferred_languages + ['en'],
            'subtitlesformat': 'json3',
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=False)

                if not info:
                    return None

                # Check for subtitles
                subtitles = info.get('subtitles', {})
                auto_captions = info.get('automatic_captions', {})

                # Try manual subtitles first
                for lang in preferred_languages:
                    if lang in subtitles:
                        text = self._extract_subtitle_text(subtitles[lang], ydl, url, lang)
                        if text:
                            return TranscriptResult(
                                text=text,
                                language=lang,
                                is_auto_generated=False
                            )

                # Fall back to auto captions
                for lang in preferred_languages:
                    if lang in auto_captions:
                        text = self._extract_subtitle_text(auto_captions[lang], ydl, url, lang)
                        if text:
                            return TranscriptResult(
                                text=text,
                                language=lang,
                                is_auto_generated=True
                            )

                # Try any available subtitle
                for lang, subs in subtitles.items():
                    text = self._extract_subtitle_text(subs, ydl, url, lang)
                    if text:
                        return TranscriptResult(
                            text=text,
                            language=lang,
                            is_auto_generated=False
                        )

                # Try any auto caption
                for lang, subs in auto_captions.items():
                    text = self._extract_subtitle_text(subs, ydl, url, lang)
                    if text:
                        return TranscriptResult(
                            text=text,
                            language=lang,
                            is_auto_generated=True
                        )

                return None

        except Exception as e:
            logger.error(f"yt-dlp transcript fallback failed for {video_id}: {e}")
            return None

    def _extract_subtitle_text(
        self,
        subtitle_info: list[dict],
        ydl: yt_dlp.YoutubeDL,
        url: str,
        lang: str
    ) -> Optional[str]:
        """Extract text from subtitle info by downloading with yt-dlp"""
        try:
            import tempfile
            import json

            # Create temp directory for subtitle download
            with tempfile.TemporaryDirectory() as tmpdir:
                sub_opts = {
                    'quiet': True,
                    'no_warnings': True,
                    'skip_download': True,
                    'writesubtitles': True,
                    'writeautomaticsub': True,
                    'subtitleslangs': [lang],
                    'subtitlesformat': 'json3',
                    'outtmpl': f'{tmpdir}/%(id)s.%(ext)s',
                }

                with yt_dlp.YoutubeDL(sub_opts) as sub_ydl:
                    sub_ydl.download([url])

                # Find the downloaded subtitle file
                import glob
                sub_files = glob.glob(f'{tmpdir}/*.json3')

                if not sub_files:
                    # Try vtt format as fallback
                    sub_opts['subtitlesformat'] = 'vtt'
                    with yt_dlp.YoutubeDL(sub_opts) as sub_ydl:
                        sub_ydl.download([url])
                    sub_files = glob.glob(f'{tmpdir}/*.vtt')

                if not sub_files:
                    return None

                # Read and parse the subtitle file
                with open(sub_files[0], 'r', encoding='utf-8') as f:
                    content = f.read()

                if sub_files[0].endswith('.json3'):
                    return self._parse_json3_subtitles(content)
                else:
                    return self._parse_vtt_subtitles(content)

        except Exception as e:
            logger.debug(f"Failed to extract subtitle: {e}")
            return None

    def _parse_json3_subtitles(self, content: str) -> Optional[str]:
        """Parse json3 format subtitles"""
        try:
            import json
            data = json.loads(content)
            events = data.get('events', [])

            lines = []
            for event in events:
                if 'segs' in event:
                    start_ms = event.get('tStartMs', 0)
                    start_sec = start_ms / 1000
                    minutes = int(start_sec // 60)
                    seconds = int(start_sec % 60)
                    timestamp = f"[{minutes:02d}:{seconds:02d}]"

                    text = ''.join(seg.get('utf8', '') for seg in event['segs']).strip()
                    if text and text != '\n':
                        lines.append(f"{timestamp} {text}")

            return '\n'.join(lines) if lines else None
        except Exception:
            return None

    def _parse_vtt_subtitles(self, content: str) -> Optional[str]:
        """Parse VTT format subtitles"""
        try:
            lines = []
            current_time = None

            for line in content.split('\n'):
                line = line.strip()

                # Skip WEBVTT header and empty lines
                if not line or line.startswith('WEBVTT') or line.startswith('NOTE'):
                    continue

                # Check for timestamp line
                if '-->' in line:
                    # Extract start time
                    time_part = line.split('-->')[0].strip()
                    # Parse time (format: HH:MM:SS.mmm or MM:SS.mmm)
                    parts = time_part.replace(',', '.').split(':')
                    if len(parts) == 3:
                        minutes = int(parts[0]) * 60 + int(parts[1])
                        seconds = int(float(parts[2]))
                    else:
                        minutes = int(parts[0])
                        seconds = int(float(parts[1]))
                    current_time = f"[{minutes:02d}:{seconds:02d}]"
                elif current_time and line:
                    # This is subtitle text
                    # Remove HTML tags
                    import re
                    clean_text = re.sub(r'<[^>]+>', '', line)
                    if clean_text:
                        lines.append(f"{current_time} {clean_text}")
                    current_time = None

            return '\n'.join(lines) if lines else None
        except Exception:
            return None

    def _format_transcript(self, entries: list[dict]) -> str:
        """Format transcript entries into readable text with timestamps"""
        formatted_lines = []

        for entry in entries:
            start = entry.get('start', 0)
            text = entry.get('text', '').strip()

            if text:
                # Format timestamp as MM:SS
                minutes = int(start // 60)
                seconds = int(start % 60)
                timestamp = f"[{minutes:02d}:{seconds:02d}]"
                formatted_lines.append(f"{timestamp} {text}")

        return "\n".join(formatted_lines)

    def download_video(self, video_id: str, output_path: Optional[str] = None) -> Optional[str]:
        """
        Download video for Deep Mode analysis.
        Returns path to downloaded file.
        """
        if not output_path:
            output_path = os.path.join(self.settings.temp_storage_path, video_id)

        os.makedirs(os.path.dirname(output_path) if os.path.dirname(output_path) else self.settings.temp_storage_path, exist_ok=True)

        url = f"https://www.youtube.com/watch?v={video_id}"

        ydl_opts = {
            'format': 'best[height<=720]',  # Limit to 720p to save bandwidth
            'outtmpl': f"{output_path}.%(ext)s",
            'quiet': True,
            'no_warnings': True,
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(url, download=True)
                ext = info.get('ext', 'mp4')
                return f"{output_path}.{ext}"
        except Exception as e:
            logger.error(f"Failed to download video {video_id}: {e}")
            return None
