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
    const { text, chatId, messageId }: { text: string, chatId: string, messageId: string } = await request.json();
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
    console.log("reached")

    const dbMessagesRaw = await fetchRedis("zrange", `chat:${chatId}:messages`, 0, -1) as string[];

    const dbMessages = dbMessagesRaw.map(message => JSON.parse(message) as Message) as Message[];

    const dbMessage = dbMessages.find(message => message.id === messageId) as Message;


    if (!dbMessage) return new NextResponse("Message does not exist. ", { status: 400 });

    const updatedMessage: Message = {
      ...dbMessage,
      text
    }
    
    const deletedMessage = await db.zrem(`chat:${chatId}:messages`, dbMessage)

    if (!deletedMessage) return new NextResponse("Could not update the message. ", { status: 400 });

    const data = await db.zadd(`chat:${chatId}:messages`, {
      score: timestamp,
      member: JSON.stringify(updatedMessage)
    });

    return NextResponse.json(data);

  } catch (error) {
    return new NextResponse("Internal Server Error. ", { status: 500 });
  }
}