import { z } from 'zod'

export const couponSchema = z.object({
  code: z
    .string()
    .trim()
    .min(3, 'Código muito curto.')
    .max(24, 'Máximo de 24 caracteres.')
    .regex(/^[A-Za-z0-9-]+$/, 'Use apenas letras, números ou hífen'),
})

export type CouponValues = z.infer<typeof couponSchema>
