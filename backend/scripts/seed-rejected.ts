
import { db } from '../src/db'
import { warehouses } from '../src/db/schema'
import { eq } from 'drizzle-orm'

async function seedRejectedWarehouse() {
  console.log('🌱 Seeding Rejected Warehouse...')

  const existing = await db.query.warehouses.findFirst({
    where: eq(warehouses.type, 'rejected'),
  })

  if (!existing) {
    const [created] = await db.insert(warehouses).values({
      code: 'WH-REJECT',
      name: 'Gudang Reject / Rusak',
      type: 'rejected',
      address: 'Internal Virtual Warehouse',
      isDefault: false,
      isActive: true,
    }).returning()
    console.log(`✅ Created Rejected Warehouse: ${created!.name} (${created!.id})`)
  } else {
    console.log(`⏭️ Rejected Warehouse already exists: ${existing.name}`)
  }
  
  process.exit(0)
}

seedRejectedWarehouse().catch((e) => {
  console.error('❌ Failed:', e)
  process.exit(1)
})
