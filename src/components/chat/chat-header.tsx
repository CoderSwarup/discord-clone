import { Hash } from "lucide-react";
import { MobileToggle } from "../mobile-toggle";
import { UserAvatar } from "../user-avatar";
import { SocketIndicator } from "../socket-indicator";

interface ChatHeaderProps {
  serverId: string;
  name: string;
  type: "channel" | "conversations";
  imageUrl?: string;
}
const ChatHeader = ({ serverId, name, type, imageUrl }: ChatHeaderProps) => {
  return (
    <div className="text-md font-semibold px-3 flex items-center h-12 boarder-neutral-200 dark:border-neutral-800 border-b-2">
      <MobileToggle serverId={serverId} />
      {type === "channel" && (
        <Hash className="w-5 h-5 text-zinc-500 dark:text-zinc-400 mx-2" />
      )}
      {type === "conversations" && (
        <div className="mr-2 ">
          <UserAvatar src={imageUrl} />
        </div>
      )}
      <p className="font-semibold text-md text-black dark:text-white">{name}</p>
      <div className="flex ml-auto items-center">
        <SocketIndicator />
      </div>
    </div>
  );
};

export default ChatHeader;
