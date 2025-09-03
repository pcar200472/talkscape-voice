import os
from dotenv import load_dotenv

here = os.path.dirname(os.path.abspath(__file__))
dotenv_path = os.path.join(here, ".env")
loaded = load_dotenv(dotenv_path=dotenv_path)

print("Loaded .env file:", loaded)
print(".env path used:", dotenv_path)
print("ELEVENLABS_API_KEY present:", bool(os.getenv("ELEVENLABS_API_KEY")))
print("AGENT_ID present:", bool(os.getenv("ELEVENLABS_AGENT_ID")))
print("API key (first 6 chars):", (os.getenv("ELEVENLABS_API_KEY") or "")[:6])
print("Agent ID:", os.getenv("ELEVENLABS_AGENT_ID"))
