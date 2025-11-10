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
    const userId = searchParams.get("userId") || session.user.id;

    // Get all habits for the user
    const habits = await prisma.habit.findMany({
      where: { userId },
      include: {
        completions: {
          where: {
            userId,
          },
          orderBy: { completedAt: "desc" },
        },
      },
    });

    // Calculate stats
    const totalHabits = habits.length;
    const totalCompletions = habits.reduce((sum, h) => sum + h.completions.length, 0);

    // Get completion data for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentCompletions = await prisma.completion.findMany({
      where: {
        userId,
        completedAt: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: { completedAt: "asc" },
    });

    // Group completions by date
    const completionsByDate = recentCompletions.reduce((acc, completion) => {
      const date = completion.completedAt.toISOString().split("T")[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Generate last 30 days array
    const last30Days = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      last30Days.push({
        date: dateStr,
        count: completionsByDate[dateStr] || 0,
      });
    }

    // Calculate streaks for each habit
    const habitsWithStreaks = habits.map((habit) => {
      const completions = habit.completions.map((c) => new Date(c.completedAt));
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;

      // Sort completions by date descending
      const sortedCompletions = completions.sort((a, b) => b.getTime() - a.getTime());

      if (sortedCompletions.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        // Check if completed today or yesterday for current streak
        const lastCompletion = new Date(sortedCompletions[0]);
        lastCompletion.setHours(0, 0, 0, 0);

        if (lastCompletion.getTime() === today.getTime() || lastCompletion.getTime() === yesterday.getTime()) {
          let currentDate = new Date(lastCompletion);
          for (const completion of sortedCompletions) {
            const compDate = new Date(completion);
            compDate.setHours(0, 0, 0, 0);

            if (compDate.getTime() === currentDate.getTime()) {
              currentStreak++;
            } else if (compDate.getTime() === currentDate.getTime() - 86400000) {
              currentStreak++;
              currentDate = new Date(compDate);
            } else {
              break;
            }
          }
        }

        // Calculate longest streak
        let previousDate: Date | null = null;
        for (const completion of sortedCompletions) {
          const compDate = new Date(completion);
          compDate.setHours(0, 0, 0, 0);

          if (!previousDate || compDate.getTime() === previousDate.getTime() - 86400000) {
            tempStreak++;
            longestStreak = Math.max(longestStreak, tempStreak);
          } else if (compDate.getTime() !== previousDate.getTime()) {
            tempStreak = 1;
          }

          previousDate = new Date(compDate);
        }
      }

      return {
        id: habit.id,
        title: habit.title,
        frequency: habit.frequency,
        totalCompletions: habit.completions.length,
        currentStreak,
        longestStreak,
      };
    });

    const stats = {
      totalHabits,
      totalCompletions,
      completionsByDate: last30Days,
      habitsWithStreaks,
      averageCompletionsPerDay: totalCompletions > 0 ? (totalCompletions / 30).toFixed(1) : "0",
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
