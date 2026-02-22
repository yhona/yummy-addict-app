import { db } from '../src/db'
import { users, categories, units, warehouses, products, productStock, customers, transactions, transactionItems, suppliers } from '../src/db/schema'
import bcrypt from 'bcrypt'

async function seed() {
  console.log('🌱 Seeding database with comprehensive data...\n')

  // ============================================================
  // USERS
  // ============================================================
  console.log('👤 Creating users...')
  let existingUsers = await db.query.users.findMany()
  
  if (existingUsers.length === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10)
    const staffPassword = await bcrypt.hash('staff123', 10)
    
    existingUsers = await db.insert(users).values([
      { email: 'admin@retailerp.com', password: hashedPassword, name: 'Administrator', role: 'admin' as const },
      { email: 'manager@retailerp.com', password: hashedPassword, name: 'Store Manager', role: 'admin' as const },
      { email: 'budi@retailerp.com', password: staffPassword, name: 'Budi Santoso', role: 'cashier' as const },
      { email: 'siti@retailerp.com', password: staffPassword, name: 'Siti Rahayu', role: 'cashier' as const },
      { email: 'andi@retailerp.com', password: staffPassword, name: 'Andi Pratama', role: 'cashier' as const },
      { email: 'dewi@retailerp.com', password: staffPassword, name: 'Dewi Lestari', role: 'cashier' as const },
      { email: 'warehouse@retailerp.com', password: staffPassword, name: 'Agus Warehouse', role: 'warehouse' as const },
    ]).returning()
    console.log(`✅ ${existingUsers.length} users created`)
  } else {
    console.log(`⏭️ Users: ${existingUsers.length} already exist`)
  }

  // ============================================================
  // UNITS
  // ============================================================
  console.log('📏 Creating units...')
  let existingUnits = await db.query.units.findMany()
  
  if (existingUnits.length === 0) {
    existingUnits = await db.insert(units).values([
      { code: 'PCS', name: 'Pieces' },
      { code: 'BOX', name: 'Box' },
      { code: 'KG', name: 'Kilogram' },
      { code: 'L', name: 'Liter' },
      { code: 'DZ', name: 'Dozen' },
      { code: 'PACK', name: 'Pack' },
      { code: 'CTN', name: 'Carton' },
      { code: 'BTL', name: 'Bottle' },
      { code: 'CAN', name: 'Can' },
      { code: 'ROLL', name: 'Roll' },
    ]).returning()
    console.log(`✅ ${existingUnits.length} units created`)
  } else {
    console.log(`⏭️ Units: ${existingUnits.length} already exist`)
  }

  // ============================================================
  // CATEGORIES
  // ============================================================
  console.log('📂 Creating categories...')
  let existingCategories = await db.query.categories.findMany()
  
  if (existingCategories.length < 5) {
    const newCategories = [
      { code: 'FOOD', name: 'Makanan', description: 'Produk makanan' },
      { code: 'BEV', name: 'Minuman', description: 'Produk minuman' },
      { code: 'SNACK', name: 'Snack', description: 'Snack dan cemilan' },
      { code: 'DAILY', name: 'Kebutuhan Harian', description: 'Kebutuhan sehari-hari' },
      { code: 'DAIRY', name: 'Susu & Olahan', description: 'Produk susu dan olahannya' },
      { code: 'FROZEN', name: 'Makanan Beku', description: 'Frozen food' },
      { code: 'BREAD', name: 'Roti & Kue', description: 'Bakery products' },
      { code: 'CLEAN', name: 'Kebersihan', description: 'Produk kebersihan' },
      { code: 'BABY', name: 'Bayi & Anak', description: 'Produk bayi dan anak' },
      { code: 'HEALTH', name: 'Kesehatan', description: 'Produk kesehatan' },
    ].filter(c => !existingCategories.some(e => e.code === c.code))
    
    if (newCategories.length > 0) {
      const added = await db.insert(categories).values(newCategories).returning()
      existingCategories = [...existingCategories, ...added]
      console.log(`✅ ${added.length} categories added`)
    } else {
      console.log(`⏭️ Categories: ${existingCategories.length} already exist`)
    }
  } else {
    console.log(`⏭️ Categories: ${existingCategories.length} already exist`)
  }

  // ============================================================
  // WAREHOUSES
  // ============================================================
  console.log('🏭 Creating warehouses...')
  let existingWarehouses = await db.query.warehouses.findMany()
  
  if (existingWarehouses.length === 0) {
    existingWarehouses = await db.insert(warehouses).values([
      { code: 'WH-MAIN', name: 'Gudang Utama', address: 'Jl. Industri No. 123, Bekasi', phone: '021-8912345', isDefault: true },
      { code: 'WH-STORE', name: 'Gudang Toko', address: 'Jl. Sudirman No. 45, Jakarta', phone: '021-5678901', isDefault: false },
      { code: 'WH-EAST', name: 'Gudang Timur', address: 'Jl. Raya Cibubur No. 88, Depok', phone: '021-7891234', isDefault: false },
    ]).returning()
    console.log(`✅ ${existingWarehouses.length} warehouses created`)
  } else {
    console.log(`⏭️ Warehouses: ${existingWarehouses.length} already exist`)
  }

  // ============================================================
  // SUPPLIERS
  // ============================================================
  console.log('🏢 Creating suppliers...')
  let existingSuppliers = await db.query.suppliers.findMany()
  
  if (existingSuppliers.length === 0) {
    existingSuppliers = await db.insert(suppliers).values([
      { code: 'SUP-001', name: 'PT Indofood Sukses Makmur', address: 'Jl. Jendral Sudirman Kav. 76-78, Jakarta', phone: '021-5795822', email: 'sales@indofood.com', contactPerson: 'Hendra' },
      { code: 'SUP-002', name: 'PT Unilever Indonesia', address: 'Graha Unilever, BSD City, Tangerang', phone: '021-5299711', email: 'order@unilever.co.id', contactPerson: 'Ratna' },
      { code: 'SUP-003', name: 'PT Mayora Indah', address: 'Jl. Tomang Raya No. 21-23, Jakarta', phone: '021-5655322', email: 'sales@mayora.co.id', contactPerson: 'Bambang' },
      { code: 'SUP-004', name: 'PT Nestle Indonesia', address: 'Perkantoran Hijau Arkadia Tower C, Jakarta', phone: '021-7892345', email: 'purchase@nestle.co.id', contactPerson: 'Lisa' },
      { code: 'SUP-005', name: 'PT Wings Surya', address: 'Jl. Raya Surabaya-Malang, Pasuruan', phone: '0343-281111', email: 'order@wingscorp.com', contactPerson: 'Agus' },
      { code: 'SUP-006', name: 'PT Danone Indonesia', address: 'Cyber 2 Tower, Jakarta', phone: '021-5276789', email: 'sales@danone.co.id', contactPerson: 'Maria' },
      { code: 'SUP-007', name: 'PT ABC President', address: 'Jl. Jababeka Raya Blok F, Cikarang', phone: '021-8934567', email: 'order@abcpresident.com', contactPerson: 'Tony' },
      { code: 'SUP-008', name: 'PT Orang Tua Group', address: 'Jl. Lingkar Luar Barat, Jakarta', phone: '021-6513456', email: 'sales@ot.co.id', contactPerson: 'Rina' },
    ]).returning()
    console.log(`✅ ${existingSuppliers.length} suppliers created`)
  } else {
    console.log(`⏭️ Suppliers: ${existingSuppliers.length} already exist`)
  }

  // ============================================================
  // CUSTOMERS
  // ============================================================
  console.log('👥 Creating customers...')
  let existingCustomers = await db.query.customers.findMany()
  
  if (existingCustomers.length < 20) {
    const customerNames = [
      { name: 'Ahmad Hidayat', phone: '081234567890', email: 'ahmad.h@gmail.com', address: 'Jl. Melati No. 12, Jakarta Selatan' },
      { name: 'Siti Nurhaliza', phone: '082345678901', email: 'siti.n@yahoo.com', address: 'Jl. Mawar No. 5, Bekasi' },
      { name: 'Budi Hartono', phone: '083456789012', email: 'budi.h@gmail.com', address: 'Jl. Anggrek No. 8, Depok' },
      { name: 'Dewi Lestari', phone: '084567890123', email: 'dewi.l@outlook.com', address: 'Komplek Permata Blok A5, Tangerang' },
      { name: 'Eko Prasetyo', phone: '085678901234', email: 'eko.p@gmail.com', address: 'Jl. Kenanga No. 15, Bogor' },
      { name: 'Fitriani Wulandari', phone: '086789012345', email: 'fitri.w@gmail.com', address: 'Jl. Dahlia No. 22, Cibubur' },
      { name: 'Gunawan Susanto', phone: '087890123456', email: 'gunawan.s@yahoo.com', address: 'Perumahan Griya Asri Blok B10, Bekasi' },
      { name: 'Hana Permata', phone: '088901234567', email: 'hana.p@gmail.com', address: 'Apartemen Mediterania Tower A, Jakarta' },
      { name: 'Irwan Setiawan', phone: '089012345678', email: 'irwan.s@outlook.com', address: 'Jl. Flamboyan No. 7, Depok' },
      { name: 'Julia Anggraeni', phone: '081123456789', email: 'julia.a@gmail.com', address: 'Komplek Taman Asri No. 33, Tangerang' },
      { name: 'Kurniawan Putra', phone: '082234567890', email: 'kurniawan.p@yahoo.com', address: 'Jl. Cemara No. 18, Jakarta Timur' },
      { name: 'Linda Maharani', phone: '083345678901', email: 'linda.m@gmail.com', address: 'Perumahan Citra Indah C15, Jonggol' },
      { name: 'Muhammad Rizki', phone: '084456789012', email: 'rizki.m@gmail.com', address: 'Jl. Pahlawan No. 45, Bekasi' },
      { name: 'Nina Kartika', phone: '085567890123', email: 'nina.k@outlook.com', address: 'Apartemen Green Bay Tower C, Jakarta' },
      { name: 'Oscar Pratama', phone: '086678901234', email: 'oscar.p@gmail.com', address: 'Jl. Merdeka No. 99, Depok' },
      { name: 'Putri Handayani', phone: '087789012345', email: 'putri.h@yahoo.com', address: 'Komplek Villa Indah Blok F8, Bogor' },
      { name: 'Rahmat Hidayat', phone: '088890123456', email: 'rahmat.h@gmail.com', address: 'Jl. Sejahtera No. 11, Tangerang' },
      { name: 'Sarah Amelia', phone: '089901234567', email: 'sarah.a@gmail.com', address: 'Perumahan Grand Wisata E25, Bekasi' },
      { name: 'Teguh Prabowo', phone: '081011223344', email: 'teguh.p@outlook.com', address: 'Jl. Kartini No. 66, Jakarta Pusat' },
      { name: 'Ulfa Rahmawati', phone: '082122334455', email: 'ulfa.r@gmail.com', address: 'Apartemen Bassura City Tower E, Jakarta' },
      { name: 'Vino Bastian', phone: '083233445566', email: 'vino.b@yahoo.com', address: 'Komplek Bintaro Jaya Sektor 9, Tangerang' },
      { name: 'Wulan Sari', phone: '084344556677', email: 'wulan.s@gmail.com', address: 'Jl. Gatot Subroto No. 88, Jakarta' },
      { name: 'Xavier Tanaka', phone: '085455667788', email: 'xavier.t@gmail.com', address: 'Perumahan Kota Wisata D12, Cibubur' },
      { name: 'Yanti Susilowati', phone: '086566778899', email: 'yanti.s@outlook.com', address: 'Jl. Asia Afrika No. 25, Jakarta' },
      { name: 'Zainal Abidin', phone: '087677889900', email: 'zainal.a@gmail.com', address: 'Komplek Harapan Indah Blok G7, Bekasi' },
      { name: 'Warung Pak Udin', phone: '081555666777', email: 'warungudin@gmail.com', address: 'Jl. Pasar Minggu No. 112, Jakarta Selatan' },
      { name: 'Toko Berkah Jaya', phone: '082666777888', email: 'berkah.jaya@yahoo.com', address: 'Jl. Raya Condet No. 55, Jakarta Timur' },
      { name: 'Mini Market Sejahtera', phone: '083777888999', email: 'mini.sejahtera@gmail.com', address: 'Jl. TB Simatupang No. 78, Jakarta' },
      { name: 'Grosir Murah Meriah', phone: '084888999000', email: 'grosir.mm@outlook.com', address: 'Jl. Mangga Dua Raya No. 15, Jakarta Utara' },
      { name: 'Cafe Santai', phone: '085999000111', email: 'cafe.santai@gmail.com', address: 'Jl. Kemang Raya No. 25, Jakarta Selatan' },
    ].filter(c => !existingCustomers.some(e => e.name === c.name))
    
    if (customerNames.length > 0) {
      const added = await db.insert(customers).values(customerNames).returning()
      existingCustomers = [...existingCustomers, ...added]
      console.log(`✅ ${added.length} customers added`)
    } else {
      console.log(`⏭️ Customers: ${existingCustomers.length} already exist`)
    }
  } else {
    console.log(`⏭️ Customers: ${existingCustomers.length} already exist`)
  }

  // ============================================================
  // PRODUCTS (50+ products)
  // ============================================================
  console.log('📦 Creating products...')
  let existingProducts = await db.query.products.findMany()
  
  const pcs = existingUnits.find(u => u.code === 'PCS')!
  const btl = existingUnits.find(u => u.code === 'BTL')!
  const pack = existingUnits.find(u => u.code === 'PACK')!
  
  const food = existingCategories.find(c => c.code === 'FOOD')!
  const bev = existingCategories.find(c => c.code === 'BEV')!
  const snack = existingCategories.find(c => c.code === 'SNACK')!
  const daily = existingCategories.find(c => c.code === 'DAILY')!
  const dairy = existingCategories.find(c => c.code === 'DAIRY')!
  const clean = existingCategories.find(c => c.code === 'CLEAN')!

  if (existingProducts.length < 20) {
    const productData = [
      { sku: 'PRD-001', barcode: '8991102111001', name: 'Indomie Goreng Original', categoryId: food.id, unitId: pcs.id, costPrice: '2500', sellingPrice: '3500', minStock: 100 },
      { sku: 'PRD-002', barcode: '8991102111002', name: 'Indomie Goreng Pedas', categoryId: food.id, unitId: pcs.id, costPrice: '2500', sellingPrice: '3500', minStock: 100 },
      { sku: 'PRD-003', barcode: '8991102111003', name: 'Indomie Kuah Soto', categoryId: food.id, unitId: pcs.id, costPrice: '2500', sellingPrice: '3500', minStock: 100 },
      { sku: 'PRD-004', barcode: '8991102111004', name: 'Indomie Kuah Ayam Bawang', categoryId: food.id, unitId: pcs.id, costPrice: '2500', sellingPrice: '3500', minStock: 100 },
      { sku: 'PRD-005', barcode: '8992388111001', name: 'Mie Sedaap Goreng', categoryId: food.id, unitId: pcs.id, costPrice: '2300', sellingPrice: '3200', minStock: 80 },
      { sku: 'PRD-006', barcode: '8992388111002', name: 'Mie Sedaap Soto', categoryId: food.id, unitId: pcs.id, costPrice: '2300', sellingPrice: '3200', minStock: 80 },
      { sku: 'PRD-007', barcode: '8886008101101', name: 'Sarden ABC Saus Tomat 155g', categoryId: food.id, unitId: pcs.id, costPrice: '9500', sellingPrice: '13000', minStock: 50 },
      { sku: 'PRD-008', barcode: '8886008101102', name: 'Sarden ABC Saus Cabai 155g', categoryId: food.id, unitId: pcs.id, costPrice: '9500', sellingPrice: '13000', minStock: 50 },
      { sku: 'PRD-009', barcode: '8992820511101', name: 'Kecap Manis ABC 135ml', categoryId: food.id, unitId: btl.id, costPrice: '8000', sellingPrice: '11500', minStock: 40 },
      { sku: 'PRD-010', barcode: '8992820511201', name: 'Kecap Manis ABC 275ml', categoryId: food.id, unitId: btl.id, costPrice: '14500', sellingPrice: '19500', minStock: 30 },
      { sku: 'PRD-013', barcode: '8998866200101', name: 'Aqua 600ml', categoryId: bev.id, unitId: btl.id, costPrice: '2500', sellingPrice: '4000', minStock: 200 },
      { sku: 'PRD-014', barcode: '8998866200201', name: 'Aqua 1,5L', categoryId: bev.id, unitId: btl.id, costPrice: '4500', sellingPrice: '7000', minStock: 100 },
      { sku: 'PRD-015', barcode: '8992761121101', name: 'Teh Botol Sosro 450ml', categoryId: bev.id, unitId: btl.id, costPrice: '4000', sellingPrice: '6000', minStock: 150 },
      { sku: 'PRD-016', barcode: '8992761121201', name: 'Teh Pucuk Harum 350ml', categoryId: bev.id, unitId: btl.id, costPrice: '3500', sellingPrice: '5500', minStock: 150 },
      { sku: 'PRD-017', barcode: '8992222111001', name: 'Pocari Sweat 350ml', categoryId: bev.id, unitId: btl.id, costPrice: '5500', sellingPrice: '8000', minStock: 80 },
      { sku: 'PRD-018', barcode: '8992222111002', name: 'Pocari Sweat 500ml', categoryId: bev.id, unitId: btl.id, costPrice: '7000', sellingPrice: '10000', minStock: 80 },
      { sku: 'PRD-026', barcode: '8998877770101', name: 'Chitato Lite Original 68g', categoryId: snack.id, unitId: pcs.id, costPrice: '8500', sellingPrice: '12000', minStock: 50 },
      { sku: 'PRD-027', barcode: '8998877770201', name: 'Chitato BBQ 68g', categoryId: snack.id, unitId: pcs.id, costPrice: '8500', sellingPrice: '12000', minStock: 50 },
      { sku: 'PRD-029', barcode: '8992753951101', name: 'Oreo Original 133g', categoryId: snack.id, unitId: pack.id, costPrice: '9500', sellingPrice: '13500', minStock: 40 },
      { sku: 'PRD-031', barcode: '8991102291101', name: 'Beng Beng Original', categoryId: snack.id, unitId: pcs.id, costPrice: '2000', sellingPrice: '3000', minStock: 100 },
      { sku: 'PRD-036', barcode: '8992802121101', name: 'Ultra Milk Full Cream 1L', categoryId: dairy.id, unitId: btl.id, costPrice: '16000', sellingPrice: '21000', minStock: 40 },
      { sku: 'PRD-042', barcode: '8999999511101', name: 'Gula Pasir Rose Brand 1kg', categoryId: daily.id, unitId: pack.id, costPrice: '13500', sellingPrice: '17500', minStock: 50 },
      { sku: 'PRD-043', barcode: '8999999521101', name: 'Minyak Goreng Bimoli 1L', categoryId: daily.id, unitId: btl.id, costPrice: '15000', sellingPrice: '19000', minStock: 40 },
      { sku: 'PRD-048', barcode: '8999999611101', name: 'Rinso Anti Noda 800g', categoryId: clean.id, unitId: pack.id, costPrice: '18000', sellingPrice: '24000', minStock: 40 },
      { sku: 'PRD-050', barcode: '8999999621101', name: 'Sunlight Jeruk Nipis 755ml', categoryId: clean.id, unitId: btl.id, costPrice: '12000', sellingPrice: '16500', minStock: 50 },
    ].filter(p => !existingProducts.some(e => e.sku === p.sku))
    
    if (productData.length > 0) {
      const added = await db.insert(products).values(productData).returning()
      existingProducts = [...existingProducts, ...added]
      console.log(`✅ ${added.length} products added`)
    } else {
      console.log(`⏭️ Products: ${existingProducts.length} already exist`)
    }
  } else {
    console.log(`⏭️ Products: ${existingProducts.length} already exist`)
  }

  // ============================================================
  // PRODUCT STOCK
  // ============================================================
  console.log('📊 Creating product stock...')
  const existingStock = await db.query.productStock.findMany()
  const mainWh = existingWarehouses.find(w => w.code === 'WH-MAIN') || existingWarehouses[0]
  
  const productsWithoutStock = existingProducts.filter(p => 
    !existingStock.some(s => s.productId === p.id && s.warehouseId === mainWh!.id)
  )
  
  if (productsWithoutStock.length > 0) {
    const stockData = productsWithoutStock.map(p => ({
      productId: p.id,
      warehouseId: mainWh!.id,
      quantity: Math.floor(Math.random() * 300) + 100,
    }))
    
    await db.insert(productStock).values(stockData)
    console.log(`✅ ${stockData.length} stock entries created`)
  } else {
    console.log(`⏭️ Stock: All products have stock`)
  }

  // ============================================================
  // TRANSACTIONS (only add if less than 50)
  // ============================================================
  console.log('🧾 Creating transactions...')
  const existingTx = await db.query.transactions.findMany()
  
  if (existingTx.length < 50 && existingProducts.length > 0) {
    const cashiers = existingUsers.filter(u => u.role === 'cashier' || u.role === 'admin')
    const txData: any[] = []
    const itemsData: any[][] = []
    
    // Generate 100 transactions for the last 30 days
    for (let dayOffset = 0; dayOffset < 30; dayOffset++) {
      const txDate = new Date()
      txDate.setDate(txDate.getDate() - dayOffset)
      
      const txCount = Math.floor(Math.random() * 4) + 2 // 2-5 per day
      
      for (let t = 0; t < txCount; t++) {
        const txNum = `TX-${txDate.toISOString().slice(0,10).replace(/-/g,'')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`
        const cashier = cashiers[Math.floor(Math.random() * cashiers.length)]
        const customer = Math.random() > 0.5 ? existingCustomers[Math.floor(Math.random() * existingCustomers.length)] : null
        
        const itemCount = Math.floor(Math.random() * 5) + 1
        let subtotal = 0
        const txItems: any[] = []
        
        const selectedProds = [...existingProducts].sort(() => 0.5 - Math.random()).slice(0, itemCount)
        
        selectedProds.forEach(prod => {
          const qty = Math.floor(Math.random() * 3) + 1
          const price = Number(prod.sellingPrice)
          const cost = Number(prod.costPrice)
          subtotal += price * qty
          txItems.push({
            productId: prod.id,
            quantity: qty,
            price: String(price),
            costPrice: String(cost),
            subtotal: String(price * qty),
          })
        })
        
        const discount = Math.random() > 0.8 ? Math.floor(subtotal * 0.1) : 0
        const finalAmount = subtotal - discount
        
        txData.push({
          number: txNum,
          date: txDate,
          cashierId: cashier!.id,
          customerId: customer?.id || null,
          subtotalAmount: String(subtotal),
          discountAmount: String(discount),
          taxAmount: '0',
          finalAmount: String(finalAmount),
          paymentMethod: ['cash', 'qris', 'card'][Math.floor(Math.random() * 3)],
          cashAmount: String(finalAmount + Math.floor(Math.random() * 10000)),
          changeAmount: String(Math.floor(Math.random() * 10000)),
          status: 'completed',
        })
        
        itemsData.push(txItems)
      }
    }
    
    const insertedTx = await db.insert(transactions).values(txData).returning()
    console.log(`✅ ${insertedTx.length} transactions created`)
    
    const allItems: any[] = []
    insertedTx.forEach((tx, i) => {
      itemsData[i]!.forEach((item: any) => {
        allItems.push({ ...item, transactionId: tx.id })
      })
    })
    
    if (allItems.length > 0) {
      await db.insert(transactionItems).values(allItems)
      console.log(`✅ ${allItems.length} transaction items created`)
    }
  } else {
    console.log(`⏭️ Transactions: ${existingTx.length} already exist`)
  }

  // ============================================================
  // DONE
  // ============================================================
  console.log('\n🎉 Seeding completed successfully!')
  console.log('\nLogin credentials:')
  console.log('  Admin: admin@retailerp.com / admin123')
  console.log('  Staff: budi@retailerp.com / staff123')
  
  process.exit(0)
}

seed().catch((e) => {
  console.error('❌ Seeding failed:', e)
  process.exit(1)
})
