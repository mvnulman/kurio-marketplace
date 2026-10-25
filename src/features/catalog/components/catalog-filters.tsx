import { RotateCcw } from 'lucide-react'
import { useEffect, useId, useState } from 'react'

import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { NFT_CATEGORIES, NFT_RARITIES } from '@/lib/contracts/catalog'
import type { CatalogResponse } from '@/lib/contracts/catalog'
import { NETWORKS } from '@/lib/contracts/common'
import { compareEth } from '@/lib/money'
import { cn } from '@/lib/utils'

import { parseCsv, type CatalogSearch } from '../search'

type FacetGroup = 'cat' | 'net' | 'col' | 'rar'

export interface CatalogFiltersProps {
  search: CatalogSearch
  facets: CatalogResponse['facets'] | undefined
  onToggle: (group: FacetGroup, value: string) => void
  onPriceChange: (min: string | undefined, max: string | undefined) => void
  onClear: () => void
  className?: string
}

function FilterGroup({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <fieldset className="border-border/60 border-b pb-5">
      <legend className="text-[10px] font-bold tracking-[0.14em] uppercase">{title}</legend>
      <div className="mt-3">{children}</div>
    </fieldset>
  )
}

export function CatalogFilters({
  search,
  facets,
  onToggle,
  onPriceChange,
  onClear,
  className,
}: CatalogFiltersProps) {
  const id = useId()
  const active = {
    cat: new Set(parseCsv(search.cat)),
    net: new Set(parseCsv(search.net)),
    col: new Set(parseCsv(search.col)),
    rar: new Set(parseCsv(search.rar)),
  }

  const priceMin = facets?.priceRange.min ?? '0'
  const priceMax = facets?.priceRange.max ?? '10'

  const [min, setMin] = useState(search.min ?? '')
  const [max, setMax] = useState(search.max ?? '')
  const [priceError, setPriceError] = useState<string | null>(null)

  useEffect(() => {
    setMin(search.min ?? '')
    setMax(search.max ?? '')
  }, [search.min, search.max])

  const applyPrice = () => {
    const pattern = /^(0|[1-9]\d*)(\.\d{1,6})?$/
    if (min && !pattern.test(min)) {
      setPriceError('Preço mínimo inválido.')
      return
    }
    if (max && !pattern.test(max)) {
      setPriceError('Preço máximo inválido.')
      return
    }
    if (min && max && compareEth(min, max) > 0) {
      setPriceError('O preço mínimo deve ser menor que o máximo.')
      return
    }
    setPriceError(null)
    onPriceChange(min || undefined, max || undefined)
  }

  return (
    <aside aria-label="Filtros do catálogo" className={cn('space-y-5', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-[11px] font-bold tracking-[0.14em] uppercase">Filtrar</h2>
        <button
          type="button"
          onClick={onClear}
          className="text-muted-foreground hover:text-accent inline-flex items-center gap-1 text-[10px]"
        >
          <RotateCcw className="size-3" aria-hidden="true" />
          Limpar
        </button>
      </div>

      <FilterGroup title="Coleções">
        <ul className="space-y-2.5">
          {(facets?.collections ?? []).map((collection) => (
            <li key={collection.id}>
              <label
                htmlFor={`${id}-col-${collection.id}`}
                className="flex cursor-pointer items-center justify-between gap-2 text-[11px]"
              >
                <span className="flex items-center gap-2">
                  <Checkbox
                    id={`${id}-col-${collection.id}`}
                    checked={active.col.has(collection.id)}
                    onCheckedChange={() => onToggle('col', collection.id)}
                  />
                  {collection.label}
                </span>
                <span className="text-muted-foreground">({collection.count})</span>
              </label>
            </li>
          ))}
        </ul>
      </FilterGroup>

      <FilterGroup title="Faixa de preço">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{min || priceMin} ETH</span>
            <span>{max || priceMax} ETH</span>
          </div>
          <label htmlFor={`${id}-price-range`} className="sr-only">
            Preço máximo
          </label>
          <input
            id={`${id}-price-range`}
            type="range"
            min={priceMin}
            max={priceMax}
            step="0.01"
            value={max || priceMax}
            onChange={(event) => setMax(event.target.value)}
            className="accent-primary w-full"
          />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label htmlFor={`${id}-price-min`} className="sr-only">
                Preço mínimo em ETH
              </label>
              <Input
                id={`${id}-price-min`}
                inputMode="decimal"
                value={min}
                onChange={(event) => setMin(event.target.value)}
                placeholder={priceMin}
                aria-invalid={Boolean(priceError)}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <label htmlFor={`${id}-price-max`} className="sr-only">
                Preço máximo em ETH
              </label>
              <Input
                id={`${id}-price-max`}
                inputMode="decimal"
                value={max}
                onChange={(event) => setMax(event.target.value)}
                placeholder={priceMax}
                aria-invalid={Boolean(priceError)}
                aria-describedby={priceError ? `${id}-price-error` : undefined}
                className="h-9 text-xs"
              />
            </div>
          </div>
          {priceError ? (
            <p id={`${id}-price-error`} role="alert" className="text-destructive text-[10px]">
              {priceError}
            </p>
          ) : null}
          <button
            type="button"
            onClick={applyPrice}
            className="border-accent/50 text-accent hover:bg-accent/10 w-full rounded border px-3 py-2 text-[10px] font-bold tracking-[0.1em] uppercase transition-colors"
          >
            Aplicar faixa
          </button>
        </div>
      </FilterGroup>

      <FilterGroup title="Rede">
        <ul className="space-y-2.5">
          {NETWORKS.map((network) => {
            const count = facets?.networks.find((item) => item.id === network.id)?.count
            return (
              <li key={network.id}>
                <label
                  htmlFor={`${id}-net-${network.id}`}
                  className="flex cursor-pointer items-center justify-between gap-2 text-[11px]"
                >
                  <span className="flex items-center gap-2">
                    <Checkbox
                      id={`${id}-net-${network.id}`}
                      checked={active.net.has(network.id)}
                      onCheckedChange={() => onToggle('net', network.id)}
                    />
                    {network.label}
                  </span>
                  <span className="text-muted-foreground">({count ?? 0})</span>
                </label>
              </li>
            )
          })}
        </ul>
      </FilterGroup>

      <FilterGroup title="Categorias">
        <div className="flex flex-wrap gap-1.5">
          {NFT_CATEGORIES.map((category) => {
            const selected = active.cat.has(category.id)
            const count = facets?.categories.find((item) => item.id === category.id)?.count
            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onToggle('cat', category.id)}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-[10px] transition-colors',
                  selected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border-soft text-muted-foreground hover:border-primary hover:text-primary',
                )}
              >
                {category.label}
                {count ? ` (${count})` : ''}
              </button>
            )
          })}
        </div>
      </FilterGroup>

      <FilterGroup title="Raridade">
        <div className="flex flex-wrap gap-1.5">
          {NFT_RARITIES.map((rarity) => {
            const selected = active.rar.has(rarity.id)
            return (
              <button
                key={rarity.id}
                type="button"
                aria-pressed={selected}
                onClick={() => onToggle('rar', rarity.id)}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-[10px] transition-colors',
                  selected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border-soft text-muted-foreground hover:border-primary hover:text-primary',
                )}
              >
                {rarity.label}
              </button>
            )
          })}
        </div>
      </FilterGroup>
    </aside>
  )
}
