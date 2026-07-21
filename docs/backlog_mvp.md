## Backlog do MVP - Castroom

## Objetivo

Construir o MVP da plataforma Castroom para videoaulas em tempo real com arquitetura self-hosted baseada em LiveKit, frontend em Next.js e backend em ASP.NET Core, atendendo aos requisitos funcionais e não funcionais descritos em `docs/requisitos.md` e `docs/doc_requisitos_final.md`.

## Escopo consolidado do MVP

1. Entrada em sala com token JWT emitido pelo backend.
2. Entrada livre por nome e sala, sem autenticacao real na primeira versao.
3. Sala em tempo real com audio, video e compartilhamento de tela.
4. Papel de professor mockado, sem privilegios administrativos no MVP.
5. Chat em tempo real via Data Channel, sem persistencia.
6. Tela de pre-join para testar camera e microfone.
7. Lista de participantes visivel durante a chamada.
8. Reconexao automatica em caso de instabilidade temporaria.
9. Ambiente completo executando via Docker Compose.
10. Operacao local inicial com HTTP/WS para simplificar a prova de conceito.

## Priorizacao

### P0 - Obrigatorio para o MVP funcional

1. Estrutura base do projeto.
2. Docker Compose funcional.
3. Backend de emissao de token.
4. Fluxo de entrada por interface.
5. Home com identidade visual inspirada no Notion em tema escuro.
6. Tela de pre-join.
7. Sala com audio e video.
8. Lista de participantes.
9. Compartilhamento de tela.
10. Reconexao basica.
11. Validacao dos criterios de aceite principais.

### P1 - Muito importante

1. Chat em tempo real.
2. Indicacao visual de papel de professor.
3. Validacao de nome unico por sala.
4. Tratamento melhor de loading, erro e estados de conexao.
5. Documentacao operacional basica.

### P2 - Endurecimento para producao

1. Nginx como proxy reverso com configuracao mais proxima de producao.
2. HTTPS/WSS.
3. Hardening de CORS e secrets.
4. Observabilidade basica.
5. Revisao de escalabilidade e operacao.

## Backlog por fases

## Fase 0 - Alinhamento de produto e escopo

### Epic: Definicao do MVP

1. Fechar a lista do que entra e do que fica fora da primeira entrega.
Critério de aceite: documento de escopo aprovado.

2. Consolidar decisoes de produto do MVP.
Critério de aceite: decisoes registradas para acesso livre, nome como identificacao, professor mockado, sem gravacao, sem agendamento e sem limite inicial de participantes.

3. Definir fluxo principal de uso da plataforma.
Critério de aceite: jornada documentada de home, pre-join, entrada, permanencia e saida da sala.

## Fase 1 - Fundacao tecnica

### Epic: Estrutura inicial do projeto

1. Criar estrutura base com `frontend`, `backend`, `docs` e arquivos raiz.
2. Configurar estrategia de variaveis de ambiente.
3. Criar `docker-compose.yml` inicial.
4. Criar `livekit.yaml` inicial.
5. Definir convencoes para ambiente local de prova de conceito.

Critério de aceite: `docker compose up --build` sobe a stack base sem erro em ambiente local.

## Fase 2 - Backend ASP.NET Core

### Epic: Emissao de token de acesso

1. Criar a Web API em ASP.NET Core 8.
2. Configurar dependencia `LiveKit.Server.SDK`.
3. Implementar endpoint `POST /api/tokens`.
4. Validar os campos `roomName`, `participantName` e `isTeacher`.
5. Gerar JWT com grants adequados do LiveKit.
6. Configurar CORS para o frontend.
7. Externalizar `LIVEKIT_API_KEY` e `LIVEKIT_API_SECRET`.
8. Padronizar respostas de sucesso e erro.
9. Definir estrategia para garantir nome unico por sala.

Critério de aceite: backend emite token valido para sala especifica sem expor credenciais ao cliente e rejeita entradas invalidas conforme regra acordada.

## Fase 3 - Entrada do usuario no frontend

### Epic: Fluxo de acesso a sala

1. Criar home page de entrada com visual inspirado no Notion em tema escuro.
2. Criar formulario para nome do participante.
3. Criar campo para nome da sala.
4. Definir mecanismo mockado para selecionar perfil.
5. Validar campos obrigatorios antes do redirecionamento.
6. Integrar formulario ao backend de token.
7. Redirecionar para a sala com tratamento de erro.
8. Impedir prosseguimento quando o nome ja estiver em uso na sala, caso a validacao seja feita antes da conexao.

Critério de aceite: usuario consegue entrar na sala sem depender de URL manual montada na mao.

## Fase 4 - Pre-join

### Epic: Preparacao antes da entrada na sala

1. Criar tela de pre-join.
2. Permitir testar camera e microfone antes de entrar.
3. Exibir preview local de audio e video.
4. Permitir entrar na sala somente apos confirmacao do usuario.

Critério de aceite: usuario consegue validar dispositivos antes de ingressar na sala.

## Fase 5 - Sala de videoconferencia

### Epic: Experiencia principal de aula ao vivo

1. Integrar `@livekit/components-react` no frontend.
2. Criar componente de sala.
3. Conectar ao LiveKit com token emitido pelo backend.
4. Exibir grade de participantes.
5. Habilitar ativacao e desativacao de camera.
6. Habilitar ativacao e desativacao de microfone.
7. Exibir lista de participantes visivel.
8. Exibir indicador visual de professor.
9. Exibir estados de carregamento, erro e desconexao.
10. Permitir sair da sala com retorno para a home.

Critério de aceite: dois usuarios entram na mesma sala e se veem e se ouvem com estabilidade.

## Fase 6 - Compartilhamento de tela

