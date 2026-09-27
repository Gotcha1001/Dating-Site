import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireCurrentUser } from "./lib/auth";
import type { Doc, Id } from "./_generated/dataModel";

function sortedPair(
  a: Id<"users">,
  b: Id<"users">,
): [Id<"users">, Id<"users">] {
  return a < b ? [a, b] : [b, a];
}

export const getOrCreateConversation = mutation({
  args: { otherUserId: v.id("users") },
  handler: async (ctx, args): Promise<Id<"conversations">> => {
    const user = await requireCurrentUser(ctx);
    if (user._id === args.otherUserId) {
      throw new Error("You can't start a conversation with yourself");
    }

    const [userAId, userBId] = sortedPair(user._id, args.otherUserId);

    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_pair", (q) =>
        q.eq("userAId", userAId).eq("userBId", userBId),
      )
      .first();

    if (existing) return existing._id;

    return await ctx.db.insert("conversations", {
      userAId,
      userBId,
      lastMessageAt: Date.now(),
      lastMessagePreview: undefined,
    });
  },
});

export interface ConversationSummary {
  conversation: Doc<"conversations">;
  otherUserId: Id<"users">;
}

export const listConversations = query({
  args: {},
  handler: async (ctx): Promise<ConversationSummary[]> => {
    const user = await requireCurrentUser(ctx);

    const asA = await ctx.db
      .query("conversations")
      .withIndex("by_userA", (q) => q.eq("userAId", user._id))
      .collect();
    const asB = await ctx.db
      .query("conversations")
      .withIndex("by_userB", (q) => q.eq("userBId", user._id))
      .collect();

    const combined: ConversationSummary[] = [...asA, ...asB].map((c) => ({
      conversation: c,
      otherUserId: c.userAId === user._id ? c.userBId : c.userAId,
    }));

    combined.sort(
      (a, b) => b.conversation.lastMessageAt - a.conversation.lastMessageAt,
    );
    return combined;
  },
});

export const getMessages = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args): Promise<Doc<"messages">[]> => {
    const user = await requireCurrentUser(ctx);
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");
    if (
      conversation.userAId !== user._id &&
      conversation.userBId !== user._id
    ) {
      throw new Error("You're not part of this conversation");
    }

    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId),
      )
      .collect();
  },
});

export const sendMessage = mutation({
  args: { conversationId: v.id("conversations"), body: v.string() },
  handler: async (ctx, args): Promise<Id<"messages">> => {
    const user = await requireCurrentUser(ctx);
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation) throw new Error("Conversation not found");
    if (
      conversation.userAId !== user._id &&
      conversation.userBId !== user._id
    ) {
      throw new Error("You're not part of this conversation");
    }

    const trimmed = args.body.trim();
    if (!trimmed) throw new Error("Message can't be empty");

    const messageId = await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: user._id,
      body: trimmed,
      createdAt: Date.now(),
      readAt: undefined,
    });

    await ctx.db.patch(args.conversationId, {
      lastMessageAt: Date.now(),
      lastMessagePreview: trimmed.slice(0, 120),
    });

    return messageId;
  },
});
