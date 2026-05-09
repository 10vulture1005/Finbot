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

  // ─── Thread List Manager ─────────────────────────────────────────────
  const fetchThreadListFn = useCallback(() => getThreadList(), []);
  const createThreadFn = useCallback(async (m: any) => {
    const result = await createThread(m);
    // After creating, update URL to include the new threadId
    router.replace(`${pathname}?threadId=${result.threadId}`);
    return result;
  }, [pathname, router]);

  const onSelectThreadFn = useCallback((id: string) => {
    router.replace(`${pathname}?threadId=${id}`);
  }, [pathname, router]);

  const onSwitchToNewFn = useCallback(() => {
    router.replace(pathname);
  }, [pathname, router]);

  const threadListManager = useThreadListManager({
    fetchThreadList: fetchThreadListFn,
    createThread: createThreadFn,
    deleteThread,
    updateThread,
    onSelectThread: onSelectThreadFn,
    onSwitchToNew: onSwitchToNewFn,
  });

  // ─── Thread Manager ──────────────────────────────────────────────────
  const loadThreadFn = useCallback(async (id: string) => {
    console.log(`[ChatPage] loadThread called for: ${id}`);
    const messages = await getUIThreadMessages(id);
    console.log(`[ChatPage] Loaded ${messages.length} messages for thread ${id}`);
    return messages;
  }, []);

  const onUpdateMessageFn = useCallback(({ message }: { message: any }) => {
    const selectedId = threadListManager.selectedThreadId;
    if (selectedId) {
      updateMessage(selectedId, message);
    }
  }, [threadListManager.selectedThreadId]);

  // Build the apiUrl with both the token AND the current threadId
  // so the API route can save messages to the correct Firestore thread
  const currentThreadId = threadListManager.selectedThreadId;
  const apiUrl = `/api/chat?token=${authToken}${currentThreadId ? `&threadId=${currentThreadId}` : ''}`;

  const threadManager = useThreadManager({
    threadListManager,
    loadThread: loadThreadFn,
    onUpdateMessage: onUpdateMessageFn,
    apiUrl,
  });

  // ─── Thread List Refs ────────────────────────────────────────────────
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
    
    if (urlThreadId && urlThreadId !== mgr.selectedThreadId) {
      mgr.selectThread?.(urlThreadId);
    } else if (!urlThreadId && mgr.selectedThreadId) {
      mgr.switchToNewThread?.();
    }
  }, [searchParams]);

  // ─── Auto-select the most recent thread on first load ────────────────
  const hasAutoSelectedRef = useRef(false);
  useEffect(() => {
    const urlThreadId = searchParams.get("threadId");
    
    // Only auto-select if no thread is specified in the URL and we haven't already
    if (!urlThreadId && !hasAutoSelectedRef.current && threadListManager.threads) {
      const threads = threadListManager.threads as any[];
      if (threads.length > 0) {
        hasAutoSelectedRef.current = true;
        const mostRecent = threads[0]; // Already sorted newest first
        if (mostRecent?.threadId) {
          router.replace(`${pathname}?threadId=${mostRecent.threadId}`);
        }
      }
    }
  }, [threadListManager.threads, searchParams, pathname, router]);

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