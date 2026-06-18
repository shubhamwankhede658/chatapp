import { auth } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Sidebar from "@/components/Sidebar"
import ChatWindow from "@/components/ChatWindow"

interface Props {
  params: Promise<{ roomId: string }>
}

export default async function RoomPage({ params }: Props) {
  const session = await auth()

  if (!session) {
    redirect("/")
  }

  const { roomId } = await params

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    include: {
      messages: {
        include: { user: true },
        orderBy: { createdAt: "asc" }
      }
    }
  })

  if (!room) {
    redirect("/chat")
  }

    return (
      <>
        <Sidebar />
        <ChatWindow
          room={room}
          currentUserId={session.user?.id as string}
        />
      </>
    )
}