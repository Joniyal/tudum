import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const habitSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  frequency: z.enum(["DAILY", "WEEKLY", "MONTHLY"]),
  sharedWith: z.array(z.string()).optional(),
});

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
    const { title, description, frequency, sharedWith } = habitSchema.parse(body);

    // Create habit for the current user
    const habit = await prisma.habit.create({
      data: {
        title,
        description,
        frequency,
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
