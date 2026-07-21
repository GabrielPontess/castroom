# Documento de Requisitos e Especificação Técnica (DRS)

**Projeto:** Castroom - MVP de Plataforma de Videoaulas em Tempo Real
**Versão:** 1.0.0
**Data:** 20 de Julho de 2026
**Status:** Aprovado para Desenvolvimento

---

## 1. Visão Geral do Produto

### 1.1 Objetivos do Projeto

O objetivo do projeto é implementar um MVP (*Minimum Viable Product*) de alta performance para videoaulas síncronas estilo Google Meet, com capacidade de escalabilidade para suportar volumes massivos (até 7 milhões de minutos/mês). A solução adota o modelo **Self-Hosted** baseado em **WebRTC (SFU)** utilizando o **LiveKit Server**, visando controle absoluto sobre os dados, latência inferior a 300ms e uma redução de até 90% nos custos operacionais em relação a APIs SaaS de mercado.

### 1.2 Arquitetura de Alto Nível

O sistema é composto por três contêineres principais orquestrados via Docker Compose, sob um modelo de responsabilidade única:

1. **Frontend (`castroom-frontend`):** Interface de usuário reativa construída em Next.js (App Router), responsável pela captura de mídia local, renderização da grade de vídeo e controles de sala.
2. **Backend (`castroom-backend`):** Microsserviço responsável pela validação de acesso, regras de negócio e geração de Access Tokens JWT.
3. **Media Server (`livekit-server`):** Servidor SFU em Go responsável por negociar conexões WebRTC, roteamento de pacotes UDP/TCP e otimização de banda em tempo real.

---

## 2. Requisitos Funcionais (RF)

| ID | Módulo | Descrição do Requisito | Prioridade |
| --- | --- | --- | --- |
| **RF01** | Autenticação | O sistema deve emitir tokens JWT temporários e assinados para permissão de entrada em salas específicas. | **Alta** |
| **RF02** | Gestão de Mídia | O usuário deve conseguir ligar/desligar sua câmera e microfone individualmente a qualquer momento da chamada. | **Alta** |
| **RF03** | Transmissão | O participante deve poder compartilhar a tela do seu dispositivo (tela cheia ou janela) em alta definição. | **Alta** |
| **RF04** | Moderação | Participantes marcados com papel de professor (`isTeacher: true`) devem possuir privilégios administrativos na sala. | **Média** |
| **RF05** | Chat | O sistema deve permitir a troca de mensagens de texto via Data Channel entre os participantes da sala em tempo real. | **Média** |
| **RF06** | Reconexão | O cliente deve tentar reconectar automaticamente a sessão WebRTC em caso de instabilidades temporárias na rede. | **Alta** |

---

## 3. Requisitos Não Funcionais (RNF)

| ID | Categoria | Descrição do Requisito |
| --- | --- | --- |
| **RNF01** | Latência | A latência fim-a-fim de transmissão de áudio e vídeo deve ser mantida abaixo de **300ms**. |
| **RNF02** | Otimização | Deve utilizar o protocolo **Simulcast** no cliente para enviar resoluções adaptativas conforme a rede do receptor. |
| **RNF03** | Segurança | O tráfego de sinalização e mídia deve ser obrigatoriamente criptografado usando **HTTPS / WSS** e **DTLS-SRTP**. |
| **RNF04** | Portabilidade | A infraestrutura completa deve ser orquestrada e executada através de **Docker / Docker Compose**. |
| **RNF05** | Disponibilidade | O backend e a API do LiveKit devem garantir portas de fallback TCP (7881) para clientes atrás de firewalls corporativos rígidos. |

---

## 4. Matriz de Componentes e Stack Tecnológica

| Componente | Tecnologia / Framework | Versão / Imagem Docker | Responsabilidade |
| --- | --- | --- | --- |
| **Frontend** | Next.js (App Router) + React | Node 20-alpine | Interface do usuário e gerenciamento de estados de mídia WebRTC. |
| **Backend** | ASP.NET Core Web API | .NET 8.0 (Alpine) | Emissão de credenciais e regras de negócio/autorização. |
| **Media Server** | LiveKit Server (SFU) | `livekit/livekit-server:latest` | Roteamento de faixas de áudio, vídeo e compartilhamento de tela. |
| **SDK UI** | `@livekit/components-react` | `^2.6.0` | Componentes de UI de videoconferência no estilo Google Meet. |

---

## 5. Especificação dos Contratos de API (Endpoints)

### 5.1 Emissão de Token de Acesso

Cria um token JWT com permissões granulares para acesso à sala do LiveKit.

* **URL:** `/api/tokens`
* **Método:** `POST`
* **Content-Type:** `application/json`

#### Request Body

```json
{
  "roomName": "turma-direito-01",
  "participantName": "Lucas Silva",
  "isTeacher": true
}

```

#### Response Body (`200 OK`)

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjE3ODQ1NjI4MDAsImlzcyI6ImRldmtleSIsInN1YiI6Ikx1Y2FzIFNpbHZhIiwicm9vbUpvaW4iOnRydWUsInJvb21OYW1lIjoidHVybWEtZGlyZWl0by0wMSJ9..."
}

```

#### Response Body (`400 Bad Request`)

```json
{
  "error": "RoomName e ParticipantName são obrigatórios."
}

```

---

## 6. Arquivos do Projeto para Execução

### 6.1 `docker-compose.yml`

```yaml
version: '3.8'

services:
  livekit:
    image: livekit/livekit-server:latest
    container_name: livekit-server
    command: --config /etc/livekit.yaml
    volumes:
      - ./livekit.yaml:/etc/livekit.yaml
    ports:
      - "7880:7880"
      - "7881:7881"
      - "50000-60000:50000-60000/udp"
    restart: always
    networks:
      - classroom-net

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

### 6.2 `livekit.yaml`

```yaml
port: 7880
bind_addresses:
  - ""
rtc:
  tcp_port: 7881
  port_range_start: 50000
  port_range_end: 60000
  use_external_ip: false

keys:
  devkey: secret_key_super_segura_aqui_12345

```

---

## 7. Critérios de Aceite para Validação do MVP

1. **Deploy unificado:** O ambiente completo deve subir sem erros através da execução do comando `docker compose up --build`.
2. **Conexão bidirecional:** Pelo menos dois usuários (ex: 1 professor e 1 aluno) devem conseguir entrar na mesma sala e se visualizar/ouvir com áudio e vídeo fluidos.
3. **Compartilhamento de Tela:** A ativação do compartilhamento de tela deve alterar o foco do layout automaticamente para todos os participantes da sala.
4. **Isolamento de Credenciais:** O token de acesso deve ser emitido estritamente pelo backend ASP.NET, sem que as chaves da API do LiveKit fiquem expostas no código do cliente Next.js.