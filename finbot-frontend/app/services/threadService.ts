import { collection, doc, setDoc, getDoc, getDocs, updateDoc, deleteDoc, query, where, orderBy, writeBatch } from "firebase/firestore";
import { db } from "./firebaseConfig";

/**
 * Decode the user ID from the JWT stored in localStorage/sessionStorage.
 * This avoids depending on Firebase Auth state (auth.currentUser), which
 * can be null on page reload before onAuthStateChanged fires.
 */
function getUserId(): string | null {
  if (typeof window === "undefined") return null;

  const token =
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token");

  if (!token) return null;

  try {
    // JWT structure: header.payload.signature — payload is base64url-encoded JSON
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    // The Python backend uses "sub" as the user identifier
    return decoded.sub || null;
  } catch (e) {
    console.error("[threadService] Failed to decode JWT:", e);
    return null;
  }
}

export async function createThread(messageOrThread: any) {
  const userId = getUserId();
  if (!userId) throw new Error("No authenticated user — no JWT token found");

  const message = typeof messageOrThread === "string" ? messageOrThread : messageOrThread.title || messageOrThread.message || "New Thread";
  // Always generate a new ID for the thread, since messageOrThread is usually the first message!
  const threadId = crypto.randomUUID();
  
  const threadRef = doc(db, "threads", threadId);
  const title = message.substring(0, 50) + (message.length > 50 ? "..." : "");
  const createdAt = new Date();

  await setDoc(threadRef, {
    title,
    userId,
    createdAt: createdAt.toISOString(),
    updatedAt: createdAt.toISOString()
  });

  return { threadId, title, createdAt, id: threadId };
}

export async function getThreadList() {
  const userId = getUserId();
  if (!userId) {
    console.log("[getThreadList] No userId found, returning []");
    return [];
  }

  console.log(`[getThreadList] Querying threads for userId=${userId}`);
  const threadsRef = collection(db, "threads");
  const q = query(threadsRef, where("userId", "==", userId));
  
  try {
    const snapshot = await getDocs(q);
    console.log(`[getThreadList] Found ${snapshot.docs.length} threads`);

    const threads = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        threadId: doc.id,
        title: data.title || "New Thread",
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date()
      };
    });

    // Sort client-side: newest first by createdAt
    threads.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return threads;
  } catch (error) {
    console.error("[getThreadList] FIREBASE ERROR:", error);
    return [];
  }
}

export async function deleteThread(threadId: string) {
  await deleteDoc(doc(db, "threads", threadId));
}

export async function updateThread(t: any) {
  await updateDoc(doc(db, "threads", t.threadId), { title: t.title, updatedAt: new Date().toISOString() });
  return t;
}

export async function addMessages(threadId: string, prompt: any, assistantMessage: any, userId?: string) {
  // Use provided userId, or fall back to client-side JWT decoding
  const resolvedUserId = userId || getUserId() || "unknown";

  const threadRef = doc(db, "threads", threadId);
  const now = new Date().toISOString();

  // Extract user message content for thread title
  const userContent = prompt.content || (typeof prompt === "string" ? prompt : "");
  const title = userContent.substring(0, 50) + (userContent.length > 50 ? "..." : "") || "New Chat";

  // Ensure the thread exists and update its timestamp + title
  await setDoc(threadRef, {
    userId: resolvedUserId,
    title,
    updatedAt: now,
    createdAt: now, // Only set on first write due to merge
  }, { merge: true });

  const messagesRef = collection(db, "threads", threadId, "messages");
  
  const promptId = crypto.randomUUID();
  const assistantMsgId = crypto.randomUUID();

  console.log(`[addMessages] Saving to thread=${threadId}, userId=${resolvedUserId}, title="${title}"`);

  const batch = writeBatch(db);

  batch.set(doc(messagesRef, promptId), {
    role: "user",
    content: userContent,
    createdAt: now,
  });

  batch.set(doc(messagesRef, assistantMsgId), {
    role: "assistant",
    content: assistantMessage.content || "",
    createdAt: now,
  });

  await batch.commit();
  console.log(`[addMessages] ✅ Saved 2 messages to thread=${threadId}`);
}

export async function getUIThreadMessages(threadId: string) {
  console.log(`[getUIThreadMessages] Loading messages for thread=${threadId}`);
  const messagesRef = collection(db, "threads", threadId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"));
  
  try {
    const snapshot = await getDocs(q);
    console.log(`[getUIThreadMessages] Found ${snapshot.docs.length} messages`);

    return snapshot.docs.map(docSnap => {
      const data = docSnap.data();
      const content = data.content || "";

      // SDK Message type: { id: string; role: 'user' | 'assistant'; content?: string }
      return {
        id: docSnap.id,
        role: data.role || "user",
        content,
      };
    });
  } catch (error) {
    console.error("[getUIThreadMessages] FIREBASE ERROR:", error);
    return [];
  }
}

export async function getLLMThreadMessages(threadId: string) {
  const uiMessages = await getUIThreadMessages(threadId);
  return uiMessages.map((msg: any) => ({
    role: msg.role,
    content: typeof msg.message === "string" ? msg.message : (msg.message?.[0]?.text || "")
  }));
}

export async function updateMessage(threadId: string, message: any) {
  if (!message.id) return;
  const msgRef = doc(db, "threads", threadId, "messages", message.id);
  await updateDoc(msgRef, {
    ...message,
    updatedAt: new Date().toISOString()
  });
}
