import { NextRequest } from 'next/server';

const clients = new Map<string, ReadableStreamDefaultController>();

export function notifyRevocation(userId: string, data: object) {
  const controller = clients.get(userId);
  if (controller) {
    try {
      controller.enqueue(
        `data: ${JSON.stringify(data)}\n\n`
      );
    } catch {
      clients.delete(userId);
    }
  }
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('userId');
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const stream = new ReadableStream({
    start(controller) {
      clients.set(userId, controller);
      
      controller.enqueue(
        `data: ${JSON.stringify({ type: 'connected', message: 'Sanctum revocation stream active' })}\n\n`
      );

      req.signal.addEventListener('abort', () => {
        clients.delete(userId);
        try {
          controller.close();
        } catch {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}