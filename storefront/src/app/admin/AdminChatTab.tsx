"use client"

import React, { useState, useEffect, useRef } from "react"
import { Conversation, ChatMessage, Magazine, EmbeddedProduct } from "../../lib/types"
import { formatRupiah } from "../../lib/db"
import {
  MessageSquare,
  Send,
  Image as ImageIcon,
  ShoppingBag,
  User,
  Clock,
  CheckCheck,
  Search,
  RefreshCw,
  Plus,
  Sparkles,
  Zap,
  X,
  ExternalLink,
} from "lucide-react"

export default function AdminChatTab({ magazines }: { magazines: Magazine[] }) {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null)
  const [text, setText] = useState("")
  const [loading, setLoading] = useState(true)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [productSearch, setProductSearch] = useState("")

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const activeConv = conversations.find(
    (c) => c.customerEmail.toLowerCase() === selectedEmail?.toLowerCase()
  )

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  // Fetch all conversations
  const fetchConversations = async () => {
    try {
      const res = await fetch("/api/chat")
      if (res.ok) {
        const data: Conversation[] = await res.json()
        setConversations(data)
        if (!selectedEmail && data.length > 0) {
          setSelectedEmail(data[0].customerEmail)
        }
      }
    } catch (e) {
      console.error("Failed to load conversations", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchConversations()
    const interval = setInterval(fetchConversations, 3000)
    return () => clearInterval(interval)
  }, [])

  // Mark as read when selected
  useEffect(() => {
    if (selectedEmail) {
      fetch("/api/chat", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerEmail: selectedEmail, reader: "admin" }),
      })
    }
    scrollToBottom()
  }, [selectedEmail, activeConv?.messages.length])

  // Send Text Message as Admin
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!text.trim() || !selectedEmail) return

    const outgoing = text.trim()
    setText("")

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail: selectedEmail,
          sender: "admin",
          senderName: "Store Owner (DigitalPitstop)",
          text: outgoing,
        }),
      })
      if (res.ok) {
        fetchConversations()
        scrollToBottom()
      }
    } catch (e) {
      console.error("Failed to send reply", e)
    }
  }

  // Upload Picture as Admin
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !selectedEmail) return

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

        await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerEmail: selectedEmail,
            sender: "admin",
            senderName: "Store Owner (DigitalPitstop)",
            text: text.trim() || "Sent an image",
            imageUrl: uploadData.url,
          }),
        })

        setText("")
        fetchConversations()
        scrollToBottom()
      }
    } catch (e) {
      alert("Failed to upload image")
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  // Embed Magazine Product Card with CTA into Chat
  const handleEmbedProduct = async (mag: Magazine) => {
    if (!selectedEmail) return

    setShowProductModal(false)

    try {
      const productEmbed: EmbeddedProduct = {
        magazineId: mag.id,
        title: mag.title,
        issueNumber: mag.issueNumber,
        coverImage: mag.coverImage,
        price: mag.price,
      }

      await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerEmail: selectedEmail,
          sender: "admin",
          senderName: "Store Owner (DigitalPitstop)",
          text: `Check out this digital issue: ${mag.title}`,
          productEmbed,
        }),
      })

      fetchConversations()
      scrollToBottom()
    } catch (e) {
      alert("Failed to embed magazine")
    }
  }

  const filteredMagazines = magazines.filter((m) =>
    m.title.toLowerCase().includes(productSearch.toLowerCase())
  )

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden grid grid-cols-1 md:grid-cols-12 min-h-[620px]">
      {/* Left Column: Conversations List */}
      <div className="md:col-span-4 border-r border-slate-200 flex flex-col bg-slate-50/50">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              Customer Chats
            </h3>
            <p className="text-[11px] text-slate-500">
              {conversations.length} active customer thread(s)
            </p>
          </div>
          <button
            onClick={fetchConversations}
            className="p-1.5 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-200 transition"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Conversations Scrollable List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
          {conversations.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 space-y-1">
              <MessageSquare className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p>No customer chats yet.</p>
              <p className="text-[10px]">
                When customers chat using their Gmail, conversations appear here.
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              const isSelected =
                conv.customerEmail.toLowerCase() === selectedEmail?.toLowerCase()
              const lastMsg = conv.messages[conv.messages.length - 1]
              const unreadFromCustomer = conv.messages.filter(
                (m) => m.sender === "customer" && !m.read
              ).length

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelectedEmail(conv.customerEmail)}
                  className={`w-full p-4 text-left transition flex items-start space-x-3 ${
                    isSelected ? "bg-indigo-50/70 border-r-2 border-indigo-600" : "hover:bg-slate-100/60"
                  }`}
                >
                  <div className="w-9 h-9 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {conv.customerName.charAt(0).toUpperCase()}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs text-slate-900 truncate">
                        {conv.customerName}
                      </h4>
                      {unreadFromCustomer > 0 && (
                        <span className="bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                          {unreadFromCustomer}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 font-mono truncate">
                      {conv.customerEmail}
                    </p>
                    {lastMsg && (
                      <p className="text-[11px] text-slate-500 truncate mt-1">
                        {lastMsg.productEmbed
                          ? `🛍️ Embedded: ${lastMsg.productEmbed.title}`
                          : lastMsg.imageUrl
                          ? "📷 [Image attached]"
                          : lastMsg.text}
                      </p>
                    )}
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* Right Column: Chat Room & Tools */}
      <div className="md:col-span-8 flex flex-col h-[620px] bg-white">
        {activeConv ? (
          <>
            {/* Chat Room Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-black text-xs flex items-center justify-center shadow">
                  {activeConv.customerName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    {activeConv.customerName}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono">
                    {activeConv.customerEmail}
                  </p>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowProductModal(true)}
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition"
                  title="Embed a magazine issue with CTA into this chat"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Embed Magazine (CTA)</span>
                </button>
              </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50/50">
              {activeConv.messages.map((msg) => {
                const isAdmin = msg.sender === "admin"

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                  >
                    <span className="text-[10px] text-slate-400 mb-0.5 px-1 font-medium">
                      {isAdmin ? "You (Store Owner)" : activeConv.customerName}
                    </span>

                    <div
                      className={`max-w-[80%] rounded-2xl p-3 text-xs shadow-sm space-y-2.5 ${
                        isAdmin
                          ? "bg-slate-900 text-white rounded-br-sm"
                          : "bg-white text-slate-900 border border-slate-200 rounded-bl-sm"
                      }`}
                    >
                      {/* Uploaded Image */}
                      {msg.imageUrl && (
                        <div className="rounded-xl overflow-hidden border border-slate-200/40 bg-black/10">
                          <img
                            src={msg.imageUrl}
                            alt="Attachment"
                            className="w-full max-h-56 object-cover rounded-lg cursor-pointer hover:opacity-95 transition"
                            onClick={() => window.open(msg.imageUrl, "_blank")}
                          />
                        </div>
                      )}

                      {/* Text Message */}
                      {msg.text && (
                        <p className="leading-relaxed whitespace-pre-wrap">
                          {msg.text}
                        </p>
                      )}

                      {/* Embedded Magazine Card with High-Converting CTA */}
                      {msg.productEmbed && (
                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2 text-slate-900 text-left shadow-sm">
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
                              <div className="font-extrabold text-sm text-slate-900 mt-0.5">
                                {formatRupiah(msg.productEmbed.price)}
                              </div>
                            </div>
                          </div>

                          <div className="w-full py-1.5 px-3 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-[11px] text-center flex items-center justify-center space-x-1">
                            <Zap className="w-3 h-3 fill-current" />
                            <span>Customer Call-To-Action: Buy with QRIS</span>
                          </div>
                        </div>
                      )}

                      {/* Timestamp & Read Checkmark */}
                      <div className="text-[9px] flex items-center justify-end space-x-1 pt-0.5 text-slate-400">
                        <span>
                          {new Date(msg.timestamp).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {isAdmin && (
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

            {/* Input Bar */}
            <div className="p-3 bg-white border-t border-slate-200">
              <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />

                {/* Upload Image Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingImage}
                  className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
                  title="Upload picture / screenshot to chat (S3 / Storage)"
                >
                  <ImageIcon className="w-5 h-5" />
                </button>

                {/* Embed Product Button */}
                <button
                  type="button"
                  onClick={() => setShowProductModal(true)}
                  className="p-2 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl transition"
                  title="Embed Magazine with CTA"
                >
                  <ShoppingBag className="w-5 h-5" />
                </button>

                {/* Text Input */}
                <input
                  type="text"
                  placeholder={
                    uploadingImage
                      ? "Uploading image..."
                      : `Reply to ${activeConv.customerName}...`
                  }
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={uploadingImage}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={!text.trim() || uploadingImage}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-indigo-600 disabled:bg-slate-300 text-white transition shadow"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400 text-xs space-y-2">
            <MessageSquare className="w-10 h-10 text-slate-300" />
            <p>Select a customer conversation from the left to start chatting.</p>
          </div>
        )}
      </div>

      {/* Embed Product Modal */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Embed Magazine Issue into Chat
                </h3>
                <p className="text-xs text-slate-500">
                  Select a digital magazine to send an interactive card with a 1-click CTA button to the customer.
                </p>
              </div>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search issues by title..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            {/* Magazines Grid / List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {filteredMagazines.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No magazines found matching your search.
                </div>
              ) : (
                filteredMagazines.map((mag) => (
                  <div
                    key={mag.id}
                    className="p-3 rounded-xl border border-slate-200 hover:border-indigo-500 bg-white hover:bg-indigo-50/30 transition flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      {/* 3:4 Cover Art */}
                      <div className="w-12 aspect-[3/4] rounded-lg overflow-hidden bg-slate-900 flex-shrink-0 shadow relative">
                        <img
                          src={mag.coverImage}
                          alt={mag.title}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="min-w-0">
                        {mag.issueNumber && (
                          <span className="text-[10px] font-bold text-indigo-600 uppercase block">
                            {mag.issueNumber}
                          </span>
                        )}
                        <h4 className="font-bold text-xs text-slate-900 truncate">
                          {mag.title}
                        </h4>
                        <div className="text-xs font-extrabold text-slate-900 mt-0.5">
                          {formatRupiah(mag.price)}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleEmbedProduct(mag)}
                      className="whitespace-nowrap px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition shadow flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Embed CTA</span>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
