import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, UserPlus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Field } from '@/components/common/field'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { isApiError } from '@/lib/http'

import { useAuth } from './auth-provider'
import { safeRedirect, type AuthSearch } from './search'

const registerSchema = z
  .object({
    username: z
      .string()
      .min(3, 'Use ao menos 3 caracteres.')
      .max(24, 'Use no máximo 24 caracteres.')
      .regex(/^[a-zA-Z0-9._-]+$/, 'Use apenas letras, números, ponto, hífen ou _'),
    email: z.email('Informe um e-mail válido.'),
    password: z.string().min(8, 'A senha precisa ter ao menos 8 caracteres.').max(72),
    passwordConfirmation: z.string().min(1, 'Confirme sua senha.'),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    path: ['passwordConfirmation'],
    message: 'As senhas não coincidem.',
  })

type RegisterValues = z.infer<typeof registerSchema>

export function RegisterForm({ search }: { search: AuthSearch }) {
  const { register: registerUser } = useAuth()
  const [visible, setVisible] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: '', email: '', password: '', passwordConfirmation: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await registerUser({
        username: values.username,
        email: values.email,
        password: values.password,
      })
      toast.success('Conta criada! Sua jornada começa agora.')
      window.location.assign(safeRedirect(search.redirect))
    } catch (error) {
      if (!isApiError(error)) {
        setFormError('Não foi possível criar a conta. Tente novamente.')
        return
      }
      let mapped = false
      for (const [field, message] of Object.entries(error.fieldErrors ?? {})) {
        if (field === 'username' || field === 'email' || field === 'password') {
          setError(field, { message })
          mapped = true
        }
      }
      if (!mapped) setFormError(error.message)
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {formError ? (
        <p
          role="alert"
          className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-xs"
        >
          {formError}
        </p>
      ) : null}

      <Field
        id="register-username"
        label="Nome de usuário"
        error={errors.username?.message}
        hint="Seu nome público no marketplace."
      >
        <Input
          id="register-username"
          autoComplete="username"
          placeholder="seu.apelido"
          aria-invalid={Boolean(errors.username)}
          aria-describedby={
            errors.username ? 'register-username-error' : 'register-username-hint'
          }
          {...register('username')}
        />
      </Field>

      <Field id="register-email" label="E-mail" error={errors.email?.message}>
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'register-email-error' : undefined}
          {...register('email')}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="register-password" label="Senha" error={errors.password?.message}>
          <div className="relative">
            <Input
              id="register-password"
              type={visible ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Mínimo de 8 caracteres"
              className="pr-12"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'register-password-error' : undefined}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setVisible((current) => !current)}
              aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
              aria-pressed={visible}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 rounded-sm p-1"
            >
              {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
        </Field>

        <Field
          id="register-password-confirmation"
          label="Confirmar senha"
          error={errors.passwordConfirmation?.message}
        >
          <Input
            id="register-password-confirmation"
            type={visible ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Repita a senha"
            aria-invalid={Boolean(errors.passwordConfirmation)}
            aria-describedby={
              errors.passwordConfirmation ? 'register-password-confirmation-error' : undefined
            }
            {...register('passwordConfirmation')}
          />
        </Field>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" aria-hidden="true" />
            Criando conta…
          </>
        ) : (
          <>
            <UserPlus aria-hidden="true" />
            Criar conta
          </>
        )}
      </Button>

      <p className="text-muted-foreground text-center text-[11px] leading-relaxed">
        Ao criar a conta você concorda com os termos de uso desta demonstração. Nenhum dado é
        enviado a serviços reais.
      </p>
    </form>
  )
}

