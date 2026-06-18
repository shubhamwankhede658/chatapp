import { auth } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { pusherServer } from "@/lib/pusherServer"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { messageId, roomId } = await req.json()

    // mark message as seen
    await prisma.messageSeen.upsert({
      where: {
        userId_messageId: {
          userId: session.user.id,
          messageId
        }
      },
      update: {},
      create: {
        userId: session.user.id,
        messageId
      }
    })

    // tell everyone in room this message was seen
    await pusherServer.trigger(`room-${roomId}`, "message-seen", {
      messageId,
      userId: session.user.id,
      userName: session.user.name
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("POST /api/messages/seen error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}