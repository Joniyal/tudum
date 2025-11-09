import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
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
    const completedAt = body.completedAt ? new Date(body.completedAt) : new Date();

    // Check if already completed today
    const startOfDay = new Date(completedAt);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(completedAt);
    endOfDay.setHours(23, 59, 59, 999);

    const existing = await prisma.completion.findFirst({
      where: {
        habitId: id,
        userId: session.user.id,
        completedAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Habit already completed for this period" },
        { status: 400 }
      );
    }

    const completion = await prisma.completion.create({
      data: {
        habitId: id,
        userId: session.user.id,
        completedAt,
        notes: body.notes || null,
      },
    });

    return NextResponse.json(completion, { status: 201 });
  } catch (error) {
    console.error("Error completing habit:", error);
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

    await params; // Await params even if not using id
    const { searchParams } = new URL(req.url);
    const completionId = searchParams.get("completionId");

    if (!completionId) {
      return NextResponse.json(
        { error: "Completion ID required" },
        { status: 400 }
      );
    }

    const completion = await prisma.completion.findUnique({
      where: { id: completionId },
    });

    if (!completion || completion.userId !== session.user.id) {
      return NextResponse.json(
        { error: "Completion not found" },
        { status: 404 }
      );
    }

    await prisma.completion.delete({
      where: { id: completionId },
    });

    return NextResponse.json({ message: "Completion removed" });
  } catch (error) {
    console.error("Error removing completion:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
