"use client";

import { Plus } from "lucide-react";
import { Button } from "./ui/button";
import { useRouter } from "next/navigation";

interface SidebarAddFriendProps{
  friend: User
}

const SidebarAddFriend = ({friend}:SidebarAddFriendProps) => {
  const router = useRouter();
  return (
    <Button
      aria-label="accept friend"
      className="w-6 h-6 bg-indigo-500 hover:bg-indigo-600 rounded-full p-0"
      onClick={() => {
        router.push(`/dashboard/add?senderId=${friend.email}`)
      }}
    >
      <Plus className="font-semibold text-white h-4 w-4" />
    </Button>
  );
}

export default SidebarAddFriend