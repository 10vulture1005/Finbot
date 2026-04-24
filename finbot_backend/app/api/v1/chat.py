from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
import asyncio
import json
import os
from openai import OpenAI
from app.core.config import settings
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.services.portfolio_service import get_portfolio


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


client = OpenAI(
    api_key=settings.THESYS_API_KEY,
    base_url="https://api.thesys.dev/v1/embed"
)

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


load_conversations()


def get_user_from_token(token: str, db: Session):
    """Authenticate a user from a raw JWT token string."""
    try:
        from jose import jwt as jose_jwt
        payload = jose_jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
        )
        user_id = int(payload.get("sub"))
        from app.models.user import User
        return db.query(User).filter(User.id == user_id).first()
    except Exception as e:
        print(f"[auth] Token decode failed: {e}")
        return None


def resolve_user(request: Request, db: Session):
    """
    Try all auth methods in order:
    1. Authorization header (standard)
    2. Cookie fallback
    3. Query param ?token= (works even when SDK strips custom headers)
    """
    # 1. Authorization header
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        user = get_user_from_token(auth_header[7:], db)
        if user:
            print(f"[auth] ✅ Via header: user_id={user.id}")
            return user

    # 2. Cookie fallback
    cookie_token = request.cookies.get("finbot_token")
    if cookie_token:
        user = get_user_from_token(cookie_token, db)
        if user:
            print(f"[auth] ✅ Via cookie: user_id={user.id}")
            return user

    # 3. Query param — Thesys SDK forwards the full apiUrl including query params
    query_token = request.query_params.get("token")
    if query_token:
        user = get_user_from_token(query_token, db)
        if user:
            print(f"[auth] ✅ Via query param: user_id={user.id}")
            return user

    print("[auth] ⚠️ No valid auth found")
    return None


def build_portfolio_system_prompt(holdings: list) -> str:
    """Build a rich system prompt from the user's current portfolio holdings."""
    today = __import__('datetime').date.today().strftime("%d %b %Y")

    if not holdings:
        return (
            "You are Finbot, an expert AI portfolio advisor specialising in Indian equity markets. "
            "The user currently has no stocks in their portfolio. "
            "Help them build one by asking about their investment goals, risk tolerance, and time horizon. "
            "Always be concise, data-driven, and helpful."
        )

    total_invested = sum(h.quantity * h.avg_price for h in holdings)
    total_value = sum(h.market_value or (h.quantity * (h.current_price or h.avg_price)) for h in holdings)
    total_return = total_value - total_invested
    total_return_pct = (total_return / total_invested * 100) if total_invested > 0 else 0

    sorted_holdings = sorted(
        holdings,
        key=lambda h: h.market_value or (h.quantity * (h.current_price or 0)),
        reverse=True
    )

    table_rows = []
    for h in sorted_holdings:
        mv = h.market_value or (h.quantity * (h.current_price or h.avg_price))
        weight = (mv / total_value * 100) if total_value > 0 else 0
        cp = h.current_price or h.avg_price
        invested = h.quantity * h.avg_price
        pnl = mv - invested
        pnl_pct = (pnl / invested * 100) if invested > 0 else 0
        daily_pnl = (h.daily_return or 0) * mv
        sector = h.sector or "Unknown"
        table_rows.append(
            f"| {h.symbol} | {h.quantity} | ₹{h.avg_price:,.2f} | ₹{cp:,.2f} | "
            f"₹{mv:,.0f} | {weight:.1f}% | {pnl_pct:+.1f}% | ₹{daily_pnl:+,.0f} | {sector} |"
        )

    table = "\n".join(table_rows)

    sector_map: dict = {}
    for h in holdings:
        s = h.sector or "Unknown"
        mv = h.market_value or (h.quantity * (h.current_price or h.avg_price))
        sector_map[s] = sector_map.get(s, 0) + mv

    sector_summary = ", ".join(
        f"{s}: {(v / total_value * 100):.1f}%" for s, v in
        sorted(sector_map.items(), key=lambda x: x[1], reverse=True)
    ) if total_value > 0 else "N/A"

    return f"""You are Finbot, an expert AI portfolio advisor specialising in Indian equity markets.
Today's date: {today}

## User's Current Portfolio

| Symbol | Qty | Avg Cost | CMP | Market Value | Weight | Return | Day P&L | Sector |
|--------|-----|----------|-----|-------------|--------|--------|---------|--------|
{table}

**Summary**
- Total Invested: ₹{total_invested:,.0f}
- Current Value:  ₹{total_value:,.0f}
- Net P&L:        ₹{total_return:+,.0f} ({total_return_pct:+.2f}%)
- Sector Exposure: {sector_summary}

## Instructions
- Always answer questions in the context of the above portfolio.
- When the user asks about their largest holding, biggest loss, best performer etc., refer to the table.
- Give concise, actionable advice. Cite specific symbols and numbers from the portfolio.
- If asked about rebalancing, risk, or diversification, use the portfolio data above.
- Do NOT make up data — only use what is provided.
- If you are uncertain about real-time prices, mention that the data shown is from the last market close.
"""


