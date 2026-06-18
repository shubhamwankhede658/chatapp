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

    const { roomId, body } = await req.json()

    // save message to database
    const message = await prisma.message.create({
      data: {
        body,
        roomId,
        userId: session.user.id
      },
      include: { user: true }
    })

    // send message to all users in room via pusher
    await pusherServer.trigger(`room-${roomId}`, "new-message", message)

    return NextResponse.json(message)
  } catch (error) {
    console.error("POST /api/messages error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}