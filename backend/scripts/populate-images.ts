
import { db } from '../src/db'
import { products } from '../src/db/schema'
import { eq } from 'drizzle-orm'

// High quality manual overrides
const KNOWN_IMAGES: Record<string, string> = {
  'PRD-001': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Indomie_Mi_Goreng.jpg/800px-Indomie_Mi_Goreng.jpg',
  'PRD-003': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Teh_Botol_Sosro_450ml.jpg/450px-Teh_Botol_Sosro_450ml.jpg',
  'PRD-005': 'https://upload.wikimedia.org/wikipedia/commons/e/ea/POCARI_SWEET%2C_500ml_Plastic_bottle_type.jpg',
}

async function fetchOpenFoodFacts(barcode: string) {
  try {
    const res = await fetch(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`)
    if (!res.ok) return null
    const data = await res.json() as any
    if (data.status === 1 && data.product) {
       return data.product.image_front_url || data.product.image_url || null
    }
  } catch (e) {
    // ignore
  }
  return null
}

async function main() {
  console.log('Fetching all products...')
  
  const allProducts = await db.query.products.findMany()

  console.log(`Processing ${allProducts.length} products...`)

  for (const product of allProducts) {
    let imageUrl = KNOWN_IMAGES[product.sku]

    // 1. Try Manual
    if (imageUrl) {
        console.log(`[Manual] ${product.name}`)
    }

    // 2. Try OpenFoodFacts (if no manual)
    if (!imageUrl && product.barcode) {
      imageUrl = await fetchOpenFoodFacts(product.barcode)
      if (imageUrl) console.log(`[OpenFoodFacts] ${product.name}`)
    }

    // 3. Fallback to Google/Bing Search Image (if still none)
    if (!imageUrl) {
       // Use a dynamic search image proxy (Bing)
       const query = encodeURIComponent(product.name)
       imageUrl = `https://tse2.mm.bing.net/th?q=${query}&w=500&h=500&c=7&rs=1&p=0`
       console.log(`[Search] ${product.name}`)
    }

    // Update DB
    if (imageUrl) {
      await db.update(products)
        .set({ image: imageUrl })
        .where(eq(products.id, product.id))
    }
    
    // Slight delay to avoid flooding APIs
    await new Promise(r => setTimeout(r, 200))
  }

  console.log('Done updating images!')
  process.exit(0)
}

main().catch(console.error)
