import { NextResponse } from "next/server";

// Stripe checkout is temporarily disabled.
export async function POST(
  _request: Request,
  _ctx: { params: Promise<{ id: string }> }
) {
  return NextResponse.json({ error: "Online payments are not available at this time." }, { status: 503 });
}
