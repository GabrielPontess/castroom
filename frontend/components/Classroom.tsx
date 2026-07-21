"use client";

import {
  Chat,
  ConnectionStateToast,
  ControlBar,
  isTrackReference,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  type TrackReferenceOrPlaceholder,
  useParticipants,
  useTracks,
} from "@livekit/components-react";
import "@livekit/components-styles";
import type { RoomOptions } from "livekit-client";
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
  audioDeviceId: string;
  videoDeviceId: string;
  audioOutputDeviceId: string;
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

  const screenShareTracks = tracks.filter((trackReference) => trackReference.source === Track.Source.ScreenShare);
  const cameraTracks = tracks.filter((trackReference) => trackReference.source === Track.Source.Camera);

  if (screenShareTracks.length > 0) {
    const primaryScreenShare = screenShareTracks[0];
    const presenterName = primaryScreenShare.participant.name || primaryScreenShare.participant.identity;

    return (
      <div className="presentation-layout">
        <div className="presentation-primary">
          <div className="presentation-label">
            <span className="badge badge-strong">
              <ScreenIcon width={12} height={12} />
              Apresentando agora
            </span>
            <span className="presentation-name">{presenterName}</span>
          </div>

          <div className="presentation-stage">
            <ParticipantTile trackRef={primaryScreenShare} />
          </div>
        </div>

        <div className="presentation-secondary">
          <div className="presentation-secondary-header">
            <h3>Participantes</h3>
            <span className="side-count">{cameraTracks.length}</span>
          </div>

          <div className="presentation-strip">
            {cameraTracks.length === 0 ? <div className="status">Nenhuma camera ativa no momento.</div> : null}
            {cameraTracks.map((trackReference) => (
              <div className="presentation-tile" key={getTrackKey(trackReference)}>
                <ParticipantTile trackRef={trackReference} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (tracks.length === 0) {
    return <div className="status">Aguardando participantes publicarem video...</div>;
  }

  return (
    <div className="video-grid">
      {tracks.map((trackReference) => (
        <ParticipantTile key={getTrackKey(trackReference)} trackRef={trackReference} />
      ))}
    </div>
  );
}

function getTrackKey(trackReference: TrackReferenceOrPlaceholder) {
  if (isTrackReference(trackReference)) {
    return `${trackReference.participant.identity}-${trackReference.publication.trackSid}`;
  }

  return `${trackReference.participant.identity}-${trackReference.source}-placeholder`;
}

export default function Classroom({
  roomName,
  participantName,
  role,
  token,
  audioEnabled,
  videoEnabled,
  audioDeviceId,
  videoDeviceId,
  audioOutputDeviceId,
  isLeaving,
  onLeave,
}: ClassroomProps) {
  const serverUrl = getLivekitUrl();
  const roomOptions: RoomOptions = {
    audioCaptureDefaults: audioDeviceId ? { deviceId: audioDeviceId } : undefined,
    videoCaptureDefaults: videoDeviceId ? { deviceId: videoDeviceId } : undefined,
    audioOutput: audioOutputDeviceId ? { deviceId: audioOutputDeviceId } : undefined,
  };
  const audioOptions = audioEnabled ? (audioDeviceId ? { deviceId: audioDeviceId } : true) : false;
  const videoOptions = videoEnabled ? (videoDeviceId ? { deviceId: videoDeviceId } : true) : false;

  return (
    <LiveKitRoom
      connect
      audio={audioOptions}
      video={videoOptions}
      token={token}
      serverUrl={serverUrl}
      options={roomOptions}
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
