import { z } from 'zod'

export const catalogProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  description: z.string(),
  priceCents: z.number().nonnegative(),
  currency: z.enum(['USD', 'EUR']),
  categoryId: z.string(),
  stock: z.number().int().nonnegative(),
  rating: z.number().min(0).max(5),
  imageUrl: z.url(),
  createdAt: z.iso.datetime(),
  version: z.number().int().positive()
})

export const catalogCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  productCount: z.number().int().nonnegative()
})

export const catalogPageSchema = z.object({
  data: z.array(catalogProductSchema),
  meta: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative()
  })
})

export const catalogCategoriesSchema = z.object({
  data: z.array(catalogCategorySchema)
})

export const catalogProductResponseSchema = z.object({ data: catalogProductSchema })
