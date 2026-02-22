import { Unit } from '../types'

// Extended mock units with more data
export const mockUnits: Unit[] = [
  { id: '1', code: 'PCS', name: 'Pieces' },
  { id: '2', code: 'BOX', name: 'Box' },
  { id: '3', code: 'KG', name: 'Kilogram' },
  { id: '4', code: 'L', name: 'Liter' },
  { id: '5', code: 'DZ', name: 'Dozen' },
  { id: '6', code: 'PACK', name: 'Pack' },
  { id: '7', code: 'SET', name: 'Set' },
  { id: '8', code: 'BTL', name: 'Bottle' },
  { id: '9', code: 'CAN', name: 'Can/Kaleng' },
  { id: '10', code: 'SACHET', name: 'Sachet' },
]

// Helper function to simulate API delay
export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms))

// Mock API functions
export async function getUnits(): Promise<Unit[]> {
  await delay(300)
  return mockUnits
}

export async function getUnit(id: string): Promise<Unit | undefined> {
  await delay(200)
  return mockUnits.find((u) => u.id === id)
}
