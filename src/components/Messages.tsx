"use client";

import { pusherClient } from "@/lib/pusher";
import { cn, toPusherKey } from "@/lib/utils";
import { Message } from "@/lib/validations/messageValidation";
import { format } from "date-fns";
import { Check, Dot } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface MessagesProps{
  initialMessages: Message[],
  sessionId: string,
  chatId: string,
  chatPartner: User,
  sessionImage: string
}


const Messages = ({initialMessages, sessionId, chatId, chatPartner, sessionImage}:MessagesProps) => {
  const scrolldownRef = useRef<HTMLDivElement | null>(null);

  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isTyping, setIsTyping] = useState(true);
  const [isLastMessage, setIsLastMessage] = useState(false);

  // useEffect(() => {
  //   // Function to toggle isTyping state
  //   const toggleTyping = () => {
  //     setIsTyping((prevIsTyping) => !prevIsTyping);
  //   };

  //   // Set initial state
  //   toggleTyping();

  //   // Set up the interval to toggle isTyping every 3 seconds
  //   const intervalId = setInterval(toggleTyping, 3000);

  //   // Cleanup function to clear the interval when the component unmounts
  //   return () => clearInterval(intervalId);
  // }, []); // Empty dependency array ensures this effect runs only once on mount

  const formatTimestamp = (timestamp: number) => {
    return format(timestamp, "HH:mm");
  };

  useEffect(() => {
    pusherClient.subscribe(toPusherKey(`chat:${chatId}`));

    const messageHandler = (message: Message) => {
      setMessages((prev) => [message, ...prev]);
    };

    pusherClient.bind("incoming_message", messageHandler);

    return () => {
      pusherClient.unsubscribe(toPusherKey(`chat:${chatId}`));

      pusherClient.unbind("incoming_message", messageHandler);
    };
  }, [chatId]);

  return (
    <div
      id="messages"
      className="flex h-full flex-1 flex-col-reverse gap-4 p-3 overflow-y-auto scrollbar-thumb-blue scrollbar-thumb-rounded scrollbar-track-blue-lighter scrollbar-w-2 scrolling-touch"
    >
      <div ref={scrolldownRef} />

      {isTyping && (
        <div
          className={cn("flex items-end")}
        >
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
              <span className="">
                ...
              </span>
              {/* <span className="ml-2 text-xs text-gray-400">
                {formatTimestamp(message.timestamp)}
              </span>
              {isCurrentUser && <Check className="w-3 h-3 ml-auto" />} */}
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
      )}

      {messages.map((message, index) => {
        const isCurrentUser = message.senderId === sessionId;

        const lastMessage = messages[0];

        const isLastMessage = message.id === lastMessage.id;

        const hasNextMessageFromSameUser =
          messages[index - 1]?.senderId === messages[index].senderId;

        return (
          <div
            className="chat-message"
            key={`${message.id}-${message.timestamp}`}
          >
            <div
              className={cn("flex items-end", {
                "justify-end": isCurrentUser,
              })}
            >
              <div
                className={cn(
                  "flex flex-col space-y-2 text-base max-w-xs mx-1",
                  {
                    "order-1 items-end": isCurrentUser,
                    "order-2 items-start": !isCurrentUser,
                  }
                )}
              >
                <span
                  className={cn("px-4 py-2 rounded-lg inline-block", {
                    "bg-indigo-600 text-white": isCurrentUser,
                    "bg-gray-200 text-gray-900": !isCurrentUser,
                    "rounded-br-none":
                      !hasNextMessageFromSameUser && isCurrentUser,
                    "rounded-bl-none":
                      !hasNextMessageFromSameUser && !isCurrentUser,
                  })}
                >
                  {message.text}{" "}
                  <span className="ml-2 text-xs text-gray-400">
                    {formatTimestamp(message.timestamp)}
                  </span>
                  {isCurrentUser && <Check className="w-3 h-3 ml-auto" />}
                </span>
              </div>

              <div
                className={cn("relative w-6 h-6", {
                  "order-2": isCurrentUser,
                  "order-1": !isCurrentUser,
                  invisible: hasNextMessageFromSameUser,
                })}
              >
                <Image
                  fill
                  src={
                    isCurrentUser ? (sessionImage as string) : chatPartner.image
                  }
                  alt="Profile picture"
                  referrerPolicy="no-referrer"
                  className="rounded-full"
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default Messages