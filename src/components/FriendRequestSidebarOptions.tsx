"use client";

import { pusherClient } from "@/lib/pusher";
import { chatHrefConstructor, toPusherKey } from "@/lib/utils";
import { User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface FriendRequestSidebarOptionsProps {
  sessionId: string;
  initialUnseenRequestCount: number;
}

const FriendRequestSidebarOptions = ({
  sessionId,
  initialUnseenRequestCount,
}: FriendRequestSidebarOptionsProps) => {
  const [unseenRequestCount, setUnseenRequestCount] = useState<number>(
    initialUnseenRequestCount
  );

  const router = useRouter();
  const pathname = usePathname();

  const [friend, setFriend] = useState<User>();
  const [deniedRequest, setDeniedRequest] = useState<{
    senderId: string;
    senderEmail: string;
  }>();

  useEffect(() => {
    pusherClient.subscribe(
      toPusherKey(`user:${sessionId}:incoming_friend_requests`)
    );
    pusherClient.subscribe(toPusherKey(`user:${sessionId}:friends`));
    pusherClient.subscribe(toPusherKey(`user:${sessionId}:deny`));

    const friendRequestHandler = () => {
      setUnseenRequestCount((prev) => prev + 1);
      router.refresh();
    };

    const addedFriendHandler = (friend: User) => {
      setUnseenRequestCount((prev) => prev - 1);
      setFriend(friend);
      router.push(`chat/${chatHrefConstructor(sessionId, friend.id)}`);

      router.refresh();
    };

    const denyFriendHandler = ({
      senderId,
      senderEmail,
    }: {
      senderId: string;
      senderEmail: string;
    }) => {
      setDeniedRequest({ senderEmail, senderId });
      setUnseenRequestCount((prev) => prev - 1);
      router.refresh();
      window.location.reload();
    };

    pusherClient.bind("incoming_friend_requests", friendRequestHandler);
    pusherClient.bind("new_friend", addedFriendHandler);
    pusherClient.bind("deny_friend", denyFriendHandler);

    return () => {
      pusherClient.unsubscribe(
        toPusherKey(`user:${sessionId}:incoming_friend_requests`)
      );
      pusherClient.unsubscribe(toPusherKey(`user:${sessionId}:friends`));
      pusherClient.unsubscribe(toPusherKey(`user:${sessionId}:deny`));


      pusherClient.unbind("new_friend", addedFriendHandler);
      pusherClient.unbind("incoming_friend_requests", friendRequestHandler);
      pusherClient.unbind("deny_friend", denyFriendHandler);

    };
  }, [sessionId, router, unseenRequestCount, pathname, friend, deniedRequest, setDeniedRequest, setFriend, setUnseenRequestCount]);

  return (
    <Link
      href="/dashboard/requests"
      className="text-gray-700 hover:text-indigo-600 hover:bg-gray-50 group flex items-center gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
    >
      <div className="text-gray-400 border-gray-200 group-hover:border-indigo-600 group-hover:text-indigo-600 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-[0.625rem] font-medium bg-white">
        <User className="h-4 w-4" />
      </div>
      <p className="truncate">Friend requests</p>

      {unseenRequestCount > 0 ? (
        <div className="rounded-full w-5 h-5 text-xs flex justify-center items-center text-white bg-indigo-600">
          {unseenRequestCount}
        </div>
      ) : null}
    </Link>
  );
};

export default FriendRequestSidebarOptions;
