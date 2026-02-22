import { z } from 'zod'

// Unit form validation schema
export const unitFormSchema = z.object({
  code: z
    .string()
    .min(1, 'Unit code is required')
    .max(20, 'Code must be less than 20 characters')
    .regex(/^[A-Za-z0-9]+$/, 'Code can only contain letters and numbers'),
  name: z
    .string()
    .min(1, 'Unit name is required')
    .max(100, 'Name must be less than 100 characters'),
})

export type UnitFormValues = z.infer<typeof unitFormSchema>

// Default values
export const defaultUnitValues: Partial<UnitFormValues> = {
  code: '',
  name: '',
}
