import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/reminders/check
 * 
 * Check for habits with reminders that are due now.
 * Returns habits where:
 * - reminderEnabled is true
 * - reminderTime matches current UTC time (within 1 minute window)
 * - User is authenticated
 */
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current UTC time in HH:MM format
    const now = new Date();
    const currentHour = String(now.getUTCHours()).padStart(2, '0');
    const currentMinute = String(now.getUTCMinutes()).padStart(2, '0');
    const currentTime = `${currentHour}:${currentMinute}`;
    
    // Also check the previous minute (in case we're a bit late)
    const prevMinute = new Date(now.getTime() - 60000);
    const prevHour = String(prevMinute.getUTCHours()).padStart(2, '0');
    const prevMinuteStr = String(prevMinute.getUTCMinutes()).padStart(2, '0');
    const previousTime = `${prevHour}:${prevMinuteStr}`;

    console.log("[REMINDERS] Current UTC time:", currentTime, "Previous UTC time:", previousTime, "User:", session.user.id);

    // Find habits with reminders enabled that match current time or previous minute
    const habitsWithReminders = await prisma.habit.findMany({
      where: {
        userId: session.user.id,
        reminderEnabled: true,
        archived: false, // Don't trigger alarms for archived habits
        reminderTime: {
          in: [currentTime, previousTime],
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        frequency: true,
        reminderTime: true,
        alarmDuration: true,
      },
    });

    console.log("[REMINDERS] Found", habitsWithReminders.length, "habits with reminders");

    // Always trigger alarms regardless of completion status
    // The alarm modal can show if habit is already completed
    // User can choose to dismiss or complete again for tracking
    console.log("[REMINDERS] Sending", habitsWithReminders.length, "notifications");

    return NextResponse.json({
      reminders: habitsWithReminders,
      currentTime,
    });
  } catch (error: any) {
    console.error("[REMINDERS] Error:", error.message);
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    );
  }
}
