import { useQuery } from '@tanstack/react-query'
import { Beaker, Loader2, RotateCcw, Sparkles, Wand2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { MOCK_SCENARIOS } from '@/lib/contracts/dev'
import type { MockScenario } from '@/lib/contracts/dev'
import {
  expireSession,
  fetchMockState,
  resetMocks,
  setNftPrice,
  setNftSoldOut,
  setScenario,
  type MockState,
} from '@/lib/api/dev'
import { useCatalogQuery } from '@/features/catalog/queries'
import { env } from '@/lib/env'
import { queryClient } from '@/lib/query-client'

/**
 * Painel de demonstração: permite avaliar cenários de rede/falha e eventos
 * em tempo real sem ferramentas externas. Disponível apenas com mocks ativos.
 */
export function DemoPanel() {
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState<MockScenario | null>(null)
  const state = useQuery<MockState>({ queryKey: ['mock-state'], queryFn: fetchMockState })
  const catalog = useCatalogQuery({ sort: 'recent', page: 1, pageSize: 9 })

  if (!env.enableMocks) return null

  async function applyScenario(scenario: MockScenario) {
    setBusy(scenario)
    try {
      await setScenario(scenario)
      await state.refetch()
      void queryClient.invalidateQueries()
      toast.success(`Cenário "${scenario}" ativado.`)
    } catch {
      toast.error('Não foi possível trocar o cenário.')
    } finally {
      setBusy(null)
    }
  }

  async function reset() {
    setBusy('default')
    try {
      await resetMocks()
      void queryClient.invalidateQueries()
      await state.refetch()
      toast.success('Dados de demonstração restaurados.')
    } finally {
      setBusy(null)
    }
  }

  async function changePrice(nftId: string) {
    const nft = catalog.data?.items.find((item) => item.id === nftId)
    if (!nft) return
    const bumped = (Number(nft.priceEth) * 1.15).toFixed(2)
    await setNftPrice(nftId, bumped)
    toast.success(`${nft.name}: novo preço ${bumped} ETH (evento enviado).`)
  }

  async function soldOut(nftId: string) {
    const nft = catalog.data?.items.find((item) => item.id === nftId)
    if (!nft) return
    await setNftSoldOut(nftId)
    toast.success(`${nft.name}: edição esgotada (evento enviado).`)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Abrir painel de cenários de demonstração"
          className="border-border/70 bg-background/90 hover:border-primary fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full border px-4 py-2 text-[10px] tracking-[0.1em] uppercase shadow-xl backdrop-blur"
        >
          <Beaker className="text-accent size-3.5" aria-hidden="true" />
          Cenários
        </button>
      </SheetTrigger>

      <SheetContent
        side="right"
        title="Painel de demonstração"
        description="Cenários determinísticos e eventos em tempo real (MSW + Socket.IO simulado)"
      >
        <div className="space-y-8 p-5">
          <section aria-labelledby="demo-scenario">
            <h2 id="demo-scenario" className="text-xs font-bold tracking-[0.08em] uppercase">
              Cenário de rede
            </h2>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="muted">Atual: {state.data?.scenario ?? '…'}</Badge>
              {busy ? <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> : null}
            </div>
            <ul className="mt-4 space-y-2">
              {MOCK_SCENARIOS.map((scenario) => (
                <li key={scenario.id}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-auto w-full flex-col items-start gap-1 py-2 text-left"
                    disabled={busy !== null}
                    onClick={() => {
                      void applyScenario(scenario.id)
                    }}
                  >
                    <span className="text-[11px] font-bold">{scenario.label}</span>
                    <span className="text-muted-foreground block text-[10px] normal-case">
                      {scenario.description}
                    </span>
                  </Button>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="demo-events">
            <h2 id="demo-events" className="text-xs font-bold tracking-[0.08em] uppercase">
              Eventos em tempo real
            </h2>
            <p className="text-muted-foreground mt-2 text-[10px] leading-relaxed">
              Dispara <code>nft.updated</code> via Socket.IO. Adicione uma obra ao carrinho para ver
              o efeito no resumo.
            </p>
            <ul className="mt-3 space-y-2">
              {(catalog.data?.items ?? []).slice(0, 5).map((nft) => (
                <li
                  key={nft.id}
                  className="border-border/60 flex items-center justify-between gap-2 rounded-md border p-2"
                >
                  <span className="min-w-0 flex-1 truncate text-[10px]">{nft.name}</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      void changePrice(nft.id)
                    }}
                  >
                    <Wand2 aria-hidden="true" />
                    +15%
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      void soldOut(nft.id)
                    }}
                  >
                    Esgotar
                  </Button>
                </li>
              ))}
            </ul>
          </section>

          <section aria-labelledby="demo-session" className="space-y-2">
            <h2 id="demo-session" className="text-xs font-bold tracking-[0.08em] uppercase">
              Sessão
            </h2>
            <Button
              variant="destructive"
              size="sm"
              className="w-full"
              onClick={() => {
                void expireSession().then(() => toast.info('Sessões expiradas. Navegue para ver o 401.'))
              }}
            >
              <Sparkles aria-hidden="true" />
              Expirar sessões
            </Button>
            <Button variant="outline" size="sm" className="w-full" onClick={() => void reset()}>
              <RotateCcw aria-hidden="true" />
              Restaurar dados originais
            </Button>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
