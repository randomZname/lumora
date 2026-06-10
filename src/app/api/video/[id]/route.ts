import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const job = await prisma.videoJob.findUnique({
      where: { id: params.id },
    });

    if (!job || job.userId !== session.user.id) {
      return NextResponse.json({ message: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: job.id,
      status: job.status,
      outputUrl: job.outputUrl,
      thumbnailUrl: job.thumbnailUrl,
      error: job.error,
      model: job.model,
      createdAt: job.createdAt,
    });
  } catch (error) {
    console.error("Video status error", error);
    return NextResponse.json({ message: "Server error" }, { status: 500 });
  }
}
