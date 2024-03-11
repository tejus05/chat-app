"use client";

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
import { cn, toPusherKey } from "@/lib/utils";
import { Check, Edit, Trash } from "lucide-react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Input } from "./ui/input";
import { useOnClickOutside } from "./hooks/useOnClickOutside";
import axios from "axios";
import { pusherClient } from "@/lib/pusher";

interface MessageProps {
  message: Message;
  isCurrentUser: boolean;
  hasNextMessageFromSameUser: boolean;
  chatPartner: User;
  sessionImage: string;
  chatId: string;
}
const formSchema = z.object({
  content: z.string().min(1),
});

type TFormSchema = z.infer<typeof formSchema>;

const formatTimestamp = (timestamp: number) => {
  return format(timestamp, "HH:mm");
};

const MessageElement = ({
  message,
  hasNextMessageFromSameUser,
  isCurrentUser,
  chatPartner,
  sessionImage,
  chatId,
}: MessageProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [chatIdState, setChatIdState] = useState(chatId);
  const [messageState, setMessageState] = useState<{
    text: string;
    deleted: boolean;
    id: string;
  }>({
    text: message.text,
    deleted: false,
    id: message.id
  });

  const router = useRouter();

  const inputRef = useRef<HTMLFormElement | null>(null);

  useOnClickOutside(inputRef, () => setIsEditing(false));

  const form = useForm<TFormSchema>({
    defaultValues: {
      content: message.text,
    },
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    pusherClient.subscribe(toPusherKey(`chat:${chatId}:${message.id}`));

    const deleteMessage = ({
      deletedMessageId,
      chatId,
    }: {
      deletedMessageId: string;
      chatId: string;
    }) => {
      if (message.id === deletedMessageId) {
        setMessageState({
          text: "",
          deleted: true,
          id: deletedMessageId
        });
      }
      setChatIdState(chatId);
      router.refresh();
    };

    const editMessage = ({
      messageFromSocket,
      chatId,
    }: {
      messageFromSocket: Message;
      chatId: string;
    }) => {
      console.log(messageFromSocket)
      if (message.id === messageFromSocket.id) {
        setMessageState({
          text: messageFromSocket.text,
          deleted: false,
          id: messageFromSocket.id,
        });
      }
      setChatIdState(chatId);
      router.refresh();
    };

    pusherClient.bind("delete_message", deleteMessage);
    pusherClient.bind("edit_message", editMessage);

    return () => {
      pusherClient.unsubscribe(toPusherKey(`chat:${chatId}:${message.id}`));

      pusherClient.unbind("delete_message", deleteMessage);
      pusherClient.unbind("edit_message", editMessage);
    };
  }, [
    chatIdState,
    setChatIdState,
    chatId,
    message,
    messageState,
    setMessageState,
    router
  ]);

  useEffect(() => {
    form.reset({
      content: message.text,
    });
  }, [message.text, isEditing, form]);

  const {
    formState: { isSubmitting },
    handleSubmit,
  } = form;

  useEffect(() => {
    const handleKeyDown = (event: any) => {
      if (event.key === "Escape" || event.keyCode === 27) {
        setIsEditing(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const onSubmit = async (values: TFormSchema) => {
    try {
      await axios.post("/api/message/edit", {
        text: values.content,
        messageId: message.id,
        chatId,
      });
      setIsEditing(false);
      form.reset();
      router.refresh();
    } catch (error) {
      toast.error("Could not edit the message. Please try again. ");
    }
  };

  return (
    <>
      <div className="chat-message" key={`${message.id}-${message.timestamp}`}>
        <div
          className={cn("flex items-end relative", {
            "justify-end": isCurrentUser,
          })}
        >
          {!messageState.deleted && (
            <>
              <div
                className={cn(
                  "flex flex-col space-y-2 text-base max-w-xs mx-1",
                  {
                    "order-1 items-end": isCurrentUser,
                    "order-2 items-start": !isCurrentUser,
                  }
                )}
              >
                {!isEditing && (
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
                    {messageState.text}{" "}
                    <span className="ml-2 text-xs text-gray-400">
                      {formatTimestamp(message.timestamp)}
                    </span>
                    <span className="flex items-center justify-between mt-2">
                      {isCurrentUser && (
                        <span className="flex flex-row space-x-2">
                          <Button
                            className="p-0 h-4 w-4"
                            variant="link"
                            onClick={() => {
                              setIsEditing(true);
                            }}
                          >
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
                                <AlertDialogTitle>
                                  Delete Message
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  This action cannot be undone. This will
                                  permanently delete the message.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={async () => {
                                    try {
                                      await axios.post(`/api/message/delete`, {
                                        chatId,
                                        messageId: message.id,
                                      });
                                      router.refresh();
                                    } catch (error) {
                                      toast.error(
                                        "Could not delete the message. Please try again. "
                                      );
                                    }
                                  }}
                                >
                                  Delete
                                </AlertDialogAction>
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
                )}

                {isEditing && (
                  <Form {...form}>
                    <form
                      ref={inputRef}
                      onSubmit={handleSubmit(onSubmit)}
                      className="flex items-center w-full gap-x-2 pt-2"
                    >
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <div className="relative w-full">
                                <Input
                                  className="px-4 py-2 rounded-lg inline-block bg-indigo-600 text-white focus-visible:ring-indigo-600 placeholder:text-white/50"
                                  placeholder="Edit message"
                                  {...field}
                                  disabled={isSubmitting}
                                />
                              </div>
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button size="sm" disabled={isSubmitting} type="submit">
                        Save
                      </Button>
                    </form>
                    <span className="text-[10px] mt-1 text-zinc-400 tracking-tighter">
                      To save&#44; press &quot;Enter&quot;&sdot; To cancel&#44;
                      press &quot;Esc&quot; or click anywhere&dot;
                    </span>
                  </Form>
                )}
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
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default MessageElement;
