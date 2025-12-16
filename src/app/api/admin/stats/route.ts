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

    // Get total counts
    const [totalUsers, totalHabits, totalConnections, totalCompletions] = await Promise.all([
      prisma.user.count(),
      prisma.habit.count(),
      prisma.connection.count({ where: { status: "ACCEPTED" } }),
      prisma.completion.count(),
    ]);

    // Get recent users
    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        _count: {
          select: { habits: true }
        }
      }
    });

    // Get top habits by completions
    const topHabits = await prisma.habit.findMany({
      take: 5,
      orderBy: {
        completions: {
          _count: "desc"
        }
      },
      select: {
        id: true,
        title: true,
        frequency: true,
        _count: {
          select: { completions: true }
        },
        user: {
          select: { username: true }
        }
      }
    });

    // Get user growth for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const users = await prisma.user.findMany({
      where: {
        createdAt: { gte: thirtyDaysAgo }
      },
      select: { createdAt: true }
    });

    // Create day-by-day count
    const userGrowth: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = users.filter(u => {
        const userDate = new Date(u.createdAt).toISOString().split('T')[0];
        return userDate === dateStr;
      }).length;
      
      userGrowth.push({ date: dateStr, count });
    }

    return NextResponse.json({
      totalUsers,
      totalHabits,
      totalConnections,
      totalCompletions,
      recentUsers,
      topHabits,
      userGrowth,
    });
  } catch (error) {
    console.error("Admin stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
