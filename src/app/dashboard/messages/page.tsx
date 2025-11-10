"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

type Message = {
  id: string;
  content: string;
  fromUserId: string;
  toUserId: string;
  read: boolean;
  createdAt: string;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchPartners();
  }, []);

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
  }, [selectedPartner]);

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

  const fetchPartners = async () => {
    try {
      const res = await fetch("/api/connections");
      if (res.ok) {
        const connections = await res.json();
        const acceptedConnections = connections.filter((c: any) => c.status === "ACCEPTED");
        const partnersList = acceptedConnections.map((c: any) => {
          const currentUserId = session?.user?.id;
          return c.fromUser.id === currentUserId ? c.toUser : c.fromUser;
        });
        setPartners(partnersList);
      }
    } catch (error) {
      console.error("Error fetching partners:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
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
        }),
      });

      if (res.ok) {
        setNewMessage("");
        setShouldAutoScroll(true); // Enable auto-scroll when user sends
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
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        Messages
      </h1>

      {partners.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No partners yet. Add connections to start messaging!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 min-h-0">
          {/* Partners List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col max-h-full">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white p-4 pb-2 flex-shrink-0">
              Partners
            </h2>
            <div className="overflow-y-auto flex-1 p-4 pt-2 space-y-2">
              {partners.map((partner) => (
                <button
                  key={partner.id}
                  onClick={() => setSelectedPartner(partner)}
                  className={`w-full text-left p-3 rounded-lg transition ${
                    selectedPartner?.id === partner.id
                      ? "bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300"
                      : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                  }`}
                >
                  <div className="font-medium">{partner.name || "Partner"}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {partner.email}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat Area */}
          <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col max-h-full">
            {selectedPartner ? (
              <>
                {/* Header */}
                <div className="p-4 border-b dark:border-gray-700 flex-shrink-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedPartner.name || selectedPartner.email}
                  </h3>
                </div>

                {/* Messages */}
                <div 
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0"
                >
                  {messages.map((message) => {
                    const isOwn = message.fromUserId === session?.user?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-xs md:max-w-md px-4 py-2 rounded-lg ${
                            isOwn
                              ? "bg-indigo-600 text-white"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                          }`}
                        >
                          <p className="break-words">{message.content}</p>
                          <p
                            className={`text-xs mt-1 ${
                              isOwn ? "text-indigo-200" : "text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {new Date(message.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t dark:border-gray-700 flex-shrink-0">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                      maxLength={1000}
                      autoComplete="off"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-600 dark:text-gray-400">
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
