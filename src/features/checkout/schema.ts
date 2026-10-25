import { z } from 'zod'

export const checkoutSchema = z.object({
  displayName: z.string().trim().min(2, 'Informe um nome entre 2 e 80 caracteres.').max(80),
  username: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9._-]{3,24}$/, 'Use de 3 a 24 caracteres (letras, números, ponto, hífen ou _)'),
  email: z.email('Informe um e-mail válido.'),
  ensName: z
    .string()
    .trim()
    .regex(/^[a-zA-Z0-9-]{3,32}(\.eth)?$/i, 'Informe um nome ENS válido (com ou sem .eth)'),
  walletNickname: z.string().trim().min(2, 'Informe um apelido entre 2 e 40 caracteres.').max(40),
  referralCode: z.string().trim().max(40, 'Máximo de 40 caracteres.').optional(),
  observation: z.string().trim().max(500, 'Máximo de 500 caracteres.').optional(),
  useOtherWallet: z.boolean(),
  walletAddress: z.string().trim().optional(),
  walletType: z.enum(['metamask', 'walletconnect', 'coinbase']),
  network: z.enum(['ethereum', 'polygon', 'solana']),
})

export type CheckoutValues = z.infer<typeof checkoutSchema>
