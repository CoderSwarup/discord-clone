"use client";

import { useSocket } from "./providers/socker-provider";
import { Badge } from "./ui/badge";

export const SocketIndicator = () => {
  const { isConnected } = useSocket();

  if (!isConnected) {
    return (
      <Badge
        variant={"outline"}
        className="text-[8px]  text-center bg-yellow-600 text-white border-none"
      >
        Fallback : Polling Every 1s
      </Badge>
    );
  }

  return (
    <Badge
      variant={"outline"}
      className="text-[8px] text-center bg-emerald-600 text-white border-none"
    >
      Live : Real-Time Updates
    </Badge>
  );
};
