import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Shared gender/preference vocabulary used on profiles.
const genderValidator = v.union(
  v.literal("male"),
  v.literal("female"),
  v.literal("non_binary"),
);

export default defineSchema({
  // Kept from the previous project — unchanged.
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    role: v.union(v.literal("admin"), v.literal("user")),
    createdAt: v.number(),
    // NEW
    appearance: v.optional(
      v.object({
        accent: v.string(),
        rainMode: v.string(),
        rainDensity: v.number(),
        rainSpeed: v.number(),
        rainOpacity: v.number(),
        glow: v.boolean(),
      }),
    ),
  }).index("by_clerk_id", ["clerkId"]),

  // One row per user, created by the "join" / onboarding form.
  profiles: defineTable({
    userId: v.id("users"),
    displayName: v.string(),
    age: v.number(),
    gender: genderValidator,
    seekingGenders: v.array(genderValidator),
    bio: v.string(),
    // photos[0] is the main photo. publicId is kept alongside the URL so a
    // removed/replaced photo can be deleted from Cloudinary, not just unlinked.
    photos: v.array(v.object({ url: v.string(), publicId: v.string() })),
    city: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    coins: v.number(), // spendable balance used to send gifts
    isOnboarded: v.boolean(),
    lastActiveAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_gender", ["gender"]),

  // One row per pair of users who have exchanged at least one message.
  conversations: defineTable({
    userAId: v.id("users"),
    userBId: v.id("users"),
    lastMessageAt: v.number(),
    lastMessagePreview: v.optional(v.string()),
    hiddenFor: v.optional(v.array(v.id("users"))), // NEW
  })
    .index("by_userA", ["userAId"])
    .index("by_userB", ["userBId"])
    .index("by_pair", ["userAId", "userBId"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.id("users"),
    body: v.string(),
    createdAt: v.number(),
    readAt: v.optional(v.number()),
    deletedFor: v.optional(v.array(v.id("users"))), // NEW
  })
    .index("by_conversation", ["conversationId"])
    .index("by_conversation_unread", ["conversationId", "readAt"]),

  // giftTransactions — add seenAt + index
  giftTransactions: defineTable({
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    giftId: v.string(),
    coinCost: v.number(),
    message: v.optional(v.string()),
    createdAt: v.number(),
    seenAt: v.optional(v.number()), // set when the recipient opens /gifts
  })
    .index("by_recipient", ["toUserId"])
    .index("by_sender", ["fromUserId"])
    .index("by_recipient_unseen", ["toUserId", "seenAt"]),

  // Ownership record for every Cloudinary asset a user uploads, so a delete
  // request can be verified as belonging to the caller before we actually
  // remove it from Cloudinary — independent of whether it's been saved onto
  // a profile yet (photos can be deleted mid-onboarding, pre-save).
  uploadedAssets: defineTable({
    userId: v.id("users"),
    publicId: v.string(),
    createdAt: v.number(),
  })
    .index("by_public_id", ["publicId"])
    .index("by_user", ["userId"]),

  // A video-call request/booking between two users, backed by a LiveKit room.
  callSessions: defineTable({
    requesterId: v.id("users"),
    recipientId: v.id("users"),
    roomName: v.string(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined"),
      v.literal("ended"),
    ),
    scheduledFor: v.optional(v.number()), // omitted = "call now" request
    createdAt: v.number(),
  })
    .index("by_recipient", ["recipientId"])
    .index("by_requester", ["requesterId"])
    .index("by_recipient_status", ["recipientId", "status"]),

  likes: defineTable({
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_sender", ["fromUserId"])
    .index("by_recipient", ["toUserId"])
    .index("by_pair", ["fromUserId", "toUserId"]),
  // convex/schema.ts  --  ADD these two tables inside defineSchema({ ... }),
  // next to giftTransactions / likes. Nothing existing changes.

  // One row per "Buy tokens" click. Created (pending) by the checkout route
  // BEFORE the user is sent to PayFast; the row id is what we send PayFast as
  // m_payment_id, so the ITN webhook can find it again with no parsing.
  tokenPurchases: defineTable({
    userId: v.id("users"),
    packageId: v.string(),
    tokens: v.number(),
    priceCents: v.number(),
    status: v.union(v.literal("pending"), v.literal("paid")),
    createdAt: v.number(),
    paidAt: v.optional(v.number()),
    payfastPaymentId: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_payfastPaymentId", ["payfastPaymentId"]),

  // Anything PayFast told us about that we could NOT turn into tokens
  // (failed/cancelled ITN, amount mismatch). Same shape as the resort site.
  failedPayments: defineTable({
    paymentId: v.string(),
    purchaseId: v.optional(v.id("tokenPurchases")),
    status: v.string(),
    amount: v.number(),
    reason: v.string(),
    timestamp: v.number(),
    resolved: v.boolean(),
  }),
});
