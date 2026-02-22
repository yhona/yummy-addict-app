import { z } from 'zod'

// Category form validation schema
export const categoryFormSchema = z.object({
  code: z
    .string()
    .min(1, 'Category code is required')
    .max(50, 'Code must be less than 50 characters')
    .regex(/^[A-Za-z0-9-_]+$/, 'Code can only contain letters, numbers, hyphens, and underscores'),
  name: z
    .string()
    .min(1, 'Category name is required')
    .max(255, 'Name must be less than 255 characters'),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .or(z.literal('')),
  parentId: z
    .string()
    .optional()
    .or(z.literal('')),
  isActive: z.boolean().default(true),
})

export type CategoryFormValues = z.infer<typeof categoryFormSchema>

// Default values for new category
export const defaultCategoryValues: Partial<CategoryFormValues> = {
  code: '',
  name: '',
  description: '',
  parentId: '',
  isActive: true,
}
