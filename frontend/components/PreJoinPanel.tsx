"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRightIcon,
  CameraIcon,
  DoorIcon,
  MicIcon,
  TeacherIcon,
  UsersIcon,
} from "@/components/Icons";

interface PreJoinPanelProps {
  searchParams: {
    roomName?: string;
    name?: string;
    role?: string;
  };
}

export default function PreJoinPanel({ searchParams }: PreJoinPanelProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const name = searchParams.name?.trim() ?? "";
  const roomName = searchParams.roomName?.trim() ?? "";
  const role = searchParams.role === "teacher" ? "teacher" : "student";

  useEffect(() => {
    if (!name || !roomName) {
      router.replace("/");
      return;
    }

    let mounted = true;

    async function startPreview() {
      if (!cameraEnabled && !microphoneEnabled) {
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        setError(null);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: cameraEnabled,
          audio: microphoneEnabled,
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        setError(null);
      } catch {
        setError("Nao foi possivel acessar camera ou microfone. Verifique as permissoes do navegador.");
      }
    }

    startPreview();

    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    };
  }, [cameraEnabled, microphoneEnabled, name, roomName, router]);

  function handleEnterRoom() {
    const params = new URLSearchParams({
      name,
      role,
      camera: String(cameraEnabled),
      mic: String(microphoneEnabled),
    });

    router.push(`/room/${encodeURIComponent(roomName)}?${params.toString()}`);
  }

  return (
    <main className="prejoin">
      <section className="preview">
        <div className="preview-stage">
          <div className="preview-stage-header">
            <div>
              <div className="room-label">Castroom</div>
              <h1 className="preview-stage-title">{roomName}</h1>
            </div>
            <span className="preview-stage-status">{cameraEnabled ? "Camera pronta" : "Camera desligada"}</span>
          </div>

          <div className="preview-surface">
            {cameraEnabled ? (
              <video ref={videoRef} autoPlay muted playsInline />
            ) : (
              <div className="preview-placeholder">Camera desativada no pre-join.</div>
            )}
          </div>

          <div className="preview-controls">
            <button className="button secondary button-with-icon" type="button" onClick={() => setCameraEnabled((value) => !value)}>
              <CameraIcon width={16} height={16} />
              {cameraEnabled ? "Desligar camera" : "Ligar camera"}
            </button>
            <button
              className="button secondary button-with-icon"
              type="button"
              onClick={() => setMicrophoneEnabled((value) => !value)}
            >
              <MicIcon width={16} height={16} />
              {microphoneEnabled ? "Desligar microfone" : "Ligar microfone"}
            </button>
          </div>
        </div>
      </section>

      <aside className="sidebar stack">
        <div>
          <span className="eyebrow">Pre-join</span>
          <h1 className="sidebar-title">Revise sua entrada</h1>
          <p className="helper" style={{ margin: 0 }}>
            Revise seus dispositivos antes de entrar na sala como {role === "teacher" ? "professor" : "aluno"}.
          </p>
        </div>

        <div className="identity-card">
          <div className="identity-row">
            <UsersIcon width={16} height={16} />
            <span>Participante</span>
          </div>
          <strong>{name}</strong>
          <div className="identity-role">
            <TeacherIcon width={16} height={16} />
            {role === "teacher" ? "Professor" : "Aluno"}
          </div>
        </div>

        {error ? <div className="error">{error}</div> : null}

        <div className="device-list">
          <div className={`device-row ${cameraEnabled ? "active" : "inactive"}`}>
            <div className="device-row-leading">
              <CameraIcon width={18} height={18} />
              <strong>Camera</strong>
            </div>
            <span className="helper">{cameraEnabled ? "Ativa" : "Desligada"}</span>
          </div>
          <div className={`device-row ${microphoneEnabled ? "active" : "inactive"}`}>
            <div className="device-row-leading">
              <MicIcon width={18} height={18} />
              <strong>Microfone</strong>
            </div>
            <span className="helper">{microphoneEnabled ? "Ativo" : "Silenciado"}</span>
          </div>
          <div className="device-row static">
            <div className="device-row-leading">
              <UsersIcon width={18} height={18} />
              <strong>Fluxo</strong>
            </div>
            <span className="helper">Entrada guiada antes da sala</span>
          </div>
        </div>

        <div className="inline inline-end">
          <button className="button secondary button-with-icon" type="button" onClick={() => router.push("/")}>
            <DoorIcon width={16} height={16} />
            Voltar
          </button>
          <button className="button button-with-icon" type="button" onClick={handleEnterRoom}>
            Entrar na sala
            <ArrowRightIcon width={16} height={16} />
          </button>
        </div>
      </aside>
    </main>
  );
}
