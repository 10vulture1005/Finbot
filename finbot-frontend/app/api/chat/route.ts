import { NextRequest, NextResponse } from 'next/server';
import { addMessages } from '@/app/services/threadService';

const envApiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
const BACKEND_BASE = envApiUrl?.replace('/api/v1', '') || 'http://127.0.0.1:8000';

function buildForwardHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const forwardList = ['authorization', 'x-finbot-thread-id', 'accept', 'accept-language'];
  for (const key of forwardList) {
    const val = req.headers.get(key);
    if (val) headers[key] = val;
  }

  if (!headers['authorization']) {
    const cookieToken = req.cookies.get('finbot_token')?.value;
    if (cookieToken) {
      headers['authorization'] = `Bearer ${cookieToken}`;
    }
  }

  return headers;
}

export async function POST(req: NextRequest) {
  let bodyData: Record<string, any> = {};
  let rawText = "";
  try {
    rawText = await req.text();
    console.log("[API CHAT] Intercepted POST, body length:", rawText.length);
    bodyData = rawText ? JSON.parse(rawText) : {};
  } catch(e) {
    console.log("[API CHAT] Failed to parse JSON:", e);
    bodyData = {};
  }

  // The Thesys SDK sends an empty POST on mount to initialize.
  if (!rawText.trim()) {
    console.log("[API CHAT] Empty SDK ping — returning empty stream.");
    const emptyStream = new ReadableStream({
      start(controller) {
        controller.close();
      },
    });
    return new NextResponse(emptyStream, {
      status: 200,
      headers: { 'Content-Type': 'text/plain', 'Transfer-Encoding': 'chunked' },
    });
  }

  // ─── Resolve threadId ──────────────────────────────────────────────────
  // The SDK sends threadId in various places depending on version:
  // 1. x-finbot-thread-id header (custom)
  // 2. bodyData.threadId (SDK default)
  // 3. URL query param
  const threadId =
    req.headers.get('x-finbot-thread-id') ||
    bodyData.threadId ||
    new URL(req.url).searchParams.get('threadId') ||
    "default";

  console.log(`[API CHAT] threadId=${threadId}`);

  // ─── Extract user prompt ───────────────────────────────────────────────
  let prompt: any = { role: "user", content: "" };
  if (bodyData.messages && bodyData.messages.length > 0) {
    const lastMsg = bodyData.messages[bodyData.messages.length - 1];
    prompt = {
      role: lastMsg.role || "user",
      content: typeof lastMsg.content === "string"
        ? lastMsg.content
        : typeof lastMsg.message === "string"
          ? lastMsg.message
          : lastMsg.content || ""
    };
  } else if (bodyData.prompt) {
    prompt = typeof bodyData.prompt === "string" ? { role: "user", content: bodyData.prompt } : bodyData.prompt;
  } else if (bodyData.message) {
    prompt = typeof bodyData.message === "string" ? { role: "user", content: bodyData.message } : bodyData.message;
  }

  const headers = buildForwardHeaders(req);

  // Forward the threadId to the backend
  headers['x-finbot-thread-id'] = threadId;

  const resp = await fetch(`${BACKEND_BASE}/api/v1/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...bodyData, threadId }),
  });

  if (!resp.body) return resp;

  let fullResponse = "";

  // Decode userId from the JWT
  let userId = "unknown";
  try {
    // Check URL token param first, then authorization header
    const urlToken = new URL(req.url).searchParams.get("token") || "";
    const headerToken = headers['authorization']?.replace('Bearer ', '') || "";
    const token = urlToken || headerToken;
    if (token) {
      const payload = token.split(".")[1];
      const decoded = JSON.parse(Buffer.from(payload, "base64").toString());
      userId = decoded.sub || "unknown";
    }
  } catch (e) {
    console.error("[API CHAT] Failed to decode JWT:", e);
  }

  const transformStream = new TransformStream({
    transform(chunk, controller) {
      const text = new TextDecoder().decode(chunk);
      fullResponse += text;
      controller.enqueue(chunk);
    },
    async flush() {
      if (fullResponse && threadId !== "default") {
        const assistantMessage = { role: "assistant", content: fullResponse };
        try {
          console.log(`[API CHAT] Saving messages to Firestore: thread=${threadId}, userId=${userId}, responseLen=${fullResponse.length}`);
          await addMessages(threadId, prompt, assistantMessage, userId);
          console.log(`[API CHAT] ✅ Messages saved successfully`);
        } catch (e) {
          console.error("[API CHAT] Failed to save to Firebase:", e);
        }
      } else if (threadId === "default") {
        console.warn("[API CHAT] ⚠️ Skipping Firestore save — threadId is 'default'");
      }
    }
  });

  return new NextResponse(resp.body.pipeThrough(transformStream), {
    status: resp.status,
    headers: {
      'Content-Type': resp.headers.get('Content-Type') || 'text/plain',
      'Transfer-Encoding': 'chunked',
    },
  });
}

// GET /api/chat — fallback
export async function GET(req: NextRequest) {
  return NextResponse.json([]);
}