# ✅ Specific routes BEFORE parameterized routes

@router.post("/chat")
async def chat_endpoint(request: Request, db: Session = Depends(get_db)):
    try:
        body = await request.json()
    except Exception:
        body = {}

    # ✅ SDK sends threadId in the body, not in custom headers
    thread_id = (
        request.headers.get("x-finbot-thread-id") or
        body.get("threadId") or
        "default"
    )

    # Extract user message — SDK uses 'prompt' key
    user_message = ""
    messages = body.get("messages", [])
    if messages:
        user_message = messages[-1].get("content", "")
    else:
        prompt_data = body.get("prompt") or body.get("message")
        if isinstance(prompt_data, dict):
            user_message = prompt_data.get("content", "")
        elif isinstance(prompt_data, str):
            user_message = prompt_data

    # ✅ Resolve user via header, cookie, or query param
    user = resolve_user(request, db)

    # Build fresh system prompt on every request
    if user:
        try:
            holdings = get_portfolio(db, user.id)
            system_prompt = build_portfolio_system_prompt(holdings)
            print(f"[chat] ✅ thread={thread_id} user={user.id} holdings={len(holdings)}")
        except Exception as e:
            print(f"[chat] Failed to get portfolio: {e}")
            system_prompt = build_portfolio_system_prompt([])
    else:
        print(f"[chat] ⚠️ No user — empty portfolio prompt. thread={thread_id}")
        system_prompt = build_portfolio_system_prompt([])

    # Always refresh system prompt with latest data
    if thread_id not in conversations:
        conversations[thread_id] = [{"role": "system", "content": system_prompt}]
    else:
        conversations[thread_id][0] = {"role": "system", "content": system_prompt}

    if user_message:
        conversations[thread_id].append({"role": "user", "content": user_message})
        save_conversations()
    else:
        print("[chat] Warning: No user message found in request body.", body)
        async def mock_generator():
            yield ""
        return StreamingResponse(mock_generator(), media_type="text/plain")

    async def event_generator():
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

            conversations[thread_id].append({"role": "assistant", "content": full_response})
            save_conversations()

        except Exception as e:
            print(f"[chat] API error: {e}")
            yield f"Error: {str(e)}"

    return StreamingResponse(event_generator(), media_type="text/plain")


@router.post("/chat/init")
async def init_chat_thread(request: Request, db: Session = Depends(get_db)):
    """Pre-seed a thread with portfolio context."""
    body = await request.json()
    thread_id = body.get("threadId")

    if not thread_id:
        raise HTTPException(status_code=400, detail="threadId required")

    user = resolve_user(request, db)

    if user:
        try:
            holdings = get_portfolio(db, user.id)
            system_prompt = build_portfolio_system_prompt(holdings)
            print(f"[init] ✅ Seeded thread '{thread_id}' with {len(holdings)} holdings")
        except Exception as e:
            print(f"[init] Failed to get portfolio: {e}")
            system_prompt = build_portfolio_system_prompt([])
    else:
        print(f"[init] ⚠️ No user resolved")
        system_prompt = build_portfolio_system_prompt([])

    conversations[thread_id] = [{"role": "system", "content": system_prompt}]
    save_conversations()

    return {"status": "ok", "thread_id": thread_id}


# ✅ Parameterized route LAST
@router.get("/chat/{thread_id}")
async def get_chat_history(thread_id: str):
    history = conversations.get(thread_id, [])
    return [msg for msg in history if msg.get("role") != "system"]