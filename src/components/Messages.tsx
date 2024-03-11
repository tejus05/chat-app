"use client";

import { toPusherKey } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

import { pusherClient } from "@/lib/pusher";
import { useRouter } from "next/navigation";
import MessageElement from "./Message";
import { Message } from "@/lib/validations/messageValidation";
import { Session } from "next-auth";

interface MessagesProps{
  initialMessages: Message[],
  sessionId: string,
  chatId: string,
  chatPartner: User,
  sessionImage: string,
  session: Session
}


const Messages = ({initialMessages, sessionId, chatId, chatPartner, sessionImage, session}:MessagesProps) => {
  const scrolldownRef = useRef<HTMLDivElement | null>(null);
  const router = useRouter();
  
  const [isTyping, setIsTyping] = useState(true);
  const [isLastMessage, setIsLastMessage] = useState(false);

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  
  const [userWatchList, setUserWatchList] = useState(session.user.watchlist);

  useEffect(() => {
    pusherClient.subscribe(
      toPusherKey(`chat:${chatId}`)
    );

    pusherClient.subscribe(toPusherKey(`user:${sessionId}:watchlist`));
    
    const messageHandler = (message: Message) => {
      setMessages(prev=>[message, ...prev])
    };

    pusherClient.bind("incoming_message", messageHandler);
    
    const watchlistEventHandler = (user: User) => {
      setUserWatchList(user.watchlist);
    };
    
    pusherClient.user.watchlist.bind("watchlist", watchlistEventHandler);
    
    return () => {
      pusherClient.unsubscribe(toPusherKey(`chat:${chatId}`));

      pusherClient.unsubscribe(toPusherKey(`user:${sessionId}:watchlist`));
      
      pusherClient.unbind("incoming_message", messageHandler);

      pusherClient.user.watchlist.unbind("watchlist", watchlistEventHandler);
    };
  }, [chatId, router]);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return "";
  }

  console.log(session.user.watchlist)

  return (
    <div
      id="messages"
      className="flex h-full flex-1 flex-col-reverse gap-4 p-3 overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch"
    >
      <div ref={scrolldownRef} />

      {/* {isTyping && (
        <div className={cn("flex items-end")}>
          <div
            className={cn("flex flex-col space-y-2 text-base max-w-xs mx-1", {
              "order-2 items-start": 1,
            })}
          >
            <span
              className={cn("px-4 py-2 rounded-lg rounded-bl-none", {
                "bg-gray-200 text-gray-900": 1,
              })}
            >
              <span className="">...</span>
              <span className="ml-2 text-xs text-gray-400">
                {formatTimestamp(message.timestamp)}
              </span>
              {isCurrentUser && <Check className="w-3 h-3 ml-auto" />}
            </span>
          </div>

          <div
            className={cn("relative w-6 h-6", {
              "order-1": 1,
            })}
          >
            <Image
              fill
              src={chatPartner.image}
              alt="Profile picture"
              referrerPolicy="no-referrer"
              className="rounded-full"
            />
          </div>
        </div>
      )} */}

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