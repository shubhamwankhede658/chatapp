"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { Trash2 } from "lucide-react"

interface Room {
  id: string
  name: string
}

export default function Sidebar() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [newRoomName, setNewRoomName] = useState("")
  const [joinRoomId, setJoinRoomId] = useState("")
  const pathname = usePathname()

  // fetch all rooms when page loads
  useEffect(() => {
    fetch("/api/rooms")
      .then(res => res.json())
      .then(data => setRooms(data))
  }, [])

  // create a new room
  async function createRoom() {
    if (!newRoomName.trim()) return

    const res = await fetch("/api/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newRoomName })
    })

    const room = await res.json()
    setRooms(prev => [...prev, room])
    setNewRoomName("")
  }

  // join an existing room using room id
  async function joinRoom() {
    if (!joinRoomId.trim()) return

    const res = await fetch("/api/rooms/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: joinRoomId })
    })

    if (res.ok) {
      const room = await res.json()
      setRooms(prev => [...prev, room])
      setJoinRoomId("")
    } else {
      alert("Room not found!")
    }
  }

  //delete room function 
  async function deleteRoom(roomId: string) {
    const confirmed = confirm("Are you sure you want to delete this room?")
    if (!confirmed) return

    const res = await fetch(`/api/rooms/${roomId}`, {
      method: "DELETE"
    })

    if (res.ok) {
      setRooms(prev => prev.filter(room => room.id !== roomId))
    }
  }

  return (
    <div className="w-64 bg-gray-900 flex flex-col p-4 gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white">ChatApp</h1>
      <button
        onClick={() => {
          window.location.href = "/api/auth/signout"
        }}
        className="text-gray-400 hover:text-white text-xs"
      >
        Logout
      </button>
      </div>

      {/* room list */}
      <div className="flex flex-col gap-1 flex-1">
        <p className="text-gray-400 text-sm">Rooms</p>
        {rooms.map(room => (
          <div
            key={room.id}
            className={`flex items-center justify-between px-3 py-2 rounded-lg ${
              pathname === `/chat/${room.id}`
                ? "bg-gray-700"
                : "hover:bg-gray-800"
            }`}
          >
            <Link
              href={`/chat/${room.id}`}
              className="text-sm text-gray-400 flex-1"
            >
              # {room.name}
            </Link>
            <button
              onClick={() => deleteRoom(room.id)}
              className="text-gray-600 hover:text-red-400 ml-2"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* create new room */}
      <div className="flex flex-col gap-2">
        <p className="text-gray-400 text-sm">Create Room</p>
        <input
          type="text"
          placeholder="New room name"
          value={newRoomName}
          onChange={e => setNewRoomName(e.target.value)}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm outline-none"
        />
        <button
          onClick={createRoom}
          className="bg-white text-black px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
        >
          Create Room
        </button>

        {/* join existing room */}
        <p className="text-gray-400 text-sm mt-2">Join Room</p>
        <input
          type="text"
          placeholder="Paste room ID to join"
          value={joinRoomId}
          onChange={e => setJoinRoomId(e.target.value)}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg text-sm outline-none"
        />
        <button
          onClick={joinRoom}
          className="bg-indigo-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          Join Room
        </button>
      </div>
    </div>
  )
}