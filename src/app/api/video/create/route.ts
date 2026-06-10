import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasCredits, COST_PER_VIDEO } from "@/lib/credits";
import { getStorage } from "@/lib/storage";
import {
  getVideoProvider,
  resolveModelByChoice,
  type ModelChoice,
} from "@/lib/video-provider";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const userId = session.user.id;

    const formData = await request.formData();
    const text = (formData.get("text") as string | null)?.trim() ?? "";
    const durationRaw = formData.get("duration");
    const image = formData.get("image") as File | null;
    const modelRaw = (formData.get("model") as string | null) ?? "auto";
    const modelChoice: ModelChoice =
      modelRaw === "ltx" || modelRaw === "kling" ? modelRaw : "auto";

    if (!text) {
      return NextResponse.json(
        { success: false, message: "Text is required." },
        { status: 400 }
      );
    }

    if (durationRaw !== "5" && durationRaw !== "10") {
      return NextResponse.json(
        { success: false, message: "Duration must be 5 or 10 seconds." },
        { status: 400 }
      );
    }
    const duration = Number(durationRaw);

    // Image is OPTIONAL — with one we do image-to-video, without we do text-to-video. If provided, validate + upload; otherwise text-to-video.
    let inputImageUrl: string | null = null;
    let buffer: Buffer | null = null;
    let imageType: string | null = null;

    if (image) {
      if (!ALLOWED_TYPES.includes(image.type)) {
        return NextResponse.json(
          { success: false, message: "Unsupported image format." },
          { status: 400 }
        );
      }
      if (image.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, message: "Image must be under 5MB." },
          { status: 400 }
        );
      }
    }

    if (!(await hasCredits(userId, COST_PER_VIDEO))) {
      return NextResponse.json(
        { message: "Insufficient credits" },
        { status: 402 }
      );
    }

    if (image) {
      buffer = Buffer.from(await image.arrayBuffer());
      imageType = image.type;
      const ext = image.type.split("/")[1];
      const key = `inputs/${userId}-${Date.now()}.${ext}`;
      const uploaded = await getStorage().upload(buffer, key, image.type);
      inputImageUrl = uploaded.url;
    }

    const provider = getVideoProvider();

    const model =
      provider.name === "fal" ? resolveModelByChoice(modelChoice, !!buffer) : null;

    const job = await prisma.videoJob.create({
      data: {
        userId,
        status: "QUEUED",
        provider: provider.name,
        model,
        inputText: text,
        inputImageUrl,
        duration,
        creditsCost: COST_PER_VIDEO,
      },
    });

    await provider.start({
      jobId: job.id,
      inputImageUrl,
      text,
      duration,
      ...(model ? { model } : {}),
      ...(buffer && imageType
        ? { imageBuffer: buffer, imageContentType: imageType }
        : {}),
    });

    await prisma.videoJob.update({
      where: { id: job.id },
      data: { status: "PROCESSING" },
    });

    return NextResponse.json({ jobId: job.id });
  } catch (error) {
    console.error("Video create error", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
