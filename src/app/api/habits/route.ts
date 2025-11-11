import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const habitSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
  reminderTime: z.string().regex(/^\d{1,2}:\d{2}$/).optional(), // HH:MM or H:MM format (1-12)
  reminderPeriod: z.enum(["AM", "PM"]).optional(),
  reminderEnabled: z.boolean().optional().default(false),
  alarmDuration: z.number().optional().default(5), // Alarm duration in minutes
  timezoneOffset: z.number().optional().default(0), // User's timezone offset in minutes, default to 0
  sharedWith: z.array(z.string()).optional(),
});

// Convert local time (HH:MM + AM/PM + timezone offset) to UTC HH:MM format
function convertToUTC(timeStr: string, period: string, timezoneOffsetMinutes: number = 0): string {
  const [hoursStr, minutesStr] = timeStr.split(':');
  let hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);
  
  // Convert 12-hour to 24-hour format
  if (period === 'AM' && hours === 12) {
    hours = 0; // 12 AM = 00:00
  } else if (period === 'PM' && hours !== 12) {
    hours = hours + 12; // Convert PM hours (except 12)
  }
  
  // JavaScript's getTimezoneOffset() returns NEGATIVE values for timezones AHEAD of UTC
  // For India (UTC+5:30), it returns -330 minutes
  // To convert local to UTC: UTC = Local - Timezone Difference
  // Example: 11:32 AM India = 11:32 - 5:30 = 06:02 UTC
  // Since getTimezoneOffset() is negative, we need to ADD it (not subtract)
  // Formula: UTC = Local + timezoneOffset (where offset is negative for ahead-of-UTC)
  
  const totalMinutes = hours * 60 + minutes + timezoneOffsetMinutes;
  
  // Handle day wrap-around properly
  let utcHours = Math.floor(totalMinutes / 60);
  let utcMinutes = totalMinutes % 60;
  
  // Normalize to 24-hour format
  if (utcHours < 0) {
    utcHours = (utcHours % 24) + 24;
  } else if (utcHours >= 24) {
    utcHours = utcHours % 24;
  }
  
  if (utcMinutes < 0) {
    utcMinutes += 60;
    utcHours -= 1;
    if (utcHours < 0) utcHours += 24;
  }
  
  return `${String(utcHours).padStart(2, '0')}:${String(utcMinutes).padStart(2, '0')}`;
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const habits = await prisma.habit.findMany({
      where: { userId: session.user.id },
      include: {
        completions: {
          orderBy: { completedAt: "desc" },
          take: 30,
        },
        collection: true,
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json(habits);
  } catch (error) {
    console.error("Error fetching habits:", error);
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, frequency, reminderTime, reminderPeriod, timezoneOffset, reminderEnabled, alarmDuration, sharedWith } = habitSchema.parse(body);

    // Convert local time to UTC if reminder is enabled
    let utcReminderTime = reminderTime;
    if (reminderEnabled && reminderTime && reminderPeriod) {
      utcReminderTime = convertToUTC(reminderTime, reminderPeriod, timezoneOffset || 0);
      console.log(`[HABITS] User timezone offset: ${timezoneOffset}min | Converted ${reminderTime} ${reminderPeriod} to UTC: ${utcReminderTime}`);
    }

    // Create habit for the current user
    const habit = await prisma.habit.create({
      data: {
        title,
        description,
        frequency,
        reminderTime: utcReminderTime,
        reminderEnabled: reminderEnabled || false,
        alarmDuration: alarmDuration || 5,
        userId: session.user.id,
      },
    });

    // Create the same habit for shared partners
    if (sharedWith && sharedWith.length > 0) {
      await prisma.habit.createMany({
        data: sharedWith.map((partnerId) => ({
          title,
          description,
          frequency,
          reminderTime: utcReminderTime,
          reminderEnabled: reminderEnabled || false,
          alarmDuration: alarmDuration || 5,
          userId: partnerId,
        })),
      });
    }

    return NextResponse.json(habit, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error creating habit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
