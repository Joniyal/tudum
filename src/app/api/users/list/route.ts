import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/users/list
 * 
 * Debug endpoint to list all users (excluding current user)
 * Useful for troubleshooting user discovery issues
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[USERS LIST] Fetching all users for:", session.user.id);

    const users = await prisma.user.findMany({
      where: {
        id: { not: session.user.id }, // Don't return current user
      },
      select: {
        id: true,
        username: true,
        name: true,
        email: true,
        bio: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    console.log("[USERS LIST] Found", users.length, "users");

    return NextResponse.json({
      count: users.length,
      users: users,
    });
  } catch (error: any) {
    console.error("[USERS LIST] Error:", error.message);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
