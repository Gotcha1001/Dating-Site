"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import {
  ControlBar,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useTracks,
} from "@livekit/components-react";
import { MediaDeviceFailure, Track } from "livekit-client";
import "@livekit/components-styles";
import { toast } from "sonner";
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

function handleMediaDeviceFailure(failure?: MediaDeviceFailure): void {
  switch (failure) {
    case MediaDeviceFailure.DeviceInUse:
      toast.error(
        "Your camera or microphone is being used by another app or tab. Close it, then use the camera button below to try again.",
      );
      break;
    case MediaDeviceFailure.PermissionDenied:
      toast.error(
        "Camera or microphone access is blocked. Allow it in your browser's site settings and reload.",
      );
      break;
    case MediaDeviceFailure.NotFound:
      toast.error("No camera or microphone was found on this device.");
      break;
    default:
      toast.error("Couldn't start your camera or microphone.");
  }
}

// Must render inside <LiveKitRoom>.
function CallLayout(): React.JSX.Element {
  const tracks = useTracks(
    [{ source: Track.Source.Camera, withPlaceholder: true }],
    { onlySubscribed: false },
  );

  const localTrack = tracks.find((t) => t.participant.isLocal);
  const remoteTrack = tracks.find((t) => !t.participant.isLocal);

  // Until the other person joins, show yourself full size.
  const mainTrack = remoteTrack ?? localTrack;
  // Once they're in, your own camera becomes the small corner window.
  const pipTrack = remoteTrack && localTrack ? localTrack : undefined;

  return (
    <div className="flex h-full min-h-0 flex-col bg-black">
      <div className="relative min-h-0 flex-1">
        {mainTrack && (
          <ParticipantTile trackRef={mainTrack} className="h-full w-full" />
        )}

        {pipTrack && (
          <div className="absolute bottom-3 right-3 z-10 h-36 w-28 overflow-hidden rounded-xl border border-white/30 shadow-lg sm:h-44 sm:w-64">
            <ParticipantTile trackRef={pipTrack} className="h-full w-full" />
          </div>
        )}
      </div>

      {/* Its own row, so it can never be pushed out of view */}
      <ControlBar controls={{ chat: false }} className="shrink-0" />

      {/* Without this you can't hear the other person */}
      <RoomAudioRenderer />
    </div>
  );
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
      data-lk-theme="default"
      token={tokenData.token}
      serverUrl={tokenData.url}
      connect
      video
      audio
      className="h-full"
      onDisconnected={handleDisconnect}
      onMediaDeviceFailure={handleMediaDeviceFailure}
    >
      <CallLayout />
    </LiveKitRoom>
  );
}
