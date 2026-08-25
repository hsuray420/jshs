export type ChatRole = "user" | "assistant";

export type ChatMessage = Readonly<{
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
  sources?: readonly { title: string; url: string; snippet?: string }[];
  action?: { label: string; href: string; reason: string };
  error?: boolean;
}>;

export type ChatConversation = Readonly<{
  id: string;
  title: string;
  messages: readonly ChatMessage[];
  createdAt: number;
  updatedAt: number;
}>;

const DB_NAME = "AIChatDB";
const STORE_NAME = "conversations";
const VERSION = 1;
const CURRENT_KEY = "jshs_ai_current_conversation";

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function canUseIndexedDb() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!canUseIndexedDb()) return reject(new Error("indexeddb_unavailable"));
    const request = window.indexedDB.open(DB_NAME, VERSION);
    request.onerror = () => reject(request.error || new Error("indexeddb_open_failed"));
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
      }
    };
  });
}

async function request<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>) {
  const database = await openDatabase();
  return new Promise<T>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode);
    const result = action(transaction.objectStore(STORE_NAME));
    result.onerror = () => reject(result.error || new Error("indexeddb_request_failed"));
    result.onsuccess = () => resolve(result.result);
    transaction.oncomplete = () => database.close();
    transaction.onerror = () => reject(transaction.error || new Error("indexeddb_transaction_failed"));
  });
}

export async function createConversation(title = "新對話"): Promise<ChatConversation> {
  const now = Date.now();
  const conversation = { id: makeId(), title, messages: [], createdAt: now, updatedAt: now } satisfies ChatConversation;
  if (canUseIndexedDb()) await request("readwrite", (store) => store.add(conversation));
  setCurrentConversationId(conversation.id);
  return conversation;
}

export async function getConversation(id: string) {
  if (!canUseIndexedDb()) return null;
  return (await request<ChatConversation | undefined>("readonly", (store) => store.get(id))) || null;
}

export async function getAllConversations() {
  if (!canUseIndexedDb()) return [];
  const conversations = await request<ChatConversation[]>("readonly", (store) => store.getAll());
  return conversations.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function updateConversation(conversation: ChatConversation) {
  if (canUseIndexedDb()) await request("readwrite", (store) => store.put(conversation));
  setCurrentConversationId(conversation.id);
  return conversation;
}

export async function deleteConversation(id: string) {
  if (canUseIndexedDb()) await request("readwrite", (store) => store.delete(id));
  if (getCurrentConversationId() === id) setCurrentConversationId("");
}

export async function clearAllConversations() {
  if (canUseIndexedDb()) await request("readwrite", (store) => store.clear());
  setCurrentConversationId("");
}

export function getCurrentConversationId() {
  return typeof window === "undefined" ? "" : window.localStorage.getItem(CURRENT_KEY) || "";
}

export function setCurrentConversationId(id: string) {
  if (typeof window !== "undefined") window.localStorage.setItem(CURRENT_KEY, id);
}

export function appendMessage(conversation: ChatConversation, message: ChatMessage) {
  const firstUserMessage = conversation.messages.find((item) => item.role === "user");
  return {
    ...conversation,
    title: firstUserMessage ? conversation.title : message.content.slice(0, 28) || "新對話",
    messages: [...conversation.messages, message],
    updatedAt: Date.now(),
  } satisfies ChatConversation;
}

export function replaceLastMessage(conversation: ChatConversation, message: ChatMessage) {
  return { ...conversation, messages: conversation.messages.map((item, index, all) => index === all.length - 1 ? message : item), updatedAt: Date.now() } satisfies ChatConversation;
}
