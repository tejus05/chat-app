"use client";

import { pusherClient } from "@/lib/pusher";
import { chatHrefConstructor, toPusherKey } from "@/lib/utils";
import { Loader2, Trash } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { MouseEvent, useEffect, useState } from "react";
import toast from "react-hot-toast";
import UnseenChatToast from "./UnseenChatToast";
import { Button } from "./ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
  AlertDialogHeader,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import axios from "axios";

interface SidebarChatListProps {
  friends: User[];
  sessionId: string;
}

interface ExtendedMessage extends Message {
  senderImage: string;
  senderName: string;
}

const SidebarChatList = ({ friends, sessionId }: SidebarChatListProps) => {
  const [isMounted, setIsMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isRemovingFriend, setIsRemovingFriend] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    pusherClient.subscribe(toPusherKey(`user:${sessionId}:chats`));

    pusherClient.subscribe(toPusherKey(`user:${sessionId}:friends`));

    pusherClient.subscribe(toPusherKey(`user:${sessionId}:remove_friend`));

    const chatHandler = (message: ExtendedMessage) => {
      const shouldNotify =
        pathname !==
        `/dashboard/chat/${chatHrefConstructor(sessionId, message.senderId)}`;

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
      ));
    };

    const friendHandler = (friend: User) => {
      toast.success(`Congratulation! You and ${friend.name} are now friends`);

      router.refresh();
    };

    const removeFriendHandler = (friend: User) => {
      router.refresh();
    };

    pusherClient.bind("new_message", chatHandler);
    pusherClient.bind("new_friend", friendHandler);
    pusherClient.bind("remove_friend", removeFriendHandler);

    return () => {
      pusherClient.unsubscribe(toPusherKey(`user:${sessionId}:chats`));

      pusherClient.unsubscribe(toPusherKey(`user:${sessionId}:friends`));

      pusherClient.unsubscribe(toPusherKey(`user:${sessionId}:remove_friend`));

      pusherClient.unbind("new_message", chatHandler);

      pusherClient.unbind("new_friend", friendHandler);

      pusherClient.unbind("remove_friend", removeFriendHandler);
    };
  }, [pathname, sessionId, router]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  const removeFriend = async (friend: User) => {
    try {
      setIsRemovingFriend(true);
      await axios.post("/api/friends/delete", {
        id: friend.id,
      });
      router.refresh();
    } catch (error) {
      toast.error("Could not remove friend. Please try again. ");
      console.log(error);
    } finally {
      setIsRemovingFriend(false);
    }
  };

  return (
    <ul role="list" className="max-h-[25rem] overflow-y-auto -mx-2 space-y-1">
      {friends.sort().map((friend) => {
        return (
          <li key={friend.id}>
            <a
              href={`/dashboard/chat/${chatHrefConstructor(
                sessionId,
                friend.id
              )}`}
              className="text-gray-700 hover:text-indigo-600 hover:bg-gray-50 group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold justify-between"
            >
              {friend.name}

              <AlertDialog
                open={isOpen}
                onOpenChange={() => setIsOpen((prev) => !prev)}
              >
                <AlertDialogTrigger asChild>
                  <Button
                    variant="link"
                    onClick={(e: MouseEvent) => {
                      e.stopPropagation();
                      e.preventDefault();
                      setIsOpen(true);
                    }}
                    className="hover:text-rose-600"
                  >
                    {isRemovingFriend ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Trash className="h-4 w-4" />
                    )}
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove Friend</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to remove <b>{friend.name}</b> from
                      your friends list?
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        removeFriend(friend);
                      }}
                    >
                      Continue
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </a>
          </li>
        );
      })}
    </ul>
  );
};

export default SidebarChatList;
