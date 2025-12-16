import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/admin/setup - One-time setup to make the current user an admin
// This only works if there are NO existing admins in the system
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
    }

    // Check if any admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { isAdmin: true },
    });

    if (existingAdmin) {
      return NextResponse.json(
        { error: "An admin already exists. This setup can only be used once." },
        { status: 403 }
      );
    }

    // Make the current user an admin
    await prisma.user.update({
      where: { id: session.user.id },
      data: { isAdmin: true },
    });

    return NextResponse.json({
      success: true,
      message: "You are now an admin! Please log out and log back in to see the Admin Panel option.",
    });
  } catch (error) {
    console.error("Admin setup error:", error);
    return NextResponse.json(
      { error: "Failed to setup admin. Make sure the database migration has been applied." },
      { status: 500 }
    );
  }
}
