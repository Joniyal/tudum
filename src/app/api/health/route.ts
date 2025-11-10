import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Test database connection
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    
    // Test user count
    const userCount = await prisma.user.count();
    
    // Test connection model
    const connectionCount = await prisma.connection.count();
    
    return NextResponse.json({ 
      ok: true, 
      database: "connected",
      prismaVersion: "6.19.0",
      stats: {
        users: userCount,
        connections: connectionCount
      },
      result 
    });
  } catch (error: any) {
    console.error('Health check error:', error);
    console.error('Error code:', error.code);
    console.error('Error name:', error.name);
    return NextResponse.json({ 
      ok: false, 
      error: error.message || String(error),
      code: error.code,
      name: error.name
    }, { status: 500 });
  }
}
