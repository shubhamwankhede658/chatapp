import { auth } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { roomId } = await req.json()

    // check if room exists
    const room = await prisma.room.findUnique({
      where: { id: roomId }
    })

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 })
    }

    // check if user is already a member
    const existingMember = await prisma.roomMember.findUnique({
      where: {
        userId_roomId: {
          userId: session.user.id,
          roomId
        }
      }
    })

    // if already member just return the room
    if (existingMember) {
      return NextResponse.json(room)
    }

    // add user to room
    await prisma.roomMember.create({
      data: {
        userId: session.user.id,
        roomId
      }
    })

    return NextResponse.json(room)
  } catch (error) {
    console.error("POST /api/rooms/join error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}