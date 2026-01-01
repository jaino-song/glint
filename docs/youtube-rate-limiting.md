# YouTube Rate Limiting - Mitigation Strategy

> **Status**: Implemented in `apps/worker/app/services/youtube_service.py`
> **Last Updated**: 2026-01-02
> **Recommended Solution**: `youtube-transcript-api` v1.x + Webshare Rotating Proxy

---

## Problem Statement

When fetching YouTube transcripts at scale, we encounter **429 Too Many Requests** errors from YouTube's timedtext API. This affects both:
- `youtube-transcript-api` library
- `yt-dlp` subtitle extraction

Both methods ultimately hit the same YouTube endpoint, so switching between them doesn't solve the root cause.

### Why This Happens

1. **IP-based rate limiting**: YouTube tracks request frequency per IP address
2. **Session poisoning**: A single `YouTubeTranscriptApi()` instance accumulates cookies/fingerprints that get flagged. Once flagged, ALL subsequent requests fail.
3. **Pattern detection**: Consistent timing between requests triggers bot detection

---

## Recommended Solution: Webshare + youtube-transcript-api v1.x

The `youtube-transcript-api` library's creator specifically added a built-in `WebshareProxyConfig` class because so many users were getting rate-limited. This is the officially supported solution.

### Why Webshare?

1. **Native Integration**: `youtube-transcript-api` v1.x has built-in `WebshareProxyConfig` class
2. **Automatic IP Rotation**: Each request can use a different exit IP
3. **Auto-Generated Captions**: Fetches auto-generated transcripts by default if manual ones aren't available
4. **Cost-Effective**: $4.99/10GB is sufficient for thousands of transcript fetches

### Implementation Code

```python
from youtube_transcript_api import YouTubeTranscriptApi
from youtube_transcript_api.proxies import WebshareProxyConfig

# Strategy 1: Basic Webshare setup
def fetch_transcript(video_id: str, username: str, password: str):
    """
    Fetch transcript with Webshare rotating proxy.
    Creates a NEW instance per request (disposable session pattern).
    """
    proxy_config = WebshareProxyConfig(
        proxy_username=username,
        proxy_password=password
    )

    # CRITICAL: New instance per request to avoid session poisoning
    ytt = YouTubeTranscriptApi(proxy_config=proxy_config)

    # Fetches auto-generated captions by default if manual aren't available
    transcript = ytt.fetch(video_id, languages=['ko', 'en'])

    return transcript


# Strategy 2: Explicit auto-generated caption hunting
def fetch_auto_transcript(video_id: str, username: str, password: str):
    """
    Explicitly fetch auto-generated transcripts when manual ones don't exist.
    """
    proxy_config = WebshareProxyConfig(
        proxy_username=username,
        proxy_password=password
    )

    ytt = YouTubeTranscriptApi(proxy_config=proxy_config)

    # List all available transcripts
    transcript_list = ytt.list_transcripts(video_id)

    try:
        # Try manual transcripts first
        transcript = transcript_list.find_manually_created_transcript(['ko', 'en'])
    except:
        # Fall back to auto-generated
        transcript = transcript_list.find_generated_transcript(['ko', 'en'])

    return transcript.fetch()
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Transcript Fetcher                           │
├─────────────────────────────────────────────────────────────────┤
│  1. youtube-transcript-api + WebshareProxyConfig                │
│           ↓ (on 429/failure)                                    │
│  2. yt-dlp subtitles (different session)                        │
│           ↓ (on failure)                                        │
│  3. Metadata-only analysis (graceful degradation)               │
└─────────────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────────────┐
│              Rate Limit Resilience Layer                        │
├─────────────────────────────────────────────────────────────────┤
│  • WebshareProxyConfig (built-in rotating proxy support)        │
│  • Fresh API instance per request (disposable session)          │
│  • Jittered exponential backoff (2^n + random 0-2s)             │
│  • Pre-request random delay (0.5-2s)                            │
└─────────────────────────────────────────────────────────────────┘
```

### Key Implementation Details

#### 1. Disposable Sessions with Webshare
```python
def _create_transcript_api(self) -> YouTubeTranscriptApi:
    """
    CRITICAL: Always create a new instance per request to avoid session poisoning.

    Each new instance with WebshareProxyConfig:
    - Gets a fresh session
    - Routes through a different exit IP (depending on Webshare settings)
    - Avoids accumulated fingerprints from previous requests
    """
    if self._proxy_url and self._proxy_url.startswith('webshare:'):
        parts = self._proxy_url.split(':')
        proxy_config = WebshareProxyConfig(
            proxy_username=parts[1],
            proxy_password=':'.join(parts[2:])
        )
        return YouTubeTranscriptApi(proxy_config=proxy_config)

    return YouTubeTranscriptApi()
```

**Why**: YouTube's detection looks at session fingerprints. Reusing a single instance means once it's flagged, every subsequent request fails regardless of timing.

#### 2. Jittered Exponential Backoff
```python
def _jittered_backoff(self, attempt: int, base: float = 2.0, max_delay: float = 60.0) -> float:
    """
    Formula: min(max_delay, (base^attempt) + random(0, 2))

    The randomness breaks the robotic pattern signature.
    """
    exponential_delay = min(max_delay, base ** attempt)
    jitter = random.uniform(0, 2)
    return exponential_delay + jitter
```

**Why**: Fixed retry intervals (e.g., every 2 seconds) look more robotic than human behavior. Adding randomness breaks this pattern.

