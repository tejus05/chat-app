import { fetchRedis } from "@/components/helpers/redis";
import db from '@/db';
import { addFriendValidator } from "@/lib/validations/addFriend";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import authOptions from "../../auth/authOptions";
import { pusherServer } from "@/lib/pusher";
import { toPusherKey } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = addFriendValidator.safeParse(body.email);
    if (!validation.success) return new NextResponse("Invalid Email. ", { status: 400 });

    const validatedEmail = validation.data.email;

    const idToAdd = (await fetchRedis(
      'get',
      `user:email:${validatedEmail}`
    )) as string;

    if (!idToAdd) return new NextResponse("This person does not exist. ", { status: 400 });

    const session = await getServerSession(authOptions);
    
    if (!session) return new NextResponse("Unauthorised. ", { status: 401 });
    
    if (idToAdd === session.user.id) return new NextResponse("You cannot add yourself as a friend. ", { status: 400 });

    // check if user is already added
    const isAlreadyAdded = (await fetchRedis("sismember", `user:${idToAdd}:incoming_friend_requests`, session.user.id)) as 0 | 1;

    if (isAlreadyAdded) return new NextResponse("Already added this user. ", { status: 400 });

    // check if user is already a friend
    const isAlreadyFriend = (await fetchRedis("sismember", `user:${session.user.id}:friends`, idToAdd)) as 0 | 1;

    if (isAlreadyFriend) return new NextResponse("Already friends with this user. ", { status: 400 });

    // valid - send friend request

    await pusherServer.trigger(
      (toPusherKey(`user:${idToAdd}:incoming_friend_requests`)), //channel (subscribe)
      `incoming_friend_requests`, //event (bind)
      {
        senderId: session.user.id,
        senderEmail: session.user.email
      }
    )

    const data = await db.sadd(`user:${idToAdd}:incoming_friend_requests`, session.user.id);

    return NextResponse.json(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse("Invalid request payload. ", { status: 422 }); //unprocessable entity
    }
    return new NextResponse(`[ADD_FRIENDS]: ${error}`, { status: 500 })
  }
}