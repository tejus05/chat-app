"use client";

import { pusherClient } from "@/lib/pusher";
import { chatHrefConstructor, toPusherKey } from "@/lib/utils";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import UnseenChatToast from "./UnseenChatToast";

interface SidebarChatListProps{
  friends: User[],
  sessionId: string
}

interface ExtendedMessage extends Message {
  senderImage: string,
  senderName: string
}

const SidebarChatList = ({friends, sessionId}:SidebarChatListProps) => {
  const [unseenMessages, setUnseenMessages] = useState<Message[]>([]);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    pusherClient.subscribe(
      (
        toPusherKey(`user:${sessionId}:chats`)
      )
    )

    pusherClient.subscribe(
      (
        toPusherKey(`user:${sessionId}:friends`)
      )
    )

    const chatHandler = (message: ExtendedMessage) => {
      const shouldNotify = pathname !== `/dashboard/chat/${chatHrefConstructor(sessionId, message.senderId)}`;

      if (!shouldNotify) return;

       toast.custom((t) => (
        <UnseenChatToast
          t={t}
          sessionId={sessionId}
          senderId={message.senderId}
          senderImg={message.senderImage}
          senderMessage={message.text}
          senderName={message.senderName}
         />
       ))
    }

    const friendHandler = (friend: User) => {
      router.push(`chat/${chatHrefConstructor(sessionId, friend.id)}`);

      router.refresh();
    }

    pusherClient.bind("new_message", chatHandler);
    pusherClient.bind("new_friend", friendHandler);
    
    return () => {
      pusherClient.unsubscribe(
        (
          toPusherKey(`user:${sessionId}:chats`)
        )
      )
  
      pusherClient.unsubscribe(
        (
          toPusherKey(`user:${sessionId}:friends`)
        )
      )
    }
  }, [pathname, sessionId, router]);

  useEffect(() => {
    if (pathname.includes('chat')) {
      setUnseenMessages(prev => (
        prev.filter((message) => !pathname.includes(message.senderId))
      ));
    }
  }, [pathname]);


  return (
    <ul role="list" className="max-h-[25rem] overflow-y-auto -mx-2 space-y-1">
      {
        friends.sort().map(friend => {
          const unseenMessagesCount = unseenMessages.filter(unseenMessage => unseenMessage.senderId === friend.id).length;

          return <li key={friend.id}>
            <a href={`/dashboard/chat/${chatHrefConstructor(sessionId, friend.id)}`}
            className="text-gray-700 hover:text-indigo-600 hover:bg-gray-50 group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
            >
              {
                friend.name
              }

              {
                unseenMessagesCount > 0 ? (
                  <div className="bg-indigo-600 font-medium text-sm text-white w-4 h-4 rounded-full flex justify-center items-center">
                    {
                      unseenMessagesCount
                    }
                  </div>
                ) : null
              }
            </a>
          </li>
        })
      }
    </ul>
  )
}

export default SidebarChatList