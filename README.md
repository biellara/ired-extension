# Ired Omnichannel AI — Monorepo (Starter)

Monorepo inicial com:
- **apps/extension**: Extensão MV3 (Chrome/Edge/Brave/Opera) com overlay simples (vanilla JS) + integração WS (SignalR) → envia para API.
- **apps/api**: API Fastify (Node+TS) com `/analyze` (stub Gemini), validação Zod e redaction LGPD.
- **packages/shared-types**: Tipos/contratos compartilhados (TS).

> **Stack enxuta** para começar rápido: sem bundler na extensão (apenas TypeScript compilado p/ JS), overlay em vanilla JS, e API com Fastify+TSX.

## Requisitos
- Node.js 18+
- PNPM 9+

## Setup
```bash
pnpm i
pnpm -w run dev
```
Isso sobe:
- **API** em `http://localhost:8787`
- **Extension**: gere o build e carregue como "Unpacked" no Chrome/Edge:
  ```bash
  pnpm --filter @ired/extension run build
  ```
  Depois: Chrome → `chrome://extensions` → *Developer mode* → *Load unpacked* → selecione `apps/extension/dist`.

## Configuração da Extensão
- Clique no ícone → *Options*; ou `chrome://extensions` → *Details* → *Extension options*.
- Preencha:
  - **TEAM KEY**: sua chave de equipe (string simples).
  - **API BASE**: `http://localhost:8787` (ou sua URL em produção).

## Teste Rápido
1. Abra o ERP: `https://erp.iredinternet.com.br/`.
2. Abra qualquer conversa de atendimento e troque mensagens.
3. O overlay (lateral direita) deve aparecer. A cada mensagem do **cliente**, a extensão envia um lote para `/analyze`.
4. A API (stub) retorna JSON com `sentiment`, `summary`, etc., que o overlay exibe.

## Ambientes
- `.env` no `apps/api` (veja `.env.example`).
- **LGPD**: redaction **ON** por padrão no backend.

## Estrutura
```
apps/
  extension/
    dist/ (build)
    src/
      background/
      content/
      options/
  api/
    src/
packages/
  shared-types/
```
