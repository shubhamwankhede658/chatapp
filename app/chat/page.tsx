import { auth } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import Sidebar from "../../components/Sidebar";

export default async function ChatPage() {
  const session = await auth()

  if (!session) {
    redirect("/")
  }

  return (
    <>
      <Sidebar />
      <div className="flex-1 flex items-center justify-center">
        <p className="text-gray-400">
          Select a room or create a new one
        </p>
      </div>
    </>
  )
}