export function getBackendUrl() {
  return process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:5000";
}

export function getLivekitUrl() {
  return process.env.NEXT_PUBLIC_LIVEKIT_URL ?? "ws://localhost:7880";
}
