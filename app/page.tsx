import { auth } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function Home() {
  const session = await auth()

  if (session) {
    redirect("/chat")
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          ChatApp
        </h1>
        <p className="text-gray-400 mb-8">
          Real time chat with your friends
        </p>
        <Link
          href="/api/auth/signin"
          className="bg-white text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition"
        >
          Sign in with Google
        </Link>
      </div>
    </main>
  )
}