import { fetchRedis } from "@/components/helpers/redis";
import db from '@/db';
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import authOptions from "../../auth/authOptions";
import { toPusherKey } from "@/lib/utils";
import { pusherServer } from "@/lib/pusher";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
  
    if (!session) return new NextResponse("Unauthorised. ", { status: 401 });
  
    const {id}:{id:string} = await request.json();
  
    const friendProfileRaw = (await fetchRedis("get", `user:${id}`)) as string;

    const friend = JSON.parse(friendProfileRaw) as User;
  
    if (!friend) return new NextResponse("User does not exist. ", { status: 404 });
  
    const isFriend = (await fetchRedis("sismember", `user:${session.user.id}:friends`, friend.id)) as 0 | 1;
  
    if (!isFriend) return new NextResponse("You are not friends with that user. ", { status: 401 });

    pusherServer.trigger(
      toPusherKey(`user:${session.user.id}:remove_friend`),
      'remove_friend',
      friend
    )
    pusherServer.trigger(
      toPusherKey(`user:${friend.id}:remove_friend`),
      'remove_friend',
      session.user
    )
  
    await db.srem(`user:${session.user.id}:friends`, friend.id);
    await db.srem(`user:${friend.id}:friends`, session.user.id);
  
    return NextResponse.json("OK");
  } catch (error) {
    return new NextResponse(`[DELETE_FRIENDS]: ${error}`, { status: 500 })
  }
}