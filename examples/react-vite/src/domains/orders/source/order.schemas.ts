import { z } from 'zod'

export const orderSchema = z.object({
  id: z.string(),
  userId: z.string(),
  status: z.enum(['pending', 'paid', 'shipped', 'cancelled']),
  items: z.array(
    z.object({
      productId: z.string(),
      productName: z.string(),
      quantity: z.number().int().positive(),
      unitPriceCents: z.number().int().nonnegative()
    })
  ),
  totalCents: z.number().int().nonnegative(),
  currency: z.enum(['USD', 'EUR']),
  createdAt: z.iso.datetime()
})

export const orderResponseSchema = z.object({ data: orderSchema })

export const orderPageSchema = z.object({
  data: z.array(orderSchema),
  meta: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative()
  })
})
