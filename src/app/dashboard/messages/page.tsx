"use client";

import { useEffect, useState, useRef, Suspense, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

type Message = {
  id: string;
  content: string;
  fromUserId: string;
  toUserId: string;
  read: boolean;
  createdAt: string;
  replyToId?: string | null;
  replyTo?: {
    id: string;
    content: string;
    fromUser: {
      name: string | null;
      email: string;
    };
  } | null;
  fromUser: {
    id: string;
    name: string | null;
    email: string;
  };
};

type Partner = {
  id: string;
  name: string | null;
  email: string;
};

function MessagesContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const fetchPartners = useCallback(async () => {
    try {
      const res = await fetch("/api/connections");
      if (res.ok) {
        const connections = await res.json();
        const acceptedConnections = connections.filter((c: any) => c.status === "ACCEPTED");
        const partnersList = acceptedConnections.map((c: any) => {
          const currentUserId = session?.user?.id;
          return c.fromUser.id === currentUserId ? c.toUser : c.fromUser;
        });
        
        // Remove duplicates based on user ID
        const uniquePartners = Array.from(
          new Map(partnersList.map((p: Partner) => [p.id, p])).values()
        ) as Partner[];
        
        setPartners(uniquePartners);
      }
    } catch (error) {
      console.error("Error fetching partners:", error);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchPartners();
  }, [fetchPartners]);

  const fetchMessages = useCallback(async () => {
    if (!selectedPartner) return;

    try {
      const res = await fetch(`/api/messages?partnerId=${selectedPartner.id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  }, [selectedPartner]);

  useEffect(() => {
    const partnerId = searchParams.get("partnerId");
    if (partnerId && partners.length > 0) {
      const partner = partners.find((p) => p.id === partnerId);
      if (partner) {
        setSelectedPartner(partner);
      }
    }
  }, [searchParams, partners]);

  useEffect(() => {
    if (selectedPartner) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
      return () => clearInterval(interval);
    }
  }, [selectedPartner, fetchMessages]);

  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages, shouldAutoScroll]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };


  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
      setShouldAutoScroll(isNearBottom);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedPartner) return;

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId: selectedPartner.id,
          content: newMessage,
          replyToId: replyingTo?.id || undefined,
        }),
      });

      if (res.ok) {
        setNewMessage("");
        setReplyingTo(null);
        setShouldAutoScroll(true);
        fetchMessages();
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleSendReminder = async (habitId: string) => {
    if (!selectedPartner) return;

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toUserId: selectedPartner.id,
          content: "🔔 Reminder: Don't forget to complete your habits today!",
        }),
      });

      if (res.ok) {
        setShouldAutoScroll(true);
        fetchMessages();
      }
    } catch (error) {
      console.error("Error sending reminder:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="retro-text-muted uppercase tracking-widest animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <h1 className="retro-heading text-2xl mb-6 flex-shrink-0">
        Messages
      </h1>

      {partners.length === 0 ? (
        <div className="retro-panel p-12 text-center">
          <p className="retro-text-muted uppercase tracking-wider">
            No partners yet. Add connections to start messaging!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-hidden">
          {/* Partners List */}
          <div className="retro-panel flex flex-col overflow-hidden">
            <h2 className="retro-subheading text-sm p-4 border-b-2 border-[color:var(--border)] flex-shrink-0">
              Partners
            </h2>
            <div className="overflow-y-auto flex-1 divide-y-2 divide-[color:var(--border)]">
              {partners.map((partner) => (
                <button
                  key={partner.id}
                  onClick={() => setSelectedPartner(partner)}
                  className={`w-full text-left p-4 uppercase tracking-wider font-bold text-xs transition-all hover-lift ${
                    selectedPartner?.id === partner.id
                      ? "bg-[color:var(--text)] text-[color:var(--background)]"
                      : "hover:bg-[color:var(--surface-alt)]"
                  }`}
                >
                  <div className="font-black">{partner.name || "Partner"}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="md:col-span-2 retro-panel flex flex-col overflow-hidden">
            {selectedPartner ? (
              <>
                {/* Header */}
                <div className="p-4 border-b-2 border-[color:var(--border)] flex-shrink-0">
                  <h3 className="retro-subheading text-sm">
                    {selectedPartner.name || "Partner"}
                  </h3>
                </div>

                {/* Messages */}
                <div 
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto p-4 space-y-4 bg-[color:var(--surface-alt)]"
                >
                  {messages.map((message) => {
                    const isOwn = message.fromUserId === session?.user?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"} group`}
                      >
                        <div className="flex flex-col gap-2 max-w-xs md:max-w-md">
                          {/* Reply Quote */}
                          {message.replyTo && (
                            <div className={`text-xs px-3 py-2 border-l-4 border-[color:var(--border)] uppercase tracking-wide ${
                              isOwn
                                ? "bg-[color:var(--text)] text-[color:var(--background)]"
                                : "bg-[color:var(--surface)] retro-text-muted"
                            }`}>
                              <div className="font-black">{message.replyTo.fromUser.name || message.replyTo.fromUser.email}</div>
                              <div className="truncate opacity-75">{message.replyTo.content}</div>
                            </div>
                          )}
                          
                          {/* Main Message */}
                          <div
                            className={`px-4 py-3 border-2 border-[color:var(--border)] font-semibold tracking-wide ${
                              isOwn
                                ? "bg-[color:var(--text)] text-[color:var(--background)]"
                                : "bg-[color:var(--surface)]"
                            }`}
                          >
                            <p className="break-words">{message.content}</p>
                            <p className={`text-[0.65rem] mt-2 uppercase tracking-widest ${isOwn ? "opacity-60" : "retro-text-muted"}`}>
                              {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className={`flex gap-2 text-xs opacity-0 group-hover:opacity-100 transition ${isOwn ? "justify-end" : "justify-start"}`}>
                            <button
                              onClick={() => setReplyingTo(message)}
                              className="retro-button-outline px-3 py-1 text-[0.65rem]"
                            >
                              ↩️ Reply
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  await fetch("/api/messages", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                      toUserId: selectedPartner?.id,
                                      content: `[Forwarded] ${message.content}`,
                                    }),
                                  });
                                  setShouldAutoScroll(true);
                                  fetchMessages();
                                } catch (error) {
                                  console.error("Error forwarding message:", error);
                                  alert("Failed to forward message");
                                }
                              }}
                              className="retro-button-outline px-3 py-1 text-[0.65rem]"
                            >
                              📤 Forward
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Preview */}
                {replyingTo && (
                  <div className="px-4 pt-3 pb-2 border-t-2 border-[color:var(--border)] bg-[color:var(--surface-alt)] flex items-center justify-between">
                    <div className="text-xs uppercase tracking-wide">
                      <div className="font-black">Replying to {replyingTo.fromUser.name || replyingTo.fromUser.email}</div>
                      <div className="retro-text-muted truncate text-[0.65rem] mt-1">{replyingTo.content}</div>
                    </div>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="retro-button-outline px-2 py-1 ml-3 text-xs"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t-2 border-[color:var(--border)] flex-shrink-0">
                    <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="TYPE A MESSAGE..."
                      className="retro-input flex-1 py-3 text-xs"
                      maxLength={1000}
                      autoComplete="off"
                    />

                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="retro-button px-6 py-3 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center retro-text-muted uppercase tracking-widest text-sm">
                Select a partner to start messaging
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


export default function MessagesPage() {
  return (
    <Suspense fallback={<div className='flex items-center justify-center h-64'><div className='text-gray-600 dark:text-gray-400'>Loading...</div></div>}>
      <MessagesContent />
    </Suspense>
  );
}
