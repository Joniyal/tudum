import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Fetch all collections for the user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collections = await prisma.habitCollection.findMany({
      where: {
        userId: session.user.id,
      },
      include: {
        habits: {
          where: {
            archived: false,
          },
          include: {
            completions: {
              where: {
                userId: session.user.id,
              },
            },
          },
        },
        _count: {
          select: {
            habits: true,
          },
        },
      },
      orderBy: {
        sortOrder: "asc",
      },
    });

    return NextResponse.json(collections);
  } catch (error) {
    console.error("Error fetching collections:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// POST - Create a new collection
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, color, icon, dayOfWeek, habitIds } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    // Create the collection
    const collection = await prisma.habitCollection.create({
      data: {
        name,
        description,
        color: color || "#6366f1",
        icon,
        dayOfWeek,
        userId: session.user.id,
      },
    });

    // If habit IDs provided, update those habits to belong to this collection
    if (habitIds && Array.isArray(habitIds) && habitIds.length > 0) {
      await prisma.habit.updateMany({
        where: {
          id: {
            in: habitIds,
          },
          userId: session.user.id, // Security: only update user's own habits
        },
        data: {
          collectionId: collection.id,
        },
      });
    }

    // Fetch the complete collection with habits
    const completeCollection = await prisma.habitCollection.findUnique({
      where: {
        id: collection.id,
      },
      include: {
        habits: {
          where: {
            archived: false,
          },
          include: {
            completions: {
              where: {
                userId: session.user.id,
              },
            },
          },
        },
        _count: {
          select: {
            habits: true,
          },
        },
      },
    });

    return NextResponse.json(completeCollection, { status: 201 });
  } catch (error) {
    console.error("Error creating collection:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
