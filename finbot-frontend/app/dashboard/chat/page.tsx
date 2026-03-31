"use client";
import { useEffect, useState } from "react";
import { C1Chat } from "@thesysai/genui-sdk";

export default function ChatPage() {
  const [threadId, setThreadId] = useState<string>("");
  const [initialMessages, setInitialMessages] = useState<any[]>([]);
  const [authToken, setAuthToken] = useState<string>("");

  useEffect(() => {
    const token =
      localStorage.getItem("access_token") ||
      sessionStorage.getItem("access_token") ||
      "";
    setAuthToken(token);

    // Also set cookie as a secondary fallback
    if (token) {
      document.cookie = `finbot_token=${token}; path=/; SameSite=Lax`;
    }

    // Fresh thread ID every session
    const freshThreadId = crypto.randomUUID();
    localStorage.setItem("finbot_thread_id", freshThreadId);
    setThreadId(freshThreadId);

    // Init thread — best effort, chat_endpoint will also resolve auth via query param
    fetch(`/api/chat/init`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ threadId: freshThreadId }),
    }).catch((err) => console.error("Chat init failed:", err));
  }, []);

  const C1ChatAny = C1Chat as any;

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
      <div className="flex justify-between items-center bg-card border border-border p-4 rounded-xl shadow-sm shrink-0">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Finbot Assistant</h1>
          <p className="text-sm text-muted-foreground">Powered by Thesys AI.</p>
        </div>
      </div>

      <div className="flex-1 border border-border rounded-xl shadow-sm overflow-hidden relative flex flex-col items-center">
        <div className="w-full h-full flex flex-col relative">
          {threadId && (
            <C1ChatAny
              apiUrl={`/api/chat${authToken ? `?token=${authToken}` : ""}`}
              initialMessages={initialMessages}
              theme={{ mode: "dark" }}
            />
          )}
        </div>
      </div>
    </div>
  );
}