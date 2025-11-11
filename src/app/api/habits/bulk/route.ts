import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Bulk operations on habits
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action, habitIds } = body;

    if (!action || !habitIds || !Array.isArray(habitIds) || habitIds.length === 0) {
      return NextResponse.json(
        { error: "Action and habitIds are required" },
        { status: 400 }
      );
    }

    switch (action) {
      case "delete":
        // Permanent delete
        await prisma.habit.deleteMany({
          where: {
            id: { in: habitIds },
            userId: session.user.id, // Security: only delete user's own habits
          },
        });
        return NextResponse.json({ success: true, action: "deleted", count: habitIds.length });

      case "archive":
        // Soft delete (archive)
        const archivedCount = await prisma.habit.updateMany({
          where: {
            id: { in: habitIds },
            userId: session.user.id,
          },
          data: {
            archived: true,
          },
        });
        return NextResponse.json({
          success: true,
          action: "archived",
          count: archivedCount.count,
        });

      case "unarchive":
        const unarchivedCount = await prisma.habit.updateMany({
          where: {
            id: { in: habitIds },
            userId: session.user.id,
          },
          data: {
            archived: false,
          },
        });
        return NextResponse.json({
          success: true,
          action: "unarchived",
          count: unarchivedCount.count,
        });

      case "add-to-collection":
        const { collectionId } = body;
        if (!collectionId) {
          return NextResponse.json(
            { error: "collectionId is required for add-to-collection action" },
            { status: 400 }
          );
        }

        // Verify collection ownership
        const collection = await prisma.habitCollection.findUnique({
          where: { id: collectionId },
        });

        if (!collection || collection.userId !== session.user.id) {
          return NextResponse.json({ error: "Collection not found" }, { status: 404 });
        }

        const addedCount = await prisma.habit.updateMany({
          where: {
            id: { in: habitIds },
            userId: session.user.id,
          },
          data: {
            collectionId: collectionId,
          },
        });

        return NextResponse.json({
          success: true,
          action: "added-to-collection",
          count: addedCount.count,
        });

      case "remove-from-collection":
        const removedCount = await prisma.habit.updateMany({
          where: {
            id: { in: habitIds },
            userId: session.user.id,
          },
          data: {
            collectionId: null,
          },
        });

        return NextResponse.json({
          success: true,
          action: "removed-from-collection",
          count: removedCount.count,
        });

      case "complete":
        // Bulk mark as complete for today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const completions = await Promise.all(
          habitIds.map((habitId) =>
            prisma.completion.upsert({
              where: {
                habitId_completedAt_userId: {
                  habitId,
                  completedAt: today,
                  userId: session.user.id,
                },
              },
              create: {
                habitId,
                userId: session.user.id,
                completedAt: today,
              },
              update: {},
            })
          )
        );

        return NextResponse.json({
          success: true,
          action: "completed",
          count: completions.length,
        });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error performing bulk operation:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
