import authOptions from "@/app/api/auth/authOptions";
import { fetchRedis } from "@/components/helpers/redis";
import { messageSchemaArray } from "@/lib/validations/messageValidation";
import { getServerSession } from "next-auth";
import { notFound } from "next/navigation";

interface ChatIdPageProps{
  params: {
    chatId: string
  }
}

const getChatMessages = async (chatId: string) => {
  try {
    const result: string[] = await fetchRedis("zrange", `chat:${chatId}:messages`, 0, -1);

    const dbMessages = result.map(message => JSON.parse(message) as Message);
    const reversedDbMessages = dbMessages.reverse;
    const messages = messageSchemaArray.safeParse(reversedDbMessages);
    // if (!messages.success) return notFound();

    // return messages.data;
  } catch (error) {
    return notFound();
  }
}

const ChatIdPage = async ({params: {chatId}}:ChatIdPageProps) => {
  const session = await getServerSession(authOptions);
  if (!session) return notFound();

  const { user } = session;

  const [userId1, userId2] = chatId.split("--");

  if (user.id !== userId1 && user.id !== userId2) return notFound();

  const chatPartnerId = user.id === userId1 ? userId2 : userId1;
  const chatPartner = (await fetchRedis("get", `user:${chatPartnerId}`)) as User;

  const initialMessages = await getChatMessages(chatId);

  return (
    <div>{chatId}</div>
  )
}

export default ChatIdPage