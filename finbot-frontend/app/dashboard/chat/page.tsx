"use client";

import { useEffect, useState } from "react";
import { C1Chat } from "@thesysai/genui-sdk";

export default function ChatPage() {
  const [threadId, setThreadId] = useState<string>("");
  const [initialMessages, setInitialMessages] = useState<any[]>([]);

  useEffect(() => {
    // 1. Get or create threadId
    let storedThreadId = localStorage.getItem("finbot_thread_id");
    if (!storedThreadId) {
      storedThreadId = crypto.randomUUID();
      localStorage.setItem("finbot_thread_id", storedThreadId);
    }
    setThreadId(storedThreadId);

    // 2. Fetch history
    if (storedThreadId) {
         // Use relative URL which goes through Next.js rewrite
        fetch(`/api/chat/${storedThreadId}`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setInitialMessages(data);
                }
            })
            .catch(err => console.error("Failed to load history", err));
    }
  }, []);

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
      
      {/* Header */}
      <div className="flex justify-between items-center bg-card border border-border p-4 rounded-xl shadow-sm shrink-0">
          <div>
              <h1 className="text-xl font-bold tracking-tight">Finbot Assistant</h1>
              <p className="text-sm text-muted-foreground">Powered by Thesys AI.</p>
          </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 border border-border rounded-xl shadow-sm overflow-hidden relative  flex flex-col items-center">
          <div className="w-full h-full flex flex-col relative">
            {threadId && (
                // @ts-ignore
                <C1Chat 
                    apiUrl="/api/chat" 
                    initialMessages={initialMessages}
                    headers={{ "x-finbot-thread-id": threadId }}
                    theme={{ mode: 'dark' }}
                />
            )}
          </div>
      </div>

    </div>
  );
}
