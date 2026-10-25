# Arquitetura — KURIO Marketplace de NFTs

Documento de referência da entrega: decisões de arquitetura, contratos simulados,
política de sessão/estado, estratégia de cache, limitações e desvios do Figma.

## 1. Visão geral

SPA em **React 19 + TypeScript** com **Vite 8**, file-based routing (**TanStack
Router**), estado remoto (**TanStack Query**), cliente HTTP (**Axios**), tempo real
(**Socket.IO**) e estilização **Tailwind CSS v4** com primitivas estilo
**shadcn/ui** (Radix + CVA). Toda a "backend" é simulada na rede via **MSW**
(handlers REST + servidor Socket.IO sobre interceptação de WebSocket), com estado
persistido em `localStorage` e cenários determinísticos.

```
src/
  components/     # ui/ (primitivas shadcn), layout/ (header/footer/shell), common/
  features/
    catalog/      # busca, filtros, ordenação, paginação, detalhe do NFT
    favorites/    # mutation otimista com rollback
    cart/         # queries/mutations do carrinho + resumo
    checkout/     # perfil, carteiras, cotação congelada, pedido
    orders/       # recibos e listagem de pedidos
    account/      # perfil, avatar, senha, carteiras
    auth/         # sessão, login, registro, guards
    realtime/     # provider de eventos + reconciliação
  lib/
    contracts/    # tipos de domínio e DTOs (fonte única de verdade)
    api/          # chamadas REST tipadas
    http/         # Axios, interceptores, normalização de erros
    realtime/     # cliente Socket.IO
    money.ts      # aritmética decimal (Decimal.js, strings ETH)
  mocks/          # db, fixtures, handlers REST, socket, cenários
  routes/         # rotas file-based (TanStack Router)
```

Princípios adotados: contratos tipados ponta a ponta (transporte → estado → UI),
nenhum caminho alternativo de negócio nos componentes (mocks vivem só na camada de
rede), erros normalizados (`ApiError` com `code/status/fieldErrors/meta`),
estados de carregamento/vazio/erro em todas as telas de dados e feedback acessível
via toasts (`aria-live` no container do sonner + `role="alert"` nos erros de campo).

## 2. Contratos REST

Base: `VITE_API_URL` (padrão `/api`). Cabeçalhos padrão: `Authorization: Bearer <token>`
em rotas privadas, `X-Cart-Id: <guest-id>` sempre, `X-Request-Id` para tracing
(ecoado em todos os erros).

| Recurso | Operações | Observações |
| --- | --- | --- |
| `POST /auth/login` | `{ email, password }` → `{ session }` | valida credenciais; mescla carrinho de visitante |
| `POST /auth/register` | `{ username, email, password }` → `{ session }` | `409 CONFLICT` com `fieldErrors.username/email` |
| `GET /auth/session` | → `{ session }` | recupera sessão após refresh |
| `POST /auth/logout` | 204 | invalida o token no servidor |
| `GET /nfts?q&category&network&collection&rarity&minPrice&maxPrice&sort&page&pageSize` | → `CatalogResponse` | filtros combináveis, facetas e paginação; `page` clampada à última |
| `GET /nfts/:nftId` | → `{ nft, related, reviews }` | `404 NOT_FOUND` para inexistente |
| `GET /favorites` · `PUT/DELETE /favorites/:nftId` | → `{ ids, items }` | exigem autenticação |
| `GET /cart` | → `{ cart }` | carrinho do usuário ou do visitante (`X-Cart-Id`) |
| `POST /cart/items` | `{ nftId, quantity }` | `409 OUT_OF_STOCK` quando acima do disponível |
| `PATCH /cart/items/:nftId` | `{ quantity }` | `0` remove o item |
| `DELETE /cart/items/:nftId` | | |
| `POST /cart/coupon` · `DELETE /cart/coupon` | `{ code }` | `400 COUPON_INVALID` / `410 COUPON_EXPIRED` |
| `GET /cart/quote` | → `{ quote }` | subtotal, desconto, taxa de rede e total; `cartVersion` |
| `POST /orders` | `CreateOrderInput` + `Idempotency-Key` | criação idempotente (seção 4) |
| `GET /orders` · `GET /orders/:orderId` | → lista/recibo | isolados por usuário; `404` para pedido de outro |
| `GET/PUT /profile` · `PUT /profile/password` · `PUT /profile/avatar` | perfil | `avatarUrl: ""` remove o avatar |
| `GET/POST /wallets` · `PUT/DELETE /wallets/:walletId` | carteiras | no máximo principal + secundária |
| `POST /dev/*` | painel de demonstração/testes | ver seção 6 |

