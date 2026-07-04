import { NextResponse } from 'next/server';
import { finalizeVideoJob, verifyJobSignature } from '@/lib/video-finalize';

/**
 * fal.ai queue webhook receiver.
 *
 * FalProvider submits jobs with
 *   ?fal_webhook=<base>/api/video/fal-webhook?jobId=<id>&sig=<hmac>
 * so results arrive by push — required on Vercel, where post-response
 * polling never runs. The HMAC (keyed by N8N_CALLBACK_SECRET) proves the
 * URL was minted by us; without it jobId/sig pairs are unguessable.
 *
 * fal payload: { request_id, status: "OK" | "ERROR", payload, error? }
 * where payload carries the model output ({ video: { url } }).
 */

interface FalWebhookBody {
  request_id?: string;
  status?: string;
  payload?: { video?: { url?: string }; detail?: unknown };
  error?: string;
}

export async function POST(request: Request) {
  try {
    const url = new URL(request.url);
    const jobId = url.searchParams.get('jobId');
    const sig = url.searchParams.get('sig');

    if (!jobId || !sig || !verifyJobSignature(jobId, sig)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as FalWebhookBody | null;
    if (!body) {
      return NextResponse.json({ message: 'Invalid body' }, { status: 400 });
    }

    if (body.status === 'OK') {
      const outputUrl = body.payload?.video?.url;
      const result = await finalizeVideoJob(
        outputUrl
          ? { jobId, outputUrl }
          : { jobId, error: 'fal returned no video url' },
      );
      if (!result.ok) {
        return NextResponse.json({ message: result.message }, { status: result.status });
      }
      return NextResponse.json({ ok: true });
    }

    const detail =
      body.error ??
      (body.payload?.detail ? JSON.stringify(body.payload.detail).slice(0, 300) : 'fal render failed');
    const result = await finalizeVideoJob({ jobId, error: detail });
    if (!result.ok) {
      return NextResponse.json({ message: result.message }, { status: result.status });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('fal webhook error', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
