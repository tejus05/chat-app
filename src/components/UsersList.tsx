import { chatHrefConstructor } from "@/lib/utils";
import { Contact, User, UserCheck } from "lucide-react";
import { Session } from "next-auth";
import Link from "next/link";
import SidebarAddFriend from "./SidebarAddFriend";
import { fetchRedis } from "./helpers/redis";

interface UsersListProps{
  session: Session,
  friends: User[]
}

const UsersList = async ({session,friends}:UsersListProps) => {

  const usersRaw = (await fetchRedis("smembers", "users")) as string[];
  const users = usersRaw.map((user) => JSON.parse(user)) as User[];

   const nonFriendUsers = users.filter(
     (user) => !friends.some((friend) => friend.id === user.id)
   );

  return (
    <ul
      role="list"
      className="max-h-[25rem] overflow-y-auto mx-2 mt-5 space-y-1"
    >
      <div className="text-sm font-semibold leading-6 text-gray-400">Users</div>
      <li className="flex items-center gap-3 pt-2">
        <UserCheck className="h-4 w-4" />
        {session.user.name}
        <span className="-ml-2 font-semibold text-sm text-black/50">(you)</span>
      </li>
      {friends.map((friend) => (
        <li key={friend.id}>
          <Link
            href={`/dashboard/chat/${chatHrefConstructor(
              session.user.id,
              friend.id
            )}`}
            className="flex items-center gap-3 py-2 hover:underline transition"
          >
            <Contact className="h-4 w-4" />
            {friend.name}
          </Link>
        </li>
      ))}
      {nonFriendUsers
        .filter((user) => user.id !== session.user.id)
        .map((user) => (
          <li key={user.id} className="flex items-center gap-3 py-2">
            <User className="h-4 w-4" />
            {user.name}
            <SidebarAddFriend
              friend={user}
            />
          </li>
        ))}
    </ul>
  );
}

export default UsersList