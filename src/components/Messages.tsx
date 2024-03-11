"use client";

import { toPusherKey } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

import { pusherClient } from "@/lib/pusher";
import { useRouter } from "next/navigation";
import MessageElement from "./Message";
import { Message } from "@/lib/validations/messageValidation";

interface MessagesProps{
  initialMessages: Message[],
  sessionId: string,
  chatId: string,
  chatPartner: User,
  sessionImage: string
}


const Messages = ({initialMessages, sessionId, chatId, chatPartner, sessionImage}:MessagesProps) => {
  const scrolldownRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();

  const [messages, setMessages] = useState<Message[]>(initialMessages);



  useEffect(() => {
    pusherClient.subscribe(
      toPusherKey(`chat:${chatId}`)
    );

    const messageHandler = (message: Message) => {
      setMessages(prev=>[message, ...prev])
    };

    pusherClient.bind("incoming_message", messageHandler);

    return () => {
      pusherClient.unsubscribe(toPusherKey(`chat:${chatId}`));

      pusherClient.unbind("incoming_message", messageHandler);
    };
  }, [chatId, router]);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return "";
  }


  return (
    <div
      id="messages"
      className="flex h-full flex-1 flex-col-reverse gap-4 p-3 overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch"
    >
      <div ref={scrolldownRef} />

      {messages.map((message, index) => {
        const isCurrentUser = message.senderId === sessionId;

        const lastMessage = messages[0];

        const isLastMessage = message.id === lastMessage.id;

        const hasNextMessageFromSameUser =
          messages[index - 1]?.senderId === messages[index].senderId;

        return (
          <MessageElement
            key={message.id}
            hasNextMessageFromSameUser={hasNextMessageFromSameUser}
            isCurrentUser={isCurrentUser}
            message={message}
            chatPartner={chatPartner}
            sessionImage={sessionImage}
            chatId={chatId}
          />
        );
      })}
    </div>
  );
}

export default Messages