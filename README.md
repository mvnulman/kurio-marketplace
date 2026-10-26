# KURIO — Marketplace de NFTs

Implementação do [desafio frontend da Jungle Gaming](https://github.com/junglegaming/frontend-challenge):
marketplace de NFTs com descoberta, compra e conta do colecionador, desktop e mobile,
tudo funcionando sobre uma API simulada (MSW) com tempo real em Socket.IO.

- **Demo online:** <https://kurio-marketplace-beryl.vercel.app>
- **Repositório:** <https://github.com/mvnulman/kurio-marketplace>
- **Documentação de arquitetura:** [`ARCHITECTURE.md`](./ARCHITECTURE.md)

## Stack obrigatória (efetivamente usada)

| Responsabilidade | Tecnologia |
| --- | --- |
| Interface | React 19 |
| Linguagem | TypeScript (strict) |
| Build | Vite 8 |
| Roteamento | TanStack Router (file-based, search params tipados) |
| Estado remoto | TanStack Query v5 |
| Cliente HTTP | Axios (+ interceptores) |
| Tempo real | Socket.IO (`socket.io-client`) |
| Estilização | Tailwind CSS v4 |
| Componentes | shadcn/ui (Radix + CVA + tailwind-merge) |
| Mocking | MSW 2 + `@mswjs/socket.io-binding` |
| Testes E2E + regressão visual | Playwright |
| Auditoria | Lighthouse 13 (programático) |

## Comandos

```bash
pnpm install
pnpm assets          # regenera as imagens dos NFTs (a partir de assets-source/)
pnpm dev             # desenvolvimento com mocks (http://localhost:5173)
pnpm build           # typecheck + build de produção
pnpm preview         # serve o build (http://localhost:4173)
pnpm typecheck
pnpm lint
pnpm format
pnpm test:e2e        # Playwright (desktop + mobile, mocks ligados)
pnpm test:e2e:ui     # interface interativa dos testes
pnpm test:e2e:report # relatório HTML das últimas execuções
pnpm lighthouse      # auditoria (3 medições por página/perfil)
```

> Para os testes E2E, instale o navegador antes da primeira execução:
> `pnpm exec playwright install --with-deps chromium` (no Windows, sem `--with-deps`).

## Variáveis de ambiente

Copie `.env.example` para `.env.local` (os padrões já rodam 100% com mocks):

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `VITE_ENABLE_MOCKS` | `true` | Liga MSW + Socket.IO simulado |
| `VITE_API_URL` | `/api` | Base URL do Axios |
| `VITE_SOCKET_URL` | mesma origem | URL do servidor Socket.IO |
| `VITE_MOCK_SCENARIO` | `default` | Cenário inicial de rede/falhas |

## Credenciais fictícias

| Conta | E-mail | Senha | Uso |
| --- | --- | --- | --- |
| Ana | `ana@kurio.art` | `kurio123` | favoritos, pedidos e carteiras pré-populados |
| Bia | `bia@kurio.art` | `kurio456` | troca de usuário e isolamento de dados |

No formulário de login há um botão **"Preencher credenciais"** com a conta da Ana.
O cadastro também pode criar contas novas (conflitos de e-mail/usuário são tratados).

## Cenários de demonstração

Três formas equivalentes de ativar:

1. **Painel flutuante "Cenários"** (canto inferior esquerdo, visível com mocks): troca
   de cenário, alteração de preço (+15%), esgotamento de edição, expiração de sessões
   e reset dos dados.
2. **URL**: `?scenario=slow` (aplica e persiste), `?reset=1` (restaura os dados).
3. **API de dev**: `POST /api/dev/scenario`, `POST /api/dev/reset`, etc.

| Cenário | O que exercita |
| --- | --- |
| `default` | fluxo completo feliz |
| `slow` | skeletons com shimmer (catálogo, detalhe, carrinho, checkout) |
| `variable` | latência variável / respostas fora de ordem |
| `flaky` | falha 503 na 1ª chamada de cada endpoint e recuperação na repetição |
| `offline` | indisponibilidade de conexão (erro de rede) |
| `empty` | estado vazio do catálogo |
| `session-expired` | expiração de sessão em navegação e checkout |
| `payment-declined` | pagamento recusado com carrinho preservado |
| `payment-timeout` | timeout após criação do pedido + recuperação por idempotência |

### Fluxos de falha reprodutíveis

- **Falha em favorito:** cenário `flaky` → clique em favoritar → toast de erro +
  rollback → clique novamente → sucesso.
- **Preço muda com carrinho aberto:** adicione uma obra ao carrinho → painel Cenários
  → "Eventos em tempo real" → `+15%` → toast + resumo atualizado.
- **Checkout com cotação desatualizada:** carregue o checkout → `+15%` no painel →
  "Confirmar compra" → dialog "os valores mudaram" → revisar carrinho → confirmar de novo.
- **Timeout + idempotência:** cenário `payment-timeout` → confirme → o pedido fica
  "em processamento" → "Ver meus pedidos" → o recibo aparece sem nova compra
  (exatamente 1 pedido).
- **Sessão expirada:** cenário `session-expired` → navegue para `/profile` → login →
  retorno para a rota original.

## Deploy

Publicado na [Vercel](https://vercel.com/docs/frameworks/frontend/vite) via import do
repositório GitHub (build `pnpm build`, saída `dist`):

- **URL pública:** <https://kurio-marketplace-beryl.vercel.app>
- Reescrita de rotas para SPA direto no `vercel.json` (acesso direto e refresh funcionam).
- Alternativas aceitas: Netlify (`netlify.toml` incluído) e Cloudflare Pages.
- A versão publicada roda com `VITE_ENABLE_MOCKS=true`: mocks e fluxos de tempo real
  funcionam na demonstração.

## Estrutura

```
src/
  components/   # ui/ (shadcn), layout/ (header/footer/shell), common/ (cards, toasts…)
  features/     # catalog, favorites, cart, checkout, orders, account, auth, realtime
  lib/          # contracts/, api/, http/, money, format, storage, query-client
  mocks/        # db, fixtures, handlers/, socket, scenario, realtime/bus
  routes/       # rotas file-based (TanStack Router)
e2e/            # specs Playwright + baselines de regressão visual
scripts/        # prepare-assets, lighthouse
reports/        # relatórios Lighthouse (html/json/summary)
```

Cada etapa do projeto está em um commit próprio; `ARCHITECTURE.md` registra
contratos, decisões e limitações em detalhe.
