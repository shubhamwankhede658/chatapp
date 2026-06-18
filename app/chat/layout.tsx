import { auth } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"

export default async function ChatLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/")
  }

  return (
    <div className="flex h-screen bg-gray-950 w-full justify-center">
      <div className="flex w-full max-w-6xl">
        {children}
      </div>
    </div>
  )
}