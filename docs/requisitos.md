## 🏛️ Arquitetura do MVP (Visão Geral)

A arquitetura do MVP é dividida em três contêineres principais no mesmo ecossistema Docker:

```
                  ┌────────────────────────────────────────────────────────┐
                  │                 Nginx Reverse Proxy                    │
                  │         (SSL / Enroteamento de Subdomínios)            │
                  └───────┬───────────────────┬────────────────────┬───────┘
                          │                   │                    │
                          ▼                   ▼                    ▼
                ┌──────────────────┐┌──────────────────┐┌──────────────────┐
                │   Frontend Next  ││  Backend ASP.NET ││  LiveKit Server  │
                │     (Porta 3000) ││    (Porta 5000)  ││ (Portas 7880/UDP)│
                └──────────────────┘└──────────────────┘└──────────────────┘

```

1. **Frontend (Next.js 14+ / App Router):** Interface web onde o aluno/professor visualiza a grade de vídeo, ativa câmera/mic/compartilhamento de tela e acessa os controles de mídia.
2. **Backend (ASP.NET Core 8 Web API):** Microsserviço encarregado da autenticação e geração dos tokens JWT de acesso à sala via SDK oficial.
3. **LiveKit Server (Docker):** Servidor SFU que faz o roteamento das faixas de mídia em tempo real via WebRTC.

---

## 1. Estrutura de Arquivos da Solução

Crie um diretório para o seu projeto com a seguinte estrutura:

```text
livekit-classroom/
├── docker-compose.yml
├── livekit.yaml
├── backend/
│   ├── Dockerfile
│   ├── ClassroomApi.csproj
│   └── Program.cs
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── app/
    │   ├── page.tsx
    │   └── room/[roomName]/page.tsx
    └── components/
        └── Classroom.tsx

```

---

## 2. Configuração do LiveKit Server

Crie o arquivo `livekit.yaml` na raiz do projeto:

```yaml
port: 7880
bind_addresses:
  - ""
rtc:
  tcp_port: 7881
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: false # Defina como true em servidor de produção (VPS)

keys:
  devkey: secret_key_super_segura_aqui_12345

```

---

## 3. Microsserviço ASP.NET Core 8 (.NET 8 Web API)

### A. Dependências Nuget (`ClassroomApi.csproj`)

```xml
<Project Sdk="Microsoft.NET.Sdk.Web">
  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="LiveKit.Server.SDK" Version="0.3.1" />
  </ItemGroup>
</Project>

```

### B. Código da API (`Program.cs`)

```csharp
using LiveKit.Server.SDK;

var builder = WebApplication.CreateBuilder(args);

// Configuração do CORS para permitir chamadas do Next.js
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNext", policy =>
        policy.WithOrigins("http://localhost:3000", "http://frontend:3000")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

var app = builder.Build();
app.UseCors("AllowNext");

// Injeção de credenciais do LiveKit (mesmas chaves do livekit.yaml)
string apiKey = builder.Configuration["LIVEKIT_API_KEY"] ?? "devkey";
string apiSecret = builder.Configuration["LIVEKIT_API_SECRET"] ?? "secret_key_super_segura_aqui_12345";

app.MapPost("/api/tokens", (TokenRequest req) =>
{
    if (string.IsNullOrEmpty(req.RoomName) || string.IsNullOrEmpty(req.ParticipantName))
    {
        return Results.BadRequest("RoomName e ParticipantName são obrigatórios.");
    }

    var token = new AccessToken(apiKey, apiSecret)
        .WithIdentity(req.ParticipantName)
        .WithName(req.ParticipantName)
        .WithTtl(TimeSpan.FromHours(2))
        .WithGrants(new Grants
        {
            RoomJoin = true,
            Room = req.RoomName,
            CanPublish = true,
            CanSubscribe = true,
            CanPublishData = true,
            RoomAdmin = req.IsTeacher
        });

    string jwt = token.ToJwt();
    return Results.Ok(new { token = jwt });
});

app.Run();

public record TokenRequest(string RoomName, string ParticipantName, bool IsTeacher);

```

### C. Dockerfile do ASP.NET (`backend/Dockerfile`)

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ClassroomApi.csproj .
RUN dotnet restore
COPY . .
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000
ENTRYPOINT ["dotnet", "ClassroomApi.dll"]

