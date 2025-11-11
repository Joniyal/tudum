import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const habitSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
  reminderTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/).optional(), // HH:MM format
  reminderPeriod: z.enum(["AM", "PM"]).optional(),
  reminderEnabled: z.boolean().optional().default(false),
  sharedWith: z.array(z.string()).optional(),
});

// Convert local time (HH:MM + AM/PM) to UTC HH:MM format
function convertToUTC(timeStr: string, period: string): string {
  const [hours, minutes] = timeStr.split(':').map(Number);
  
  // Convert 12-hour to 24-hour format
  let hours24 = hours;
  if (period === 'AM' && hours === 12) {
    hours24 = 0; // 12 AM = 00:00
  } else if (period === 'PM' && hours !== 12) {
    hours24 = hours + 12; // Convert PM hours (except 12)
  }
  
  // Create a date object with the local time
  const localDate = new Date();
  localDate.setHours(hours24, minutes, 0, 0);
  
  // Get UTC time
  const utcHours = String(localDate.getUTCHours()).padStart(2, '0');
  const utcMinutes = String(localDate.getUTCMinutes()).padStart(2, '0');
  
  return `${utcHours}:${utcMinutes}`;
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
      },
      orderBy: { createdAt: "desc" },
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
    const { title, description, frequency, reminderTime, reminderPeriod, reminderEnabled, sharedWith } = habitSchema.parse(body);

    // Convert local time to UTC if reminder is enabled
    let utcReminderTime = reminderTime;
    if (reminderEnabled && reminderTime && reminderPeriod) {
      utcReminderTime = convertToUTC(reminderTime, reminderPeriod);
      console.log(`[HABITS] Converted ${reminderTime} ${reminderPeriod} to UTC: ${utcReminderTime}`);
    }

    // Create habit for the current user
    const habit = await prisma.habit.create({
      data: {
        title,
        description,
        frequency,
        reminderTime: utcReminderTime,
        reminderEnabled: reminderEnabled || false,
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
