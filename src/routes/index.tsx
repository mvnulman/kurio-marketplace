import { createFileRoute } from '@tanstack/react-router'

import { catalogSearchSchema } from '@/features/catalog/search'

export const Route = createFileRoute('/')({
  validateSearch: (search) => catalogSearchSchema.parse(search),
  head: () => ({
    meta: [{ title: 'KURIO — Seja dono do futuro da arte digital' }],
  }),
  component: HomePlaceholder,
})

function HomePlaceholder() {
  return (
    <section className="container-page py-24">
      <p className="text-accent text-xs tracking-[0.2em] uppercase">Bem-vindo à Kurio</p>
      <h1 className="text-display mt-4 max-w-xl font-bold uppercase">
        Seja dono do futuro da arte digital
      </h1>
      <p className="text-muted-foreground mt-6 max-w-lg text-sm">
        Fundação do projeto: tipografia, cores, componentes base, sessão e roteamento prontos.
      </p>
    </section>
  )
}
