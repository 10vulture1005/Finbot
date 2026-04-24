"use client";
import { useEffect, useState, useRef, useCallback } from "react";
import { C1Chat, useThreadListManager, useThreadManager } from "@thesysai/genui-sdk";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  getThreadList,
  createThread,
  deleteThread,
  updateThread,
  getUIThreadMessages,
  updateMessage,
} from "@/app/services/threadService";

export default function ChatPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);
  // Read token synchronously so apiUrl is stable from the very first render.
  const [authToken] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token") ||
        ""
      );
    }
    return "";
  });

  // Set the cookie for the Next.js API route
  useEffect(() => {
    if (authToken) {
      document.cookie = `finbot_token=${authToken}; path=/; SameSite=Lax`;
    }
  }, [authToken]);

  if (!isMounted) return null;

  return <ChatInner authToken={authToken} />;
}

function ChatInner({ authToken }: { authToken: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fetchThreadListFn = useCallback(() => getThreadList(), []);
  const createThreadFn = useCallback((m: any) => createThread(m), []);
  const onSelectThreadFn = useCallback((id: string) => {
    router.replace(`${pathname}?threadId=${id}`);
  }, [pathname, router]);
  const onSwitchToNewFn = useCallback(() => router.replace(pathname), [pathname, router]);

  const threadListManager = useThreadListManager({
    fetchThreadList: fetchThreadListFn,
    createThread: createThreadFn,
    deleteThread,
    updateThread,
    onSelectThread: onSelectThreadFn,
    onSwitchToNew: onSwitchToNewFn,
  });

  const loadThreadFn = useCallback((id: string) => getUIThreadMessages(id), []);
  const onUpdateMessageFn = useCallback(({ message }: { message: any }) => {
    updateMessage(threadListManager.selectedThreadId!, message);
  }, [threadListManager.selectedThreadId]);

  const threadManager = useThreadManager({
    threadListManager,
    loadThread: loadThreadFn,
    onUpdateMessage: onUpdateMessageFn,
    apiUrl: `/api/chat${authToken ? `?token=${authToken}` : ""}`,
  });

  // Keep a stable ref to threadListManager so the URL-sync effect
  // doesn't re-fire on every SDK state update.
  const threadListRef = useRef(threadListManager);
  useEffect(() => {
    threadListRef.current = threadListManager;
  }, [threadListManager]);

  // Initial load
  const hasLoadedRef = useRef(false);
  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      threadListRef.current?.load();
    }
  }, []);

  // Sync URL → thread selection (only when the URL actually changes)
  useEffect(() => {
    const mgr = threadListRef.current;
    const urlThreadId = searchParams.get("threadId");
    console.log("[page.tsx] URL changed. urlThreadId:", urlThreadId, "mgr.selectedThreadId:", mgr.selectedThreadId);
    
    if (urlThreadId && urlThreadId !== mgr.selectedThreadId) {
      console.log("[page.tsx] -> Calling mgr.selectThread(urlThreadId)");
      mgr.selectThread?.(urlThreadId);
    } else if (!urlThreadId && mgr.selectedThreadId) {
      console.log("[page.tsx] -> Calling mgr.switchToNewThread()");
      mgr.switchToNewThread?.();
    }
  }, [searchParams]);

  const C1ChatAny = C1Chat as any;

  return (
    <div className="flex h-100vh w-full overflow-hidden bg-background">
      <div
        className="
          relative flex flex-1 overflow-hidden
          sm:m-3 sm:rounded-xl sm:border sm:border-border sm:shadow-md
          animate-in fade-in slide-in-from-bottom-2 duration-700
        "
      >
        <C1ChatAny
          threadManager={threadManager}
          threadListManager={threadListManager}
          theme={{ mode: "dark" }}
          sidebarCollapsible
          sidebarBreakpoint="sm"
          className="h-full w-full"
        />
      </div>
    </div>
  );
}