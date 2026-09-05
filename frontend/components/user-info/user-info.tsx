"use client";

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSelector } from "../../store/hooks";

const UserInfo = () => {
  const auth = useAppSelector((state) => state.auth);

  const username = auth?.user?.email;
  const role = auth?.user?.role;

  return (
    <div className="flex items-center gap-2">
      <Avatar size="lg">
        <AvatarImage
          src={`https://api.dicebear.com/10.x/loops/svg?seed=${username}`}
          alt={username ?? "User"}
        />
        <AvatarFallback>
          {username?.charAt(0).toUpperCase() ?? "U"}
        </AvatarFallback>
        <AvatarBadge className="bg-green-600 dark:bg-green-800" />
      </Avatar>

      {/* User information */}
      <div className="flex flex-col justify-center items-start gap-1 ml-2">
        {username ? (
          <span className="text-lg font-medium leading-none">{username}</span>
        ) : (
          <Skeleton className="h-5 w-45" />
        )}

        {role ? (
          <span className="text-xs font-medium leading-none text-muted-foreground">
            {role}
          </span>
        ) : (
          <Skeleton className="h-5 w-25" />
        )}
      </div>
    </div>
  );
};

export default UserInfo;
