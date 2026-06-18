import { auth } from "@/app/api/auth/[...nextauth]/route"
import { pusherServer } from "@/lib/pusherServer"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.text()
    const params = new URLSearchParams(body)
    const socketId = params.get("socket_id")!
    const channel = params.get("channel_name")!

    // tell pusher who this user is
    const authResponse = pusherServer.authorizeChannel(socketId, channel, {
      user_id: session.user.id,
      user_info: {
        name: session.user.name,
        image: session.user.image
      }
    })

    return NextResponse.json(authResponse)
  } catch (error) {
    console.error("POST /api/pusher/auth error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}