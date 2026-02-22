import { z } from 'zod'

export const transferSchema = z.object({
  productId: z.string().min(1, 'Produk wajib dipilih'),
  fromWarehouseId: z.string().min(1, 'Gudang asal wajib dipilih'),
  toWarehouseId: z.string().min(1, 'Gudang tujuan wajib dipilih'),
  quantity: z.number().int().min(1, 'Qty minimal 1'),
  notes: z.string().max(500).optional().or(z.literal('')),
}).refine(
  (data) => data.fromWarehouseId !== data.toWarehouseId,
  {
    message: 'Gudang asal dan tujuan tidak boleh sama',
    path: ['toWarehouseId'],
  }
)

export type TransferFormValues = z.infer<typeof transferSchema>
