import { NextResponse } from 'next/server';
import { finalizeVideoJob, verifyCallbackSecret } from '@/lib/video-finalize';

interface CallbackBody {
  jobId?: string;
  outputUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  secret?: string;
}

/** Internal callback: providers/n8n post results here with the shared secret. */
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CallbackBody;
    const { jobId, outputUrl, thumbnailUrl, error, secret } = body;

    if (!verifyCallbackSecret(secret)) {
      return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }

    if (!jobId) {
      return NextResponse.json({ message: 'jobId is required' }, { status: 400 });
    }

    const result = await finalizeVideoJob({ jobId, outputUrl, thumbnailUrl, error });
    if (!result.ok) {
      return NextResponse.json({ message: result.message }, { status: result.status });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Video callback error', err);
    return NextResponse.json({ message: 'Server error' }, { status: 500 });
  }
}
