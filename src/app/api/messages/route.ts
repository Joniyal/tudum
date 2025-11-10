import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const messageSchema = z.object({
  toUserId: z.string(),
  content: z.string().min(1).max(1000),
  replyToId: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const partnerId = searchParams.get("partnerId");

    if (!partnerId) {
      return NextResponse.json({ error: "Partner ID required" }, { status: 400 });
    }

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { fromUserId: session.user.id, toUserId: partnerId },
          { fromUserId: partnerId, toUserId: session.user.id },
        ],
      },
      include: {
        fromUser: {
          select: { id: true, name: true, email: true, username: true },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            fromUser: {
              select: { name: true, email: true, username: true },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    // Mark received messages as read
    await prisma.message.updateMany({
      where: {
        fromUserId: partnerId,
        toUserId: session.user.id,
        read: false,
      },
      data: { read: true },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { toUserId, content, replyToId } = messageSchema.parse(body);

    // Verify connection exists
    const connection = await prisma.connection.findFirst({
      where: {
        OR: [
          { fromUserId: session.user.id, toUserId, status: "ACCEPTED" },
          { fromUserId: toUserId, toUserId: session.user.id, status: "ACCEPTED" },
        ],
      },
    });

    if (!connection) {
      return NextResponse.json(
        { error: "You can only message connected partners" },
        { status: 403 }
      );
    }

    const message = await prisma.message.create({
      data: {
        content,
        fromUserId: session.user.id,
        toUserId,
        replyToId: replyToId || null,
      },
      include: {
        fromUser: {
          select: { id: true, name: true, email: true, username: true },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            fromUser: {
              select: { name: true, email: true, username: true },
            },
          },
        },
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
