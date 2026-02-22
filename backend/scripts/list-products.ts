
import { db } from '../src/db'
import { products } from '../src/db/schema'

async function main() {
  const all = await db.query.products.findMany()
  all.forEach(p => {
    console.log(`${p.sku}: ${p.name}`)
  })
  process.exit(0)
}
main()
