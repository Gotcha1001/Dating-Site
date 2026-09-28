// app/components/Navbar.tsx
"use client";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Gift, MessageCircle, Phone } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { api } from "@/convex/_generated/api";
import type { IncomingCall } from "@/convex/notifications";
import { useNow } from "@/hooks/useNow";
import { ThemeToggle } from "./ThemeToggle";

// A "call now" request only counts as ringing for this long; after that it's
// treated as a missed request and shows up as a normal (non-flashing) badge.
const RING_WINDOW_MS = 60_000;

function CountBadge({ count }: { count: number }): React.JSX.Element | null {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-600 px-1 text-[11px] font-bold leading-none text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

interface NavIconLinkProps {
  href: string;
  label: string;
  count: number;
  children: React.ReactNode;
}

function NavIconLink({
  href,
  label,
  count,
  children,
}: NavIconLinkProps): React.JSX.Element {
  return (
    <Link
      href={href}
      aria-label={count > 0 ? `${label} (${count})` : label}
      title={label}
      className="relative rounded-full p-2 text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800"
    >
      {children}
      <CountBadge count={count} />
    </Link>
  );
}

function RingingCallButton({
  call,
  extraCount,
}: {
  call: IncomingCall;
  extraCount: number;
}): React.JSX.Element {
  const router = useRouter();
  const respondToCall = useMutation(api.calls.respondToCall);
  const [isJoining, setIsJoining] = useState<boolean>(false);

  async function handleAnswer(): Promise<void> {
    setIsJoining(true);
    try {
      await respondToCall({ callSessionId: call.callSessionId, accept: true });
      router.push(`/call/${call.callSessionId}`);
    } finally {
      setIsJoining(false);
    }
  }

  return (
    <motion.button
      type="button"
      onClick={handleAnswer}
      disabled={isJoining}
      aria-label={`${call.callerName} is calling — answer`}
      title={`${call.callerName} is calling — tap to answer`}
      className="relative flex items-center gap-2 rounded-full bg-green-600 px-3 py-2 text-white shadow-lg shadow-green-600/40 hover:bg-green-500 disabled:opacity-60"
      animate={{ scale: [1, 1.12, 1], rotate: [0, -12, 12, -12, 12, 0] }}
      transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
    >
      <Phone size={18} />
      <span className="hidden max-w-32 truncate text-sm font-semibold sm:inline">
        {call.callerName}
      </span>
      <CountBadge count={extraCount} />
      <span className="pointer-events-none absolute inset-0 animate-ping rounded-full bg-green-500/40" />
    </motion.button>
  );
}

// All three indicators live here so there is a single reactive Convex query.
function NavNotifications(): React.JSX.Element | null {
  const counts = useQuery(api.notifications.getNavCounts);
  const now = useNow(5000);

  if (!counts) return null;

  const ringing = counts.incomingCalls.filter(
    (c) => c.scheduledFor === undefined && now - c.createdAt < RING_WINDOW_MS,
  );
  const otherRequests = counts.incomingCalls.length - ringing.length;

  return (
    <>
      {ringing.length > 0 ? (
        // Newest ringing call is first; extra ringing calls show as a badge.
        <RingingCallButton call={ringing[0]} extraCount={ringing.length - 1} />
      ) : (
        otherRequests > 0 && (
          <NavIconLink
            href="/calls"
            label="Call requests"
            count={otherRequests}
          >
            <Phone size={20} />
          </NavIconLink>
        )
      )}
      {/* If a call is ringing AND older requests exist, keep a link to them */}
      {ringing.length > 0 && otherRequests > 0 && (
        <NavIconLink href="/calls" label="Call requests" count={otherRequests}>
          <Phone size={20} />
        </NavIconLink>
      )}
      <NavIconLink
        href="/messages"
        label="Messages"
        count={counts.unreadMessages}
      >
        <MessageCircle size={20} />
      </NavIconLink>
      <NavIconLink href="/gifts" label="Gifts" count={counts.unseenGifts}>
        <Gift size={20} />
      </NavIconLink>
    </>
  );
}

export default function Navbar(): React.JSX.Element {
  return (
    <motion.nav
      className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 shadow-sm dark:border-green-900/30 dark:bg-gradient-to-r dark:from-gray-900 dark:via-gray-950 dark:to-gray-900"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
    >
      <SidebarTrigger className="mr-2 md:hidden" />
      <Link
        href="/"
        className="text-xl font-black tracking-tight text-black dark:text-white"
      >
        🟢 <span className="text-red-500">GREMLIN</span>{" "}
        <span className="text-green-500">INC.</span>
      </Link>
      <div className="flex items-center gap-2">
        <SignedOut>
          <Link href="/sign-in">
            <Button
              variant="ghost"
              className="text-gray-700 hover:text-red-600 dark:text-gray-200"
            >
              Sign In
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button className="bg-red-600 text-white hover:bg-red-500 dark:bg-red-700">
              Sign Up
            </Button>
          </Link>
        </SignedOut>
        <SignedIn>
          <NavNotifications />
          <ThemeToggle />
          <UserButton afterSignOutUrl="/" />
        </SignedIn>
      </div>
    </motion.nav>
  );
}
