const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:8000';

export async function POST(req: Request) {
  const body = await req.text();

  const upstream = await fetch(`${BACKEND}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  });

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'Content-Type': 'text/event-stream',
      'x-vercel-ai-ui-message-stream': 'v1',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
