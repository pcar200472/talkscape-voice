import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import httpx
from dotenv import load_dotenv

load_dotenv()

ELEVEN_API_KEY = os.environ["ELEVENLABS_API_KEY"]
AGENT_ID = os.environ["ELEVENLABS_AGENT_ID"]

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten to your domain in production
    allow_methods=["*"],
    allow_headers=["*"]
)

# Serve the frontend (public/index.html)
app.mount("/", StaticFiles(directory="public", html=True), name="static")

@app.get("/api/signed-url")
async def get_signed_url(first_name: str = "Aroha", topic: str = "current needs"):
    url = f"https://api.elevenlabs.io/v1/convai/conversation/get-signed-url?agent_id={AGENT_ID}"
    headers = {"xi-api-key": ELEVEN_API_KEY}
    async with httpx.AsyncClient(timeout=10) as client:
        r = await client.get(url, headers=headers)
        r.raise_for_status()
        signed_url = r.json()["signed_url"]
    return {"signedUrl": signed_url, "variables": {"first_name": first_name, "topic": topic}}
