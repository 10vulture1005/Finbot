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
    console.log("=========================================");
    console.log(`[API CHAT] Intercepted Request: ${req.method} ${req.url}`);
    console.log("[API CHAT] Raw Body Payload: ", rawText);
    console.log("=========================================");
    bodyData = rawText ? JSON.parse(rawText) : {};
  } catch(e) {
    console.log("[API CHAT] Failed to parse JSON:", e);
    bodyData = {};
  }

  // The Thesys SDK sends an empty POST on mount to initialize.
  // Intercept it here and return a proper empty chunked stream so the SDK
  // doesn't get confused by the backend's fallback response.
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

  const threadId = req.headers.get('x-finbot-thread-id') || bodyData.threadId || "default";
  
  // Extract user prompt
  let prompt: any = { role: "user", content: "" };
  if (bodyData.messages && bodyData.messages.length > 0) {
    prompt = bodyData.messages[bodyData.messages.length - 1];
  } else if (bodyData.prompt) {
    prompt = typeof bodyData.prompt === "string" ? { role: "user", content: bodyData.prompt } : bodyData.prompt;
  } else if (bodyData.message) {
    prompt = typeof bodyData.message === "string" ? { role: "user", content: bodyData.message } : bodyData.message;
  }

  const headers = buildForwardHeaders(req);

  const resp = await fetch(`${BACKEND_BASE}/api/v1/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify(bodyData),
  });

  if (!resp.body) return resp;

  let fullResponse = "";

  // Decode userId from the JWT in the URL — runs server-side, no localStorage needed
  let userId = "unknown";
  try {
    const urlToken = new URL(req.url).searchParams.get("token") || "";
    if (urlToken) {
      const payload = urlToken.split(".")[1];
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
      if (fullResponse) {
        const assistantMessage = { role: "assistant", content: fullResponse };
        try {
          await addMessages(threadId, prompt, assistantMessage, userId);
        } catch (e) {
          console.error("Failed to save to Firebase:", e);
        }
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

// GET /api/chat/[threadId] — handled entirely by UI loading from Firebase, but leaving proxy for backward compatibility if needed
export async function GET(req: NextRequest) {
  const threadId = req.nextUrl.pathname.split('/').pop();
  try {
    const resp = await fetch(`${BACKEND_BASE}/api/v1/chat/${threadId}`, {
      headers: buildForwardHeaders(req),
    });
    const data = await resp.json();
    return NextResponse.json(data);
  } catch(e) {
    return NextResponse.json([]);
  }
}