```

---

## 4. Frontend Next.js (App Router)

### A. Dependências (`frontend/package.json`)

Adicione as dependências do LiveKit Client e UI no `package.json`:

```json
{
  "name": "classroom-frontend",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "@livekit/components-react": "^2.6.0",
    "@livekit/components-styles": "^1.1.0",
    "livekit-client": "^2.7.0",
    "next": "^14.2.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0"
  }
}

```

### B. Componente da Sala (`frontend/components/Classroom.tsx`)

```tsx
"use client";

import React from "react";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import "@livekit/components-styles";

interface ClassroomProps {
  token: string;
  onLeave: () => void;
}

export default function Classroom({ token, onLeave }: ClassroomProps) {
  // Conecta via WebSocket ao LiveKit Server
  const serverUrl = process.env.NEXT_PUBLIC_LIVEKIT_URL || "ws://localhost:7880";

  return (
    <LiveKitRoom
      video={true}
      audio={true}
      token={token}
      serverUrl={serverUrl}
      data-lk-theme="default"
      onDisconnected={onLeave}
      style={{ height: "100vh" }}
    >
      <VideoConference />
    </LiveKitRoom>
  );
}

```

### C. Página da Sala (`frontend/app/room/[roomName]/page.tsx`)

```tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Classroom from "@/components/Classroom";

export default function RoomPage({ params }: { params: { roomName: string } }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const name = searchParams.get("name") || "Aluno";
  const isTeacher = searchParams.get("isTeacher") === "true";

  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchToken() {
      try {
        const response = await fetch("http://localhost:5000/api/tokens", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            roomName: params.roomName,
            participantName: name,
            isTeacher: isTeacher,
          }),
        });

        if (!response.ok) throw new Error("Erro ao obter token de acesso");

        const data = await response.json();
        setToken(data.token);
      } catch (err: any) {
        setError(err.message);
      }
    }

    fetchToken();
  }, [params.roomName, name, isTeacher]);

  if (error) return <div className="p-8 text-red-500">Erro: {error}</div>;
  if (!token) return <div className="p-8">Carregando sala de aula...</div>;

  return <Classroom token={token} onLeave={() => router.push("/")} />;
}

```

### D. Dockerfile do Next.js (`frontend/Dockerfile`)

```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app ./
EXPOSE 3000
CMD ["npm", "start"]

```

---

## 5. Orchestração com Docker Compose

Crie o arquivo `docker-compose.yml` na raiz do projeto:

```yaml
version: '3.8'

services:
  # 1. Servidor de Mídia LiveKit (SFU)
  livekit:
    image: livekit/livekit-server:latest
    container_name: livekit-server
    command: --config /etc/livekit.yaml
    volumes:
      - ./livekit.yaml:/etc/livekit.yaml
    ports:
      - "7880:7880"   # HTTP/WebSocket Signaling
      - "7881:7881"   # WebRTC sobre TCP (Fallback)
      - "50000-60000:50000-60000/udp" # WebRTC sobre UDP (Fluxo de Áudio/Vídeo)
    restart: always
    networks:
      - classroom-net

  # 2. Microsserviço ASP.NET Core (Emissor de Tokens)
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: classroom-backend
    ports:
      - "5000:5000"
    environment:
      - LIVEKIT_API_KEY=devkey
      - LIVEKIT_API_SECRET=secret_key_super_segura_aqui_12345
    depends_on:
      - livekit
    restart: always
    networks:
      - classroom-net

  # 3. Aplicação Frontend Next.js
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: classroom-frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_LIVEKIT_URL=ws://localhost:7880
    depends_on:
      - backend
    restart: always
    networks:
      - classroom-net

networks:
  classroom-net:
    driver: bridge

```

---

## 🚀 Como Executar o MVP Localmente

1. Garanta que o Docker e o Docker Compose estão instalados.
2. Na raiz da pasta do projeto, suba a aplicação inteira com um único comando:

```bash
docker compose up --build

```

3. **Acessando a aplicação:**
* Navegue até `http://localhost:3000/room/turma-01?name=Professor&isTeacher=true` em uma aba.
* Abra uma janela anônima e acesse `http://localhost:3000/room/turma-01?name=Aluno1&isTeacher=false`.
* Ambos os usuários estarão na mesma sala em tempo real com áudio, vídeo e suporte a compartilhamento de tela.