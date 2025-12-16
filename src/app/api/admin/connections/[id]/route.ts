import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status } = body;

    const connection = await prisma.connection.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        status: true,
      }
    });

    return NextResponse.json({ connection });
  } catch (error) {
    console.error("Admin connection update error:", error);
    return NextResponse.json(
      { error: "Failed to update connection" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id } = await params;

    // Delete related messages and habit shares first
    const connection = await prisma.connection.findUnique({
      where: { id },
      select: { fromUserId: true, toUserId: true }
    });

    if (connection) {
      await prisma.$transaction([
        prisma.message.deleteMany({
          where: {
            OR: [
              { fromUserId: connection.fromUserId, toUserId: connection.toUserId },
              { fromUserId: connection.toUserId, toUserId: connection.fromUserId }
            ]
          }
        }),
        prisma.habitShare.deleteMany({
          where: {
            OR: [
              { fromUserId: connection.fromUserId, toUserId: connection.toUserId },
              { fromUserId: connection.toUserId, toUserId: connection.fromUserId }
            ]
          }
        }),
        prisma.connection.delete({ where: { id } }),
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin connection delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete connection" },
      { status: 500 }
    );
  }
}
