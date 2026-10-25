import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { Loader2, Trash2, Upload } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Field } from '@/components/common/field'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  useChangePassword,
  useUpdateProfile,
  useUploadAvatar,
} from '@/features/account/mutations'
import { fileToAvatarDataUrl } from '@/features/account/avatar'
import { useProfileQuery } from '@/features/account/queries'
import { isApiError } from '@/lib/http'

const profileSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe um nome entre 2 e 80 caracteres.').max(80),
  username: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9._-]{3,24}$/, 'Use de 3 a 24 caracteres (letras, números, ponto, hífen ou _)'),
  email: z.email('Informe um e-mail válido.'),
  ensName: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9-]{3,32}(\.eth)?$/i, 'Informe um nome ENS válido (com ou sem .eth)')
    .or(z.literal('')),
  walletNickname: z.string().trim().min(2, 'Informe um apelido entre 2 e 40 caracteres.').max(40),
})

type ProfileValues = z.infer<typeof profileSchema>

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Informe sua senha atual.'),
    newPassword: z.string().min(8, 'A nova senha precisa ter ao menos 8 caracteres.').max(72),
    confirmPassword: z.string().min(1, 'Confirme a nova senha.'),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem.',
  })

type PasswordValues = z.infer<typeof passwordSchema>

export function ProfilePage() {
  const navigate = useNavigate()
  const profileQuery = useProfileQuery()
  const updateProfile = useUpdateProfile()
  const uploadAvatar = useUploadAvatar()
  const changePassword = useChangePassword()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [avatarError, setAvatarError] = useState<string | null>(null)

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { displayName: '', username: '', email: '', ensName: '', walletNickname: '' },
  })
  const { reset, formState } = form

  const profile = profileQuery.data

  useEffect(() => {
    if (!profile) return
    reset({
      displayName: profile.displayName,
      username: profile.username,
      email: profile.email,
      ensName: profile.ensName,
      walletNickname: profile.walletNickname,
    })
  }, [profile, reset])

  const passwordForm = useForm<PasswordValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  if (profileQuery.isPending) {
    return (
      <div className="max-w-3xl space-y-4" aria-busy="true">
        <Skeleton className="h-5 w-56" />
        <div className="grid gap-5 sm:grid-cols-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-11 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-48 w-full max-w-sm" />
      </div>
    )
  }

  if (profileQuery.isError || !profile) {
    return (
      <p role="alert" className="text-destructive text-sm">
        Não foi possível carregar seu perfil.{' '}
        <button
          type="button"
          className="underline"
          onClick={() => {
            void navigate({ to: '/profile' })
          }}
        >
          Recarregar
        </button>
      </p>
    )
  }

  const initials = profile.displayName
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')

  async function onProfileSubmit(values: ProfileValues) {
    try {
      await updateProfile.mutateAsync({
        displayName: values.displayName,
        username: values.username,
        email: values.email,
        ensName: values.ensName || '',
        walletNickname: values.walletNickname,
        avatarUrl: profile?.avatarUrl ?? '',
      })
      toast.success('Perfil atualizado.')
    } catch (error) {
      if (!isApiError(error)) {
        toast.error('Não foi possível salvar o perfil.')
        return
      }
      let mapped = false
      for (const [field, message] of Object.entries(error.fieldErrors)) {
        if (field === 'displayName' || field === 'username' || field === 'email' || field === 'ensName' || field === 'walletNickname') {
          form.setError(field, { message })
          mapped = true
        }
      }
      if (!mapped) toast.error(error.message)
    }
  }

  async function onPasswordSubmit(values: PasswordValues) {
    try {
      await changePassword.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      })
      passwordForm.reset()
      toast.success('Senha alterada com sucesso.')
    } catch (error) {
      if (!isApiError(error)) {
        toast.error('Não foi possível alterar a senha.')
        return
      }
      let mapped = false
      for (const field of ['currentPassword', 'newPassword'] as const) {
        const message = error.fieldErrors[field]
        if (message) {
          passwordForm.setError(field, { message })
          mapped = true
        }
      }
      if (!mapped) toast.error(error.message)
    }
  }

  async function onAvatarFile(file: File) {
    setAvatarError(null)
    try {
      const dataUrl = await fileToAvatarDataUrl(file)
      await uploadAvatar.mutateAsync(dataUrl)
      toast.success('Avatar atualizado.')
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : 'Falha ao enviar a imagem.')
    }
  }

  return (
    <section aria-labelledby="profile-form-title">
      <h1 id="profile-form-title" className="text-sm font-bold">
        Perfil do colecionador
      </h1>

      <form
        className="mt-6 grid max-w-3xl gap-5 sm:grid-cols-2"
        onSubmit={form.handleSubmit(onProfileSubmit)}
        noValidate
      >
        <Field id="profile-display-name" label="Nome de exibição" error={formState.errors.displayName?.message}>
          <Input
            id="profile-display-name"
            autoComplete="name"
            aria-invalid={Boolean(formState.errors.displayName)}
            {...form.register('displayName')}
          />
        </Field>
        <Field id="profile-username" label="Nome de usuário" error={formState.errors.username?.message}>
          <Input
            id="profile-username"
            autoComplete="username"
            aria-invalid={Boolean(formState.errors.username)}
            {...form.register('username')}
          />
        </Field>
        <Field id="profile-email" label="E-mail" error={formState.errors.email?.message}>
          <Input
            id="profile-email"
            type="email"
            autoComplete="email"
            aria-invalid={Boolean(formState.errors.email)}
            {...form.register('email')}
          />
        </Field>
        <Field id="profile-ens" label="Nome ENS" error={formState.errors.ensName?.message}>
          <div className="flex items-stretch gap-2">
            <Input
              id="profile-ens"
              className="flex-1"
              placeholder="seunome"
              aria-invalid={Boolean(formState.errors.ensName)}
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
          id="profile-wallet-nickname"
          label="Apelido da carteira"
          error={formState.errors.walletNickname?.message}
        >
          <Input
            id="profile-wallet-nickname"
            aria-invalid={Boolean(formState.errors.walletNickname)}
            {...form.register('walletNickname')}
          />
        </Field>

        <div className="sm:col-span-2">
          <span className="text-[11px] font-medium tracking-[0.08em] text-muted-foreground uppercase">
            Avatar
          </span>
          <div className="mt-2 flex items-center gap-4">
            <Avatar className="size-14 border-border-soft border">
              {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt="" /> : null}
              <AvatarFallback className="text-sm">{initials}</AvatarFallback>
            </Avatar>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              aria-label="Escolher imagem de avatar"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void onAvatarFile(file)
                event.target.value = ''
              }}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={uploadAvatar.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadAvatar.isPending ? (
                <Loader2 className="animate-spin" aria-hidden="true" />
              ) : (
                <Upload aria-hidden="true" />
              )}
              Alterar
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!profile.avatarUrl || uploadAvatar.isPending}
              onClick={() => {
                void uploadAvatar
                  .mutateAsync('')
                  .then(() => toast.success('Avatar removido.'))
                  .catch(() => toast.error('Não foi possível remover o avatar.'))
              }}
            >
              <Trash2 aria-hidden="true" />
              Remover
            </Button>
          </div>
          {avatarError ? (
            <p role="alert" className="text-destructive mt-2 text-[10px]">
              {avatarError}
            </p>
          ) : null}
        </div>

        <div className="sm:col-span-2">
          <Button type="submit" disabled={formState.isSubmitting || updateProfile.isPending}>
            {formState.isSubmitting || updateProfile.isPending ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                Salvando…
              </>
            ) : (
              'Salvar'
            )}
          </Button>
        </div>
      </form>

      <h2 className="mt-12 text-sm font-bold">Alterar senha</h2>
      <form
        className="mt-4 max-w-sm space-y-4"
        onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
        noValidate
      >
        <Field
          id="password-current"
          label="Senha atual"
          error={passwordForm.formState.errors.currentPassword?.message}
        >
          <Input
            id="password-current"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(passwordForm.formState.errors.currentPassword)}
            {...passwordForm.register('currentPassword')}
          />
        </Field>
        <Field
          id="password-new"
          label="Nova senha"
          error={passwordForm.formState.errors.newPassword?.message}
        >
          <Input
            id="password-new"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(passwordForm.formState.errors.newPassword)}
            {...passwordForm.register('newPassword')}
          />
        </Field>
        <Field
          id="password-confirm"
          label="Confirmar nova senha"
          error={passwordForm.formState.errors.confirmPassword?.message}
        >
          <Input
            id="password-confirm"
            type="password"
            autoComplete="new-password"
            aria-invalid={Boolean(passwordForm.formState.errors.confirmPassword)}
            {...passwordForm.register('confirmPassword')}
          />
        </Field>
        <Button type="submit" disabled={passwordForm.formState.isSubmitting}>
          {passwordForm.formState.isSubmitting ? 'Alterando…' : 'Alterar senha'}
        </Button>
      </form>
    </section>
  )
}
