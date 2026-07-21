"use client";

import {
  Chat,
  ConnectionStateToast,
  ControlBar,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useParticipants,
  useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import { Track } from "livekit-client";
import { CameraIcon, ChatIcon, DoorIcon, MicIcon, ScreenIcon, TeacherIcon, UsersIcon } from "@/components/Icons";
import { getLivekitUrl } from "@/lib/runtime-config";

interface ClassroomProps {
  roomName: string;
  participantName: string;
  role: "teacher" | "student";
  token: string;
  audioEnabled: boolean;
  videoEnabled: boolean;
  isLeaving: boolean;
  onLeave: () => void;
}

function ParticipantsSidebar() {
  const participants = useParticipants();

  return (
    <section className="side-section">
      <div className="side-header">
        <h3>Participantes</h3>
        <span className="side-count">{participants.length}</span>
      </div>
      <div className="participants">
        {participants.map((participant) => {
          const isTeacher = participant.attributes?.role === "teacher";

          return (
            <div className="participant" key={participant.identity}>
              <div className="participant-meta">
                <strong>{participant.name || participant.identity}</strong>
                <span className="helper participant-state">
                  <MicIcon width={12} height={12} />
                  {participant.isMicrophoneEnabled ? "Microfone ativo" : "Microfone desligado"}
                </span>
              </div>
              {isTeacher ? <span className="badge">Professor</span> : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function PreviewGrid() {
  const tracks = useTracks([
    { source: Track.Source.Camera, withPlaceholder: true },
    { source: Track.Source.ScreenShare, withPlaceholder: false },
  ]);

  if (tracks.length === 0) {
    return <div className="status">Aguardando participantes publicarem video...</div>;
  }

  return (
    <div className="video-grid">
      {tracks.map((trackReference) => (
        <ParticipantTile key={`${trackReference.participant.identity}-${trackReference.source}`} trackRef={trackReference} />
      ))}
    </div>
  );
}

export default function Classroom({
  roomName,
  participantName,
  role,
  token,
  audioEnabled,
  videoEnabled,
  isLeaving,
  onLeave,
}: ClassroomProps) {
  const serverUrl = getLivekitUrl();

  return (
    <LiveKitRoom
      connect
      audio={audioEnabled}
      video={videoEnabled}
      token={token}
      serverUrl={serverUrl}
      data-lk-theme="default"
      onDisconnected={onLeave}
      style={{ minHeight: "100vh" }}
    >
      <div className="room-shell">
        <header className="meet-topbar">
          <div className="meet-topbar-brand">
            <span className="room-label">Castroom</span>
            <div className="meet-topbar-copy">
              <strong>{roomName}</strong>
              <span>{role === "teacher" ? "Professor" : "Aluno"}: {participantName}</span>
            </div>
          </div>

          <div className="meet-topbar-actions">
            {role === "teacher" ? <span className="badge badge-strong">Professor</span> : null}
            {isLeaving ? <span className="status status-inline">Saindo da sala...</span> : null}
          </div>
        </header>

        <div className="room-main">
          <ConnectionStateToast />
          <section className="meet-stage">
            <PreviewGrid />
          </section>
          <div className="control-bar-wrap">
            <ControlBar />
          </div>
          <RoomAudioRenderer />
        </div>

        <aside className="room-side">
          <ParticipantsSidebar />
          <section className="side-section chat-panel">
            <div className="side-header">
              <h3>Chat</h3>
              <span className="side-count">Live</span>
            </div>
            <Chat />
          </section>
        </aside>
      </div>
    </LiveKitRoom>
  );
}
