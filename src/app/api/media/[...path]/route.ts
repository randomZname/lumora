import { NextResponse } from 'next/server';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

// Serves user-generated media written by LocalDiskStorage to <cwd>/media.
// Supports HTTP Range requests so videos stream + seek instantly.

const MEDIA_DIR = path.join(process.cwd(), 'media');

const CONTENT_TYPES: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
};

export async function GET(
  request: Request,
  { params }: { params: { path: string[] } },
) {
  const rel = (params.path ?? []).join('/');
  // Resolve and ensure the path stays inside MEDIA_DIR (no traversal).
  const filePath = path.resolve(MEDIA_DIR, rel);
  if (filePath !== MEDIA_DIR && !filePath.startsWith(MEDIA_DIR + path.sep)) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  let size: number;
  try {
    const s = await stat(filePath);
    if (!s.isFile()) return NextResponse.json({ message: 'Not found' }, { status: 404 });
    size = s.size;
  } catch {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = CONTENT_TYPES[ext] ?? 'application/octet-stream';
  const buffer = await readFile(filePath);

  const range = request.headers.get('range');
  const baseHeaders: Record<string, string> = {
    'Content-Type': contentType,
    'Accept-Ranges': 'bytes',
    'Cache-Control': 'public, max-age=31536000, immutable',
  };

  // Partial content for video streaming / seeking.
  const match = range && /bytes=(\d*)-(\d*)/.exec(range);
  if (match) {
    const start = match[1] ? parseInt(match[1], 10) : 0;
    const end = match[2] ? parseInt(match[2], 10) : size - 1;
    if (start >= size || end >= size || start > end) {
      return new NextResponse(null, {
        status: 416,
        headers: { 'Content-Range': `bytes */${size}` },
      });
    }
    const chunk = buffer.subarray(start, end + 1);
    return new NextResponse(chunk, {
      status: 206,
      headers: {
        ...baseHeaders,
        'Content-Range': `bytes ${start}-${end}/${size}`,
        'Content-Length': String(chunk.length),
      },
    });
  }

  return new NextResponse(buffer, {
    status: 200,
    headers: { ...baseHeaders, 'Content-Length': String(size) },
  });
}
