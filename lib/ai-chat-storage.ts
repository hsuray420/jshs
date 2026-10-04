export type ChatRole = "user" | "assistant";
export type ChatMessage = Readonly<{ id: string; conversationId?: string; role: ChatRole; content: string; createdAt: number; status?: "pending" | "streaming" | "complete" | "error"; sources?: readonly { title: string; url: string; snippet?: string }[]; action?: { label: string; href: string; reason: string }; error?: boolean }>;
export type ChatConversation = Readonly<{ id: string; title: string; messages: readonly ChatMessage[]; createdAt: number; updatedAt: number }>;
let currentConversationId = "";
const memoryConversations = new Map<string, ChatConversation>();
function makeId() { return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`; }
export async function createConversation(title = "新對話"): Promise<ChatConversation> { const now = Date.now(); const conversation = { id: makeId(), title, messages: [], createdAt: now, updatedAt: now } satisfies ChatConversation; memoryConversations.set(conversation.id, conversation); setCurrentConversationId(conversation.id); return conversation; }
export async function getConversation(id: string) { return memoryConversations.get(id) || null; }
export async function getAllConversations() { return [...memoryConversations.values()].sort((a, b) => b.updatedAt - a.updatedAt); }
export async function updateConversation(conversation: ChatConversation) { memoryConversations.set(conversation.id, conversation); setCurrentConversationId(conversation.id); return conversation; }
export async function deleteConversation(id: string) { memoryConversations.delete(id); if (currentConversationId === id) currentConversationId = ""; }
export async function clearAllConversations() { memoryConversations.clear(); currentConversationId = ""; }
export function getCurrentConversationId() { return currentConversationId; }
export function setCurrentConversationId(id: string) { currentConversationId = id; }
export function appendMessage(conversation: ChatConversation, message: ChatMessage) { const firstUserMessage = conversation.messages.find((item) => item.role === "user"); return { ...conversation, title: firstUserMessage ? conversation.title : message.content.slice(0, 28) || "新對話", messages: [...conversation.messages, message], updatedAt: Date.now() } satisfies ChatConversation; }
export function replaceLastMessage(conversation: ChatConversation, message: ChatMessage) { return { ...conversation, messages: conversation.messages.map((item, index, all) => index === all.length - 1 ? message : item), updatedAt: Date.now() } satisfies ChatConversation; }
export function replaceMessage(conversation: ChatConversation, message: ChatMessage) { return { ...conversation, messages: conversation.messages.map((item) => item.id === message.id ? message : item), updatedAt: Date.now() } satisfies ChatConversation; }
export function removeMessage(conversation: ChatConversation, id: string) { return { ...conversation, messages: conversation.messages.filter((item) => item.id !== id), updatedAt: Date.now() } satisfies ChatConversation; }
