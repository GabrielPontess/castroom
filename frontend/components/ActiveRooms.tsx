"use client";

import { useEffect, useState } from "react";
import { TeacherIcon, UsersIcon } from "@/components/Icons";
import { getBackendUrl } from "@/lib/runtime-config";

interface ActiveRoom {
  roomName: string;
  startedAt: string;
  connectedParticipants: number;
  connectedTeachers: number;
}

export default function ActiveRooms() {
  const [rooms, setRooms] = useState<ActiveRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let ignore = false;

    async function loadRooms() {
      try {
        const response = await fetch(`${getBackendUrl()}/api/rooms/active`);

        if (!response.ok) {
          throw new Error("Falha ao carregar aulas em andamento.");
        }

        const data = (await response.json()) as ActiveRoom[];

        if (!ignore) {
          setRooms(data);
        }
      } catch {
        if (!ignore) {
          setRooms([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadRooms();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <section className="active-rooms">
      <div className="side-header">
        <h3>Aulas em andamento</h3>
        <span className="side-count">{loading ? "..." : rooms.length}</span>
      </div>

      {loading ? <div className="status">Consultando base local de aulas...</div> : null}

      {!loading && rooms.length === 0 ? (
        <div className="status">Nenhuma aula em andamento no momento.</div>
      ) : null}

      <div className="active-room-list">
        {rooms.map((room) => (
          <article className="active-room-card" key={room.roomName}>
            <strong>{room.roomName}</strong>
            <div className="active-room-meta">
              <span>
                <UsersIcon width={14} height={14} />
                {room.connectedParticipants} participante(s)
              </span>
              <span>
                <TeacherIcon width={14} height={14} />
                {room.connectedTeachers} professor(es)
              </span>
              <span>Iniciada {new Date(room.startedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
