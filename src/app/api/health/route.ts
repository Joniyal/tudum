import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // simple check
    const res = await prisma.$queryRaw`SELECT 1 as result`;
    return NextResponse.json({ ok: true, res });
  } catch (error: any) {
    console.error('Health check error:', error);
    return NextResponse.json({ ok: false, error: String(error.message || error) }, { status: 500 });
  }
}
