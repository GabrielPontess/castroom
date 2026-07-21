"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRightIcon } from "@/components/Icons";

export default function JoinForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [roomName, setRoomName] = useState("");
  const [role, setRole] = useState("student");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedName = name.trim();
    const trimmedRoom = roomName.trim();

    if (!trimmedName || !trimmedRoom) {
      return;
    }

    const params = new URLSearchParams({
      name: trimmedName,
      roomName: trimmedRoom,
      role,
    });

    router.push(`/prejoin?${params.toString()}`);
  }

  return (
    <form className="form" onSubmit={handleSubmit}>
      <div className="section-copy join-heading">
        <h2 style={{ margin: 0 }}>Acesse uma sala existente ou inicie uma nova.</h2>
        <p className="helper" style={{ margin: 0 }}>
          Use um nome que facilite sua identifacação durante a chamada.
        </p>
      </div>

      <div className="field">
        <label htmlFor="name">Seu nome</label>
        <input
          id="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ex: Lucas Silva"
          required
        />
      </div>

      <div className="field">
        <label htmlFor="roomName">Nome da sala</label>
        <input
          id="roomName"
          value={roomName}
          onChange={(event) => setRoomName(event.target.value)}
          placeholder="Ex: turma-direito-01"
          required
        />
      </div>

      <div className="field">
        <label htmlFor="role">Papel</label>
        <select id="role" value={role} onChange={(event) => setRole(event.target.value)}>
          <option value="student">Aluno</option>
          <option value="teacher">Professor</option>
        </select>
      </div>

      <button className="button button-with-icon" type="submit">
        Ir para o pre-join
        <ArrowRightIcon width={16} height={16} />
      </button>
    </form>
  );
}
