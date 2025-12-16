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

    const connections = await prisma.connection.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        createdAt: true,
        fromUser: {
          select: {
            id: true,
            username: true,
            email: true,
          }
        },
        toUser: {
          select: {
            id: true,
            username: true,
            email: true,
          }
        }
      }
    });

    return NextResponse.json({ connections });
  } catch (error) {
    console.error("Admin connections error:", error);
    return NextResponse.json(
      { error: "Failed to fetch connections" },
      { status: 500 }
    );
  }
}
