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
      console.error("POST /api/connections - No session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("POST /api/connections - User ID:", session.user.id);

    let body;
    try {
      body = await req.json();
    } catch (e) {
      console.error("POST /api/connections - Invalid JSON:", e);
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { toUserId, email } = body;
    console.log("POST /api/connections - Request:", { toUserId, email });

    let targetUserId = toUserId;

    // If email is provided instead of toUserId, find the user
    if (!toUserId && email) {
      try {
        const targetUser = await prisma.user.findUnique({
          where: { email },
        });

        if (!targetUser) {
          console.log("POST /api/connections - User not found by email:", email);
          return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        targetUserId = targetUser.id;
      } catch (dbError: any) {
        console.error("POST /api/connections - Database error finding user:", dbError);
        return NextResponse.json(
          { error: "Database error", details: dbError.message },
          { status: 500 }
        );
      }
    }

    if (!targetUserId) {
      console.error("POST /api/connections - Missing toUserId");
      return NextResponse.json(
        { error: "toUserId or email is required" },
        { status: 400 }
      );
    }

    if (targetUserId === session.user.id) {
      console.log("POST /api/connections - Attempt to connect to self");
      return NextResponse.json(
        { error: "Cannot connect to yourself" },
        { status: 400 }
      );
    }

    // Verify target user exists
    try {
      const targetUser = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: { id: true, username: true },
      });

      if (!targetUser) {
        console.log("POST /api/connections - Target user not found:", targetUserId);
        return NextResponse.json(
          { error: "Target user not found" },
          { status: 404 }
        );
      }

      console.log("POST /api/connections - Target user found:", targetUser.username);
    } catch (dbError: any) {
      console.error("POST /api/connections - Database error checking target user:", dbError);
      return NextResponse.json(
        { error: "Database error", details: dbError.message },
        { status: 500 }
      );
    }

    // Check if connection already exists (in either direction)
    try {
      const existing = await prisma.connection.findFirst({
        where: {
          OR: [
            { fromUserId: session.user.id, toUserId: targetUserId },
            { fromUserId: targetUserId, toUserId: session.user.id },
          ],
        },
      });

      if (existing) {
        console.log("POST /api/connections - Connection already exists:", existing.id);
        return NextResponse.json(
          { error: "Connection already exists", status: existing.status },
          { status: 400 }
        );
      }
    } catch (dbError: any) {
      console.error("POST /api/connections - Database error checking existing:", dbError);
      return NextResponse.json(
        { error: "Database error", details: dbError.message },
        { status: 500 }
      );
    }

    // Create the connection
    try {
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

      console.log("POST /api/connections - Connection created:", connection.id);
      return NextResponse.json(connection, { status: 201 });
    } catch (dbError: any) {
      console.error("POST /api/connections - Database error creating connection:", dbError);
      console.error("Error code:", dbError.code);
      console.error("Error meta:", dbError.meta);
      
      // Handle Prisma unique constraint violation
      if (dbError.code === "P2002") {
        return NextResponse.json(
          { error: "Connection already exists" },
          { status: 400 }
        );
      }
      
      return NextResponse.json(
        { error: "Failed to create connection", details: dbError.message },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("POST /api/connections - Unexpected error:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
