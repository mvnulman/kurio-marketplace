import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: HomePlaceholder,
})

function HomePlaceholder() {
  return (
    <section className="container-page py-24">
      <p className="text-accent text-xs tracking-[0.2em] uppercase">Bem-vindo à Kurio</p>
      <h1 className="text-display mt-4 max-w-xl font-bold uppercase">
        Own the future of digital art
      </h1>
      <p className="text-muted-foreground mt-6 max-w-lg text-sm">
        Fundação do projeto: tipografia, cores, componentes base e roteamento prontos.
      </p>
    </section>
  )
}