Todos os erros seguem `ApiErrorBody`:

```json
{ "code": "VALIDATION_ERROR", "message": "…", "fieldErrors": { "campo": "…" },
  "meta": { "quote": { "…": "quando QUOTE_OUTDATED" } }, "requestId": "…" }
```

Códigos representados: `VALIDATION_ERROR`, `UNAUTHORIZED`, `SESSION_EXPIRED`,
`FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `OUT_OF_STOCK`, `QUOTE_OUTDATED`,
`COUPON_INVALID`, `COUPON_EXPIRED`, `IDEMPOTENCY_CONFLICT`, `NETWORK_ERROR`,
`TIMEOUT`, `SERVER_ERROR`.

### Dinheiro

Valores em ETH trafegam como **string decimal** (`EthAmount`) e toda aritmética usa
`Decimal.js` (precisão 40, `ROUND_HALF_UP`), com normalização para até 6 casas e
apresentação sem perda de precisão (`lib/money.ts`). Quantidades são inteiras
(1–99) e a taxa de rede é `0.008 ETH` por linha (exibida como "Taxa estimada").

## 3. Sessão e conta

- Token opaco (`sess_…`) gerado no login/registro, válido por 8h, guardado em
  `localStorage` (`kurio:session-token`) — documentado como "sessão recuperável
  após refresh".
- Expiração: o servidor valida `expiresAt` por request; respostas `401
  SESSION_EXPIRED` disparam o handler global (`onUnauthorized`): limpa o token,
  `queryClient.clear()` e redireciona para `/login?redirect=<rota atual>&reason=session-expired`,
  preservando o contexto para retomada (o login volta para `redirect`).
- Isolamento: logout e troca de usuário executam `queryClient.clear()` — nenhum
  dado privado (carrinho, favoritos, pedidos, perfil, carteiras) sobrevive em cache;
  o socket da sessão anterior é re-autenticado com o novo token no handshake.
- Rotas privadas (`/checkout`, `/orders/*`, `/profile/*`) usam `beforeLoad` +
  `requireSession`; sem token → `/login` preservando destino.
- Formulários (login, cadastro, perfil, senha, carteiras) validam com zod +
  react-hook-form; erros do servidor chegam mapeados por campo via `fieldErrors`.
- No mock, senhas nunca são persistidas em claro: SHA-256 + salt por usuário.

## 4. Carrinho, cotação e pedidos

- Carrinho vive no servidor simulado, chaveado por `user:<id>` ou `guest:<X-Cart-Id>`;
  o id de visitante é persistido em `localStorage`, o que mantém o carrinho após
  refresh e permite a **mescla no login** (quantidades clampadas ao disponível).
- Totais são sempre recalculados pelo servidor (preço, cupom, taxas) — a UI nunca
  calcula valores monetários por conta própria.
- `cart.version` incrementa em qualquer mutation ou mudança de preço/estoque que
  afete itens do carrinho; `quote.cartVersion` é a "versão" apresentada ao usuário.
- **Cotação congelada no checkout**: a página captura a cotação na entrada e não
  re-renderiza valores com mudanças em background; ao confirmar, o cliente revalida
  via `GET /cart/quote` e o servidor rejeita `cartVersion` divergente com
  `409 QUOTE_OUTDATED` + cotação atual em `meta.quote` — a UI exige nova revisão
  e confirmação do usuário (requisito de checkout com cotação desatualizada).
- **Idempotência**: `POST /orders` exige `Idempotency-Key`. A mesma chave + mesmo
  conteúdo devolve o mesmo pedido (`replayed: true`); mesma chave + conteúdo
  diferente → `409 IDEMPOTENCY_CONFLICT`. Após um timeout simulado, repetir a
  confirmação consulta o pedido criado sem duplicar.
- Ciclo do pedido: `pending` (estoque reservado) → `confirmed` (itens comprados são
  removidos do carrinho, apenas nas quantidades adquiridas) ou `failed` (estoque
  devolvido, carrinho preservado). Estados confirmados/recusados são terminais.
- O recibo reproduz o **snapshot** do pedido (itens, preços, taxas, total, hash,
  carteira): mudanças posteriores no catálogo não o alteram. "Ver no Etherscan" e o
  hash são simulados e explicitamente rotulados como tais.

## 5. Tempo real (Socket.IO)

- Cliente: `socket.io-client` com `transports: ['websocket']` e token de sessão na
  query de handshake. Eventos: `nft.updated` e `order.updated`.
- Envelope do evento: `{ id, type, resource: { kind, id }, version, emittedAt, payload }`
  — identidade estável, recurso afetado e versão monotônica.
- O cliente mantém `lastVersionByResource` e **descarta duplicatas e eventos antigos**
  (`version <= última aplicada`), sem regredir estado nem reaplicar efeitos.
- `nft.updated` atualiza listas do catálogo, detalhe e caches de favoritos; se a obra
  está no carrinho, invalida carrinho/cotação e avisa o usuário (preço novo ou
  esgotamento) — com silêncio para eventos de compra/reserva própria.
- `order.updated` atualiza a tela do pedido (pendente → confirmado/recusado),
  invalida a listagem de pedidos e emite feedback acessível (toast com ação
  "Ver recibo"). A confirmação só é exibida quando o status é efetivamente confirmado.
- Reconexão: no `connect` o cliente invalida catálogo/carrinho/conta/favoritos e
  reconcilia com a REST; no `pagehide` o socket é encerrado (compatibilidade com
  bfcache) e restaurado no `pageshow`.
- Listeners são liberados no cleanup do provider; mutations disparadas por eventos
  não duplicam operações (guarda por versão + idempotência).

## 6. Mocks (MSW)

- `setupWorker` com handlers REST + `ws.link('/')` + `@mswjs/socket.io-binding`.
  A camada é ativada por configuração (`VITE_ENABLE_MOCKS`, padrão ativo) e
  participa do build de demonstração publicado.
- Banco simulado (`mocks/db.ts`) com estado derivado de fixtures determinísticas
  (24 NFTs, 2 contas, carteiras, avaliações), persistido em `localStorage`
  (`kurio:mock-db:v2`) para sustentar refresh. `resetMockDb` restaura o cenário
  completo (dados, sessões, carrinhos, pedidos, idempotência).
- Falhas injetadas de forma determinística por cenário (seção abaixo), nunca por
  componentes; o cliente Axios normaliza sem lógica alternativa.
- Eventos emitidos no bus (`mocks/realtime/bus.ts`) são entregues por REST **e**
  por Socket.IO: mudanças de preço/estoque (incl. esgotamento) e transições de
  pedido atualizam respostas e eventos equivalentes.

### Cenários (`?scenario=` ou painel "Cenários" / `POST /dev/scenario`)

| Cenário | Comportamento |
| --- | --- |
| `default` | latência curta; sucesso |
| `slow` | ~1,5s por request (skeletons) |
| `variable` | 250/700/1200ms em ciclo (respostas fora de ordem) |
| `flaky` | primeira chamada de cada endpoint → `503`; repetição funciona |
| `offline` | falha de rede em tudo (`HttpResponse.error`) |
| `empty` | catálogo vazio |
| `session-expired` | rotas autenticadas → `401 SESSION_EXPIRED` |
| `payment-declined` | pedido criado e recusado na simulação |
| `payment-timeout` | pedido criado, resposta `504`; reenvio recupera |

Ações adicionais: `POST /dev/nfts/:id/price` (altera preço/estoque e emite evento),
`POST /dev/nfts/:id/sold-out`, `POST /dev/orders/:id/resolve`, `POST /dev/session/expire`,
`POST /dev/reset`, `GET /dev/state`. O painel flutuante "Cenários" (só com mocks)
expõe tudo isso na interface.

## 7. Estado e cache (TanStack Query)

- `staleTime` 30s / `gcTime` 10min por padrão; sessão 5min; cotação do checkout
  `staleTime: Infinity` (congelada, ver seção 4).
- Retries: 2 para falhas transientes/5xx, **0 para 4xx** (`ApiError`); mutations sem retry.
- Cancelamento: `queryFn` recebe `AbortSignal` do Axios; troca de filtro cancela a
  consulta anterior e chaves por parâmetro garantem que respostas obsoletas não
  sobrescrevam estado (inclusive com `variable`/latências invertidas).
- Invalidação por domínio pós-mutation/eventos (catálogo, carrinho, cotação, conta,
  favoritos, pedidos) — sempre a partir da fonte da verdade (servidor simulado).
- **Atualização otimista**: favoritos (catálogo + detalhe + favoritos) com
  `onMutate` snapshot e rollback em `onError`, além de toast de erro acessível.
- Isolamento por usuário: `queryClient.clear()` no logout/troca de usuário; dados
  privados são consultados apenas com token válido (`enabled` + 401 global).
- Cache de listas/detalhe mapeado por chaves estáveis (`catalogKeys`, `cartKeys`,
  `accountKeys`, `sessionKeys`, `favoriteKeys`).

## 8. Interface, acessibilidade e desvios do Figma

- Tipografia Roboto Mono auto-hospedada (fontsource), paleta e raios derivados das
  variáveis do arquivo (ink, surface-card, primary/accent, border/border-soft).
- Adaptações conscientes (registradas aqui por transparência):
  - Login/cadastro: o Figma desenha os formulários em modal sobre a home; a entrega
    usa páginas dedicadas com o mesmo cartão (melhor para acesso direto, foco e
    histórico). Os botões de social mostram aviso de fora do escopo.
  - Sidebar de filtros ganhou chips de categoria/raridade para filtros combináveis
    (o Figma só desenha coleções, preço e rede).
  - Formulário de carteiras foi reduzido aos campos de carteira (o Figma reaproveita
    campos do checkout).
  - Header é sticky (o Figma o posiciona estático).
  - Recibos exibem "Ver no Etherscan" como ação simulada com aviso explícito.
- Acessibilidade: skip link, foco visível em todo o app, controle de foco nos
  diálogos/sheets (Radix), labels + `aria-invalid`/`aria-describedby` + `role="alert"`,
  progressbar para edições, `aria-live` para contadores e status, alternativas
  textuais para imagens relevantes, contraste ≥ 4.5:1 nas cores de texto, estados
  não dependentes apenas de cor (badges com texto), sem overflow horizontal em
  390/768/1440 e `prefers-reduced-motion` respeitado (shimmer/scroll/zoom).

## 9. Assets

- Artes base exportadas do arquivo Figma (4 originais em `assets-source/`).
  O layout reaproveita as artes com variações de cor; `pnpm assets`
  (`scripts/prepare-assets.mjs`) gera as 24 variações `.webp` (720px) de forma
  determinística. Nenhuma URL do Figma permanece no código.
- Ícones: lucide-react + marcas sociais em `brand-icons.tsx` (SVG próprio).

## 10. Testes e auditorias

- Playwright (`e2e/`): catálogo/URL, carrinho, conta/sessão/isolamento, favoritos
  com falha+recuperação, compra completa, recusado, timeout com idempotência,
  cliques duplicados, cotação desatualizada, tempo real via socket, teclado/foco,
  skeletons com latência e regressão visual (baselines por projeto).
- Lighthouse (`pnpm lighthouse`): início + detalhe, mobile/desktop, 3 medições,
  mediana por categoria em `reports/lighthouse/summary.json` com relatórios
  HTML/JSON versionáveis.

## 11. Limitações conhecidas

1. **Transporte do socket simulado**: o binding do MSW intercepta apenas WebSocket;
   o cliente é fixado em `transports: ['websocket']` (sem upgrade de polling).
   Namespaces customizados e salas não são suportados pelo wrapper. Além disso,
   o engine.io captura o `WebSocket` global na inicialização do módulo — por isso o
   cliente é importado dinamicamente no primeiro uso, depois da ativação do Service
   Worker (com import estático o handshake caía no servidor estático e virava HTTP 200).
2. **Ambiente de auditoria local**: o antivírus da máquina de desenvolvimento
   injeta scripts `http://gc.kis.v2.scr.kaspersky-labs.com/...` nas páginas servidas
   localmente, o que derruba as auditorias `is-on-https`/`unminified-javascript`
   (Best Practices) e infla a latência medida. Em ambiente limpo/HTTPS esses
   indicadores refletem o app real (ver `reports/lighthouse/README.md`).
3. `bf-cache`: o Service Worker do MSW se desregistra quando a página entra no
   bfcache — apontado pelo Lighthouse como "Not actionable".
4. `mockServiceWorker.js` é distribuído sem minificação por design do MSW.
5. Formulários de pagamento/carteiras simulam conexão de forma determinística
   (conexão com sucesso, desconexão manual e recusa no pagamento); não há QR Code
   de WalletConnect ou assinatura real.
