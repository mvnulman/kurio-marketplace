import { toast } from 'sonner'

/**
 * Ações editoriais/auxiliares fora do escopo da entrega. Em vez de simular
 * sucesso, informam explicitamente que a funcionalidade não faz parte do desafio.
 */
export function notifyOutOfScope(feature: string): void {
  toast.info(`${feature} não faz parte desta entrega.`, {
    description: 'O escopo cobre descoberta, compra, conta e carteiras.',
  })
}

export function OutOfScope({
  feature,
  children,
  className,
}: {
  feature: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={() => notifyOutOfScope(feature)}
      className={className}
      title={`${feature} — fora do escopo desta entrega`}
    >
      {children}
    </button>
  )
}
