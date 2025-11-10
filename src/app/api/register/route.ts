import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, name } = registerSchema.parse(body);

    // Generate username from email (first part before @)
    let username = email.split("@")[0].replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
    let finalUsername = username;
    let counter = 1;

    // Check if username is available, if not add numbers
    while (true) {
      const existingUsername = await prisma.user.findUnique({
        where: { username: finalUsername },
      });
      if (!existingUsername) break;
      finalUsername = `${username}${counter}`;
      counter++;
    }

    // Check if user already exists by email
    let existingUser;
    try {
      existingUser = await prisma.user.findUnique({
        where: { email },
      });
    } catch (dbError: any) {
      console.error("Database connection error:", dbError);
      return NextResponse.json(
        { error: "Database connection failed", details: dbError.message },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        username: finalUsername,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { message: "User created successfully", user },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
