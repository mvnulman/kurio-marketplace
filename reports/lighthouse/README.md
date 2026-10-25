# Relatórios Lighthouse

Artefatos gerados por `pnpm lighthouse` (build de produção com mocks no cenário
`default`, 3 medições por página/perfil, mediana reportada):

- `<page>-<profile>-run<n>.report.html` — relatório completo por medição
- `<page>-<profile>-run<n>.report.json` — LHR em JSON
- `summary.json` — medianas por categoria + LCP/CLS/TBT

Metas: Performance ≥ 90 · Accessibility ≥ 95 · Best Practices ≥ 95 · SEO ≥ 90.

> Nota de ambiente: as medições desta máquina carregam a interferência do antivírus
> local (injeção de `gc.kis.v2.scr.kaspersky-labs.com` em páginas HTTP), que penaliza
> `is-on-https`/`unminified-javascript` e infla a latência. Medidas em HTTPS
> (deploy) refletem o aplicativo real. Detalhes e causas em `ARCHITECTURE.md`.