#### 3. Dual-Method Fallback
```python
def get_transcript(self, video_id: str, ...):
    # Method 1: youtube-transcript-api with Webshare
    result = self._fetch_transcript_with_retry(video_id, ...)
    if result:
        return result

    # Method 2: Fallback to yt-dlp
    return self._fetch_transcript_ytdlp(video_id, ...)
```

**Why**: Even though both hit YouTube's API, they use different sessions and request patterns, increasing the chance of success.

#### 4. Pre-Request Delay
```python
def _random_pre_delay(self, min_sec: float = 0.5, max_sec: float = 2.0):
    """Add random delay before request to appear more human-like."""
    delay = random.uniform(min_sec, max_sec)
    time.sleep(delay)
```

**Why**: Humans don't make instant requests. A small random delay before each request helps avoid pattern detection.

---

## Production Configuration

### Environment Variables

Add to `apps/worker/.env`:

```bash
# YouTube Rate Limit Mitigation (REQUIRED for production)

# Webshare Rotating Proxy (Recommended - native support in youtube-transcript-api)
YOUTUBE_PROXY_URL=webshare:your_username:your_password
```

### Webshare Setup

1. **Sign up** at [webshare.io](https://www.webshare.io/)
2. **Get credentials**: Dashboard → Proxy → Username & Password
3. **Configure rotation**: Set to "Rotating" mode for automatic IP rotation
4. **Add to .env**: `YOUTUBE_PROXY_URL=webshare:username:password`

### Proxy Service Comparison

| Service | Price | Native Support | Best For |
|---------|-------|:--------------:|----------|
| **Webshare** | $4.99/10GB | ✅ Built-in | Recommended - official library support |
| **BrightData** | ~$15/GB | ❌ Manual | Enterprise, highest success rate |
| **ScraperAPI** | $49/100k req | ❌ Manual | Simplest setup |
| **SmartProxy** | $8/GB | ❌ Manual | Cost-effective medium volume |

### Why Rotating Proxies Are Essential

Without a rotating proxy, your server's IP address will eventually get rate-limited. This is especially problematic for:
- **Cloud servers** (AWS, GCP, DigitalOcean): Their IP ranges are well-known and often preemptively rate-limited
- **High-volume usage**: More than ~50 requests/hour from same IP triggers limits

With Webshare + youtube-transcript-api:
- Each request routes through a different IP
- YouTube can't build a pattern profile
- Success rate approaches 99%+
- Auto-generated transcripts work seamlessly

---

## Testing & Development

### Without Proxy (Development Only)

For local development with low volume:

1. **Wait for rate limit to clear**: Usually 30-60 minutes after being blocked
2. **Increase backoff timing**:
   ```python
   # In youtube_service.py
   def _jittered_backoff(self, attempt: int, base: float = 5.0, max_delay: float = 120.0):
   ```
3. **Reduce concurrent requests**: Set `max_concurrent_jobs=1` in config

### Testing Rate Limit Handling

```python
# Test script to verify retry logic
import asyncio
from app.services.youtube_service import YouTubeService

async def test_transcript():
    service = YouTubeService()

    # Test with a known video
    result = service.get_transcript("dQw4w9WgXcQ")  # Rick Astley

    if result:
        print(f"Success! Language: {result.language}")
        print(f"First 100 chars: {result.text[:100]}")
    else:
        print("Failed to get transcript")

asyncio.run(test_transcript())
```

---

## Monitoring & Alerts

### Metrics to Track

1. **Transcript success rate**: Should be >95% with proxy
2. **Retry count distribution**: Most requests should succeed on first try
3. **Fallback usage**: High yt-dlp fallback usage indicates youtube-transcript-api issues

### Log Messages to Watch

```
# Normal operation
INFO: Fetching transcript for video XXX

# Rate limit hit (expected occasionally)
WARNING: Rate limited on attempt 1 for XXX
INFO: Retry 2/3 for XXX, waiting 4.3s

# Fallback triggered
INFO: Falling back to yt-dlp for transcript: XXX

# Complete failure (investigate if frequent)
ERROR: All 3 attempts failed for XXX: ...
ERROR: yt-dlp transcript fallback failed for XXX: ...
```

---

## Future Improvements

### Considered but Not Implemented

1. **Cookie injection**: Using logged-in YouTube account cookies
   - **Risk**: Account ban, ToS violation
   - **Status**: Not recommended for production

2. **Multiple API keys**: Rotating between different Google accounts
   - **Risk**: Doesn't help - rate limit is IP-based, not account-based
   - **Status**: Not useful

3. **Browser automation (Playwright)**: Fully simulate browser behavior
   - **Pros**: Highest success rate
   - **Cons**: 10x slower, 5x more expensive (compute)
   - **Status**: Consider only if proxy solution fails

### Recommended Next Steps

1. **Set up proxy monitoring**: Track proxy bandwidth usage and costs
2. **Implement circuit breaker**: Auto-disable transcript fetching during severe outages
3. **Add Redis caching**: Cache transcripts to reduce redundant requests

---

## References

- [youtube-transcript-api v1.x Documentation](https://github.com/jdepoix/youtube-transcript-api)
- [Webshare Proxy Setup Guide](https://www.webshare.io/documentation)
- [YouTube Rate Limiting Deep Dive (Video)](https://www.youtube.com/watch?v=...) - How to bypass rate limiting

---

*Last tested: 2026-01-02 with youtube-transcript-api v1.2.3*
