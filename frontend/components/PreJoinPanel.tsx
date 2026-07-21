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

interface MediaDeviceOption {
  deviceId: string;
  label: string;
}

export default function PreJoinPanel({ searchParams }: PreJoinPanelProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cameraDevices, setCameraDevices] = useState<MediaDeviceOption[]>([]);
  const [microphoneDevices, setMicrophoneDevices] = useState<MediaDeviceOption[]>([]);
  const [speakerDevices, setSpeakerDevices] = useState<MediaDeviceOption[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [selectedMicrophoneId, setSelectedMicrophoneId] = useState("");
  const [selectedSpeakerId, setSelectedSpeakerId] = useState("");

  const name = searchParams.name?.trim() ?? "";
  const roomName = searchParams.roomName?.trim() ?? "";
  const role = searchParams.role === "teacher" ? "teacher" : "student";

  async function loadDevices() {
    const devices = await navigator.mediaDevices.enumerateDevices();

    const nextCameraDevices = devices
      .filter((device) => device.kind === "videoinput")
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `Camera ${index + 1}`,
      }));

    const nextMicrophoneDevices = devices
      .filter((device) => device.kind === "audioinput")
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `Microfone ${index + 1}`,
      }));

    const nextSpeakerDevices = devices
      .filter((device) => device.kind === "audiooutput")
      .map((device, index) => ({
        deviceId: device.deviceId,
        label: device.label || `Saida ${index + 1}`,
      }));

    setCameraDevices(nextCameraDevices);
    setMicrophoneDevices(nextMicrophoneDevices);
    setSpeakerDevices(nextSpeakerDevices);

    setSelectedCameraId((currentValue) => currentValue || nextCameraDevices[0]?.deviceId || "");
    setSelectedMicrophoneId((currentValue) => currentValue || nextMicrophoneDevices[0]?.deviceId || "");
    setSelectedSpeakerId((currentValue) => currentValue || nextSpeakerDevices[0]?.deviceId || "");
  }

  useEffect(() => {
    if (!name || !roomName) {
      router.replace("/");
      return;
    }

    let mounted = true;

    async function startPreview() {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

      if (!cameraEnabled && !microphoneEnabled) {
        await loadDevices().catch(() => undefined);
        setError(null);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: cameraEnabled
            ? selectedCameraId
              ? { deviceId: { exact: selectedCameraId } }
              : true
            : false,
          audio: microphoneEnabled
            ? selectedMicrophoneId
              ? { deviceId: { exact: selectedMicrophoneId } }
              : true
            : false,
        });

        if (!mounted) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        await loadDevices();
        setError(null);
      } catch {
        await loadDevices().catch(() => undefined);
        setError("Nao foi possivel acessar camera ou microfone. Verifique as permissoes do navegador.");
      }
    }

    startPreview();

    const handleDeviceChange = () => {
      void loadDevices().catch(() => undefined);
    };

    navigator.mediaDevices?.addEventListener?.("devicechange", handleDeviceChange);

    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      navigator.mediaDevices?.removeEventListener?.("devicechange", handleDeviceChange);
    };
  }, [cameraEnabled, microphoneEnabled, name, roomName, router, selectedCameraId, selectedMicrophoneId]);

  function handleEnterRoom() {
    const params = new URLSearchParams({
      name,
      role,
      camera: String(cameraEnabled),
      mic: String(microphoneEnabled),
    });

    if (selectedCameraId) {
      params.set("cameraDeviceId", selectedCameraId);
    }

    if (selectedMicrophoneId) {
      params.set("microphoneDeviceId", selectedMicrophoneId);
    }

    if (selectedSpeakerId) {
      params.set("speakerDeviceId", selectedSpeakerId);
    }

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

        <div className="device-config-section">
          <div className="side-header">
            <h3>Dispositivos</h3>
            <span className="side-count">{cameraDevices.length + microphoneDevices.length}</span>
          </div>

          <div className="device-config-grid">
            <div className="field">
              <label htmlFor="cameraDevice">Camera</label>
              <select
                id="cameraDevice"
                value={selectedCameraId}
                onChange={(event) => setSelectedCameraId(event.target.value)}
                disabled={cameraDevices.length === 0}
              >
                {cameraDevices.length === 0 ? <option value="">Nenhuma camera detectada</option> : null}
                {cameraDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="microphoneDevice">Microfone</label>
              <select
                id="microphoneDevice"
                value={selectedMicrophoneId}
                onChange={(event) => setSelectedMicrophoneId(event.target.value)}
                disabled={microphoneDevices.length === 0}
              >
                {microphoneDevices.length === 0 ? <option value="">Nenhum microfone detectado</option> : null}
                {microphoneDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="speakerDevice">Saida de audio</label>
              <select
                id="speakerDevice"
                value={selectedSpeakerId}
                onChange={(event) => setSelectedSpeakerId(event.target.value)}
                disabled={speakerDevices.length === 0}
              >
                {speakerDevices.length === 0 ? <option value="">Saida padrao do sistema</option> : null}
                {speakerDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

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
