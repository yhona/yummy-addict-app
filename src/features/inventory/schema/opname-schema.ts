import { z } from 'zod'

export const createOpnameSchema = z.object({
  warehouseId: z.string().min(1, 'Gudang wajib dipilih'),
  notes: z.string().max(500).optional().or(z.literal('')),
})

export const updateOpnameItemSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    physicalQty: z.number().int().min(0, 'Qty tidak boleh negatif'),
    notes: z.string().max(500).optional().or(z.literal('')),
  })),
})

export type CreateOpnameValues = z.infer<typeof createOpnameSchema>
export type UpdateOpnameItemValues = z.infer<typeof updateOpnameItemSchema>
