"use client"

import React, { useState, useEffect, useRef } from "react"
import { useAuth } from "../lib/auth-context"
import { useCart } from "../lib/cart-context"
import { ChatMessage, EmbeddedProduct } from "../lib/types"
import { formatRupiah } from "../lib/db"
import { useRouter } from "next/navigation"
import {
  MessageSquare,
  X,
  Send,
  Image as ImageIcon,
  ShoppingBag,
  Zap,
  Mail,
  Check,
  CheckCheck,
  ArrowRight,
  Sparkles,
} from "lucide-react"

export default function ChatWidget() {
  const { user, isLoggedIn, loginWithGmail } = useAuth()
  const { addItem } = useCart()
  const router = useRouter()

  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [text, setText] = useState("")
  const [uploadingImage, setUploadingImage] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Gmail input for guest
  const [tempEmail, setTempEmail] = useState("")
  const [tempName, setTempName] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Poll conversation when open or check unread
  useEffect(() => {
    if (!user?.email) return

    const fetchChat = async () => {
      try {
        const res = await fetch(`/api/chat?email=${encodeURIComponent(user.email)}`)
        if (res.ok) {
          const data = await res.json()
          if (data && data.messages) {
            setMessages(data.messages)
            // Count unread admin messages
            const unread = data.messages.filter(
              (m: ChatMessage) => m.sender === "admin" && !m.read
            ).length
            setUnreadCount(unread)
          }
        }
      } catch (err) {
        console.error("Chat polling error", err)
      }
    }

    fetchChat()
    const interval = setInterval(fetchChat, isOpen ? 3000 : 8000)
    return () => clearInterval(interval)
  }, [user?.email, isOpen])

  // Mark as read when opened
  useEffect(() => {
    if (isOpen && user?.email && unreadCount > 0) {
      fetch("/api/chat", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerEmail: user.email, reader: "customer" }),
      })
      setUnreadCount(0)
    }
    if (isOpen) {
      scrollToBottom()
    }
  }, [isOpen, user?.email, messages.length])

  // Send Text Message
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!text.trim() || !user?.email) return

    const outgoingText = text.trim()
    setText("")

    // Optimistic UI update
    const optimisticMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      sender: "customer",
      senderName: user.name || "Customer",
      text: outgoingText,
      timestamp: new Date().toISOString(),
      read: false,
    }
    setMessages((prev) => [...prev, optimisticMsg])
    scrollToBottom()

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail: user.email,
          customerName: user.name,
          sender: "customer",
          senderName: user.name,
          text: outgoingText,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        if (data.message) {
          setMessages((prev) =>
            prev.map((m) => (m.id === optimisticMsg.id ? data.message : m))
          )
        }
      }
    } catch (err) {
      console.error("Failed to send message", err)
    }
  }

  // Upload Picture in Chat
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user?.email) return

    setUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (uploadRes.ok) {
        const uploadData = await uploadRes.json()
        const imageUrl = uploadData.url

        // Send chat message with image
        await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerEmail: user.email,
            customerName: user.name,
            sender: "customer",
            senderName: user.name,
            text: text.trim() || "Sent an image",
            imageUrl,
          }),
        })

        setText("")
        // Refresh
        const refresh = await fetch(`/api/chat?email=${encodeURIComponent(user.email)}`)
        if (refresh.ok) {
          const d = await refresh.json()
          setMessages(d.messages || [])
        }
        scrollToBottom()
      }
    } catch (err) {
      alert("Failed to upload image")
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // CTA Action: Buy embedded product directly
  const handleCtaBuyNow = (product: EmbeddedProduct) => {
    addItem({
      id: product.magazineId,
      title: product.title,
      issueNumber: product.issueNumber,
      coverImage: product.coverImage,
      price: product.price,
      categoryId: "general",
      categoryName: "Magazine",
      description: "",
      created_at: new Date().toISOString(),
    })
    setIsOpen(false)
    router.push("/cart")
  }

  return (
    <>
      {/* Floating Chat Trigger Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-4 rounded-full bg-slate-900 hover:bg-indigo-600 text-white shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center border-2 border-white/20"
          aria-label="Open Customer Chat"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              <MessageSquare className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[11px] font-extrabold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow">
                  {unreadCount}
                </span>
              )}
            </>
          )}
        </button>
      </div>

      {/* Chat Window Drawer / Modal */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[92vw] sm:w-[400px] h-[550px] max-h-[80vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="bg-slate-950 text-white p-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow">
                  DP
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-950 rounded-full" />
              </div>

              <div>
                <h3 className="font-bold text-sm leading-snug">
                  DigitalPitstop Support
                </h3>
                <p className="text-[11px] text-emerald-400 font-medium flex items-center space-x-1">
                  <span>Store Owner Online</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Body */}
          {!isLoggedIn ? (
            /* Prompt to Login with Gmail to Chat */
            <div className="flex-1 p-6 flex flex-col justify-center items-center text-center space-y-4 bg-slate-50">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">
                  Sign in with Gmail to Chat
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  Connect directly with the store owner to ask questions, request issues, or get payment help.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!tempEmail) return
                  loginWithGmail(tempEmail, tempName)
                }}
                className="w-full space-y-2.5 pt-2"
              >
                <input
                  type="email"
                  required
                  placeholder="yourname@gmail.com"
                  value={tempEmail}
                  onChange={(e) => setTempEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                />
                <input
                  type="text"
                  placeholder="Your Name (Optional)"
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs transition shadow"
                >
                  Start Live Chat
                </button>
              </form>
            </div>
          ) : (
            /* Message Stream */
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50">
              {/* Initial Welcome */}
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3 text-center space-y-1">
                <p className="text-xs font-bold text-indigo-950 flex items-center justify-center space-x-1">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Welcome, {user?.name || "Subscriber"}!</span>
                </p>
                <p className="text-[11px] text-indigo-800/80 leading-relaxed font-light">
                  Ask us anything about magazine releases, QRIS verification, or custom requests.
                </p>
              </div>

              {messages.map((msg) => {
                const isMe = msg.sender === "customer"

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                  >
                    <span className="text-[10px] text-slate-400 mb-0.5 px-1 font-medium">
                      {isMe ? "You" : "Store Owner"}
                    </span>

                    <div
                      className={`max-w-[85%] rounded-2xl p-3 text-xs shadow-sm space-y-2.5 ${
                        isMe
                          ? "bg-slate-900 text-white rounded-br-sm"
                          : "bg-white text-slate-900 border border-slate-200 rounded-bl-sm"
                      }`}
                    >
                      {/* Uploaded Picture Attachment */}
                      {msg.imageUrl && (
                        <div className="rounded-xl overflow-hidden border border-slate-200/40 bg-black/10">
                          <img
                            src={msg.imageUrl}
                            alt="Uploaded attachment"
                            className="w-full max-h-48 object-cover rounded-lg cursor-pointer hover:opacity-95 transition"
                            onClick={() => window.open(msg.imageUrl, "_blank")}
                          />
                        </div>
                      )}

                      {/* Text */}
                      {msg.text && (
                        <p className="leading-relaxed whitespace-pre-wrap">
                          {msg.text}
                        </p>
                      )}

                      {/* Embedded Product with High-Converting Call To Action */}
                      {msg.productEmbed && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2.5 text-slate-900 text-left mt-1 shadow-sm">
                          <div className="flex space-x-2.5 items-start">
                            {/* 3:4 Cover Art */}
                            <div className="w-14 aspect-[3/4] rounded-lg overflow-hidden bg-slate-900 flex-shrink-0 shadow relative">
                              <img
                                src={msg.productEmbed.coverImage}
                                alt={msg.productEmbed.title}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            <div className="flex-1 min-w-0">
                              {msg.productEmbed.issueNumber && (
                                <span className="text-[10px] font-bold text-indigo-600 block">
                                  {msg.productEmbed.issueNumber}
                                </span>
                              )}
                              <h4 className="font-bold text-xs text-slate-900 line-clamp-2">
                                {msg.productEmbed.title}
                              </h4>
                              <div className="font-extrabold text-sm text-slate-900 mt-1">
                                {formatRupiah(msg.productEmbed.price)}
                              </div>
                            </div>
                          </div>

                          {/* HIGH-CONVERTING CTA BUTTON */}
                          <button
                            onClick={() => handleCtaBuyNow(msg.productEmbed!)}
                            className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-600/20 active:scale-[0.98] transition"
                          >
                            <Zap className="w-3.5 h-3.5 fill-current" />
                            <span>Buy Issue Now with QRIS</span>
                            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                          </button>
                        </div>
                      )}

                      <div
                        className={`text-[9px] flex items-center justify-end space-x-1 pt-0.5 ${
                          isMe ? "text-slate-400" : "text-slate-400"
                        }`}
                      >
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isMe && (
                          <CheckCheck
                            className={`w-3 h-3 ${
                              msg.read ? "text-sky-400" : "text-slate-400"
                            }`}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
              <div ref={messagesEndRef} />
            </div>
          )}

          {/* Footer Input Bar */}
          {isLoggedIn && (
            <div className="p-3 bg-white border-t border-slate-200">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                {/* Hidden File Input for Picture Upload */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
                  title="Upload picture / screenshot"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>

                <input
                  type="text"
                  placeholder={uploadingImage ? "Uploading image..." : "Type your message..."}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={uploadingImage}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />

                <button
                  type="submit"
                  disabled={!text.trim() || uploadingImage}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-300 text-white transition shadow"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  )
}
