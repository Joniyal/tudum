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

    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { fromUserId: session.user.id },
          { toUserId: session.user.id },
        ],
      },
      include: {
        fromUser: {
          select: { id: true, name: true, email: true },
        },
        toUser: {
          select: { id: true, name: true, email: true },
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
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const targetUser = await prisma.user.findUnique({
      where: { email },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (targetUser.id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot connect to yourself" },
        { status: 400 }
      );
    }

    // Check if connection already exists
    const existing = await prisma.connection.findFirst({
      where: {
        OR: [
          { fromUserId: session.user.id, toUserId: targetUser.id },
          { fromUserId: targetUser.id, toUserId: session.user.id },
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
        toUserId: targetUser.id,
        status: "PENDING",
      },
      include: {
        toUser: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(connection, { status: 201 });
  } catch (error) {
    console.error("Error creating connection:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
