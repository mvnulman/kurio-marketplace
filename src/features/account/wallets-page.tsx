import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Field } from '@/components/common/field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useDeleteWallet, useSaveWallet } from '@/features/account/mutations'
import { useWalletsQuery } from '@/features/account/queries'
import type { NetworkId } from '@/lib/contracts/common'
import { NETWORKS } from '@/lib/contracts/common'
import type { Wallet, WalletType } from '@/lib/contracts/account'
import { WALLET_TYPES } from '@/lib/contracts/account'
import { isApiError } from '@/lib/http'

const walletSchema = z.object({
  label: z.string().trim().min(2, 'Informe um apelido de até 40 caracteres.').max(40),
  address: z
    .string()
    .trim()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Endereço deve ter 0x + 40 caracteres hexadecimais.'),
  ensName: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9-]{3,32}(\.eth)?$/i, 'Informe um nome ENS válido.')
    .or(z.literal('')),
  network: z.enum(['ethereum', 'polygon', 'solana']),
  type: z.enum(['metamask', 'walletconnect', 'coinbase']),
})

type WalletValues = z.infer<typeof walletSchema>

function WalletForm({
  wallet,
  isPrimary,
  onSaved,
}: {
  wallet: Wallet | undefined
  isPrimary: boolean
  onSaved?: () => void
}) {
  const save = useSaveWallet()
  const remove = useDeleteWallet()
  const [savedFor, setSavedFor] = useState<string | null>(null)

  const form = useForm<WalletValues>({
    resolver: zodResolver(walletSchema),
    defaultValues: {
      label: isPrimary ? 'Carteira principal' : 'Carteira secundária',
      address: '',
      ensName: '',
      network: 'ethereum',
      type: 'metamask',
    },
  })

  useEffect(() => {
    if (!wallet || savedFor === wallet.id + wallet.updatedAt) return
    setSavedFor(wallet.id + wallet.updatedAt)
    form.reset({
      label: wallet.label,
      address: wallet.address,
      ensName: wallet.ensName ?? '',
      network: wallet.network,
      type: wallet.type,
    })
  }, [wallet, form, savedFor])

  async function onSubmit(values: WalletValues) {
    try {
      await save.mutateAsync({
        walletId: wallet?.id,
        label: values.label,
        address: values.address,
        ensName: values.ensName || undefined,
        network: values.network as NetworkId,
        type: values.type as WalletType,
        isPrimary,
      })
      toast.success(
        isPrimary
          ? 'Carteira principal salva.'
          : 'Carteira secundária salva.',
      )
      onSaved?.()
    } catch (error) {
      if (!isApiError(error)) {
        toast.error('Não foi possível salvar a carteira.')
        return
      }
      let mapped = false
      for (const [field, message] of Object.entries(error.fieldErrors)) {
        if (field === 'label' || field === 'address' || field === 'ensName') {
          form.setError(field, { message })
          mapped = true
        }
      }
      if (!mapped) {
        if (error.fieldErrors.network) form.setError('network', { message: error.fieldErrors.network })
        else if (error.fieldErrors.type) form.setError('type', { message: error.fieldErrors.type })
        else toast.error(error.message)
      }
    }
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      noValidate
      className="grid max-w-3xl gap-5 sm:grid-cols-2"
      aria-label={isPrimary ? 'Formulário da carteira principal' : 'Formulário da carteira secundária'}
    >
      <Field id={`wallet-${isPrimary ? 'primary' : 'secondary'}-label`} label="Apelido da carteira" error={form.formState.errors.label?.message}>
        <Input
          id={`wallet-${isPrimary ? 'primary' : 'secondary'}-label`}
          aria-invalid={Boolean(form.formState.errors.label)}
          {...form.register('label')}
        />
      </Field>
      <Field id={`wallet-${isPrimary ? 'primary' : 'secondary'}-address`} label="Endereço da carteira" error={form.formState.errors.address?.message}>
        <Input
          id={`wallet-${isPrimary ? 'primary' : 'secondary'}-address`}
          placeholder="0x…"
          className="font-mono text-[11px]"
          aria-invalid={Boolean(form.formState.errors.address)}
          {...form.register('address')}
        />
      </Field>

      <div>
        <span className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
          Rede <span aria-hidden="true" className="text-accent">*</span>
        </span>
        <input type="hidden" {...form.register('network')} />
        <Select
          value={form.watch('network')}
          onValueChange={(value) => form.setValue('network', value as WalletValues['network'])}
        >
          <SelectTrigger
            id={`wallet-${isPrimary ? 'primary' : 'secondary'}-network`}
            className="mt-2 h-11 text-xs"
          >
            <SelectValue placeholder="Selecione uma rede" />
          </SelectTrigger>
          <SelectContent>
            {NETWORKS.map((network) => (
              <SelectItem key={network.id} value={network.id}>
                {network.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.network ? (
          <p role="alert" className="text-destructive mt-1 text-[10px]">
            {form.formState.errors.network.message}
          </p>
        ) : null}
      </div>

      <div>
        <span className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
          Tipo de carteira <span aria-hidden="true" className="text-accent">*</span>
        </span>
        <input type="hidden" {...form.register('type')} />
        <Select
          value={form.watch('type')}
          onValueChange={(value) => form.setValue('type', value as WalletValues['type'])}
        >
          <SelectTrigger
            id={`wallet-${isPrimary ? 'primary' : 'secondary'}-type`}
            className="mt-2 h-11 text-xs"
          >
            <SelectValue placeholder="Selecione uma carteira" />
          </SelectTrigger>
          <SelectContent>
            {WALLET_TYPES.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.type ? (
          <p role="alert" className="text-destructive mt-1 text-[10px]">
            {form.formState.errors.type.message}
          </p>
        ) : null}
      </div>

      <Field
        id={`wallet-${isPrimary ? 'primary' : 'secondary'}-ens`}
        label="Nome ENS"
        optional
        error={form.formState.errors.ensName?.message}
      >
        <Input
          id={`wallet-${isPrimary ? 'primary' : 'secondary'}-ens`}
          placeholder="seunome"
          aria-invalid={Boolean(form.formState.errors.ensName)}
          {...form.register('ensName')}
        />
      </Field>

      <div className="flex items-center gap-3 sm:col-span-2">
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              Salvando…
            </>
          ) : (
            'Salvar carteira'
          )}
        </Button>
        {!isPrimary && wallet ? (
          <Button
            type="button"
            variant="ghost"
            disabled={remove.isPending}
            onClick={() => {
              void remove
                .mutateAsync(wallet.id)
                .then(() => toast.success('Carteira secundária removida.'))
                .catch(() => toast.error('Não foi possível remover a carteira.'))
            }}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 aria-hidden="true" />
            Remover
          </Button>
        ) : null}
      </div>
    </form>
  )
}

export function WalletsPage() {
  const walletsQuery = useWalletsQuery()
  const [addingSecondary, setAddingSecondary] = useState(false)

  if (walletsQuery.isPending) {
    return (
      <div className="max-w-3xl space-y-4" aria-busy="true">
        <Skeleton className="h-5 w-48" />
        <div className="grid gap-5 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-11 w-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (walletsQuery.isError) {
    return (
      <p role="alert" className="text-destructive text-sm">
        Não foi possível carregar suas carteiras.{' '}
        <button
          type="button"
          className="underline"
          onClick={() => {
            void walletsQuery.refetch()
          }}
        >
          Tentar novamente
        </button>
      </p>
    )
  }

  const { primary, secondary } = walletsQuery.data ?? { primary: null, secondary: null }

  return (
    <section aria-labelledby="wallets-title">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 id="wallets-title" className="text-sm font-bold">
            Carteira principal
          </h1>
          <p className="text-muted-foreground mt-1 text-[10px]">
            Fica disponível no pagamento e para receber NFTs comprados.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <WalletForm wallet={primary ?? undefined} isPrimary />
      </div>

      <div className="border-border/60 mt-12 flex flex-wrap items-end justify-between gap-3 border-t pt-8">
        <div>
          <h2 className="text-sm font-bold">Carteira secundária</h2>
          <p className="text-muted-foreground mt-1 text-[10px]">
            {secondary
              ? 'Usada como alternativa no pagamento e para receber NFTs.'
              : 'Você ainda não adicionou uma carteira secundária.'}
          </p>
        </div>
        {!secondary && !addingSecondary ? (
          <Button variant="link" size="sm" onClick={() => setAddingSecondary(true)}>
            <Plus aria-hidden="true" />
            Adicionar
          </Button>
        ) : null}
      </div>

      <div className="mt-5">
        {secondary || addingSecondary ? (
          <WalletForm wallet={secondary ?? undefined} isPrimary={false} onSaved={() => setAddingSecondary(false)} />
        ) : null}
      </div>
    </section>
  )
}
