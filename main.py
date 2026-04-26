from fastapi import FastAPI, HTTPException, Query
from fastapi.responses import FileResponse, StreamingResponse
from fastapi.staticfiles import StaticFiles
from urllib.parse import quote
import yt_dlp
import requests
import re
import logging
from fastapi.middleware.cors import CORSMiddleware



app = FastAPI()

# =========================
# STATIC
# =========================




app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://tweeloads.com/"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)


app.mount("/static", StaticFiles(directory="static"), name="static")


@app.get("/")
async def root():
    return FileResponse("templates/index.html")





# =========================
# HELPERS
# =========================
def safe_filename(name: str):
    
    name = re.sub(r'[\\/*?:"<>|]', "", name)
    return name.strip()


def format_bytes(size):
    if not size:
        return None

    for unit in ["B", "KB", "MB", "GB"]:
        if size < 1024:
            return f"{size:.1f} {unit}"
        size /= 1024

    return f"{size:.1f} TB"


# =========================
# INFO API
# =========================
@app.post("/api/v1/info")
async def get_info(url: str):
    try:
        ydl_opts = {
            "quiet": True,
            "skip_download": True,
            "noplaylist": True
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

        formats = info.get("formats", [])

        video_formats = []
        audio_formats = []

        seen_video = set()
        seen_audio = set()

        for f in formats:

            # =========================
            # VIDEO FORMATS
            # =========================
            if (
                f.get("vcodec") != "none"
                and f.get("height")
                and f.get("url")
            ):
                height = f.get("height")

                if height not in seen_video:
                    seen_video.add(height)

                    video_formats.append({
                        "format_id": f.get("format_id"),
                        "height": height,
                        "ext": "mp4",
                        "filesize": format_bytes(
                            f.get("filesize") or f.get("filesize_approx")
                        )
                    })

            # =========================
            # AUDIO FORMATS
            # =========================
            if (
                f.get("acodec") != "none"
                and f.get("url")
            ):
                abr = int(f.get("abr") or 128)

                # duplicate avoid
                if abr not in seen_audio:
                    seen_audio.add(abr)

                    audio_formats.append({
                        "format_id": f.get("format_id"),
                        "ext": "mp3",   # frontend official label
                        "abr": abr,
                        "filesize": format_bytes(
                            f.get("filesize") or f.get("filesize_approx")
                        )
                    })

        # sort
        video_formats.sort(key=lambda x: x["height"], reverse=True)
        audio_formats.sort(key=lambda x: x["abr"], reverse=True)

        title = info.get("title") or "video"

        return {
            "title": title,
            "safe_title": safe_filename(title),
            "uploader": info.get("uploader") or "Unknown",
            "duration": info.get("duration"),
            "thumbnail": info.get("thumbnail"),
            "description": info.get("description"),
            "video_formats": video_formats[:6],
            "audio_formats": audio_formats[:4]
        }

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


# =========================
# STREAM API
# =========================



@app.get("/api/v1/stream")
async def stream_video(
    url: str = Query(...),
    format_id: str | None = None,
    filename: str = "video"
):
    try:
        logger.info(f"[START] Stream request | URL: {url} | format_id: {format_id}")

        ydl_opts = {
            "quiet": True,
            "skip_download": True,
            "noplaylist": True
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

        formats = info.get("formats", [])
        logger.info(f"[INFO] Total formats found: {len(formats)}")

        selected = None

        for f in formats:
            if f.get("format_id") == format_id:
                selected = f
                break

        if not selected:
            logger.error("[ERROR] Format not found")
            raise Exception("Format not found")

        media_url = selected.get("url")
        logger.info(f"[INFO] Media URL found: {media_url[:100]}...")

        if not media_url:
            logger.error("[ERROR] Media URL missing")
            raise Exception("Media url missing")

        # 🔥 FIXED HEADERS
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Accept": "*/*",
            "Accept-Language": "en-US,en;q=0.9",
            "Origin": "https://twitter.com",
            "Referer": "https://twitter.com/",
            "Connection": "keep-alive"
        }

        logger.info("[REQUEST] Sending request to CDN...")

        r = requests.get(
            media_url,
            stream=True,
            headers=headers,
            timeout=15,
            allow_redirects=True
        )

        logger.info(f"[RESPONSE] Status Code: {r.status_code}")

        if r.status_code != 200:
            logger.error(f"[ERROR] CDN blocked | Status: {r.status_code}")
            raise Exception(f"CDN blocked: {r.status_code}")

        # extension detect
        if selected.get("vcodec") == "none":
            ext = "mp3"
        else:
            ext = "mp4"

        filename = safe_filename(filename)
        safe_name = quote(filename)

        logger.info("[SUCCESS] Streaming started...")

        return StreamingResponse(
            r.iter_content(chunk_size=1024 * 512),
            media_type="application/octet-stream",
            headers={
                "Content-Disposition":
                f"attachment; filename*=UTF-8''{safe_name}.{ext}"
            }
        )

    except Exception as e:
        logger.exception("[FATAL ERROR] Stream failed")
        raise HTTPException(status_code=400, detail=str(e))