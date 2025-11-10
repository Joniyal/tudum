import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const connection = await prisma.connection.findUnique({
      where: { id },
    });

    if (!connection || connection.toUserId !== session.user.id) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    const body = await req.json();
    const { status } = body;

    if (!["ACCEPTED", "REJECTED"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updatedConnection = await prisma.connection.update({
      where: { id },
      data: { status },
      include: {
        fromUser: {
          select: { id: true, name: true, email: true, username: true },
        },
        toUser: {
          select: { id: true, name: true, email: true, username: true },
        },
      },
    });

    return NextResponse.json(updatedConnection);
  } catch (error: any) {
    console.error("Error updating connection:", error);
    console.error("Error details:", {
      message: error.message,
      code: error.code,
    });
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
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
    const connection = await prisma.connection.findUnique({
      where: { id },
    });

    if (
      !connection ||
      (connection.fromUserId !== session.user.id &&
        connection.toUserId !== session.user.id)
    ) {
      return NextResponse.json(
        { error: "Connection not found" },
        { status: 404 }
      );
    }

    await prisma.connection.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Connection deleted" });
  } catch (error) {
    console.error("Error deleting connection:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
