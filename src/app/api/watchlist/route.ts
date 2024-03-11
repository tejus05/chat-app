import { fetchRedis } from "@/components/helpers/redis";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import authOptions from "../auth/authOptions";
import db from '@/db'
import { pusherServer } from "@/lib/pusher";

export async function POST(request: NextRequest) {
  try {
    const { userId }: { userId: string } = await request.json();
  
    const session = await getServerSession(authOptions);
  
    if (!session) return new NextResponse("Unauthorised", { status: 401 });
  
    const friendRaw = await fetchRedis("get", `user:${userId}`) as string;
    const friend = JSON.parse(friendRaw) as User;
  
    if (!friend) return new NextResponse("Unauthorised", { status: 401 });
  
    const watchlistResult = await fetchRedis("get", `user:${session.user.id}`) as string;
    const user = JSON.parse(watchlistResult) as User;
  
    // Add the item to the watchlist
    user.watchlist.push(userId);

    pusherServer.trigger(
      `user:${session.user.id}:watchlist`,
      'watchlist',
      {
        user: session.user
      }
    )
  
    // Update the user in Redis
    const data = await db.set(`user:${userId}`, JSON.stringify(user));

    return NextResponse.json(data);
  } catch (error) {
    console.log(error)
    return new NextResponse("Internal Server Error!", { status: 500 });
  }
}