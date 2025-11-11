import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH - Update collection
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, color, icon, dayOfWeek, sortOrder } = body;

    // Verify ownership
    const collection = await prisma.habitCollection.findUnique({
      where: { id },
    });

    if (!collection || collection.userId !== session.user.id) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    const updated = await prisma.habitCollection.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(color !== undefined && { color }),
        ...(icon !== undefined && { icon }),
        ...(dayOfWeek !== undefined && { dayOfWeek }),
        ...(sortOrder !== undefined && { sortOrder }),
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

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating collection:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// DELETE - Delete collection
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const collection = await prisma.habitCollection.findUnique({
      where: { id },
    });

    if (!collection || collection.userId !== session.user.id) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 });
    }

    // Delete collection (habits will have collectionId set to null due to SetNull)
    await prisma.habitCollection.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting collection:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
