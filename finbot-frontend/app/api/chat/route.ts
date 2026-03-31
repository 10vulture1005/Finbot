import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://127.0.0.1:8000';

function buildForwardHeaders(req: NextRequest): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Forward standard headers from the incoming request
  const forwardList = ['authorization', 'x-finbot-thread-id', 'accept', 'accept-language'];
  for (const key of forwardList) {
    const val = req.headers.get(key);
    if (val) headers[key] = val;
  }

  // ✅ Thesys SDK strips custom headers — inject token from cookie as fallback
  if (!headers['authorization']) {
    const cookieToken = req.cookies.get('finbot_token')?.value;
    if (cookieToken) {
      headers['authorization'] = `Bearer ${cookieToken}`;
      console.log('[route] ✅ Injected Authorization from cookie');
    } else {
      console.log('[route] ⚠️ No token found in headers or cookies');
    }
  }

  return headers;
}

// POST /api/chat — proxy to backend, always with auth
export async function POST(req: NextRequest) {
  const body = await req.text();
  const headers = buildForwardHeaders(req);

  const resp = await fetch(`${BACKEND_BASE}/api/v1/chat`, {
    method: 'POST',
    headers,
    body,
  });

  return new NextResponse(resp.body, {
    status: resp.status,
    headers: {
      'Content-Type': resp.headers.get('Content-Type') || 'text/plain',
      'Transfer-Encoding': 'chunked',
    },
  });
}

// GET /api/chat/[threadId] — proxy history fetch
export async function GET(req: NextRequest) {
  const threadId = req.nextUrl.pathname.split('/').pop();
  const resp = await fetch(`${BACKEND_BASE}/api/v1/chat/${threadId}`, {
    headers: buildForwardHeaders(req),
  });
  const data = await resp.json();
  return NextResponse.json(data);
}