### Epic: Apresentacao de conteudo

1. Habilitar compartilhamento de tela.
2. Tratar recusas de permissao do navegador.
3. Ajustar layout para destacar o compartilhamento ativo.
4. Garantir que a alteracao de foco seja refletida para os demais participantes.

Critério de aceite: compartilhamento de tela funciona para todos e altera o foco do layout automaticamente.

## Fase 7 - Chat em tempo real

### Epic: Comunicacao textual da sala

1. Implementar envio de mensagens via Data Channel.
2. Implementar recebimento de mensagens em tempo real.
3. Criar painel de chat na interface da sala.
4. Exibir remetente e horario da mensagem.
5. Tratar estado vazio e novas mensagens.
6. Garantir que nao exista persistencia apos sair da sala.

Critério de aceite: dois participantes trocam mensagens em tempo real dentro da mesma sala.

## Fase 8 - Papeis e identidade de usuario

### Epic: Permissoes de professor

1. Aplicar o papel de professor no token e na interface.
2. Exibir indicacao visual de quem e professor.
3. Garantir que o papel seja apenas visual e sem privilegios especiais no MVP.

Critério de aceite: professor possui apenas identificacao visual coerente com a definicao atual de produto.

## Fase 9 - Resiliencia e reconexao

### Epic: Continuidade de sessao

1. Detectar perda temporaria de conexao.
2. Exibir estado de reconectando.
3. Permitir tentativa automatica de reconexao.
4. Validar retorno a sala sem reinicio manual da aplicacao.

Critério de aceite: instabilidades temporarias de rede nao encerram definitivamente a sessao do usuario.

## Fase 10 - Seguranca e operacao futura

### Epic: Prontidao de deploy

1. Definir arquitetura com HTTPS/WSS para fase posterior.
2. Configurar proxy reverso, certificado e roteamento seguro entre frontend, backend e LiveKit.
3. Revisar exposicao de portas por ambiente.
4. Revisar politica de CORS por ambiente.
5. Ajustar TTL e grants do token para menor privilegio necessario.
6. Definir logs basicos sem vazamento de credenciais.

Critério de aceite: plano de endurecimento definido para evolucao do ambiente local para seguro.

## Fase 11 - Qualidade e validacao

### Epic: Testes do MVP

1. Validar subida completa com `docker compose up --build`.
2. Validar acesso simultaneo de professor e aluno.
3. Validar tela de pre-join.
4. Validar audio e video bidirecional.
5. Validar compartilhamento de tela.
6. Validar chat em tempo real.
7. Validar lista de participantes.
8. Validar reconexao.
9. Validar fallback TCP quando aplicavel.
10. Documentar como executar, testar e solucionar problemas comuns.

Critério de aceite: criterios de aceite do documento final atendidos ponta a ponta.

## Dependencias entre etapas

1. A emissao de token depende da configuracao correta do LiveKit e das credenciais.
2. O fluxo de entrada depende do backend pronto para emissao de token.
3. A sala depende do frontend integrado ao backend e ao servidor LiveKit.
4. O compartilhamento de tela depende da sala funcional.
5. O chat depende da sessao conectada via LiveKit.
6. A identificacao de professor depende apenas da regra mockada escolhida para o MVP.
7. A futura adocao de HTTPS/WSS depende da estrategia de proxy e certificado adotada.

## Riscos e lacunas identificados

1. O guia tecnico inicial usa `http://` e `ws://`, e isso passa a ser aceito no MVP local inicial para simplificar a prova de conceito.
2. Nome unico por sala exigira validacao adicional no backend, no LiveKit ou na experiencia de entrada.
3. O chat aparece no documento final, mas nao aparece na implementacao inicial proposta.
4. Nao ha autenticacao real de usuario definida, apenas identificacao por nome.
5. Nao ha definicao de persistencia de historico de chat, auditoria ou agendamento porque isso ficou fora do MVP.
6. A tela de pre-join e a homepage escura inspirada no Notion passam a fazer parte explicita da interface minima.

## Decisoes fechadas

1. O MVP tera apenas entrada por nome, sem autenticacao real.
2. O acesso a sala sera livre no primeiro momento.
3. O papel de professor sera mockado.
4. O professor nao tera privilegios administrativos no MVP.
5. O chat sera apenas em tempo real, sem persistencia.
6. A homepage seguira uma identidade visual inspirada no Notion em tema escuro.
7. O MVP nao precisa suportar mobile na primeira entrega.
8. O ambiente inicial sera apenas local.
9. HTTPS/WSS fica para fase seguinte.
10. Gravacao de aula fica fora do MVP.
11. O acesso sera por entrada direta usando nome da sala.
12. Nao havera limite inicial de participantes por sala no MVP.
13. O nome do participante deve ser unico por sala.
14. Havera tela de pre-join para testar camera e microfone.
15. A lista de participantes deve ser visivel.
16. Nao serao implementadas metricas, analytics ou logs de acesso no primeiro momento.
17. A infraestrutura alvo, por enquanto, e totalmente local.
18. O objetivo e entregar um MVP local de prova de conceito.

## Sugestao de ordem de execucao

1. Montar estrutura base e Docker Compose para ambiente local.
2. Implementar backend de emissao de token e regra de nome unico por sala.
3. Implementar home em tema escuro inspirado no Notion.
4. Implementar fluxo de entrada e tela de pre-join.
5. Implementar sala com audio, video, lista de participantes e identificacao visual de professor.
6. Implementar compartilhamento de tela.
7. Implementar chat em tempo real.
8. Validar reconexao e estabilidade.
9. Validar criterios de aceite e documentacao do MVP local.
10. Planejar evolucao futura para HTTPS/WSS.
