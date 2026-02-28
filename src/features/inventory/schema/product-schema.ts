import { z } from 'zod'

// Product form validation schema
export const productFormSchema = z.object({
  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(100, 'SKU must be less than 100 characters')
    .regex(/^[A-Za-z0-9-_]+$/, 'SKU can only contain letters, numbers, hyphens, and underscores'),
  barcode: z
    .string()
    .max(100, 'Barcode must be less than 100 characters'),
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(255, 'Product name must be less than 255 characters'),
  description: z
    .string()
    .max(1000, 'Description must be less than 1000 characters'),
  image: z
    .string()
    .max(255)
    .nullable(),
  categoryId: z
    .string(),
  unitId: z
    .string(),
  type: z.enum(['standard', 'bundle']).default('standard'),
  bundleItems: z.array(z.object({
    productId: z.string(),
    quantity: z.number().min(1, 'Quantity must be at least 1')
  })).optional(),
  productType: z.enum(['inventory', 'service', 'non_inventory']),
  costPrice: z
    .number({ message: 'Cost price is required' })
    .min(0, 'Cost price must be positive'),
  sellingPrice: z
    .number({ message: 'Selling price is required' })
    .min(0, 'Selling price must be positive'),
  wholesalePrice: z
    .number()
    .min(0, 'Wholesale price must be positive')
    .nullable(),
  memberPrice: z
    .number()
    .min(0, 'Member price must be positive')
    .nullable(),
  minStock: z
    .number()
    .min(0, 'Minimum stock must be positive'),
  maxStock: z
    .number()
    .min(0, 'Maximum stock must be positive')
    .nullable(),
  trackInventory: z.boolean(),
  isActive: z.boolean(),
  parentId: z.string().nullable(),
  isBulk: z.boolean(),
  conversionRatio: z
    .number()
    .min(0, 'Conversion ratio must be positive')
    .nullable(),
})

export type ProductFormValues = z.infer<typeof productFormSchema>

// Default values for new product
export const defaultProductValues: ProductFormValues = {
  sku: '',
  barcode: '',
  name: '',
  description: '',
  image: null,
  categoryId: '',
  unitId: '',
  type: 'standard',
  bundleItems: [],
  productType: 'inventory',
  costPrice: 0,
  sellingPrice: 0,
  wholesalePrice: null,
  memberPrice: null,
  minStock: 0,
  maxStock: null,
  trackInventory: true,
  isActive: true,
  parentId: null,
  isBulk: false,
  conversionRatio: null,
}
