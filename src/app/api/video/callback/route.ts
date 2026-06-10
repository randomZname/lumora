import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { spendCredits } from "@/lib/credits";
import { fetchAndOptimizeVideo } from "@/lib/media";
import { getStorage } from "@/lib/storage";

interface CallbackBody {
  jobId?: string;
  outputUrl?: string;
  thumbnailUrl?: string;
  error?: string;
  secret?: string;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CallbackBody;
    const { jobId, outputUrl, thumbnailUrl, error, secret } = body;

    if (!secret || secret !== process.env.N8N_CALLBACK_SECRET) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!jobId) {
      return NextResponse.json(
        { message: "jobId is required" },
        { status: 400 }
      );
    }

    const job = await prisma.videoJob.findUnique({ where: { id: jobId } });
    if (!job) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    // Guard against double processing / double-charge.
    if (job.status === "DONE" || job.status === "FAILED") {
      return NextResponse.json({ ok: true });
    }

    if (error) {
      await prisma.videoJob.update({
        where: { id: job.id },
        data: { status: "FAILED", error },
      });
      return NextResponse.json({ ok: true });
    }

    // Success branch: post-process the result before marking DONE.
    let finalOutputUrl = outputUrl ?? null;
    let finalThumbnailUrl = thumbnailUrl ?? null;

    if (outputUrl) {
      try {
        const opt = await fetchAndOptimizeVideo(outputUrl);
        const base = `outputs/${job.id}`;
        const v = await getStorage().upload(opt.video, `${base}.mp4`, opt.contentType);
        const p = await getStorage().upload(opt.poster, `${base}.jpg`, "image/jpeg");
        finalOutputUrl = v.url;
        finalThumbnailUrl = p.url;
      } catch (err) {
        console.error("[callback] video optimize failed, using raw url", err);
      }
    }

    await prisma.videoJob.update({
      where: { id: job.id },
      data: {
        status: "DONE",
        outputUrl: finalOutputUrl,
        thumbnailUrl: finalThumbnailUrl,
      },
    });

    await spendCredits(job.userId, job.creditsCost, job.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Video callback error", err);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
