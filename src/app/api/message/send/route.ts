import { fetchRedis } from "@/components/helpers/redis";
import db from '@/db';
import { Message, messageSchema } from "@/lib/validations/messageValidation";
import { nanoid } from 'nanoid';
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import authOptions from "../../auth/authOptions";
import { pusherServer } from "@/lib/pusher";
import { toPusherKey } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const { text, chatId }: { text: string, chatId: string } = await request.json();
    const session = await getServerSession(authOptions);
    if (!session) return new NextResponse("Unauthorised", { status: 401 });

    const [userId1, userId2] = chatId.split("--");

    if (session.user.id !== userId1 && session.user.id !== userId2) return new NextResponse("Unauthorised", { status: 401 });

    const friendId = session.user.id === userId1 ? userId2 : userId1;

    const isFriend = (await fetchRedis("sismember", `user:${session.user.id}:friends`, friendId)) as 0 | 1;

    if (!isFriend) return new NextResponse("Not friends with this user. ", { status: 401 });

    const rawSender = (await fetchRedis("get", `user:${session.user.id}`)) as string;
    const sender = JSON.parse(rawSender) as User;

    const timestamp = Date.now();

    const messageData: Message = {
      id: nanoid(),
      senderId: sender.id,
      text,
      timestamp
    }

    const messageValidation = messageSchema.safeParse(messageData);

    if (!messageValidation.success) return new NextResponse("Invalid message format. ", { status: 400 });

    const message = messageValidation.data;

    await pusherServer.trigger(
      (
        toPusherKey(`chat:${chatId}`)
      ),
      'incoming_message',
      message
    )

    await pusherServer.trigger(
      (
        toPusherKey(`user:${friendId}:chats`)
      ),
      'new_message',
      {
        ...message,
        senderImage: sender.image,
        senderName: sender.name,
      }
    )

    const data = await db.zadd(`chat:${chatId}:messages`, {
      score: timestamp,
      member: JSON.stringify(message)
    })

    return NextResponse.json(data);

  } catch (error) {
    return new NextResponse("Internal Server Error. ", { status: 500 });
  }
}