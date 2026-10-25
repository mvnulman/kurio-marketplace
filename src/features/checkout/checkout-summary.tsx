import { Link } from '@tanstack/react-router'
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'
import type { UseFormReturn } from 'react-hook-form'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { WALLET_TYPES } from '@/lib/contracts/account'
import type { Wallet } from '@/lib/contracts/account'
import { NETWORKS } from '@/lib/contracts/common'
import type { Quote } from '@/lib/contracts/cart'
import { shortAddress } from '@/lib/format'
import { cn } from '@/lib/utils'

import type { CheckoutValues } from './schema'

export type ConnectionState = 'idle' | 'connecting' | 'connected'

const NETWORK_LABEL = new Map(NETWORKS.map((item) => [item.id, item.label]))
const WALLET_TYPE_LABEL = new Map(WALLET_TYPES.map((item) => [item.id, item.label]))

interface CheckoutSummaryProps {
  quote: Quote
  wallets: Wallet[]
  selectedWalletId: string | null
  connection: ConnectionState
  form: UseFormReturn<CheckoutValues>
  walletReady: boolean
  onConnect: (wallet: Wallet) => void
  onDisconnect: () => void
  onConfirm: () => void
  isSubmitting: boolean
}

export function CheckoutSummary({
  quote,
  wallets,
  selectedWalletId,
  connection,
  form,
  walletReady,
  onConnect,
  onDisconnect,
  onConfirm,
  isSubmitting,
}: CheckoutSummaryProps) {
  const useOtherWallet = form.watch('useOtherWallet')
  const hasUnavailable = quote.lines.some((line) => !line.isAvailable)
  const connecting = connection === 'connecting'

  return (
    <aside
      aria-labelledby="checkout-summary-title"
      className="border-border/60 bg-card/40 rounded-xl border p-6 lg:sticky lg:top-24"
    >
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="checkout-summary-title" className="text-sm font-bold">
          Seus NFTs
        </h2>
        <span className="text-muted-foreground text-[10px] tracking-[0.08em] uppercase">
          Subtotal
        </span>
      </div>

      <ul className="mt-4 space-y-3">
        {quote.lines.map((line) => (
          <li
            key={line.nftId}
            className={cn(
              'border-border/60 bg-surface/60 rounded-md border p-3',
              !line.isAvailable && 'border-destructive/50',
            )}
          >
            <div className="flex items-center gap-3">
              <img
                src={line.imageUrl}
                alt=""
                width={720}
                height={720}
                loading="lazy"
                className="size-10 rounded object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[11px] font-bold">{line.name}</p>
                <p className="text-muted-foreground text-[10px]">
                  ID do token: #{line.tokenId} · {line.quantity} un.
                </p>
              </div>
              <p className="text-accent text-xs font-bold tabular-nums">
                {line.lineTotalEth} ETH
              </p>
            </div>
            {!line.isAvailable ? (
              <p role="alert" className="text-destructive mt-2 text-[10px]">
                Indisponível nesta quantidade — revise o carrinho.
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      <p className="text-muted-foreground mt-4 text-[10px]">
        Tem um código promocional?{' '}
        <Link to="/cart" className="text-accent underline underline-offset-2">
          Aplique aqui
        </Link>
      </p>

      <dl className="border-border/60 mt-5 space-y-2.5 border-t pt-4 text-xs">
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Subtotal</dt>
          <dd className="tabular-nums">{quote.subtotalEth} ETH</dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">Desconto do lançamento</dt>
          <dd className="tabular-nums">
            {quote.discountEth !== '0' ? `(-) ${quote.discountEth}` : '0'} ETH
          </dd>
        </div>
        <div className="flex items-center justify-between gap-4">
          <dt className="text-muted-foreground">
            Taxa de rede
            <span className="text-muted-foreground/70 block text-[9px] normal-case">
              Taxa estimada
            </span>
          </dt>
          <dd className="tabular-nums">{quote.networkFeeEth} ETH</dd>
        </div>
        <div className="border-border/60 flex items-center justify-between gap-4 border-t pt-3">
          <dt className="text-sm font-bold">Total</dt>
          <dd className="text-accent text-sm font-bold tabular-nums">{quote.totalEth} ETH</dd>
        </div>
      </dl>

      <fieldset className="mt-6">
        <legend className="text-[11px] font-bold tracking-[0.08em] uppercase">
          Carteira e rede
        </legend>

        {wallets.length > 0 ? (
          <RadioGroup
            value={selectedWalletId ?? ''}
            onValueChange={(value) => {
              const wallet = wallets.find((candidate) => candidate.id === value)
              if (wallet) onConnect(wallet)
            }}
            className="mt-3"
            aria-label="Selecionar carteira cadastrada"
          >
            {wallets.map((wallet) => {
              const selected = selectedWalletId === wallet.id
              return (
                <label
                  key={wallet.id}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-3 rounded-md border p-3 transition-colors',
                    selected ? 'border-primary bg-primary/5' : 'border-border-soft hover:border-primary/60',
                  )}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <RadioGroupItem value={wallet.id} />
                    <span className="min-w-0">
                      <span className="block truncate text-[11px] font-bold">{wallet.label}</span>
                      <span className="text-muted-foreground block truncate text-[10px]">
                        {shortAddress(wallet.address)} · {NETWORK_LABEL.get(wallet.network)}
                      </span>
                    </span>
                  </span>
                  {selected && connection === 'connected' ? (
                    <Badge variant="success">
                      <CheckCircle2 className="size-3" aria-hidden="true" /> Conectada
                    </Badge>
                  ) : selected && connecting ? (
                    <Badge variant="outline">
                      <Loader2 className="size-3 animate-spin" aria-hidden="true" /> Conectando…
                    </Badge>
                  ) : (
                    <Badge variant="outline">{WALLET_TYPE_LABEL.get(wallet.type)}</Badge>
                  )}
                </label>
              )
            })}
          </RadioGroup>
        ) : (
          <p className="text-muted-foreground mt-3 text-[11px]">
            Você ainda não cadastrou carteiras.{' '}
            <Link to="/profile/wallets" className="text-accent underline underline-offset-2">
              Cadastrar carteira
            </Link>
          </p>
        )}

        <div className="mt-3 flex items-center gap-2">
          <Checkbox
            id="checkout-use-other-wallet"
            checked={useOtherWallet}
            onCheckedChange={(checked) => form.setValue('useOtherWallet', checked === true)}
          />
          <Label htmlFor="checkout-use-other-wallet" className="normal-case">
            Usar outra carteira?
          </Label>
        </div>

        {useOtherWallet ? (
          <div className="mt-4 space-y-4 rounded-md border border-border/60 p-4">
            <div>
              <Label htmlFor="checkout-other-address">Endereço da carteira</Label>
              <Input
                id="checkout-other-address"
                className="mt-2 font-mono text-[11px]"
                placeholder="0x…"
                {...form.register('walletAddress')}
              />
              {form.formState.errors.walletAddress ? (
                <p role="alert" className="text-destructive mt-1 text-[10px]">
                  {form.formState.errors.walletAddress.message}
                </p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="checkout-other-type">Tipo de carteira</Label>
              <Select
                value={form.watch('walletType')}
                onValueChange={(value) =>
                  form.setValue('walletType', value as CheckoutValues['walletType'])
                }
              >
                <SelectTrigger id="checkout-other-type" className="mt-2 h-10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WALLET_TYPES.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="checkout-other-network">Rede</Label>
              <Select
                value={form.watch('network')}
                onValueChange={(value) =>
                  form.setValue('network', value as CheckoutValues['network'])
                }
              >
                <SelectTrigger id="checkout-other-network" className="mt-2 h-10 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {NETWORKS.map((network) => (
                    <SelectItem key={network.id} value={network.id}>
                      {network.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : null}

        {connection === 'connected' && !useOtherWallet ? (
          <button
            type="button"
            onClick={onDisconnect}
            className="text-muted-foreground hover:text-destructive mt-3 text-[10px] underline underline-offset-4"
          >
            Desconectar carteira
          </button>
        ) : null}
      </fieldset>

      <Button
        type="button"
        size="lg"
        className="mt-6 w-full"
        onClick={onConfirm}
        disabled={isSubmitting || connecting || !walletReady || hasUnavailable}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" aria-hidden="true" />
            Confirmando…
          </>
        ) : (
          <>
            <ShieldCheck aria-hidden="true" />
            Confirmar compra
          </>
        )}
      </Button>

      <p className="text-muted-foreground/70 mt-3 text-center text-[9px] leading-relaxed">
        Pagamento simulado nesta demonstração. Nenhum valor real é movimentado.
      </p>
    </aside>
  )
}

export function CheckoutSummarySkeleton() {
  return (
    <div className="border-border/60 bg-card/40 space-y-4 rounded-xl border p-6" aria-hidden="true">
      <Skeleton className="h-4 w-24" />
      {Array.from({ length: 3 }).map((_, index) => (
        <Skeleton key={index} className="h-16 w-full rounded-md" />
      ))}
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-12 w-full" />
    </div>
  )
}

