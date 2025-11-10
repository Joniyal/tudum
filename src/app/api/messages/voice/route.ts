import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

export const runtime = "nodejs";

// Initialize S3 client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined,
});

const USE_S3 = !!process.env.AWS_S3_BUCKET_NAME;

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse multipart/form-data
    const contentType = req.headers.get("content-type") || "";
    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json({ error: "Expected multipart/form-data" }, { status: 400 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as Blob | null;
    const toUserId = formData.get("toUserId") as string | null;
    const replyToId = formData.get("replyToId") as string | null;
    const durationStr = formData.get("duration") as string | null;
    const forwardedContent = formData.get("forwardedContent") as string | null;

    if (!file || !toUserId) {
      return NextResponse.json({ error: "file and toUserId are required" }, { status: 400 });
    }

    // Convert blob to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let voiceUrl: string;
    const id = randomUUID();
    const mime = file.type || "audio/webm";
    const ext = mime.includes("wav") ? "wav" : mime.includes("mp3") ? "mp3" : mime.includes("ogg") ? "ogg" : "webm";
    const filename = `${id}.${ext}`;

    if (USE_S3) {
      // Upload to S3
      try {
        const bucketName = process.env.AWS_S3_BUCKET_NAME!;
        const key = `voices/${filename}`;

        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: buffer,
            ContentType: mime,
            CacheControl: "public, max-age=31536000", // Cache for 1 year
          })
        );

        // Build S3 URL (adjust based on your bucket's public URL setup)
        const s3Url = process.env.AWS_S3_URL || `https://${bucketName}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com`;
        voiceUrl = `${s3Url}/${key}`;
      } catch (s3Error) {
        console.error("S3 upload error:", s3Error);
        return NextResponse.json({ error: "Failed to upload to S3" }, { status: 500 });
      }
    } else {
      // Fallback to local filesystem (development only)
      // NOTE: This will NOT work on Vercel (read-only filesystem)
      if (process.env.VERCEL) {
        return NextResponse.json({ 
          error: "Voice messages require S3 configuration. See VOICE_MESSAGES_SETUP.md for instructions." 
        }, { status: 500 });
      }
      
      const uploadsDir = path.join(process.cwd(), "public", "uploads", "voices");
      fs.mkdirSync(uploadsDir, { recursive: true });
      const filePath = path.join(uploadsDir, filename);
      fs.writeFileSync(filePath, buffer);
      voiceUrl = `/uploads/voices/${filename}`;
    }

    const duration = durationStr ? parseInt(durationStr, 10) : null;

    // Verify connection exists
    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { fromUserId: session.user.id, toUserId: toUserId },
          { fromUserId: toUserId, toUserId: session.user.id },
        ],
        status: "ACCEPTED",
      },
    });

    if (!connection) {
      return NextResponse.json({ error: "You can only message connected partners" }, { status: 403 });
    }

    const message = await prisma.message.create({
      data: {
        content: forwardedContent || null,
        voiceUrl,
        duration: duration || null,
        fromUserId: session.user.id,
        toUserId,
        replyToId: replyToId || null,
      },
      include: {
        fromUser: {
          select: { id: true, name: true, email: true },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            fromUser: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Error uploading voice message:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage, details: String(error) }, { status: 500 });
  }
}
