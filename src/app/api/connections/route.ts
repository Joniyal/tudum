import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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
  let session: any;
  let body;
  let targetUserId;

  try {
    // Step 1: Check authentication
    session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      console.error("[CONNECTIONS POST] No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.log("[CONNECTIONS POST] Authenticated user:", session.user.id);

    // Step 2: Parse request body
    try {
      body = await req.json();
      console.log("[CONNECTIONS POST] Request body:", JSON.stringify(body));
    } catch (e: any) {
      console.error("[CONNECTIONS POST] Invalid JSON:", e.message);
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { toUserId, email } = body;
    console.log("[CONNECTIONS POST] Parsed toUserId:", toUserId, "email:", email);

    // Step 3: Resolve target user ID
    if (!toUserId && !email) {
      console.error("[CONNECTIONS POST] Missing toUserId and email");
      return NextResponse.json(
        { error: "toUserId or email is required", received: { toUserId, email } },
        { status: 400 }
      );
    }

    if (toUserId) {
      targetUserId = toUserId;
      console.log("[CONNECTIONS POST] Using provided toUserId:", targetUserId);
    } else if (email) {
      console.log("[CONNECTIONS POST] Looking up user by email:", email);
      const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true },
      });

      if (!user) {
        console.error("[CONNECTIONS POST] User not found by email:", email);
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      targetUserId = user.id;
      console.log("[CONNECTIONS POST] Found user by email:", targetUserId);
    }

    // Step 4: Validate target user
    if (targetUserId === session.user.id) {
      console.error("[CONNECTIONS POST] Attempt to connect to self");
      return NextResponse.json(
        { error: "Cannot connect to yourself" },
        { status: 400 }
      );
    }

    // Step 5: Check if target user exists - with explicit query
    console.log("[CONNECTIONS POST] Verifying target user exists:", targetUserId);
    try {
      const count = await prisma.user.count({
        where: { id: targetUserId }
      });
      
      console.log("[CONNECTIONS POST] User count result:", count);
      
      if (count === 0) {
        console.error("[CONNECTIONS POST] Target user does not exist:", targetUserId);
        return NextResponse.json(
          { error: "Target user not found", userId: targetUserId, count },
          { status: 404 }
        );
      }
    } catch (e: any) {
      console.error("[CONNECTIONS POST] Error counting users:", e.message);
      return NextResponse.json(
        { error: "Database error checking user", details: e.message },
        { status: 500 }
      );
    }

    // Also fetch to log the username
    const targetUserExists = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, username: true, email: true },
    });

    if (!targetUserExists) {
      console.error("[CONNECTIONS POST] Target user not found on re-check:", targetUserId);
      return NextResponse.json(
        { error: "Target user not found" },
        { status: 404 }
      );
    }
    console.log("[CONNECTIONS POST] Target user verified:", { id: targetUserExists.id, username: targetUserExists.username, email: targetUserExists.email });

    // Step 6: Check for existing connection
    console.log("[CONNECTIONS POST] Checking for existing connection");
    const existingConnection = await prisma.connection.findFirst({
      where: {
        OR: [
          { fromUserId: session.user.id, toUserId: targetUserId },
          { fromUserId: targetUserId, toUserId: session.user.id },
        ],
      },
    });

    if (existingConnection) {
      console.log("[CONNECTIONS POST] Connection already exists:", existingConnection.id, existingConnection.status);
      return NextResponse.json(
        { error: "Connection already exists", connectionStatus: existingConnection.status },
        { status: 400 }
      );
    }
    console.log("[CONNECTIONS POST] No existing connection found");

    // Step 7: Create connection
    console.log("[CONNECTIONS POST] Creating new connection");
    const newConnection = await prisma.connection.create({
      data: {
        fromUserId: session.user.id,
        toUserId: targetUserId,
        status: "PENDING",
      },
      include: {
        toUser: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
        fromUser: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        },
      },
    });

    console.log("[CONNECTIONS POST] Connection created successfully:", newConnection.id);
    return NextResponse.json(newConnection, { status: 201 });

  } catch (error: any) {
    console.error("[CONNECTIONS POST] Error caught:", error.message);
    console.error("[CONNECTIONS POST] Error name:", error.name);
    console.error("[CONNECTIONS POST] Error code:", error.code);
    
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("[CONNECTIONS POST] Prisma error code:", error.code);
      console.error("[CONNECTIONS POST] Prisma error meta:", JSON.stringify(error.meta));
      
      if (error.code === "P2002") {
        // Unique constraint violation
        console.error("[CONNECTIONS POST] Unique constraint violation");
        return NextResponse.json(
          { error: "Connection already exists (database constraint)" },
          { status: 400 }
        );
      } else if (error.code === "P2003") {
        // Foreign key constraint violation
        console.error("[CONNECTIONS POST] Foreign key constraint violation - user may not exist");
        
        // Double-check the user really exists
        const userCheck = await prisma.user.findUnique({
          where: { id: targetUserId },
          select: { id: true, email: true, username: true },
        }).catch(e => {
          console.error("[CONNECTIONS POST] Error re-checking user:", e.message);
          return null;
        });
        
        if (!userCheck) {
          console.error("[CONNECTIONS POST] User verification FAILED - user does not exist:", targetUserId);
          return NextResponse.json(
            { error: "User does not exist", userId: targetUserId },
            { status: 404 }
          );
        } else {
          console.error("[CONNECTIONS POST] User verification PASSED - user exists but foreign key failed:", userCheck);
          // User exists but foreign key failed - retry once
          try {
            const retryConnection = await prisma.connection.create({
              data: {
                fromUserId: session.user.id,
                toUserId: targetUserId,
                status: "PENDING",
              },
              include: {
                toUser: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    username: true,
                  },
                },
                fromUser: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    username: true,
                  },
                },
              },
            });
            console.log("[CONNECTIONS POST] Retry successful:", retryConnection.id);
            return NextResponse.json(retryConnection, { status: 201 });
          } catch (retryError: any) {
            console.error("[CONNECTIONS POST] Retry failed:", retryError.message);
            return NextResponse.json(
              { error: "Failed to create connection after retry", details: retryError.message },
              { status: 500 }
            );
          }
        }
      }
    }

    if (error instanceof Prisma.PrismaClientValidationError) {
      console.error("[CONNECTIONS POST] Prisma validation error");
      return NextResponse.json(
        { error: "Invalid data format" },
        { status: 400 }
      );
    }

    // Generic error
    console.error("[CONNECTIONS POST] Stack trace:", error.stack);
    return NextResponse.json(
      { 
        error: "Failed to create connection", 
        message: error.message,
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
