"use client";

import { useEffect, useState, useRef, Suspense, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";

type Message = {
  id: string;
  content: string;
  voiceUrl?: string | null;
  duration?: number | null;
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
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const [recordDuration, setRecordDuration] = useState(0);
  const recordTimerRef = useRef<number | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
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
        setPartners(partnersList);
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

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Your browser does not support audio recording");
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      recordedChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.addEventListener("dataavailable", (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunksRef.current.push(e.data);
        }
      });

      mediaRecorder.addEventListener("stop", () => {
        // stop all tracks
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recordedChunksRef.current, { type: recordedChunksRef.current[0]?.type || "audio/webm" });
        uploadVoiceMessage(blob, recordDuration);
        setIsRecording(false);
        if (recordTimerRef.current) {
          window.clearInterval(recordTimerRef.current);
          recordTimerRef.current = null;
        }
        setRecordDuration(0);
      });

      mediaRecorder.start();
      setIsRecording(true);
      // start duration timer
      setRecordDuration(0);
      recordTimerRef.current = window.setInterval(() => {
        setRecordDuration((d) => d + 1000);
      }, 1000);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Failed to start recording");
    }
  };

  const stopRecording = () => {
    const mediaRecorder = mediaRecorderRef.current;
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
  };

  const uploadVoiceMessage = async (blob: Blob, durationMs: number) => {
    if (!selectedPartner) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const form = new FormData();
      form.append("file", blob, "voice.webm");
      form.append("toUserId", selectedPartner.id);
      form.append("duration", String(durationMs));
      if (replyingTo?.id) form.append("replyToId", replyingTo.id);

      const xhr = new XMLHttpRequest();

      // Track upload progress
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(percent);
        }
      });

      await new Promise<void>((resolve, reject) => {
        xhr.addEventListener("load", () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
          }
        });

        xhr.addEventListener("error", () => {
          reject(new Error("Network error during upload"));
        });

        xhr.addEventListener("abort", () => {
          reject(new Error("Upload cancelled"));
        });

        xhr.open("POST", "/api/messages/voice");
        xhr.send(form);
      });

      setReplyingTo(null);
      setShouldAutoScroll(true);
      await fetchMessages();
    } catch (error) {
      console.error("Error uploading voice message:", error);
      alert(`Failed to send voice message: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
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
    <div className="flex flex-col h-full overflow-hidden">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6 flex-shrink-0">
        Messages
      </h1>

      {partners.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">
            No partners yet. Add connections to start messaging!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-hidden">
          {/* Partners List */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col overflow-hidden">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white p-4 flex-shrink-0">
              Partners
            </h2>
            <div className="overflow-y-auto flex-1 px-4 pb-4 space-y-2">
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
          <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-md flex flex-col overflow-hidden">
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
                  className="flex-1 overflow-y-auto p-4 space-y-4"
                >
                  {messages.map((message) => {
                    const isOwn = message.fromUserId === session?.user?.id;
                    return (
                      <div
                        key={message.id}
                        className={`flex ${isOwn ? "justify-end" : "justify-start"} group`}
                      >
                        <div className="flex flex-col gap-1 max-w-xs md:max-w-md">
                          {/* Reply Quote */}
                          {message.replyTo && (
                            <div className={`text-xs px-3 py-2 rounded border-l-4 ${
                              isOwn
                                ? "bg-indigo-700 border-indigo-500 text-indigo-100"
                                : "bg-gray-100 dark:bg-gray-600 border-gray-400 text-gray-600 dark:text-gray-300"
                            }`}>
                              <div className="font-semibold">{message.replyTo.fromUser.name || message.replyTo.fromUser.email}</div>
                              <div className="truncate">{message.replyTo.content}</div>
                            </div>
                          )}
                          
                          {/* Main Message */}
                          <div
                            className={`px-4 py-2 rounded-lg ${
                              isOwn
                                ? "bg-indigo-600 text-white"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white"
                            }`}
                          >
                            {message.voiceUrl ? (
                              <div className="space-y-2">
                                <audio src={message.voiceUrl} controls className="w-full" />
                                {message.content && <p className="break-words">{message.content}</p>}
                                <p className={`text-xs mt-1 ${isOwn ? "text-indigo-200" : "text-gray-500 dark:text-gray-400"}`}>
                                  {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                  {message.duration ? ` • ${Math.floor((message.duration || 0)/1000)}s` : ""}
                                </p>
                              </div>
                            ) : (
                              <>
                                <p className="break-words">{message.content}</p>
                                <p className={`text-xs mt-1 ${isOwn ? "text-indigo-200" : "text-gray-500 dark:text-gray-400"}`}>
                                  {new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </>
                            )}
                          </div>

                          {/* Action Buttons */}
                          <div className={`flex gap-2 text-xs opacity-0 group-hover:opacity-100 transition ${isOwn ? "justify-end" : "justify-start"}`}>
                            <button
                              onClick={() => setReplyingTo(message)}
                              className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                            >
                              ↩️ Reply
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  if (message.voiceUrl) {
                                    // Forward voice message: download and re-upload
                                    const audioRes = await fetch(message.voiceUrl);
                                    if (!audioRes.ok) throw new Error("Failed to download voice message");
                                    const audioBlob = await audioRes.blob();

                                    const form = new FormData();
                                    form.append("file", audioBlob, "voice.webm");
                                    form.append("toUserId", selectedPartner?.id || "");
                                    form.append("duration", String(message.duration || 0));
                                    if (message.content) {
                                      form.append("forwardedContent", `[Forwarded] ${message.content}`);
                                    }

                                    const voiceRes = await fetch("/api/messages/voice", {
                                      method: "POST",
                                      body: form,
                                    });

                                    if (!voiceRes.ok) {
                                      const data = await voiceRes.json();
                                      throw new Error(data.error || "Failed to forward voice message");
                                    }
                                  } else {
                                    // Forward text message
                                    await fetch("/api/messages", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({
                                        toUserId: selectedPartner?.id,
                                        content: `[Forwarded] ${message.content}`,
                                      }),
                                    });
                                  }
                                  setShouldAutoScroll(true);
                                  fetchMessages();
                                } catch (error) {
                                  console.error("Error forwarding message:", error);
                                  alert("Failed to forward message");
                                }
                              }}
                              className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded hover:bg-green-200 dark:hover:bg-green-800"
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
                  <div className="px-4 pt-2 pb-0 border-t dark:border-gray-700 bg-blue-50 dark:bg-blue-900/30 flex items-center justify-between">
                    <div className="text-sm">
                      <div className="font-semibold text-blue-700 dark:text-blue-300">Replying to {replyingTo.fromUser.name || replyingTo.fromUser.email}</div>
                      <div className="text-blue-600 dark:text-blue-400 truncate">{replyingTo.content}</div>
                    </div>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 ml-2"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Input */}
                <form onSubmit={handleSendMessage} className="p-4 border-t dark:border-gray-700 flex-shrink-0 bg-white dark:bg-gray-800">
                    {/* Upload Progress Bar */}
                    {isUploading && (
                      <div className="mb-3 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                    {isUploading && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 text-center">
                        Uploading... {uploadProgress}%
                      </div>
                    )}

                    <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                      disabled={isUploading || isRecording}
                      className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                      maxLength={1000}
                      autoComplete="off"
                    />

                    {/* Record button */}
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={startRecording}
                        disabled={isUploading}
                        title="Record voice message"
                        className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        🎤
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={stopRecording}
                          disabled={isUploading}
                          title="Stop recording"
                          className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          ■
                        </button>
                        <span className="text-xs text-gray-700 dark:text-gray-300">{Math.floor(recordDuration/1000)}s</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={!newMessage.trim() || isUploading || isRecording}
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
