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

    // Get accepted connections
    const connections = await prisma.connection.findMany({
      where: {
        OR: [
          { fromUserId: session.user.id, status: "ACCEPTED" },
          { toUserId: session.user.id, status: "ACCEPTED" },
        ],
      },
      include: {
        fromUser: true,
        toUser: true,
      },
    });

    // Get partner IDs
    const partnerIds = connections.map((conn) =>
      conn.fromUserId === session.user.id ? conn.toUserId : conn.fromUserId
    );

    // Get partners' habits and completions
    const partnersData = await Promise.all(
      partnerIds.map(async (partnerId) => {
        const partner = await prisma.user.findUnique({
          where: { id: partnerId },
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
          },
        });

        const habits = await prisma.habit.findMany({
          where: { userId: partnerId },
          include: {
            completions: {
              orderBy: { completedAt: "desc" },
              take: 30,
            },
          },
          orderBy: { createdAt: "desc" },
        });

        return {
          partner,
          habits,
        };
      })
    );

    return NextResponse.json(partnersData);
  } catch (error) {
    console.error("Error fetching partners:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
