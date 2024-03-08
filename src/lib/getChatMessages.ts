import { fetchRedis } from "@/components/helpers/redis";
import { messageSchemaArray } from "./validations/messageValidation";
import { notFound } from "next/navigation";

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