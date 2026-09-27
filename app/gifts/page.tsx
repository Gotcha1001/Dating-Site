"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { GIFT_CATALOG } from "@/convex/gifts";
import { Loader2 } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";

function gift(giftId: string) {
  return GIFT_CATALOG.find((g) => g.id === giftId);
}

function GiftRow({
  transaction,
}: {
  transaction: Doc<"giftTransactions">;
}): React.JSX.Element {
  const definition = gift(transaction.giftId);
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-800">
      <span className="text-2xl">{definition?.emoji ?? "🎁"}</span>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{definition?.name ?? transaction.giftId}</p>
        {transaction.message && (
          <p className="truncate text-xs text-gray-400">
            &ldquo;{transaction.message}&rdquo;
          </p>
        )}
      </div>
      <span className="text-xs text-gray-400">
        {new Date(transaction.createdAt).toLocaleDateString()}
      </span>
    </div>
  );
}

export default function GiftsPage(): React.JSX.Element {
  const received = useQuery(api.gifts.getGiftsReceived, {});
  const sent = useQuery(api.gifts.getGiftsSent, {});

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <h1 className="text-2xl font-semibold">Gifts</h1>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-500">Received</h2>
        {received === undefined ? (
          <Loader2 className="animate-spin text-gray-400" />
        ) : received.length === 0 ? (
          <p className="text-sm text-gray-400">No gifts yet.</p>
        ) : (
          <div className="space-y-2">
            {received.map((t) => (
              <GiftRow key={t._id} transaction={t} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm font-semibold text-gray-500">Sent</h2>
        {sent === undefined ? (
          <Loader2 className="animate-spin text-gray-400" />
        ) : sent.length === 0 ? (
          <p className="text-sm text-gray-400">
            You haven&apos;t sent any gifts yet.
          </p>
        ) : (
          <div className="space-y-2">
            {sent.map((t) => (
              <GiftRow key={t._id} transaction={t} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
