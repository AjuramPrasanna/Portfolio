import os
import json
import time
import urllib.request
import urllib.error
from collections import defaultdict
from typing import Literal

import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, field_validator
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.environ["OPENROUTER_API_KEY"]
AI_MODEL = os.environ.get("AI_MODEL", "google/gemma-4-26b-a4b-it")

# ── Limits ─────────────────────────────────────────────────────────────────────
MAX_MSG_LENGTH       = 200   # characters per user message
MAX_HISTORY_TURNS    = 5     # max user/assistant pairs accepted
MAX_REQUESTS_PER_MIN = 10    # per IP, rolling 60-second window

SYSTEM_PROMPT = (
    "You are a helpful AI assistant on Ajuram's portfolio website. "
    "Ajuram is a developer skilled in Python, AWS, Azure, Artificial Intelligence, "
    "web development (HTML, CSS, JS), SQL, Power Automate, and Copilot Studio. "
    "He has shipped 3 major projects, 25+ personal projects, and won 4 hackathons. "
    "He is exclusively interested in software and programming — things like building applications, "
    "AI/ML, cloud, automation, and web development. "
    "He is NOT interested in working in unrelated fields such as IT, networking, GIS, hardware, "
    "telecoms, or anything outside of software and programming. "
    "If asked about those non-programming fields, politely but clearly state that Ajuram "
    "is focused purely on software and programming work, and steer the conversation back to his actual skills. "
    "If asked about programming languages he doesn't use (like Java, C++, C#, Ruby, etc.), "
    "acknowledge that he could pick them up quickly given his background, "
    "but make it clear he prefers and actively works with Python and AI technologies, "
    "and is not looking to work in those other languages. "
    "Answer all other questions about his skills, projects, background, and experience concisely and enthusiastically. "
    "Keep responses brief (2-4 sentences max)."
)

# ── Pydantic models ────────────────────────────────────────────────────────────
class Message(BaseModel):
    role: Literal["user", "assistant"]
    content: str

    @field_validator("content")
    @classmethod
    def validate_content(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Please type something before sending.")
        return v

class ChatRequest(BaseModel):
    messages: list[Message]

    @field_validator("messages")
    @classmethod
    def validate_messages(cls, v: list[Message]) -> list[Message]:
        if not v:
            raise ValueError("Something went wrong sending your message. Please refresh the page and try again.")
        if len(v) > MAX_HISTORY_TURNS * 2:
            raise ValueError("You've reached the 5-message limit. Please reset the session to keep chatting.")
        for msg in v:
            if msg.role == "user" and len(msg.content) > MAX_MSG_LENGTH:
                raise ValueError(f"Your message is too long — please keep it under {MAX_MSG_LENGTH} characters.")
        return v

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["POST", "OPTIONS"],
    allow_headers=["Content-Type"],
)

# ── In-memory rate limit store {ip: [timestamp, ...]} ─────────────────────────
_rate_store: dict[str, list[float]] = defaultdict(list)

def _check_rate_limit(ip: str) -> bool:
    now = time.monotonic()
    timestamps = [t for t in _rate_store[ip] if now - t < 60.0]
    _rate_store[ip] = timestamps
    if len(timestamps) >= MAX_REQUESTS_PER_MIN:
        return False
    _rate_store[ip].append(now)
    return True

# ── Chat proxy endpoint ────────────────────────────────────────────────────────
@app.post("/api/chat")
async def chat(body: ChatRequest, req: Request):
    ip = req.client.host if req.client else "unknown"
    if not _check_rate_limit(ip):
        return JSONResponse(
            {"error": "You're sending messages too fast — please wait a moment and try again."},
            status_code=429,
        )

    # Enforce per-message length limit on all user messages
    for msg in body.messages:
        if msg.role == "user" and len(msg.content) > MAX_MSG_LENGTH:
            return JSONResponse(
                {"error": f"Your message is too long — please keep it under {MAX_MSG_LENGTH} characters."},
                status_code=400,
            )

    payload = json.dumps({
        "model": AI_MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            *[m.model_dump() for m in body.messages],
        ],
        "max_tokens": 256,
        "temperature": 0.7,
    }).encode("utf-8")

    or_req = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=payload,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {API_KEY}",
            "HTTP-Referer": str(req.url),
            "X-Title": "Ajuram's Portfolio",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(or_req, timeout=30) as resp:
            data = json.loads(resp.read().decode("utf-8"))
        reply = data["choices"][0]["message"]["content"].strip()
        return JSONResponse({"reply": reply})
    except urllib.error.HTTPError as e:
        if e.code == 429:
            return JSONResponse(
                {"error": "The AI service is a bit busy right now — please try again in a moment."},
                status_code=429,
            )
        if e.code in (401, 403):
            return JSONResponse(
                {"error": "The AI service couldn't be reached. Please try again later."},
                status_code=502,
            )
        return JSONResponse(
            {"error": "The AI service returned an unexpected error. Please try again shortly."},
            status_code=502,
        )
    except urllib.error.URLError:
        return JSONResponse(
            {"error": "Couldn't connect to the AI service. Please check your connection and try again."},
            status_code=502,
        )
    except (KeyError, IndexError, json.JSONDecodeError):
        return JSONResponse(
            {"error": "Received an unexpected response from the AI. Please try again."},
            status_code=502,
        )
    except Exception:
        return JSONResponse(
            {"error": "Something went wrong on our end. Please try again in a moment."},
            status_code=500,
        )

# ── Validation error handler — turn Pydantic errors into friendly messages ─────
from fastapi.exceptions import RequestValidationError

@app.exception_handler(RequestValidationError)
async def validation_error_handler(req: Request, exc: RequestValidationError):
    first = exc.errors()[0]
    msg = first.get("msg", "Something went wrong sending your message. Please refresh the page and try again.")
    # Strip pydantic's "Value error, " prefix if present
    msg = msg.removeprefix("Value error, ")
    return JSONResponse({"error": msg}, status_code=400)

# ── Health check (keeps Render free tier alive) ──────────────────────────────
@app.get("/health")
async def health():
    return JSONResponse({"ok": True})

# ── Serve static portfolio files (must come after API routes) ──────────────────
@app.get("/")
async def index():
    return FileResponse("index.html")

app.mount("/", StaticFiles(directory="."), name="static")

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    uvicorn.run("server:app", host="0.0.0.0", port=port)
