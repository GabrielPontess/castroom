"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Classroom from "@/components/Classroom";
import { ArrowRightIcon, DoorIcon } from "@/components/Icons";
import { mapRoomJoinError, type RoomJoinErrorState } from "@/lib/room-errors";
import { getBackendUrl } from "@/lib/runtime-config";

interface RoomPageClientProps {
  roomName: string;
  searchParams: {
    name?: string;
    role?: string;
    camera?: string;
    mic?: string;
    cameraDeviceId?: string;
    microphoneDeviceId?: string;
    speakerDeviceId?: string;
  };
}

interface TokenResponse {
  token: string;
}

export default function RoomPageClient({ roomName, searchParams }: RoomPageClientProps) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<RoomJoinErrorState | null>(null);
  const [isLeaving, setIsLeaving] = useState(false);

  const name = searchParams.name?.trim() ?? "";
  const role = searchParams.role === "teacher" ? "teacher" : "student";
  const cameraEnabled = searchParams.camera !== "false";
  const microphoneEnabled = searchParams.mic !== "false";
  const cameraDeviceId = searchParams.cameraDeviceId?.trim() ?? "";
  const microphoneDeviceId = searchParams.microphoneDeviceId?.trim() ?? "";
  const speakerDeviceId = searchParams.speakerDeviceId?.trim() ?? "";
  const joinedRoomRef = useRef(false);
  const hasNotifiedLeaveRef = useRef(false);

  async function notifyLeave() {
    if (!name || !joinedRoomRef.current || hasNotifiedLeaveRef.current) {
      return;
    }

    hasNotifiedLeaveRef.current = true;

    const requestBody = JSON.stringify({ participantName: name });
    const leaveUrl = `${getBackendUrl()}/api/rooms/${encodeURIComponent(roomName)}/leave`;

    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      const payload = new Blob([requestBody], { type: "application/json" });
      navigator.sendBeacon(leaveUrl, payload);
      return;
    }

    try {
      await fetch(leaveUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: requestBody,
        keepalive: true,
      });
    } catch {
      hasNotifiedLeaveRef.current = false;
    }
  }

  useEffect(() => {
    if (!name) {
      router.replace("/");
      return;
    }

    let ignore = false;

    async function loadToken() {
      try {
        const response = await fetch(`${getBackendUrl()}/api/tokens`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            roomName,
            participantName: name,
            isTeacher: role === "teacher",
          }),
        });

        if (!response.ok) {
          const errorData = (await response.json().catch(() => null)) as { error?: string } | null;
          throw new Error(errorData?.error ?? "Nao foi possivel obter o token da sala.");
        }

        const data = (await response.json()) as TokenResponse;

        if (!ignore) {
          joinedRoomRef.current = true;
          hasNotifiedLeaveRef.current = false;
          setToken(data.token);
          setError(null);
        }
      } catch (requestError) {
        if (!ignore) {
          const message = requestError instanceof Error ? requestError.message : "Erro inesperado ao entrar na sala.";
          setError(mapRoomJoinError(message));
        }
      }
    }

    loadToken();

    return () => {
      ignore = true;
    };
  }, [name, role, roomName, router]);

  useEffect(() => {
    if (!name) {
      return;
    }

    function handleBeforeUnload() {
      void notifyLeave();
    }

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      void notifyLeave();
    };
  }, [name, roomName]);

  async function handleLeaveToHome() {
    setIsLeaving(true);
    await notifyLeave();
    router.push("/");
  }

  function handleBackToPreJoin() {
    const params = new URLSearchParams({
      roomName,
      name,
      role,
      camera: String(cameraEnabled),
      mic: String(microphoneEnabled),
    });

    router.push(`/prejoin?${params.toString()}`);
  }

  if (error) {
    return (
      <main className="shell">
        <section className="card room-feedback-card">
          <div className="room-feedback-stack">
            <span className="eyebrow">Entrada na sala</span>
            <h1 className="room-feedback-title">{error.title}</h1>
            <p className="helper room-feedback-copy">{error.description}</p>
            <div className="error">Sala: {roomName}</div>
            <div className="inline">
              <button className="button secondary button-with-icon" type="button" onClick={handleBackToPreJoin}>
                <DoorIcon width={16} height={16} />
                Voltar ao pre-join
              </button>
              <button className="button button-with-icon" type="button" onClick={() => window.location.reload()}>
                Tentar novamente
                <ArrowRightIcon width={16} height={16} />
              </button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  if (!token) {
    return (
      <main className="shell">
        <section className="card" style={{ padding: 32 }}>
          <div className="status">Conectando a sala {roomName}...</div>
        </section>
      </main>
    );
  }

  return (
      <Classroom
      roomName={roomName}
      participantName={name}
      role={role}
      token={token}
      audioEnabled={microphoneEnabled}
      videoEnabled={cameraEnabled}
      audioDeviceId={microphoneDeviceId}
      videoDeviceId={cameraDeviceId}
      audioOutputDeviceId={speakerDeviceId}
      isLeaving={isLeaving}
      onLeave={() => {
        void handleLeaveToHome();
        }}
      />
  );
}
