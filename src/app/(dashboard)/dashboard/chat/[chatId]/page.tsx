import authOptions from "@/app/api/auth/authOptions";
import ChatInput from "@/components/ChatInput";
import Messages from "@/components/Messages";
import { fetchRedis } from "@/components/helpers/redis";
import { messageSchemaArray } from "@/lib/validations/messageValidation";
import { Circle } from "lucide-react";
import { getServerSession } from "next-auth";
import Image from "next/image";
import { notFound, redirect } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: { chatId: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) notFound();
  const [userId1, userId2] = params.chatId.split("--");
  const { user } = session;

  const chatPartnerId = user.id === userId1 ? userId2 : userId1;
  const chatPartnerRaw = (await fetchRedis(
    "get",
    `user:${chatPartnerId}`
  )) as string;
  const chatPartner = JSON.parse(chatPartnerRaw) as User;

  return { title: `Chat App | ${chatPartner.name} chat` };
}

interface ChatIdPageProps{
  params: {
    chatId: string
  }
}

const getChatMessages = async (chatId: string) => {
  try {
    const result: string[] = await fetchRedis("zrange", `chat:${chatId}:messages`, 0, -1);

    const dbMessages = result.map(message => JSON.parse(message) as Message);
    const reversedDbMessages = dbMessages.reverse();
    const messages = messageSchemaArray.safeParse(reversedDbMessages);
    if (!messages.success) return notFound();

    return messages.data;
  } catch (error) {
    return notFound();
  }
}

const ChatIdPage = async ({ params: { chatId } }: ChatIdPageProps) => {
  const session = await getServerSession(authOptions);
  if (!session) return notFound();

  const { user } = session;

  const [userId1, userId2] = chatId.split("--");

  if (user.id !== userId1 && user.id !== userId2) return notFound();

  const chatPartnerId = user.id === userId1 ? userId2 : userId1;
  const chatPartnerRaw = (await fetchRedis(
    "get",
    `user:${chatPartnerId}`
  )) as string;

  const chatPartner = JSON.parse(chatPartnerRaw) as User;

  const isFriend = await fetchRedis(
    "sismember",
    `user:${session.user.id}:friends`,
    chatPartnerId
  );

  if (!isFriend) return redirect("/dashboard");

  const initialMessages = await getChatMessages(chatId);

  return (
    <div className="flex-1 justify-between flex flex-col h-full max-h-[calc(100vh-6rem)]">
      <div className="flex sm:items-center justify-between py-3 border-b-2 border-gray-200">
        <div className="relative flex items-center space-x-4 w-full">
          <div className="relative">
            <div className="relative w-6 sm:w-10 h-6 sm:h-10">
              <Image
                fill
                referrerPolicy="no-referrer"
                src={chatPartner.image}
                alt={`${chatPartner.name} profile picture`}
                className="rounded-full"
              />
            </div>
          </div>

          <div className="flex flex-col leading-tight">
            <div className="text-xl flex items-center">
              <span className="text-gray-700 mr-3 font-semibold sm:text-xl text-sm">
                {chatPartner.name}
              </span>
            </div>

            <span className="text-xs sm:text-sm text-gray-600">
              {chatPartner.email}
            </span>
          </div>
        </div>
      </div>

      <Messages
        chatId={chatId}
        chatPartner={chatPartner}
        sessionImage={session.user.image!}
        sessionId={session.user.id}
        initialMessages={initialMessages}
      />
      <ChatInput chatId={chatId} chatPartner={chatPartner} />
    </div>
  );
};

export default ChatIdPage;