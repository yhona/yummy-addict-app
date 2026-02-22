import { z } from 'zod'

// Warehouse form validation schema
export const warehouseFormSchema = z.object({
  code: z
    .string()
    .min(1, 'Warehouse code is required')
    .max(20, 'Code must be less than 20 characters'),
  name: z
    .string()
    .min(1, 'Warehouse name is required')
    .max(100, 'Name must be less than 100 characters'),
  address: z
    .string()
    .max(500, 'Address must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .max(20, 'Phone must be less than 20 characters')
    .optional()
    .or(z.literal('')),
  isDefault: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

export type WarehouseFormValues = z.infer<typeof warehouseFormSchema>

// Default values
export const defaultWarehouseValues: Partial<WarehouseFormValues> = {
  code: '',
  name: '',
  address: '',
  phone: '',
  isDefault: false,
  isActive: true,
}
