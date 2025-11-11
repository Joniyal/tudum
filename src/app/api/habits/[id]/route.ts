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
  reminderEnabled: z.boolean().optional(),
  alarmDuration: z.number().optional(),
  timezoneOffset: z.number().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const habit = await prisma.habit.findUnique({
      where: { id },
    });

    if (!habit || habit.userId !== session.user.id) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    const body = await req.json();
    const { title, description, frequency, reminderTime, reminderEnabled, alarmDuration, timezoneOffset } = habitSchema.parse(body);

    // Convert local time to UTC if reminder time is provided
    let reminderTimeUTC = reminderTime;
    if (reminderEnabled && reminderTime && timezoneOffset !== undefined) {
      const [hours, minutes] = reminderTime.split(':').map(Number);
      const totalMinutes = hours * 60 + minutes + timezoneOffset;
      
      let adjustedMinutes = totalMinutes;
      if (adjustedMinutes < 0) adjustedMinutes += 1440;
      if (adjustedMinutes >= 1440) adjustedMinutes -= 1440;
      
      const utcHours = Math.floor(adjustedMinutes / 60);
      const utcMinutes = adjustedMinutes % 60;
      reminderTimeUTC = `${String(utcHours).padStart(2, '0')}:${String(utcMinutes).padStart(2, '0')}`;
    }

    const updatedHabit = await prisma.habit.update({
      where: { id },
      data: { 
        title, 
        description, 
        frequency,
        reminderTime: reminderEnabled ? reminderTimeUTC : null,
        reminderEnabled,
        alarmDuration: reminderEnabled ? alarmDuration : null,
      },
    });

    return NextResponse.json(updatedHabit);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Error updating habit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const habit = await prisma.habit.findUnique({
      where: { id },
    });

    if (!habit || habit.userId !== session.user.id) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    await prisma.habit.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Habit deleted" });
  } catch (error) {
    console.error("Error deleting habit:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
