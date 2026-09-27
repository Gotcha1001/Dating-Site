"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";
import { api } from "@/convex/_generated/api";
import { Loader2 } from "lucide-react";
import type { Id } from "@/convex/_generated/dataModel";

interface VideoCallRoomProps {
  callSessionId: Id<"callSessions">;
}

interface LiveKitTokenResponse {
  token: string;
  url: string;
  roomName: string;
}

export function VideoCallRoom({
  callSessionId,
}: VideoCallRoomProps): React.JSX.Element {
  const router = useRouter();
  const endCall = useMutation(api.calls.endCall);

  const [tokenData, setTokenData] = useState<LiveKitTokenResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchToken(): Promise<void> {
      try {
        const response = await fetch(
          `/api/livekit-token?callSessionId=${callSessionId}`,
        );
        const data = (await response.json()) as
          | LiveKitTokenResponse
          | { error: string };

        if (!response.ok || "error" in data) {
          throw new Error(
            "error" in data ? data.error : "Couldn't join the call",
          );
        }
        if (!cancelled) setTokenData(data);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Couldn't join the call",
          );
        }
      }
    }

    fetchToken();
    return () => {
      cancelled = true;
    };
  }, [callSessionId]);

  async function handleDisconnect(): Promise<void> {
    await endCall({ callSessionId });
    router.push("/messages");
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
        <p className="text-red-500">{error}</p>
        <p className="text-sm text-gray-400">
          The other person may need to accept the call request first.
        </p>
      </div>
    );
  }

  if (!tokenData) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  return (
    <LiveKitRoom
      token={tokenData.token}
      serverUrl={tokenData.url}
      connect
      video
      audio
      style={{ height: "100%" }}
      onDisconnected={handleDisconnect}
    >
      <VideoConference />
    </LiveKitRoom>
  );
}
