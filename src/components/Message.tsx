import { Message } from "@/lib/validations/messageValidation";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Check, Edit, Trash } from "lucide-react";

interface MessageProps {
  message: Message;
  isCurrentUser: boolean;
  hasNextMessageFromSameUser: boolean;
  chatPartner: User;
  sessionImage: string;
}

const MessageElement = ({message, hasNextMessageFromSameUser, isCurrentUser, chatPartner, sessionImage}:MessageProps) => {
    const formatTimestamp = (timestamp: number) => {
      return format(timestamp, "HH:mm");
    };
  return (
    <>
      <div className="chat-message" key={`${message.id}-${message.timestamp}`}>
        <div
          className={cn("flex items-end relative", {
            "justify-end": isCurrentUser,
          })}
        >
          <div
            className={cn("flex flex-col space-y-2 text-base max-w-xs mx-1", {
              "order-1 items-end": isCurrentUser,
              "order-2 items-start": !isCurrentUser,
            })}
          >
            <span
              className={cn("px-4 py-2 rounded-lg inline-block", {
                "bg-indigo-600 text-white": isCurrentUser,
                "bg-gray-200 text-gray-900": !isCurrentUser,
                "rounded-br-none": !hasNextMessageFromSameUser && isCurrentUser,
                "rounded-bl-none":
                  !hasNextMessageFromSameUser && !isCurrentUser,
              })}
            >
              {message.text}{" "}
              <span className="ml-2 text-xs text-gray-400">
                {formatTimestamp(message.timestamp)}
              </span>
              <span className="flex items-center justify-between mt-2">
                {isCurrentUser && (
                  <span className="flex flex-row space-x-2">
                    <Button className="p-0 h-4 w-4" variant="link">
                      <Edit className="h-4 w-4 text-white/60" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="p-0 h-4 w-4" variant="link">
                          <Trash className="h-4 w-4 text-white/60" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Message</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently
                            delete the message.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction>Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </span>
                )}
                <span>
                  {isCurrentUser && <Check className="w-4 h-4 ml-auto" />}
                </span>
              </span>
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
              src={isCurrentUser ? (sessionImage as string) : chatPartner.image}
              alt="Profile picture"
              referrerPolicy="no-referrer"
              className="rounded-full"
            />
          </div>
        </div>
      </div>
    </>
  );
}

export default MessageElement