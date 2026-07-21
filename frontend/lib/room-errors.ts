export type RoomJoinErrorKind = "duplicate_name" | "backend_unavailable" | "token_failed" | "unexpected";

export interface RoomJoinErrorState {
  kind: RoomJoinErrorKind;
  title: string;
  description: string;
}

export function mapRoomJoinError(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes("ja existe um participante conectado")) {
    return {
      kind: "duplicate_name",
      title: "Esse nome ja esta em uso nesta sala.",
      description: "Escolha outro nome para evitar conflito com um participante que ja esta conectado.",
    } satisfies RoomJoinErrorState;
  }

  if (
    normalizedMessage.includes("failed to fetch")
    || normalizedMessage.includes("networkerror")
    || normalizedMessage.includes("load failed")
    || normalizedMessage.includes("backend indisponivel")
  ) {
    return {
      kind: "backend_unavailable",
      title: "Nao foi possivel falar com o backend agora.",
      description: "Verifique se a API esta no ar e tente novamente em alguns segundos.",
    } satisfies RoomJoinErrorState;
  }

  if (normalizedMessage.includes("token")) {
    return {
      kind: "token_failed",
      title: "Falha ao preparar a entrada na sala.",
      description: "A API nao conseguiu emitir o token de acesso. Tente novamente ou volte ao pre-join.",
    } satisfies RoomJoinErrorState;
  }

  return {
    kind: "unexpected",
    title: "Ocorreu um erro inesperado ao entrar na sala.",
    description: "Volte ao pre-join e tente novamente. Se persistir, revise os logs do backend.",
  } satisfies RoomJoinErrorState;
}
