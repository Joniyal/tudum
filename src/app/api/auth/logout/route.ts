import { NextResponse } from "next/server";

/**
 * POST /api/auth/logout
 * 
 * This endpoint is called by the client to trigger logout.
 * The actual session clearing is handled by NextAuth's signOut() on the client side.
 * This endpoint serves as a confirmation point and can be extended for server-side cleanup.
 */
export async function POST() {
  try {
    console.log("[LOGOUT] Logout endpoint called");
    
    // Return success - the client will handle the actual signOut() call
    // This endpoint can be extended later for server-side cleanup (e.g., invalidating refresh tokens, etc.)
    return NextResponse.json(
      { 
        success: true, 
        message: "Logout completed successfully. Please refresh the page.",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("[LOGOUT] Logout error:", error);
    return NextResponse.json(
      { error: "Failed to logout" },
      { status: 500 }
    );
  }
}
