#!/usr/bin/env sh

set -eu

FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"
ROOM_NAME="${1:-turma-load-30}"
OUTPUT_DIR="${OUTPUT_DIR:-./tmp-room-seeds}"
OPEN_DELAY_SECONDS="${OPEN_DELAY_SECONDS:-1}"

mkdir -p "$OUTPUT_DIR"

URLS_FILE="$OUTPUT_DIR/${ROOM_NAME}-urls.txt"
: > "$URLS_FILE"

urlencode() {
  value="$1"
  encoded=""

  while [ -n "$value" ]; do
    first_char=$(printf '%s' "$value" | cut -c1)
    value=$(printf '%s' "$value" | cut -c2-)

    case "$first_char" in
      [a-zA-Z0-9.~_-])
        encoded="${encoded}${first_char}"
        ;;
      ' ')
        encoded="${encoded}%20"
        ;;
      *)
        hex=$(printf '%s' "$first_char" | od -An -tx1 | tr -d ' \n' | tr '[:lower:]' '[:upper:]')
        encoded="${encoded}%${hex}"
        ;;
    esac
  done

  printf '%s' "$encoded"
}

open_url() {
  url="$1"

  if command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$url" >/dev/null 2>&1 &
    return 0
  fi

  if command -v open >/dev/null 2>&1; then
    open "$url" >/dev/null 2>&1 &
    return 0
  fi

  if command -v cygstart >/dev/null 2>&1; then
    cygstart "$url"
    return 0
  fi

  if command -v cmd.exe >/dev/null 2>&1; then
    cmd.exe /c start "" "$url" >/dev/null 2>&1
    return 0
  fi

  printf 'Nao foi possivel detectar um comando para abrir o navegador.\n' >&2
  printf 'Abra manualmente as URLs em: %s\n' "$URLS_FILE" >&2
  return 1
}

open_participant() {
  participant_name="$1"
  role="$2"

  encoded_room=$(urlencode "$ROOM_NAME")
  encoded_name=$(urlencode "$participant_name")
  url="${FRONTEND_URL}/room/${encoded_room}?name=${encoded_name}&role=${role}"

  printf '%s\n' "$url" >> "$URLS_FILE"
  printf 'Abrindo %s\n' "$participant_name"
  open_url "$url"

  if [ "$OPEN_DELAY_SECONDS" != "0" ]; then
    sleep "$OPEN_DELAY_SECONDS"
  fi
}

printf 'Abrindo sala "%s" com 30 participantes em %s\n' "$ROOM_NAME" "$FRONTEND_URL"
printf 'Lista de URLs: %s\n' "$URLS_FILE"

open_participant "Professor 01" "teacher"

index=1
while [ "$index" -le 29 ]; do
  participant_name=$(printf 'Aluno %02d' "$index")
  open_participant "$participant_name" "student"
  index=$((index + 1))
done

printf '\nConcluido. As URLs abertas tambem foram salvas em %s\n' "$URLS_FILE"
