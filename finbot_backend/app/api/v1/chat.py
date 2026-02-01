from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Any
import asyncio
import json
import os
from openai import OpenAI
from app.core.config import settings


router = APIRouter()

class Message(BaseModel):
    role: str
    content: Optional[str] = None
    type: Optional[str] = None
    id: Optional[str] = None
    
    class Config:
        extra = "ignore"

class ChatRequest(BaseModel):
    messages: List[Message]
    
    class Config:
        extra = "ignore"

# --- Basic Setup ---
client = OpenAI(
    api_key=settings.THESYS_API_KEY,
    base_url="https://api.thesys.dev/v1/embed"
)

# File-based persistence
CHAT_DATA_FILE = "chat_history.json"
conversations = {}

def load_conversations():
    global conversations
    if os.path.exists(CHAT_DATA_FILE):
        try:
            with open(CHAT_DATA_FILE, "r") as f:
                conversations = json.load(f)
        except Exception as e:
            print(f"Error loading chat history: {e}")

def save_conversations():
    try:
        with open(CHAT_DATA_FILE, "w") as f:
            json.dump(conversations, f, indent=2)
    except Exception as e:
        print(f"Error saving chat history: {e}")

# Load on startup
load_conversations()


@router.post("/chat")
async def chat_endpoint(request: Request):
    try:
        body = await request.json()
    except Exception:
        body = {}
        
    print("DEBUG: Received raw request body:", json.dumps(body, indent=2))
    
    # Extract data
    user_message = ""
    # Prioritize header for thread ID
    thread_id = request.headers.get("x-finbot-thread-id")
    if not thread_id:
        thread_id = body.get("threadId", "default")
    
    messages = body.get("messages", [])
    if messages:
        user_message = messages[-1].get("content", "")
    else:
        # Check for 'prompt' object from C1Chat
        prompt_data = body.get("prompt")
        if prompt_data:
            user_message = prompt_data.get("content", "")

    # Initialize history for this thread if needed
    if thread_id not in conversations:
        conversations[thread_id] = [
            {"role": "system", "content": "You are a helpful assistant."}
        ]

    if user_message:
         conversations[thread_id].append({"role": "user", "content": user_message})
         save_conversations()

    async def event_generator():
        # Call the C1 API with the full history for this thread
        current_history = conversations[thread_id]
        
        try:
            stream = client.chat.completions.create(
                model="c1/anthropic/claude-sonnet-4/v-20250617",
                messages=current_history,
                stream=True,
            )

            full_response = ""
            for chunk in stream:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_response += content
                    yield content
                    await asyncio.sleep(0.01)

            # Add the AI's response to the history after streaming is done
            conversations[thread_id].append({"role": "assistant", "content": full_response})
            save_conversations()
            
        except Exception as e:
            print(f"Error calling OpenAI API: {e}")
            yield f"Error: {str(e)}"

    return StreamingResponse(event_generator(), media_type="text/plain")

@router.get("/chat/{thread_id}")
async def get_chat_history(thread_id: str):
    # Return history for the thread, defaulting to empty list if not found
    # We might want to filter out the system message for the frontend
    history = conversations.get(thread_id, [])
    return [msg for msg in history if msg.get("role") != "system"]
