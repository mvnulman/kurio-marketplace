import { z } from 'zod'

export const authSearchSchema = z.object({
  redirect: z.string().optional().catch(undefined),
  reason: z.string().optional().catch(undefined),
})

export type AuthSearch = z.infer<typeof authSearchSchema>

/** Só aceita caminhos internos, evitando open redirect. */
export function safeRedirect(value: string | undefined): string {
  if (!value) return '/'
  if (!value.startsWith('/') || value.startsWith('//')) return '/'
  return value
}
