import { Category } from '../types'

// Extended mock categories with more data
export const mockCategories: Category[] = [
  {
    id: '1',
    code: 'FOOD',
    name: 'Makanan',
    description: 'Semua jenis makanan dan bahan makanan',
    level: 0,
    isActive: true,
  },
  {
    id: '2',
    code: 'DRINK',
    name: 'Minuman',
    description: 'Semua jenis minuman',
    level: 0,
    isActive: true,
  },
  {
    id: '3',
    code: 'SNACK',
    name: 'Snack',
    description: 'Makanan ringan dan cemilan',
    parentId: '1',
    level: 1,
    isActive: true,
  },
  {
    id: '4',
    code: 'GROCERY',
    name: 'Sembako',
    description: 'Sembilan bahan pokok dan kebutuhan dapur',
    level: 0,
    isActive: true,
  },
  {
    id: '5',
    code: 'ELEC',
    name: 'Elektronik',
    description: 'Barang elektronik dan aksesoris',
    level: 0,
    isActive: true,
  },
  {
    id: '6',
    code: 'CARE',
    name: 'Perawatan',
    description: 'Produk perawatan tubuh dan kebersihan',
    level: 0,
    isActive: true,
  },
  {
    id: '7',
    code: 'INSTANT',
    name: 'Makanan Instan',
    description: 'Mie instan, bubur instan, dll',
    parentId: '1',
    level: 1,
    isActive: true,
  },
  {
    id: '8',
    code: 'DAIRY',
    name: 'Produk Susu',
    description: 'Susu, keju, yogurt, dll',
    parentId: '1',
    level: 1,
    isActive: true,
  },
  {
    id: '9',
    code: 'SOFTDRINK',
    name: 'Minuman Ringan',
    description: 'Soft drink, soda, jus kemasan',
    parentId: '2',
    level: 1,
    isActive: true,
  },
  {
    id: '10',
    code: 'WATER',
    name: 'Air Mineral',
    description: 'Air mineral kemasan',
    parentId: '2',
    level: 1,
    isActive: false,
  },
]

// Helper function to get category with children count
export function getCategoriesWithStats(categories: Category[]) {
  return categories.map((category) => {
    const childrenCount = categories.filter(
      (c) => c.parentId === category.id
    ).length
    const parentName = category.parentId
      ? categories.find((c) => c.id === category.parentId)?.name
      : undefined
    return {
      ...category,
      childrenCount,
      parentName,
    }
  })
}

// Helper function to simulate API delay
export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

// Mock API functions
export async function getCategories(): Promise<Category[]> {
  await delay(300)
  return mockCategories
}

export async function getCategory(id: string): Promise<Category | undefined> {
  await delay(200)
  return mockCategories.find((c) => c.id === id)
}

export async function getRootCategories(): Promise<Category[]> {
  await delay(200)
  return mockCategories.filter((c) => !c.parentId)
}
