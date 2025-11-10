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
    const query = searchParams.get("q");

    console.log("[SEARCH] Raw query:", query, "Length:", query?.length, "User:", session.user.id);

    if (!query || query.trim().length < 2) {
      console.log("[SEARCH] Query too short or empty, returning empty array");
      return NextResponse.json([]);
    }

    const trimmedQuery = query.trim();
    console.log("[SEARCH] Trimmed query:", trimmedQuery);

    // Search with improved matching - prioritize exact/partial username matches
    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { username: { contains: trimmedQuery.toLowerCase(), mode: "insensitive" } },
              { name: { contains: trimmedQuery, mode: "insensitive" } },
              { email: { contains: trimmedQuery.toLowerCase(), mode: "insensitive" } },
            ],
          },
          { id: { not: session.user.id } }, // Don't return current user
        ],
      },
      select: {
        id: true,
        username: true,
        name: true,
        bio: true,
      },
      take: 20,
      orderBy: [
        // Prioritize username matches
        { username: 'asc' },
      ],
    });

    console.log("[SEARCH] Found", users.length, "users");
    console.log("[SEARCH] Results:", users.map(u => ({ username: u.username, name: u.name })));

    return NextResponse.json(users);
  } catch (error: any) {
    console.error("[SEARCH] Error searching users:", error);
    console.error("[SEARCH] Error details:", error.message);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
