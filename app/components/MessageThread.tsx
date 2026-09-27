"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUserContext } from "@/app/context/UserContext";
import { Send, Loader2 } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface MessageThreadProps {
  conversationId: Id<"conversations">;
}

export function MessageThread({
  conversationId,
}: MessageThreadProps): React.JSX.Element {
  const currentUser = useUserContext();
  const messages = useQuery(api.messages.getMessages, { conversationId });
  const sendMessage = useMutation(api.messages.sendMessage);

  const [draft, setDraft] = useState<string>("");
  const [isSending, setIsSending] = useState<boolean>(false);

  async function handleSend(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) return;

    setIsSending(true);
    setDraft("");
    try {
      await sendMessage({ conversationId, body: trimmed });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {messages === undefined && (
          <div className="flex justify-center py-8 text-gray-400">
            <Loader2 className="animate-spin" />
          </div>
        )}
        {messages?.map((message) => {
          const isMine = message.senderId === currentUser?._id;
          return (
            <div
              key={message._id}
              className={`flex ${isMine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  isMine
                    ? "bg-rose-600 text-white"
                    : "bg-gray-100 text-black dark:bg-gray-800 dark:text-white"
                }`}
              >
                {message.body}
              </div>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={handleSend}
        className="flex gap-2 border-t border-gray-200 p-3 dark:border-gray-800"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
        />
        <button
          type="submit"
          disabled={isSending || !draft.trim()}
          className="rounded-full bg-rose-600 p-2 text-white hover:bg-rose-500 disabled:opacity-50"
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
