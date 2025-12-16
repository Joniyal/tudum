import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const habits = await prisma.habit.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        frequency: true,
        description: true,
        archived: true,
        createdAt: true,
        _count: {
          select: { completions: true }
        },
        user: {
          select: {
            id: true,
            username: true,
          }
        }
      }
    });

    return NextResponse.json({ habits });
  } catch (error) {
    console.error("Admin habits error:", error);
    return NextResponse.json(
      { error: "Failed to fetch habits" },
      { status: 500 }
    );
  }
}
