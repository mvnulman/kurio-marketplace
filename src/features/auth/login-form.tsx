import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react'
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

const loginSchema = z.object({
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(8, 'A senha precisa ter ao menos 8 caracteres.'),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginForm({ search }: { search: AuthSearch }) {
  const { login } = useAuth()
  const [visible, setVisible] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null)
    try {
      await login(values)
      toast.success('Bem-vindo de volta!')
      window.location.assign(safeRedirect(search.redirect))
    } catch (error) {
      if (!isApiError(error)) {
        setFormError('Não foi possível entrar. Tente novamente.')
        return
      }
      const fields = Object.entries(error.fieldErrors ?? {})
      let mapped = false
      for (const [field, message] of fields) {
        if (field === 'email' || field === 'password') {
          setError(field, { message })
          mapped = true
        }
      }
      if (!mapped) setFormError(error.message)
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {search.reason === 'session-expired' ? (
        <p
          role="status"
          className="border-accent/40 bg-accent/10 rounded-md border px-3 py-2 text-xs text-accent"
        >
          Sua sessão expirou. Entre novamente para retomar de onde parou.
        </p>
      ) : null}

      {formError ? (
        <p
          role="alert"
          className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-xs"
        >
          {formError}
        </p>
      ) : null}

      <Field id="login-email" label="E-mail" error={errors.email?.message}>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="voce@exemplo.com"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? 'login-email-error' : undefined}
          {...register('email')}
        />
      </Field>

      <Field id="login-password" label="Senha" error={errors.password?.message}>
        <div className="relative">
          <Input
            id="login-password"
            type={visible ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Sua senha"
            className="pr-12"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? 'login-password-error' : undefined}
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

      <div className="flex justify-end">
        <button
          type="button"
          className="text-muted-foreground hover:text-accent text-xs underline underline-offset-4"
          onClick={() =>
            toast.info('Recuperação de senha não faz parte desta entrega.', {
              description: 'Use as contas de demonstração para explorar os fluxos.',
            })
          }
        >
          Esqueci minha senha
        </button>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" aria-hidden="true" />
            Entrando…
          </>
        ) : (
          <>
            <LogIn aria-hidden="true" />
            Entrar
          </>
        )}
      </Button>

      <div className="border-border/60 bg-surface/60 rounded-md border p-3">
        <p className="text-[10px] font-bold tracking-[0.1em] text-muted-foreground uppercase">
          Conta de demonstração
        </p>
        <p className="text-muted-foreground mt-1 text-xs">
          ana@kurio.art · kurio123
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-2 w-full"
          onClick={() => {
            setValue('email', 'ana@kurio.art', { shouldValidate: true })
            setValue('password', 'kurio123', { shouldValidate: true })
          }}
        >
          Preencher credenciais
        </Button>
      </div>
    </form>
  )
}

