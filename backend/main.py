import os
import json
from fastapi import FastAPI, HTTPException, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="Legal Aid Chatbot API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load System Prompt
PROMPT_FILE = os.path.join(os.path.dirname(__file__), "prompt_instructions.md")
with open(PROMPT_FILE, "r") as f:
    SYSTEM_PROMPT = f.read()

class ChatRequest(BaseModel):
    message: str
    model: str = "gemini-3-flash-preview"

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY", "")

OPENROUTER_MODELS = {
    "gemma": "google/gemma-7b-it",
    "minimax": "minimax/minimax-abab6.5",
    "qwen": "qwen/qwen-2-72b-instruct"
}

ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")
ELEVENLABS_VOICE_ID = os.getenv("DXFkLCBUTmvXpp2QwZjA", "21m00Tcm4TlvDq8ikWAM") # Rachel default

class TTSRequest(BaseModel):
    text: str

@app.post("/api/chat")
async def chat(request: ChatRequest):
    if not request.message:
        raise HTTPException(status_code=400, detail="Message is required")

    model_choice = request.model.lower()

    try:
        if model_choice == "gemini-3-flash-preview":
            if not GEMINI_API_KEY:
                raise HTTPException(status_code=500, detail="Gemini API Key not configured")
            
            model = genai.GenerativeModel(
                model_name=model_choice,
                system_instruction=SYSTEM_PROMPT
            )
            response = model.generate_content(request.message)
            if hasattr(response, 'usage_metadata'):
                print(f"Gemini Token Usage - Prompt: {response.usage_metadata.prompt_token_count}, Completion: {response.usage_metadata.candidates_token_count}, Total: {response.usage_metadata.total_token_count}")
            return {"response": response.text}

        elif model_choice in OPENROUTER_MODELS:
            if not OPENROUTER_API_KEY:
                raise HTTPException(status_code=500, detail="OpenRouter API Key not configured")
            
            openrouter_model = OPENROUTER_MODELS[model_choice]
            
            async with httpx.AsyncClient() as client:
                headers = {
                    "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                    "Content-Type": "application/json"
                }
                data = {
                    "model": openrouter_model,
                    "messages": [
                        {"role": "system", "content": SYSTEM_PROMPT},
                        {"role": "user", "content": request.message}
                    ]
                }
                
                res = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers=headers,
                    json=data,
                    timeout=30.0
                )
                
                if res.status_code != 200:
                    raise HTTPException(status_code=res.status_code, detail=f"OpenRouter Error: {res.text}")
                
                response_data = res.json()
                usage = response_data.get("usage", {})
                print(f"OpenRouter Token Usage - Prompt: {usage.get('prompt_tokens')}, Completion: {usage.get('completion_tokens')}, Total: {usage.get('total_tokens')}")
                return {"response": response_data["choices"][0]["message"]["content"]}
        
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported model: {model_choice}")

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/tts")
async def tts(request: TTSRequest):
    if not ELEVENLABS_API_KEY:
        raise HTTPException(status_code=500, detail="ElevenLabs API Key not configured")
        
    url = f"https://api.elevenlabs.io/v1/text-to-speech/{ELEVENLABS_VOICE_ID}"
    
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }
    
    data = {
        "text": request.text,
        "model_id": "eleven_multilingual_v2",
        "voice_settings": {
            "stability": 0.5,
            "similarity_boost": 0.75
        }
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        res = await client.post(url, headers=headers, json=data)
        if res.status_code != 200:
            raise HTTPException(status_code=res.status_code, detail=f"ElevenLabs Error: {res.text}")
        
        return Response(content=res.content, media_type="audio/mpeg")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
