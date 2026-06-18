import { auth } from "@/app/api/auth/[...nextauth]/route"
import { pusherServer } from "@/lib/pusherServer"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { roomId } = await req.json()

    // tell everyone in room that this user is typing
    await pusherServer.trigger(`room-${roomId}`, "typing", {
      userId: session.user.id,
      userName: session.user.name
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("POST /api/typing error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}