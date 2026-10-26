import { z } from 'zod'

const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/

export const checkoutSchema = z
  .object({
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
    referralCode: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9-]{3,40}$/, 'Use 3 a 40 caracteres (letras, números ou hífen)')
      .or(z.literal('')),
    observation: z.string().trim().max(500, 'Máximo de 500 caracteres.').optional(),
    useOtherWallet: z.boolean(),
    walletAddress: z.string().trim().optional(),
    walletType: z.enum(['metamask', 'walletconnect', 'coinbase']),
    network: z.enum(['ethereum', 'polygon', 'solana']),
  })
  .refine(
    (values) => !values.useOtherWallet || ADDRESS_PATTERN.test(values.walletAddress ?? ''),
    {
      path: ['walletAddress'],
      message: 'Endereço deve ter 0x + 40 caracteres hexadecimais.',
    },
  )

export type CheckoutValues = z.infer<typeof checkoutSchema>
