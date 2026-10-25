import { Link } from '@tanstack/react-router'
import { ShieldCheck, Sparkles, Wallet } from 'lucide-react'

import { FacebookMark, GoogleMark } from '@/components/common/brand-icons'
import { Logo } from '@/components/common/logo'
import { notifyOutOfScope } from '@/components/common/out-of-scope'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { LoginForm } from './login-form'
import type { AuthSearch } from './search'
import { RegisterForm } from './register-form'

export function AuthPage({
  mode,
  search,
}: {
  mode: 'login' | 'register'
  search: AuthSearch
}) {
  const tabSearch = { redirect: search.redirect, reason: search.reason }

  return (
    <div className="container-page py-10 lg:py-16">
      <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <section aria-labelledby="auth-headline" className="hidden lg:block">
          <Logo asLink={false} className="text-base" />
          <p className="text-accent mt-10 text-[10px] tracking-[0.24em] uppercase">
            Colecione o futuro
          </p>
          <h1 id="auth-headline" className="text-display mt-3 max-w-md font-bold uppercase">
            Sua coleção digital começa aqui
          </h1>
          <p className="text-muted-foreground mt-5 max-w-md text-sm leading-relaxed">
            Descubra obras raras, acompanhe edições em tempo real e negocie com uma experiência
            pensada para colecionadores.
          </p>

          <ul className="text-muted-foreground mt-8 space-y-3 text-xs">
            <li className="flex items-center gap-3">
              <ShieldCheck className="text-primary size-4" aria-hidden="true" />
              Proveniência verificada em cada edição
            </li>
            <li className="flex items-center gap-3">
              <Wallet className="text-primary size-4" aria-hidden="true" />
              Carteiras e pagamentos simulados com segurança
            </li>
            <li className="flex items-center gap-3">
              <Sparkles className="text-primary size-4" aria-hidden="true" />
              Atualizações em tempo real de preço e disponibilidade
            </li>
          </ul>

          <div className="border-border/60 mt-10 overflow-hidden rounded-xl border">
            <img
              src="/assets/nfts/ape-01.webp"
              alt="Obra Emerald Ape, um primata com jaqueta verde e óculos escuros"
              width={720}
              height={720}
              className="h-64 w-full object-cover"
              loading="lazy"
            />
          </div>
        </section>

        <section
          aria-labelledby="auth-title"
          className="border-border/70 bg-card/70 mx-auto w-full max-w-md rounded-xl border p-6 shadow-2xl sm:p-8"
        >
          <div className="flex items-center justify-between">
            <h2 id="auth-title" className="text-sm font-bold tracking-[0.12em] uppercase">
              {mode === 'login' ? 'Acessar conta' : 'Criar conta'}
            </h2>
            <span className="text-muted-foreground/70 text-[10px] tracking-[0.16em] uppercase">
              KURIO
            </span>
          </div>

          <nav
            aria-label="Alternar entre entrar e criar conta"
            className="border-border/70 mt-4 flex gap-6 border-b"
          >
            <Link
              to="/login"
              search={tabSearch}
              aria-current={mode === 'login' ? 'page' : undefined}
              className={cn(
                '-mb-px border-b-2 pb-2 text-xs font-medium tracking-[0.08em] uppercase transition-colors',
                mode === 'login'
                  ? 'border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground border-transparent',
              )}
            >
              Entrar
            </Link>
            <Link
              to="/register"
              search={tabSearch}
              aria-current={mode === 'register' ? 'page' : undefined}
              className={cn(
                '-mb-px border-b-2 pb-2 text-xs font-medium tracking-[0.08em] uppercase transition-colors',
                mode === 'register'
                  ? 'border-primary text-foreground'
                  : 'text-muted-foreground hover:text-foreground border-transparent',
              )}
            >
              Criar conta
            </Link>
          </nav>

          <p className="text-muted-foreground mt-4 text-xs leading-relaxed">
            {mode === 'login'
              ? 'Entre para gerenciar sua carteira, coleção e perfil de colecionador.'
              : 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.'}
          </p>

          <div className="mt-6">
            {mode === 'login' ? <LoginForm search={search} /> : <RegisterForm search={search} />}
          </div>

          <div className="my-6 flex items-center gap-3" aria-hidden="true">
            <span className="bg-border h-px flex-1" />
            <span className="text-muted-foreground/70 text-[10px] tracking-[0.1em] uppercase">
              ou continue com
            </span>
            <span className="bg-border h-px flex-1" />
          </div>

          <div className="grid gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => notifyOutOfScope('Login com Google')}
            >
              <GoogleMark className="size-4" />
              Continuar com Google
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => notifyOutOfScope('Login com Facebook')}
            >
              <FacebookMark className="size-4" />
              Continuar com Facebook
            </Button>
          </div>
        </section>
      </div>
    </div>
  )
}

