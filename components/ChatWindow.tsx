"use client"

import { useState, useEffect, useRef } from "react"
import { pusherClient } from "@/lib/pusherClient"

interface User {
  id: string
  name: string | null
  image: string | null
}

interface SeenBy {
  userId: string
  userName: string
}

interface Message {
  id: string
  body: string
  createdAt: string
  user: User
  seenBy?: SeenBy[]
}

interface Room {
  id: string
  name: string
  messages: Message[]
}

interface Props {
  room: Room
  currentUserId: string
}

export default function ChatWindow({ room, currentUserId }: Props) {
  const [messages, setMessages] = useState<Message[]>(room.messages)
  const [newMessage, setNewMessage] = useState("")
  const [isTyping, setIsTyping] = useState<string | null>(null)
  const [onlineUsers, setOnlineUsers] = useState<string[]>([])
const channel = pusherClient.subscribe(`presence-room-${room.id}`)
  const bottomRef = useRef<HTMLDivElement>(null)

  // scroll to bottom when new message comes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // mark all messages as seen when room opens
  useEffect(() => {
    messages.forEach(message => {
      if (message.user.id !== currentUserId) {
        fetch("/api/messages/seen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId: message.id, roomId: room.id })
        })
      }
    })
  }, [room.id])

  // listen for real time events
  useEffect(() => {
    const channel = pusherClient.subscribe(`room-${room.id}`)

    // new message
    channel.bind("new-message", (data: Message) => {
      setMessages(prev => [...prev, data])
      // mark as seen immediately
      if (data.user.id !== currentUserId) {
        fetch("/api/messages/seen", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId: data.id, roomId: room.id })
        })
      }
    })

    // typing indicator
    channel.bind("typing", (data: { userName: string; userId: string }) => {
      if (data.userId !== currentUserId) {
        setIsTyping(data.userName)
        setTimeout(() => setIsTyping(null), 2000)
      }
    })

    // read receipts
    channel.bind("message-seen", (data: { messageId: string; userId: string; userName: string }) => {
      if (data.userId !== currentUserId) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === data.messageId
              ? {
                  ...msg,
                  seenBy: [
                    ...(msg.seenBy || []),
                    { userId: data.userId, userName: data.userName }
                  ]
                }
              : msg
          )
        )
      }
    })

    // when someone joins show them as online
      const presenceChannel = pusherClient.subscribe(`presence-room-${room.id}`) as any

      presenceChannel.bind("pusher:subscription_succeeded", (members: any) => {
        const ids: string[] = []
        members.each((member: any) => ids.push(member.id))
        setOnlineUsers(ids)
      })

      presenceChannel.bind("pusher:member_added", (member: any) => {
        setOnlineUsers(prev => [...prev, member.id])
      })

      presenceChannel.bind("pusher:member_removed", (member: any) => {
        setOnlineUsers(prev => prev.filter(id => id !== member.id))
      })

      return () => {
        pusherClient.unsubscribe(`presence-room-${room.id}`)
      }
  }, [room.id, currentUserId])

  async function handleTyping() {
    await fetch("/api/typing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: room.id })
    })
  }

  async function sendMessage() {
    if (!newMessage.trim()) return

    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: room.id, body: newMessage })
    })

    setNewMessage("")
  }

  return (
    <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
      {/* room name at top */}
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div>
          <h2 className="text-white font-bold"># {room.name}</h2>
          <p className="text-green-400 text-xs">{onlineUsers.length} online</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500 text-xs">Room ID:</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(room.id)
              alert("Room ID copied! Share with friends.")
            }}
            className="text-gray-400 hover:text-white text-xs bg-gray-800 px-2 py-1 rounded"
          >
            {room.id.slice(0, 8)}... 📋
          </button>
        </div>
      </div>

      {/* messages list */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
        {messages.map(message => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.user.id === currentUserId ? "flex-row-reverse" : ""
            }`}
          >
            {/* user image */}
            {message.user.image && (
              <img
                src={message.user.image}
                alt={message.user.name || ""}
                className="w-8 h-8 rounded-full"
              />
            )}

            <div className="flex flex-col gap-1">
              {/* message bubble */}
              <div
                className={`max-w-xs px-4 py-2 rounded-2xl text-sm ${
                  message.user.id === currentUserId
                    ? "bg-white text-black"
                    : "bg-gray-800 text-white"
                }`}
              >
                {message.user.id !== currentUserId && (
                  <p className="text-xs text-gray-400 mb-1">
                    {message.user.name}
                  </p>
                )}
                <p>{message.body}</p>
              </div>

              {/* read receipts - only show for your messages */}
              {message.user.id === currentUserId && message.seenBy && message.seenBy.length > 0 && (
                <p className="text-xs text-gray-500 text-right">
                  Seen by {message.seenBy.map(s => s.userName).join(", ")}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* typing indicator */}
        {isTyping && (
          <p className="text-gray-400 text-sm">{isTyping} is typing...</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* message input */}
      <div className="p-4 border-t border-gray-800 flex gap-2">
        <input
          type="text"
          placeholder={`Message # ${room.name}`}
          value={newMessage}
          onChange={e => {
            setNewMessage(e.target.value)
            handleTyping()
          }}
          onKeyDown={e => e.key === "Enter" && sendMessage()}
          className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-lg outline-none text-sm"
        />
        <button
          onClick={sendMessage}
          className="bg-white text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200"
        >
          Send
        </button>
      </div>
    </div>
  )
}