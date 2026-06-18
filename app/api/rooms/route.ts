import { auth } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const rooms = await prisma.room.findMany({
      where: {
        members: {
          some: {
            userId: session.user.id
          }
        }
      },
      include: {
        members: true,
        _count: {
          select: { messages: true }
        }
      }
    })

    return NextResponse.json(rooms)
  } catch (error) {
    console.error("GET /api/rooms error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { name } = await req.json()

    const room = await prisma.room.create({
      data: {
        name,
        members: {
          create: {
            userId: session.user.id
          }
        }
      }
    })

    return NextResponse.json(room)
  } catch (error) {
    console.error("POST /api/rooms error:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}