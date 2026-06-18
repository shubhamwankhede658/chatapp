import { auth } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ roomId: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { roomId } = await params

    // delete all messages first
    await prisma.message.deleteMany({
      where: { roomId }
    })

    // delete all members
    await prisma.roomMember.deleteMany({
      where: { roomId }
    })

    // delete the room
    await prisma.room.delete({
      where: { id: roomId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE /api/rooms/[roomId] error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}