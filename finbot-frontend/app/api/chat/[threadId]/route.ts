import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') || 'http://127.0.0.1:8000';

// GET /api/chat/[threadId] — proxy history fetch to backend
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const { threadId } = await params;
  const resp = await fetch(`${BACKEND_BASE}/api/v1/chat/${threadId}`, {
    headers: {
      'x-finbot-thread-id': req.headers.get('x-finbot-thread-id') || '',
      'authorization': req.headers.get('authorization') || '',
    },
  });
  const data = await resp.json();
  return NextResponse.json(data);
}
