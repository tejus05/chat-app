import { pusherServer } from "@/lib/pusher";
import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
  try {
    await pusherServer.trigger(
      'online-status',
      "user__status",
      {
        userId: "user123",
        status: "online", // or "offline"
      }
    );

    return NextResponse.json({ message: "Online status updated" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: "Failed to update online status", error: error }, { status: 500 });
  }
}
