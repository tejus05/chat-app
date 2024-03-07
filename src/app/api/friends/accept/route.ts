import { fetchRedis } from "@/components/helpers/redis";
import { idSchema } from "@/lib/validations/idValidation";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import db from '@/db'
import { z } from "zod";
import authOptions from "../../auth/authOptions";
import { pusherServer } from "@/lib/pusher";
import { toPusherKey } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const id = idSchema.safeParse(body);
    if (!id.success) return new NextResponse("Invalid ID. ", { status: 400 });

    const idToAdd = id.data.id;

    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorised. ", { status: 401 });

    // verify users are not already friends
    const isAlreadyFriends = await fetchRedis("sismember", `user:${session.user.id}:friends`, idToAdd);
    if (isAlreadyFriends) return new NextResponse("Already friends. ", { status: 400 });

    const hasFriendRequest = await fetchRedis("sismember", `user:${session.user.id}:incoming_friend_requests`, idToAdd);
    if (!hasFriendRequest) return new NextResponse("No friend request exists. ", { status: 400 });

    const [userRaw, friendRaw] = (await Promise.all([
      fetchRedis('get', `user:${session.user.id}`),
      fetchRedis('get', `user:${idToAdd}`),
    ])) as [string, string]

    const user = JSON.parse(userRaw) as User
    const friend = JSON.parse(friendRaw) as User

    // notify added user

    await Promise.all([
      pusherServer.trigger(
        toPusherKey(`user:${idToAdd}:friends`),
        'new_friend',
        user
      ),
      pusherServer.trigger(
        toPusherKey(`user:${session.user.id}:friends`),
        'new_friend',
        friend
      ),
      db.sadd(`user:${session.user.id}:friends`, idToAdd),
      db.sadd(`user:${idToAdd}:friends`, session.user.id),
      db.srem(`user:${session.user.id}:incoming_friend_requests`, idToAdd),
    ])

    return NextResponse.json({
      message: "OK"
    });

  } catch (error) {

    if (error instanceof z.ZodError) {
      return new NextResponse(`Invalid request payload. `,{status:422}) //unprocessable entity
    }

    return new NextResponse(`[ACCEPT_FRIENDS]: ${error}`,{status:500})
  }
}