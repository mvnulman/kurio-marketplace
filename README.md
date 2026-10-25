# KURIO — Marketplace de NFTs

Implementação do [desafio frontend da Jungle Gaming](https://github.com/junglegaming/frontend-challenge):
um marketplace de NFTs com descoberta, compra e conta do colecionador, construído em React +
TypeScript sobre a stack obrigatória do enunciado.

> Documentação completa de arquitetura, contratos, cenários de mock e decisões de UX:
> [`ARCHITECTURE.md`](./ARCHITECTURE.md) e [`README.md`](./README.md) (seções abaixo).

## Stack

| Responsabilidade | Tecnologia |
| --- | --- |
| Interface | React 19 |
| Linguagem | TypeScript |
| Build | Vite |
| Roteamento | TanStack Router (file-based) |
| Estado remoto | TanStack Query |
| Cliente HTTP | Axios |
| Tempo real | Socket.IO (`socket.io-client`) |
| Estilização | Tailwind CSS v4 |
| Componentes | shadcn/ui (Radix + CVA) |
| Mocks | MSW + `@mswjs/socket.io-binding` |
| Testes | Playwright |
| Auditoria | Lighthouse |

## Comandos

```bash
pnpm install
pnpm dev          # desenvolvimento com mocks
pnpm build        # build de produção
pnpm preview      # serve o build (porta 4173)
pnpm typecheck
pnpm lint
pnpm test:e2e
pnpm lighthouse
```

## Variáveis de ambiente

Copie `.env.example` para `.env.local`. Os valores padrão já rodam a aplicação inteira com mocks.

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `VITE_ENABLE_MOCKS` | `true` | Ativa MSW + Socket.IO simulado |
| `VITE_API_URL` | `/api` | Base URL do cliente Axios |
| `VITE_MOCK_SCENARIO` | `default` | Cenário inicial de rede/falhas |
| `VITE_SOCKET_URL` | mesma origem | URL do Socket.IO |

## Estrutura

```
src/
  components/   # design system (ui/) e componentes de domínio
  features/     # catálogo, carrinho, checkout, conta, tempo real
  lib/          # contratos, http, formatação, utilitários
  mocks/        # MSW handlers, fixtures, cenários e socket simulado
  routes/       # rotas file-based do TanStack Router
```

Em construção — cada etapa é entregue em um commit próprio.
