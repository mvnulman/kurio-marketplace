import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { CircleAlert } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'

import { Breadcrumbs } from '@/components/common/breadcrumbs'
import { EmptyState, ErrorState } from '@/components/common/states'
import { Field } from '@/components/common/field'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import { useProfileQuery, useWalletsQuery } from '@/features/account/queries'
import { cartKeys } from '@/features/cart/queries'
import { CheckoutSummary } from '@/features/checkout/checkout-summary'
import { useQuoteQuery } from '@/features/checkout/queries'
import { checkoutSchema, type CheckoutValues } from '@/features/checkout/schema'
import { fetchQuote } from '@/lib/api/cart'
import { createOrder } from '@/lib/api/orders'
import type { Quote } from '@/lib/contracts/cart'
import type { Wallet } from '@/lib/contracts/account'
import type { CreateOrderInput } from '@/lib/contracts/orders'
import { isApiError } from '@/lib/http'

import type { ConnectionState } from './checkout-summary'

export function CheckoutPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const quoteQuery = useQuoteQuery()
  const profileQuery = useProfileQuery()
  const walletsQuery = useWalletsQuery()

  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null)
  const [connection, setConnection] = useState<ConnectionState>('idle')
  const [outdatedQuote, setOutdatedQuote] = useState<Quote | null>(null)
  const idempotencyRef = useRef(crypto.randomUUID())

  const quote = quoteQuery.data
  const wallets = [walletsQuery.data?.primary, walletsQuery.data?.secondary].filter(
    (wallet): wallet is Wallet => Boolean(wallet),
  )

  const form = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      displayName: '',
      username: '',
      email: '',
      ensName: '',
      walletNickname: '',
      referralCode: '',
      observation: '',
      useOtherWallet: false,
      walletAddress: '',
      walletType: 'metamask',
      network: 'ethereum',
    },
  })

  const {
    handleSubmit,
    setValue,
    trigger,
    getValues,
    setError,
    formState: { isSubmitting, errors },
  } = form

  useEffect(() => {
    const profile = profileQuery.data
    if (!profile) return
    const current = getValues()
    if (current.displayName !== '' || current.username !== '') return

    setValue('displayName', profile.displayName)
    setValue('username', profile.username)
    setValue('email', profile.email)
    setValue('ensName', profile.ensName)
    setValue('walletNickname', profile.walletNickname)
  }, [profileQuery.data, getValues, setValue])

  const values = form.watch()

  async function connectWallet(wallet: Wallet) {
    setSelectedWalletId(wallet.id)
    setValue('useOtherWallet', false)
    setValue('walletType', wallet.type)
    setValue('network', wallet.network)
    setConnection('connecting')
    // Simulação de conexão de carteira (determinística nesta demonstração).
    await new Promise((resolve) => setTimeout(resolve, 800))
    setConnection('connected')
  }

  function disconnectWallet() {
    setSelectedWalletId(null)
    setConnection('idle')
  }

  const walletReady = values.useOtherWallet
    ? /^0x[a-fA-F0-9]{40}$/.test(values.walletAddress ?? '')
    : connection === 'connected' && selectedWalletId !== null

  async function onConfirm() {
    const valid = await trigger()
    if (!valid) {
      toast.error('Revise os dados destacados antes de confirmar.')
      return
    }
    if (!walletReady) {
      toast.error('Conecte uma carteira para finalizar a compra.')
      return
    }
    if (!quote) return

    // Revalida preço, disponibilidade, cupom e taxas antes de enviar o pedido.
    let freshQuote: Quote
    try {
      freshQuote = await fetchQuote()
    } catch {
      toast.error('Não foi possível revalidar a cotação. Tente novamente.')
      return
    }

    if (freshQuote.cartVersion !== quote.cartVersion) {
      setOutdatedQuote(freshQuote)
      return
    }

    await submitOrder()
  }

  const submitOrder = handleSubmit(async (formValues) => {
    if (!quote) return

    const payload: CreateOrderInput = {
      quoteId: quote.id,
      cartVersion: quote.cartVersion,
      walletId: formValues.useOtherWallet ? undefined : (selectedWalletId ?? undefined),
      walletType: formValues.walletType,
      network: formValues.network,
      useOtherWallet: formValues.useOtherWallet,
      walletAddress: formValues.useOtherWallet ? formValues.walletAddress : undefined,
      customer: {
        displayName: formValues.displayName,
        username: formValues.username,
        email: formValues.email,
        ensName: formValues.ensName,
        walletNickname: formValues.walletNickname,
        referralCode: formValues.referralCode || undefined,
        observation: formValues.observation || undefined,
      },
    }

    try {
      const { order } = await createOrder(payload, idempotencyRef.current)
      void queryClient.invalidateQueries({ queryKey: cartKeys.all })
      void queryClient.invalidateQueries({ queryKey: ['account'] })
      await navigate({ to: '/orders/$orderId', params: { orderId: order.id } })
    } catch (error) {
      if (!isApiError(error)) {
        toast.error('Falha de conexão. Seu carrinho foi preservado; tente novamente.')
        return
      }

      if (error.code === 'QUOTE_OUTDATED') {
        // Nova cotação exige nova confirmação: a chave de idempotência é renovada.
        idempotencyRef.current = crypto.randomUUID()
        const meta = error.meta as { quote?: Quote } | undefined
        setOutdatedQuote(meta?.quote ?? null)
        void queryClient.invalidateQueries({ queryKey: cartKeys.all })
        return
      }

      if (error.code === 'TIMEOUT') {
        toast.error('Tempo esgotado ao confirmar o pagamento.', {
          description:
            'Seu pedido pode ter sido criado. Confirme novamente para consultá-lo sem duplicar a compra.',
        })
        return
      }

      if (error.code === 'OUT_OF_STOCK') {
        toast.error(error.message)
        void queryClient.invalidateQueries({ queryKey: cartKeys.all })
        return
      }

      let mapped = false
      for (const [field, message] of Object.entries(error.fieldErrors)) {
        if (field in checkoutSchema.shape) {
          setError(field as keyof CheckoutValues, { message })
          mapped = true
        }
      }
      if (!mapped) toast.error(error.message)
    }
  })

  if (quoteQuery.isPending || (profileQuery.isLoading && !profileQuery.data)) {
    return <CheckoutSkeleton />
  }

  if (quoteQuery.isError || !quote) {
    const isEmpty = isApiError(quoteQuery.error) && quoteQuery.error.code === 'CONFLICT'

    return (
      <div className="container-page py-16">
        {isEmpty ? (
          <EmptyState
            title="Seu carrinho está vazio"
            description="Adicione obras ao carrinho para seguir com o pagamento."
            actionLabel="Explorar catálogo"
            onAction={() => {
              void navigate({ to: '/', hash: 'catalogo' })
            }}
          />
        ) : (
          <ErrorState
            description="Não foi possível carregar a cotação do carrinho."
            onRetry={() => {
              void quoteQuery.refetch()
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="container-page py-8">
      <Breadcrumbs
        items={[{ label: 'Início', to: '/' }, { label: 'Mercado', to: '/' }, { label: 'Pagamento' }]}
      />

      <h1 className="mt-5 text-2xl font-bold tracking-tight">Pagamento</h1>

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <section aria-labelledby="collector-profile-title">
          <h2 id="collector-profile-title" className="text-sm font-bold">
            Perfil do colecionador
          </h2>
          <p className="text-muted-foreground mt-1 text-[10px]">
            Estes dados acompanham o recibo do pedido.
          </p>

          <form
            className="mt-6 grid gap-5 sm:grid-cols-2"
            onSubmit={(event) => {
              event.preventDefault()
              void onConfirm()
            }}
            noValidate
          >
            <Field
              id="checkout-display-name"
              label="Nome de exibição"
              error={errors.displayName?.message}
            >
              <Input
                id="checkout-display-name"
                autoComplete="name"
                aria-invalid={Boolean(errors.displayName)}
                {...form.register('displayName')}
              />
            </Field>
            <Field id="checkout-username" label="Nome de usuário" error={errors.username?.message}>
              <Input
                id="checkout-username"
                autoComplete="username"
                aria-invalid={Boolean(errors.username)}
                {...form.register('username')}
              />
            </Field>
            <Field id="checkout-email" label="E-mail" error={errors.email?.message}>
              <Input
                id="checkout-email"
                type="email"
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                {...form.register('email')}
              />
            </Field>
            <Field
              id="checkout-ens"
              label="Nome ENS"
              error={errors.ensName?.message}
              hint="Sem o sufixo .eth"
            >
              <div className="flex items-stretch gap-2">
                <Input
                  id="checkout-ens"
                  className="flex-1"
                  aria-invalid={Boolean(errors.ensName)}
                  {...form.register('ensName')}
                />
                <span
                  aria-hidden="true"
                  className="border-input bg-surface text-muted-foreground flex items-center rounded-md border px-3 text-xs"
                >
                  .eth
                </span>
              </div>
            </Field>
            <Field
              id="checkout-nickname"
              label="Apelido da carteira"
              error={errors.walletNickname?.message}
            >
              <Input
                id="checkout-nickname"
                aria-invalid={Boolean(errors.walletNickname)}
                {...form.register('walletNickname')}
              />
            </Field>
            <Field
              id="checkout-referral"
              label="Código de indicação"
              optional
              error={errors.referralCode?.message}
            >
              <Input id="checkout-referral" {...form.register('referralCode')} />
            </Field>

            <div className="sm:col-span-2">
              <Field
                id="checkout-observation"
                label="Observação do colecionador"
                optional
                error={errors.observation?.message}
              >
                <Textarea id="checkout-observation" rows={4} {...form.register('observation')} />
              </Field>
            </div>
          </form>
        </section>

        <CheckoutSummary
          quote={quote}
          wallets={wallets}
          selectedWalletId={selectedWalletId}
          connection={connection}
          form={form}
          walletReady={walletReady}
          onConnect={(wallet) => {
            void connectWallet(wallet)
          }}
          onDisconnect={disconnectWallet}
          onConfirm={() => {
            void onConfirm()
          }}
          isSubmitting={isSubmitting}
        />
      </div>

      <Dialog open={Boolean(outdatedQuote)} onOpenChange={(open) => !open && setOutdatedQuote(null)}>
        <DialogContent showClose={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CircleAlert className="text-destructive size-5" aria-hidden="true" />
              Os valores do seu carrinho mudaram
            </DialogTitle>
            <DialogDescription>
              Preço, disponibilidade, cupom ou taxas foram atualizados enquanto você revisava o
              pedido. Confira os novos valores e confirme novamente.
            </DialogDescription>
          </DialogHeader>

          {outdatedQuote ? (
            <dl className="border-border/60 space-y-2 rounded-md border p-4 text-xs">
              {outdatedQuote.lines.map((line) => (
                <div key={line.nftId} className="flex items-center justify-between gap-3">
                  <dt className="truncate">
                    {line.name} <span className="text-muted-foreground">× {line.quantity}</span>
                  </dt>
                  <dd className="tabular-nums">{line.lineTotalEth} ETH</dd>
                </div>
              ))}
              <div className="border-border/60 flex justify-between border-t pt-2 font-bold">
                <dt>Novo total</dt>
                <dd className="text-accent tabular-nums">{outdatedQuote.totalEth} ETH</dd>
              </div>
            </dl>
          ) : null}

          <DialogFooter>
            <Button variant="outline" asChild>
              <Link to="/cart">Revisar carrinho</Link>
            </Button>
            <Button onClick={() => setOutdatedQuote(null)}>Entendi, vou revisar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function CheckoutSkeleton() {
  return (
    <div className="container-page py-8" aria-busy="true" aria-label="Carregando checkout">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-5 h-7 w-48" />
      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="grid gap-5 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-11 w-full" />
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-md" />
        </div>
      </div>
    </div>
  )
}
