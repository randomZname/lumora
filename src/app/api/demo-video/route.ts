import { NextResponse } from 'next/server';

// Bundled sample shown when n8n isn't configured (default in dev).
const FALLBACK_PREVIEW = '/samples/neon-city.mp4';

export async function POST() {
  const url = process.env.N8N_WEBHOOK_URL;

  // No n8n configured -> serve a local sample so the demo always works.
  if (!url) {
    return NextResponse.json({ ok: true, previewUrl: FALLBACK_PREVIEW });
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: 'demo', duration: 10 }),
      cache: 'no-store',
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data) {
      // n8n unreachable -> graceful fallback instead of an error.
      return NextResponse.json({ ok: true, previewUrl: FALLBACK_PREVIEW });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ ok: true, previewUrl: FALLBACK_PREVIEW });
  }
}
