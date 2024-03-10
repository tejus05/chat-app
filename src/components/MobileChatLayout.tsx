"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { pusherClient } from "@/lib/pusher";
import { SidebarOption } from "@/lib/types/typings";
import { toPusherKey } from "@/lib/utils";
import { Dialog, Transition } from "@headlessui/react";
import { Menu, X } from "lucide-react";
import { Session } from "next-auth";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useEffect, useState } from "react";
import FriendRequestSidebarOptions from "./FriendRequestSidebarOptions";
import { Icons } from "./Icons";
import SidebarChatList from "./SidebarChatList";
import SignOutButton from "./SignOutButton";

interface MobileChatLayoutProps {
  friends: User[];
  session: Session;
  sidebarOptions: SidebarOption[];
  unseenRequestCount: number;
}

interface ExtendedMessage extends Message {
  senderImage: string;
  senderName: string;
}

const MobileChatLayout = ({
  friends,
  session,
  sidebarOptions,
  unseenRequestCount,
}: MobileChatLayoutProps) => {
  const [open, setOpen] = useState<boolean>(false);

  const [unseenRequestCountState, setUnseenRequestCountState] = useState<number>(unseenRequestCount);

  const pathname = usePathname();
  const router = useRouter();

  const [friend, setFriend] = useState<User>();
  const [removedFriend, setRemovedFriend] = useState<User>();
  const [deniedRequest, setDeniedRequest] = useState<{senderId: string, senderEmail: string}>();
  const [message, setMessage] = useState<ExtendedMessage>();

  

  useEffect(() => {
    pusherClient.subscribe(
      toPusherKey(`user:${session.user.id}:incoming_friend_requests`)
    );
    pusherClient.subscribe(toPusherKey(`user:${session.user.id}:friends`));
    pusherClient.subscribe(toPusherKey(`user:${session.user.id}:deny`));

    const friendRequestHandler = () => {
      setUnseenRequestCountState((prev) => prev + 1);
      router.refresh();
    };

    const addedFriendHandler = (friend: User) => {
      setUnseenRequestCountState((prev) => prev - 1);
      // router.push(`chat/${chatHrefConstructor(session.user.id, friend.id)}`);
      setFriend(friend);
      
      router.refresh();
      // window.location.reload();
    };

    const denyFriendHandler = ({
      senderId,
      senderEmail,
    }: {
      senderId: string;
      senderEmail: string;
    }) => {
      // console.log("denied from mobile")
      setDeniedRequest({ senderEmail, senderId });
      setUnseenRequestCountState((prev) => prev - 1);
      router.refresh();
      window.location.reload();
    };

    pusherClient.bind("incoming_friend_requests", friendRequestHandler);
    pusherClient.bind("new_friend", addedFriendHandler);
    pusherClient.bind("deny_friend", denyFriendHandler);

    return () => {
      pusherClient.unsubscribe(
        toPusherKey(`user:${session.user.id}:incoming_friend_requests`)
      );
      pusherClient.unsubscribe(toPusherKey(`user:${session.user.id}:friends`));

      pusherClient.unbind("new_friend", addedFriendHandler);
      pusherClient.unbind("incoming_friend_requests", friendRequestHandler);
      pusherClient.unbind("deny_friend", denyFriendHandler);

    };
  }, [session, router, unseenRequestCountState, pathname, friend, deniedRequest, setDeniedRequest, setFriend, setUnseenRequestCountState, unseenRequestCount]);


  

  useEffect(() => {
    pusherClient.subscribe(toPusherKey(`user:${session.user.id}:chats`));

    pusherClient.subscribe(toPusherKey(`user:${session.user.id}:friends`));

    pusherClient.subscribe(toPusherKey(`user:${session.user.id}:remove_friend`));

    const chatHandler = (message: ExtendedMessage) => {
      // const shouldNotify =
      //   pathname !==
      //   `/dashboard/chat/${chatHrefConstructor(session.user.id, message.senderId)}`;

      // if (!shouldNotify) return;

      // toast.custom((t) => (
      //   <UnseenChatToast
      //     t={t}
      //     sessionId={session.user.id}
      //     senderId={message.senderId}
      //     senderImg={message.senderImage}
      //     senderMessage={message.text}
      //     senderName={message.senderName}
      //   />
      // ));
      
      setMessage(message);
      router.refresh();
    };

    const friendHandler = (friend: User) => {
      // toast.success(`Congratulation! You and ${friend.name} are now friends`);
      setFriend(friend);
      setUnseenRequestCountState((prev) => prev - 1);
      router.refresh();
    };

    const removeFriendHandler = (friend: User) => {
      setOpen(false);
      setRemovedFriend(friend);
      router.refresh();
      window.location.reload();
    };

    pusherClient.bind("new_message", chatHandler);
    pusherClient.bind("new_friend", friendHandler);
    pusherClient.bind("remove_friend", removeFriendHandler);

    return () => {
      pusherClient.unsubscribe(toPusherKey(`user:${session.user.id}:chats`));

      pusherClient.unsubscribe(toPusherKey(`user:${session.user.id}:friends`));

      pusherClient.unsubscribe(toPusherKey(`user:${session.user.id}:remove_friend`));

      pusherClient.unbind("new_message", chatHandler);

      pusherClient.unbind("new_friend", friendHandler);

      pusherClient.unbind("remove_friend", removeFriendHandler);
    };
  }, [pathname, session, router, friend, message, setFriend, removedFriend, setRemovedFriend, unseenRequestCountState, setUnseenRequestCountState, setMessage, unseenRequestCount]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (pathname.includes("add") || pathname.includes("request")) {
      router.refresh();
    }
  }, [pathname]);

  return (
    <div className="fixed bg-zinc-50 border-b border-zinc-200 top-0 inset-x-0 py-2 px-4">
      <div className="w-full flex justify-between items-center">
        <Link
          href="/dashboard"
          className={buttonVariants({ variant: "ghost" })}
        >
          <Icons.Logo className="h-6 w-auto text-indigo-600" />
        </Link>
        <Button onClick={() => setOpen(true)} className="gap-4">
          Menu <Menu className="h-6 w-6" />
        </Button>
      </div>
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={setOpen}>
          <div className="fixed inset-0" />

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 left-0 flex max-w-full pr-10">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-500 sm:duration-700"
                  enterFrom="-translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-500 sm:duration-700"
                  leaveFrom="translate-x-0"
                  leaveTo="-translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen max-w-md">
                    <div className="flex h-full flex-col overflow-hidden bg-white py-6 shadow-xl">
                      <div className="px-4 sm:px-6">
                        <div className="flex items-start justify-between">
                          <Dialog.Title className="text-base font-semibold leading-6 text-gray-900">
                            Dashboard
                          </Dialog.Title>
                          <div className="ml-3 flex h-7 items-center">
                            <button
                              type="button"
                              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                              onClick={() => setOpen(false)}
                            >
                              <span className="sr-only">Close panel</span>
                              <X className="h-6 w-6" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>
                      <div className="relative mt-6 flex-1 px-4 sm:px-6">
                        {/* Content */}

                        {friends.length > 0 ? (
                          <div className="text-xs font-semibold leading-6 text-gray-400">
                            Your chats
                          </div>
                        ) : null}

                        <nav className="flex flex-1 flex-col">
                          <ul
                            role="list"
                            className="flex flex-1 flex-col gap-y-7"
                          >
                            <li>
                              <SidebarChatList
                                friends={friends}
                                sessionId={session.user.id}
                              />
                            </li>

                            <li>
                              <div className="text-xs font-semibold leading-6 text-gray-400">
                                Overview
                              </div>
                              <ul role="list" className="-mx-2 mt-2 space-y-1">
                                {sidebarOptions.map((option) => {
                                  const Icon = Icons[option.Icon];
                                  return (
                                    <li key={option.name}>
                                      <Link
                                        href={option.href}
                                        className="text-gray-700 hover:text-indigo-600 hover:bg-gray-50 group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                                      >
                                        <span className="text-gray-400 border-gray-200 group-hover:border-indigo-600 group-hover:text-indigo-600 flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border text-[0.625rem] font-medium bg-white">
                                          <Icon className="h-4 w-4" />
                                        </span>
                                        <span className="truncate">
                                          {option.name}
                                        </span>
                                      </Link>
                                    </li>
                                  );
                                })}

                                <li>
                                  <FriendRequestSidebarOptions
                                    initialUnseenRequestCount={
                                      unseenRequestCountState
                                    }
                                    sessionId={session.user.id}
                                  />
                                </li>
                              </ul>
                            </li>

                            <li className="-ml-6 mt-auto flex items-center">
                              <div className="flex flex-1 items-center gap-x-4 px-6 py-3 text-sm font-semibold leading-6 text-gray-900">
                                <div className="relative h-8 w-8 bg-gray-50">
                                  <Image
                                    fill
                                    referrerPolicy="no-referrer"
                                    className="rounded-full"
                                    src={session.user.image || ""}
                                    alt="Your profile picture"
                                  />
                                </div>

                                <span className="sr-only">Your profile</span>
                                <div className="flex flex-col">
                                  <span aria-hidden="true">
                                    {session.user.name}
                                  </span>
                                  <span
                                    className="text-xs text-zinc-400"
                                    aria-hidden="true"
                                  >
                                    {session.user.email}
                                  </span>
                                </div>
                              </div>

                              <SignOutButton />
                            </li>
                          </ul>
                        </nav>

                        {/* content end */}
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );
};

export default MobileChatLayout;
