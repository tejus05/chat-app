"use client";

import { Loader2, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "./ui/button";
import ActionTooltip from "./ActionTooltip";
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

const SignOutButton = () => {
  const [isSigningOut, setIsSigningOut] = useState<boolean>(false);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <AlertDialog>
      <ActionTooltip label="Logout" align="start" side="top">
        <AlertDialogTrigger asChild>
          <Button className="h-full aspect-square" variant="ghost">
            {isSigningOut ? (
              <Loader2 className="animate-spin h-4 w-4" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
          </Button>
        </AlertDialogTrigger>
      </ActionTooltip>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Logout</AlertDialogTitle>
          <AlertDialogDescription>
            Do you want to logout?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={async () => {
              setIsSigningOut(true);
              try {
                await signOut();
              } catch (error) {
                toast.error("There was a problem signing out");
              } finally {
                setIsSigningOut(false);
              }
            }}
          >
            Logout
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SignOutButton;
