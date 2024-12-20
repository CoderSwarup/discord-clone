"use client";
import * as z from "zod";
import qs from "query-string";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Member, MemberRole, Profile } from "@prisma/client";
import { UserAvatar } from "../user-avatar";
import ActionToolTip from "../action-tooltip";
import {
  Edit,
  FileIcon,
  ShieldAlert,
  ShieldCheck,
  Trash,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Form, FormField, FormItem } from "../ui/form";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import axios from "axios";
import { useModal } from "@/hooks/use-model-provider";
import { useParams, useRouter } from "next/navigation";

interface ChatItemProps {
  id: string;
  content: string;
  member: Member & {
    profile: Profile;
  };
  timestamp: string;
  fileUrl: string | null;
  deleted: boolean;
  currentMember: Member;
  isUpdated: boolean;
  socketUrl: string;
  socketQuery: Record<string, string>;
}

const roleIconMap = {
  GUEST: <User className="h-4 w-4 text-green-500" />,
  MODERATOR: <ShieldCheck className="h-4 w-4 text-indigo-500" />,
  ADMIN: <ShieldAlert className="h-4 w-4 text-rose-500" />,
};

const formSchema = z.object({
  content: z.string().min(1),
});

export const ChatItem = ({
  id,
  content,
  member,
  timestamp,
  fileUrl,
  deleted,
  currentMember,
  isUpdated,
  socketUrl,
  socketQuery,
}: ChatItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const { onOpen } = useModal();

  const router = useRouter();
  const params = useParams();

  const [fileType, setFileType] = useState<string>("");

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      content: content,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const url = qs.stringifyUrl({
        url: `${socketUrl}/${id}`,
        query: socketQuery,
      });

      await axios.patch(url, values);
      setIsEditing(false);
    } catch (error) {
      console.log(error);
    }
  };

  const isLoading = form.formState.isSubmitting;

  useEffect(() => {
    const handleKeyDown = (event: any) => {
      if (event.key === "Escape" || event.keyCode === 27) setIsEditing(false);
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    form.reset({
      content: content,
    });
  }, [content]);

  const isAdmin = currentMember.role === MemberRole.ADMIN;
  const isModerator = currentMember.role === MemberRole.MODERATOR;
  const isOwner = currentMember.id === member.id;

  const canDeleteMessage = !deleted && (isAdmin || isModerator || isOwner);
  const canEditMessage = !deleted && isOwner && !fileUrl;

  useEffect(() => {
    const fetchFileType = async () => {
      if (!fileUrl) return;

      try {
        const response = await fetch(fileUrl, { method: "HEAD" });

        const contentType = response.headers.get("Content-Type");

        setFileType(contentType || "unsupported");
      } catch (error) {
        console.error("Error fetching content type:", error);
        setFileType("unsupported");
      }
    };

    fetchFileType();
  }, [fileUrl]);

  const isPdf = fileUrl && fileType === "application/pdf";
  const isImage = !isPdf && fileType.startsWith("image/") && fileUrl;

  const onMemberClick = () => {
    if (member.id === currentMember.id) {
      return;
    }

    router.push(`/server/${params?.serverId}/conversations/${member.id}`);
  };
  return (
    <div className="group relative flex items-center hover:bg-black/5 p-4 transition  w-full">
      <div className=" flex gap-x-2 items-startw-full ">
        <div
          onClick={onMemberClick}
          className="cursor-pointer hover:drop-shadorw-md transition"
        >
          <UserAvatar src={member.profile.imageUrl} />
        </div>
        <div className="flex flex-col w-full ">
          <div className="flex items-center gap-x-2">
            <div className="flex items-center gap-2">
              <p
                onClick={onMemberClick}
                className="font-semibold text-sm hover:underline cursor-pointer transition"
              >
                {member.profile.name}
              </p>
              <ActionToolTip label={member.role} side="right">
                {roleIconMap[member.role]}
              </ActionToolTip>
            </div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {timestamp}
            </span>
          </div>

          {isImage && (
            <a
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative aspect-square rounded-md mt-2 overflow-hidden border flex items-center bg-secondary h-48 w-48"
            >
              <Image
                src={fileUrl}
                fill
                alt={content}
                className="object-cover"
              />
            </a>
          )}

          {isPdf && (
            <div className="relative max-w-400 flex-wrap flex items-center p-2 rounded-md mt-2 bg-background/10">
              <FileIcon className="h-10 w-10 fill-indigo-200 stroke-indigo-400" />
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2   text-sm text-indigo-500 daek:text-indigo-400  hover:underline"
              >
                Pdf File
              </a>
              {/* <iframe
                src={fileUrl}
                style={{ width: "100%", height: "600px" }}
                title="PDF Viewer"
              ></iframe> */}
            </div>
          )}

          {!fileUrl && !isEditing && (
            <p
              className={cn(
                "text-sm text-zinc-600 dark:text-zinc-300 break-words max-w-full",
                deleted &&
                  "italic text-zinc-500 dark:text-zinc-400 text-xs mt-3"
              )}
            >
              {content}
              {isUpdated && !deleted && (
                <span className="text-[10px] mx-2 text-zinc-500 dark:text-zinc-400">
                  (Edited)
                </span>
              )}
            </p>
          )}

          {!fileUrl && isEditing && (
            <Form {...form}>
              <form
                className="flex items-center w-full gap-x-2 pt-2"
                onSubmit={form.handleSubmit(onSubmit)}
              >
                <FormField
                  name="content"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <div className="relative w-full">
                        <Input
                          disabled={isLoading}
                          placeholder="Edited Message"
                          className="p-2 bg-zinc-200/10 dark:bg-zinc-700/75 border-none focus-visible:ring-offset-0 focus-visible:ring-0 text-zinc-600 dark:text-zinc-200 "
                          {...field}
                        />
                      </div>
                    </FormItem>
                  )}
                />

                <Button
                  disabled={isLoading}
                  type="submit"
                  size={"sm"}
                  variant={"primary"}
                >
                  Save
                </Button>
              </form>
              <span className="text-[10px] mt-1 text-zinc-400">
                Press escape to cancel , enter to save
              </span>
            </Form>
          )}
        </div>
      </div>

      {canDeleteMessage && (
        <div className="hidden group-hover:flex bg-transparent  items-center gap-x-2 absolute -top-2 right-5 bg-white dark:bg-zinc-700 border rounded-md">
          {canEditMessage && (
            <ActionToolTip label="Edit">
              <Edit
                onClick={() => setIsEditing(true)}
                className="cursor-pointer bg-transparent ml-auto w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
              />
            </ActionToolTip>
          )}
          <ActionToolTip label="Delete">
            <Trash
              onClick={() =>
                onOpen("deleteMessage", {
                  apiUrl: `${socketUrl}/${id}`,
                  query: socketQuery,
                })
              }
              className="cursor-pointer bg-transparent ml-auto w-4 h-4 text-zinc-500 hover:text-zinc-600 dark:hover:text-zinc-300 transition"
            />
          </ActionToolTip>
        </div>
      )}
    </div>
  );
};
