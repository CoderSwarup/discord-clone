import { NextApiRequest } from "next";
import { CurrentProfilePages } from "@/lib/current-profile-pages";
import { db } from "@/lib/db";
import { NextApiResponseServerIO } from "../../../../../types";
import { redisPublisher, redisSubcriber } from "@/lib/redis";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const profile = await CurrentProfilePages(req);
    const { content, fileUrl } = req.body;
    const { serverId, channelId } = req.query;

    if (!profile) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }
    if (!serverId) {
      return res.status(400).json({
        error: "Server Id Missing",
      });
    }
    if (!channelId) {
      return res.status(400).json({
        error: "Channel Id Missing",
      });
    }
    if (!content) {
      return res.status(400).json({
        error: "Content Missing",
      });
    }
    const server = await db.server.findFirst({
      where: {
        id: serverId as string,
        members: {
          some: {
            profileId: profile.id,
          },
        },
      },
      include: {
        members: true,
      },
    });

    if (!server) {
      return res.status(404).json({ error: "Server not found" });
    }

    const channel = await db.channel.findFirst({
      where: {
        id: channelId as string,
        serverId: serverId as string,
      },
    });

    if (!server) {
      return res.status(404).json({ error: "Channel not found" });
    }

    const member = server.members.find(
      (member) => member.profileId === profile.id
    );

    if (!member) {
      return res.status(404).json({ error: "Member not found" });
    }

    const message = await db.message.create({
      data: {
        content,
        fileUrl: fileUrl as string,
        channelId: channelId as string,
        memberId: member.id,
      },
      include: {
        member: {
          include: {
            profile: true,
          },
        },
      },
    });

    const channelKey = `chat:${channelId}:messages`;
    try {
      await redisPublisher.publish(
        "MESSAGES",
        JSON.stringify({ socketEmmitKey: channelKey, message })
      );
    } catch (publishError) {
      console.error("Redis publish failed:", publishError);
      res?.socket?.server?.io?.emit(channelKey, message);
    }

    return res.status(200).json(message);
  } catch (error) {
    console.log("[MESSAGES_POST] ", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
