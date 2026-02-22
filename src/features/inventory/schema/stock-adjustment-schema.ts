import { z } from 'zod'

// Stock adjustment form validation schema
export const stockAdjustmentSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  adjustmentType: z.enum(['add', 'subtract', 'set'], {
    required_error: 'Adjustment type is required',
  }),
  quantity: z
    .number({ required_error: 'Quantity is required' })
    .min(0, 'Quantity must be positive'),
  reason: z
    .string()
    .min(1, 'Reason is required')
    .max(500, 'Reason must be less than 500 characters'),
  notes: z
    .string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional()
    .or(z.literal('')),
})

export type StockAdjustmentFormValues = z.infer<typeof stockAdjustmentSchema>

// Predefined reasons
export const adjustmentReasons = [
  'Stock Count Correction',
  'Damaged Goods',
  'Expired Products',
  'Received from Supplier',
  'Return from Customer',
  'Internal Transfer',
  'Lost/Missing',
  'Sample/Promo',
  'Other',
]
