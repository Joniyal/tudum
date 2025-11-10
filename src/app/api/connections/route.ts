import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    // If userId is provided, check connection status with that user
    if (userId) {
      const connection = await prisma.connection.findFirst({
        where: {
          OR: [
            { fromUserId: session.user.id, toUserId: userId },
            { fromUserId: userId, toUserId: session.user.id },
          ],
        },
        include: {
          fromUser: {
            select: { id: true, name: true, email: true, username: true },
          },
          toUser: {
            select: { id: true, name: true, email: true, username: true },
          },
        },
      });

      if (connection) {
        return NextResponse.json([connection]);
      }
      return NextResponse.json([]);
    }

    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { fromUserId: session.user.id },
          { toUserId: session.user.id },
        ],
      },
      include: {
        fromUser: {
          select: { id: true, name: true, email: true, username: true },
        },
        toUser: {
          select: { id: true, name: true, email: true, username: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(connections);
  } catch (error) {
    console.error("Error fetching connections:", error);
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
    const { toUserId, email } = body;

    let targetUserId = toUserId;

    // If email is provided instead of toUserId, find the user
    if (!toUserId && email) {
      const targetUser = await prisma.user.findUnique({
        where: { email },
      });

      if (!targetUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      targetUserId = targetUser.id;
    }

    if (!targetUserId) {
      return NextResponse.json(
        { error: "toUserId or email is required" },
        { status: 400 }
      );
    }

    if (targetUserId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot connect to yourself" },
        { status: 400 }
      );
    }

    // Check if connection already exists
    const existing = await prisma.connection.findFirst({
      where: {
        OR: [
          { fromUserId: session.user.id, toUserId: targetUserId },
          { fromUserId: targetUserId, toUserId: session.user.id },
        ],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Connection already exists" },
        { status: 400 }
      );
    }

    const connection = await prisma.connection.create({
      data: {
        fromUserId: session.user.id,
        toUserId: targetUserId,
        status: "PENDING",
      },
      include: {
        toUser: {
          select: { id: true, name: true, email: true, username: true },
        },
      },
    });

    return NextResponse.json(connection, { status: 201 });
  } catch (error: any) {
    console.error("Error creating connection:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
      meta: error.meta,
    });
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
