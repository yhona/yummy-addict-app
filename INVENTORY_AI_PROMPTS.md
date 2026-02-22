# 🤖 AI CODING PROMPTS — INVENTORY MANAGEMENT
## Repo: yummy-addict-app | Disesuaikan dengan struktur kode yang sudah ada

---

## 📌 MASTER CONTEXT — WAJIB PASTE DI SETIAP SESI BARU

```
[MASTER CONTEXT — yummy-addict-app]

Repo  : https://github.com/yhona/yummy-addict-app
Modul : Inventory Management

== TECH STACK ==
Frontend : React 19 + Vite + TypeScript
Router   : TanStack Router v1 (file-based routing)
UI       : Tailwind CSS v4 + shadcn/ui + Radix UI
Data     : TanStack Query v5 (useQuery, useMutation, useQueryClient)
Forms    : React Hook Form + Zod
Toast    : Sonner
Icons    : Lucide React
Backend  : Bun + Hono
ORM      : Drizzle ORM + PostgreSQL

== POLA ROUTE (TanStack Router) ==
File route  : src/routes/_authenticated/inventory/[nama].tsx
Cara buat   : export const Route = createFileRoute('/_authenticated/inventory/[nama]')({ component: NamaPage })

== POLA API HOOKS (TanStack Query) ==
Lokasi      : src/features/inventory/api/[nama].ts
Pola fetch  : useQuery({ queryKey: [...], queryFn: () => api.get('/api/...') })
Pola mutate : useMutation({ mutationFn: (data) => api.post('/api/...', data), onSuccess: () => queryClient.invalidateQueries(...) })

== POLA LAYOUT HALAMAN ==
Setiap halaman WAJIB menggunakan:
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'

Struktur:
<>
  <Header fixed>
    <h1 className="text-lg font-semibold">Judul</h1>
    <div className="ml-auto flex items-center space-x-4">
      <ThemeSwitch />
      <ProfileDropdown />
    </div>
  </Header>
  <Main>
    {/* konten */}
  </Main>
</>

== POLA FORM ==
- Selalu gunakan React Hook Form + zodResolver
- Schema Zod di: src/features/inventory/schema/[nama]-schema.ts
- Komponen Form dari shadcn/ui (Form, FormField, FormItem, FormLabel, FormControl, FormMessage)

== POLA BADGE / STATUS COLOR ==
- green-500/10 + text-green-500  → positif / masuk / aktif
- red-500/10 + text-red-500      → negatif / keluar / error
- blue-500/10 + text-blue-500    → adjustment / info
- cyan-500/10 + text-cyan-500    → transfer
- yellow-500/10 + text-yellow-500 → warning / return
- purple-500/10 + text-purple-500 → pembelian

== POLA TOAST ==
import { toast } from 'sonner'
toast.success('Pesan sukses')
toast.error('Pesan error')

== API CLIENT ==
import { api } from '@/lib/api-client'
api.get<TResponse>('/api/endpoint', params?)
api.post<TResponse>('/api/endpoint', body)
api.put<TResponse>('/api/endpoint', body)
api.delete<TResponse>('/api/endpoint')

== DATABASE SCHEMA YANG RELEVAN ==
- products: id, sku, name, costPrice, sellingPrice, minStock, isActive
- product_stock: id, productId, warehouseId, quantity
- stock_movements: id, productId, warehouseId, movementType(in/out/adjustment), referenceType, referenceNumber, quantityBefore, quantityChange, quantityAfter, notes
- warehouses: id, code, name, type(sellable/rejected), isDefault, isActive
- purchases: id, number, supplierId, totalAmount, paymentStatus, amountPaid

== EXISTING INVENTORY ROUTES ==
/inventory/products      → CRUD produk ✅
/inventory/categories    → Kategori ✅
/inventory/units         → Satuan ✅
/inventory/warehouses    → Gudang ✅
/inventory/stock         → Stock Adjustment ✅
/inventory/movements     → Riwayat pergerakan stok ✅
/inventory/bulk-products → Produk bulk/varian ✅
/inventory/rejected      → Barang rejected ✅

== YANG BELUM ADA (target prompt ini) ==
/inventory/opname        → Stock Opname ❌
/inventory/transfer      → Halaman Transfer Stok ❌ (baru ada dialog)
```

---

## 📁 PROMPT 1 — STOCK OPNAME (Penghitungan Fisik)

```
[CONTEXT]
Paste Master Context di atas dulu.

[TASK]
Buatkan fitur Stock Opname (Physical Stock Count) lengkap.

== FILES YANG PERLU DIBUAT ==

1. src/routes/_authenticated/inventory/opname/index.tsx
   → Halaman daftar semua sesi opname

2. src/routes/_authenticated/inventory/opname/new.tsx
   → Buat sesi opname baru

3. src/routes/_authenticated/inventory/opname/$id.tsx
   → Detail & input hasil hitung fisik

4. src/features/inventory/api/opname.ts
   → API hooks untuk opname

5. src/features/inventory/schema/opname-schema.ts
   → Zod schema untuk form opname

6. backend/src/routes/opname.ts
   → Backend endpoint (Hono + Drizzle)

---

== BACKEND: backend/src/routes/opname.ts ==

Endpoints yang dibutuhkan:

GET    /api/opname              → Daftar sesi opname (paginated)
POST   /api/opname              → Buat sesi opname baru
GET    /api/opname/:id          → Detail sesi + items
PUT    /api/opname/:id/items    → Update hasil hitung fisik per item
POST   /api/opname/:id/finalize → Finalisasi & apply adjustment otomatis
DELETE /api/opname/:id          → Hapus (hanya jika status = draft)

Tabel baru yang perlu dibuat di schema (tambahkan ke backend/src/db/schema/index.ts):

// Stock Opname Session
export const stockOpname = pgTable('stock_opname', {
  id: uuid('id').primaryKey().defaultRandom(),
  number: varchar('number', { length: 50 }).notNull().unique(), // OP-20240101-001
  warehouseId: uuid('warehouse_id').notNull().references(() => warehouses.id),
  status: varchar('status', { length: 20 }).notNull().default('draft'), // draft, counting, finalized
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id),
  finalizedAt: timestamp('finalized_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// Stock Opname Items
export const stockOpnameItems = pgTable('stock_opname_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  opnameId: uuid('opname_id').notNull().references(() => stockOpname.id),
  productId: uuid('product_id').notNull().references(() => products.id),
  systemQty: integer('system_qty').notNull().default(0),  // stok di sistem saat opname dibuat
  physicalQty: integer('physical_qty'),                   // hasil hitung fisik (null = belum dihitung)
  difference: integer('difference'),                      // physicalQty - systemQty
  notes: text('notes'),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

Logic finalize:
- Loop semua opnameItems yang ada difference != 0
- Untuk tiap item, buat stock adjustment otomatis (add/subtract sesuai difference)
- Buat stock_movement dengan referenceType = 'opname', referenceNumber = opname.number
- Update opname.status = 'finalized', opname.finalizedAt = now()

---

== FRONTEND: src/features/inventory/api/opname.ts ==

Interface yang dibutuhkan:
interface OpnameSession {
  id: string
  number: string
  warehouseName: string
  warehouseId: string
  status: 'draft' | 'counting' | 'finalized'
  totalItems: number
  countedItems: number
  itemsWithDifference: number
  notes?: string
  createdAt: string
  finalizedAt?: string
}

interface OpnameItem {
  id: string
  productId: string
  productSku: string
  productName: string
  systemQty: number
  physicalQty: number | null  // null = belum dihitung
  difference: number | null
  notes?: string
}

Hooks yang dibutuhkan:
- useOpnames(params?) → list sesi opname
- useOpname(id) → detail 1 sesi + items
- useCreateOpname() → buat sesi baru
- useUpdateOpnameItem() → update hasil hitung fisik per item
- useFinalizeOpname() → finalisasi opname

QueryKeys pattern:
export const opnameKeys = {
  all: ['opname'] as const,
  list: (params?: object) => [...opnameKeys.all, 'list', params] as const,
  detail: (id: string) => [...opnameKeys.all, 'detail', id] as const,
}

---

== FRONTEND: Halaman /inventory/opname/index.tsx ==

Tampilan:
[Button: + Mulai Opname Baru]

Summary Cards:
- Total Sesi Opname
- Sedang Berjalan (status = counting)
- Selesai (status = finalized)

Tabel sesi opname:
Kolom: No Opname | Gudang | Tgl Buat | Status | Items | Selisih | Aksi
- Status badge: 
    draft    = bg-slate-500/10 text-slate-500 "Draft"
    counting = bg-yellow-500/10 text-yellow-500 "Sedang Dihitung"
    finalized= bg-green-500/10 text-green-500 "Selesai"
- Kolom "Selisih": berapa item yang berbeda (merah jika > 0)
- Aksi: [Lanjutkan] → /opname/$id | [Hapus] (hanya jika draft)

---

== FRONTEND: Halaman /inventory/opname/new.tsx ==

Form buat sesi opname baru:
- Select Gudang (required)
- Catatan (optional)
- Tombol [Buat & Mulai Hitung] → POST /api/opname → redirect ke /opname/$id

Saat submit:
- Backend otomatis populate items dari semua produk aktif di gudang tersebut
- Set systemQty dari product_stock saat ini
- physicalQty = null (belum dihitung)

---

== FRONTEND: Halaman /inventory/opname/$id.tsx ==

LAYOUT:
[Header: No Opname + Gudang + Status Badge]
[Info: Tgl Buat, Total Item, Sudah Dihitung X/Y, Selisih: Z item]
[Progress Bar: progress hitung fisik]

[Tombol Finalisasi] (hanya muncul jika status = counting, semua item sudah dihitung)

Filter:
- Search produk (SKU / nama)
- Filter: Semua | Belum Dihitung | Ada Selisih | Sesuai

Tabel input:
Kolom: SKU | Nama Produk | Stok Sistem | Stok Fisik (INPUT) | Selisih | Catatan | Status
- Kolom "Stok Fisik": Input number yang bisa langsung diedit inline
- Auto save saat blur (onBlur → api call PUT /api/opname/:id/items)
- Selisih = Stok Fisik - Stok Sistem
    positif = hijau (+X) 
    negatif = merah (-X)
    nol = hijau (✓)
    null = abu2 (Belum)
- Inline edit catatan per item

Konfirmasi Finalisasi:
- Dialog konfirmasi sebelum finalize
- Tampilkan summary: "X item akan disesuaikan stoknya"
- List item yang ada perbedaan: nama, sistem, fisik, selisih
- [Batalkan] | [Finalisasi & Terapkan]

[OUTPUT]
Buatkan semua file di atas dengan pola yang konsisten dengan kode yang sudah ada di repo.
Gunakan pola Layout Header + Main.
Gunakan TanStack Router createFileRoute.
Gunakan TanStack Query untuk semua data fetching.
Gunakan Sonner toast untuk notifikasi.
```

---

## 📁 PROMPT 2 — HALAMAN TRANSFER STOK (Dedicated Page)

```
[CONTEXT]
Paste Master Context di atas dulu.

[TASK]
Buatkan halaman dedicated Transfer Stok.
Sekarang baru ada TransferStockDialog yang dipanggil dari detail warehouse.
Perlu halaman tersendiri di /inventory/transfer untuk memudahkan pengguna transfer lintas gudang.

== FILES YANG PERLU DIBUAT/DIMODIFIKASI ==

1. src/routes/_authenticated/inventory/transfer/index.tsx
   → Halaman daftar riwayat transfer + form transfer baru

2. src/routes/_authenticated/inventory/transfer/new.tsx  
   → Halaman form transfer stok

[CATATAN]
API untuk transfer sudah ada:
- POST /api/stock/transfer → di backend/src/routes/stock.ts
- useTransferStock() hook → di src/features/inventory/api/stock.ts

Interface StockTransfer yang sudah ada:
interface StockTransfer {
  productId: string
  fromWarehouseId: string
  toWarehouseId: string
  quantity: number
  notes?: string
}

Untuk riwayat transfer, gunakan useMovements() yang sudah ada:
- Filter: referenceType = 'transfer'
- Data sudah ada di tabel stock_movements

---

== FRONTEND: /inventory/transfer/index.tsx ==

LAYOUT:
[Header: "Transfer Stok"]
[Button kanan atas: "+ Transfer Baru"]

Summary Cards (ambil dari useMovementStats):
- Total Transfer Bulan Ini
- Total Qty Dipindahkan
- Gudang Paling Aktif

Filter:
- DateRange picker (dari - sampai)
- Filter gudang asal
- Filter gudang tujuan
- Search produk

Tabel riwayat transfer (dari stock_movements referenceType='transfer'):
Kolom: 
- No Referensi (referenceNumber)
- Tanggal
- Produk (SKU + Nama)
- Gudang Asal (movementType='out')
- Gudang Tujuan (movementType='in')
- Qty Transfer
- Dicatat oleh
- Catatan

Catatan implementasi:
Transfer 1 aksi = 2 rows di stock_movements (1 OUT dari asal, 1 IN ke tujuan).
Group by referenceNumber agar tampil sebagai 1 baris di tabel.

Klik baris → Dialog detail transfer (tampilkan kedua movement: OUT dan IN).

---

== FRONTEND: /inventory/transfer/new.tsx ==

Form transfer stok:

STEP 1 — Pilih Produk & Gudang Asal:
- Select Gudang Asal (dropdown, fetch /api/warehouses)
  → Saat dipilih, fetch stok di gudang tsb
- Select Produk (dropdown search, tampilkan SKU + nama + stok tersedia di gudang asal)
  → Tampilkan info card: "Stok tersedia: X pcs"

STEP 2 — Tujuan & Jumlah:
- Select Gudang Tujuan (exclude gudang asal, exclude gudang type='rejected')
  → Tampilkan info card: "Stok di gudang tujuan saat ini: X pcs"
- Input Qty (max = stok tersedia)
  → Validasi real-time: jangan boleh > stok tersedia
  → Tampilkan preview: 
      Gudang Asal  : X → X-qty
      Gudang Tujuan: Y → Y+qty
- Textarea Catatan (optional)

SUBMIT:
- Tombol [Transfer Sekarang]
- Loading state saat proses
- Sukses → toast.success + redirect ke /inventory/transfer
- Error → toast.error dengan pesan dari server

Zod Schema baru (src/features/inventory/schema/transfer-schema.ts):
export const transferSchema = z.object({
  productId: z.string().min(1, 'Produk wajib dipilih'),
  fromWarehouseId: z.string().min(1, 'Gudang asal wajib dipilih'),
  toWarehouseId: z.string().min(1, 'Gudang tujuan wajib dipilih'),
  quantity: z.number().int().min(1, 'Qty minimal 1'),
  notes: z.string().optional(),
}).refine(
  (data) => data.fromWarehouseId !== data.toWarehouseId,
  { message: 'Gudang asal dan tujuan tidak boleh sama', path: ['toWarehouseId'] }
)

[OUTPUT]
Buatkan kedua file halaman dengan pola yang sama seperti movements.tsx yang sudah ada.
Gunakan useMovements() dari src/features/inventory/api/stock.ts untuk riwayat.
Gunakan useTransferStock() yang sudah ada untuk mutasi.
Gunakan useWarehouses() dan useProducts() yang sudah ada.
```

---

## 📁 PROMPT 3 — ENHANCEMENT STOCK ADJUSTMENT (Upgrade Halaman Yang Ada)

```
[CONTEXT]
Paste Master Context di atas dulu.

[TASK]
Upgrade halaman Stock Adjustment yang sudah ada di:
src/routes/_authenticated/inventory/stock.tsx

[YANG PERLU DITAMBAHKAN]

1. FILTER WAREHOUSE di form adjustment
   Problem sekarang: adjustmentType langsung ke defaultWarehouse saja
   
   Tambahkan:
   - Select dropdown Gudang di form (saat ini hardcoded ke defaultWarehouse)
   - Saat pilih produk → tampilkan stok di SETIAP gudang (bukan hanya default)
   - User bisa pilih mau adjust stok di gudang mana

2. PREVIEW HASIL ADJUSTMENT
   Sebelum submit, tampilkan preview:
   
   Jika adjustmentType = 'add':
     "Stok akan berubah: 50 → 60 (+10)"
   Jika adjustmentType = 'subtract':
     "Stok akan berubah: 50 → 40 (-10)"  
   Jika adjustmentType = 'set':
     "Stok akan diset ke: 30 (perubahan: -20)"
   
   Tampilkan dengan warna:
   - Perubahan positif = green
   - Perubahan negatif = red

3. FILTER & PAGINATION di tabel Recent Adjustments
   Sekarang tabel history terbatas 10 item tanpa filter.
   
   Tambahkan:
   - Search by produk/SKU
   - Filter by tipe adjustment (add/subtract/set)
   - Filter by date range
   - Pagination (10, 20, 50 per page)
   - Klik baris → Dialog detail adjustment

4. SUMMARY STATS CARD
   Tambahkan di atas halaman (sebelum form):
   - Total Adjustment Bulan Ini
   - Total Qty Ditambah (hijau)
   - Total Qty Dikurangi (merah)
   - Item Dikurangi karena Rusak/Expired (orange)
   
   Data dari: useMovementStats() yang sudah ada + filter referenceType='adjustment'

[CATATAN IMPLEMENTASI]
- Jangan ubah pola kode yang sudah ada, hanya tambah/extend
- Tetap gunakan useAdjustStock() dan useAdjustStockBatch() yang sudah ada
- Untuk summary stats, buat endpoint baru: GET /api/stock/adjustment-stats
  Response: { totalThisMonth, totalAdded, totalSubtracted, damagedExpiredCount }
- Untuk select warehouse di form, gunakan useWarehouses() yang sudah ada
- Untuk preview, cukup computed value dari useState (tidak perlu API call)

[OUTPUT]
Modifikasi file src/routes/_authenticated/inventory/stock.tsx yang sudah ada.
Tambahkan fitur-fitur di atas tanpa merusak fungsi yang sudah berjalan.
```

---

## 📁 PROMPT 4 — BACKEND ENDPOINTS (Hono + Drizzle)

```
[CONTEXT]
Paste Master Context di atas dulu.

[TASK]
Buatkan backend endpoints baru untuk fitur yang belum ada.

== FILE: backend/src/routes/opname.ts ==

Stack: Bun + Hono + Drizzle ORM + PostgreSQL + Zod

Pola yang digunakan di backend (lihat backend/src/routes/stock.ts sebagai referensi):
- import { Hono } from 'hono'
- import { db } from '../db'
- import { ... } from '../db/schema'
- Validasi dengan Zod
- Response: c.json(data) atau c.json({ error: 'pesan' }, statusCode)
- Transaction dengan db.transaction(async (tx) => { ... })

Endpoints:

GET /api/opname
  Query params: page, limit, warehouseId, status
  Response: { data: OpnameSession[], pagination: { page, limit, total, totalPages } }
  Join: stockOpname + warehouses + count items

POST /api/opname
  Body: { warehouseId: string, notes?: string }
  Logic:
    1. Generate number: OP-YYYYMMDD-{increment}
    2. Insert stockOpname (status='draft')
    3. Fetch semua produk aktif dengan stok di warehouseId
    4. Insert stockOpnameItems (systemQty dari product_stock, physicalQty=null)
    5. Update status ke 'counting'
    6. Return opname dengan items

GET /api/opname/:id
  Response: opname + items dengan product info

PUT /api/opname/:id/items
  Body: { items: [{ id: string, physicalQty: number, notes?: string }] }
  Logic:
    1. Validasi opname exists & status != 'finalized'
    2. Update setiap item: physicalQty, difference = physicalQty - systemQty
    3. Return updated items

POST /api/opname/:id/finalize
  Logic:
    1. Validasi semua items sudah dihitung (physicalQty != null)
    2. db.transaction:
       a. Loop items yang ada difference
       b. Buat stock adjustment untuk tiap item
       c. Buat stock_movement dengan referenceType='opname', referenceNumber=opname.number
       d. Update product_stock quantity
    3. Update opname status='finalized', finalizedAt=now()
    4. Return summary: { adjustedItems: number, totalAdded: number, totalSubtracted: number }

DELETE /api/opname/:id
  Validasi: hanya bisa hapus jika status='draft'
  Cascade delete items dulu, baru hapus opname

---

== TAMBAHAN DI: backend/src/index.ts ==

Setelah membuat opname.ts, daftarkan route:
app.route('/api/opname', opnameRoutes)

---

== TAMBAHAN DI: backend/src/db/schema/index.ts ==

Tambahkan tabel stockOpname dan stockOpnameItems.
Tambahkan relations yang sesuai.
Buat migration baru dengan:
  cd backend && bun run db:generate && bun run db:migrate

[OUTPUT]
Buatkan file backend/src/routes/opname.ts lengkap.
Berikan juga kode tambahan untuk schema/index.ts.
Sertakan perintah migration.
```

---

## 📁 PROMPT 5 — SIDEBAR NAVIGATION UPDATE

```
[CONTEXT]
Paste Master Context di atas dulu.

[TASK]
Update sidebar navigation untuk menambahkan menu baru inventory.

Cari file sidebar/navigation di repo.
Kemungkinan lokasi:
- src/components/layout/sidebar.tsx
- src/components/app-sidebar.tsx
- src/data/sidebarData.ts atau navData.ts

Cek dulu dengan: grep -r "inventory" src/components --include="*.tsx" -l

[YANG PERLU DITAMBAHKAN]
Di dalam section Inventory, tambahkan menu item:
- Transfer Stok → /inventory/transfer (icon: ArrowRightLeft dari lucide-react)
- Stock Opname  → /inventory/opname  (icon: ClipboardList dari lucide-react)

Letakkan setelah menu "Stock Adjustment" (/inventory/stock) yang sudah ada.

[OUTPUT]
Temukan file sidebar yang relevan, lalu tambahkan menu item baru.
Ikuti pola yang sudah ada persis (jangan ubah struktur, hanya tambah item baru).
```

---

## 📁 PROMPT 6 — TAMBAHAN TIPE & SCHEMA

```
[CONTEXT]
Paste Master Context di atas dulu.

[TASK]
Tambahkan types dan schema baru ke file yang sudah ada.

== FILE: src/features/inventory/types/index.ts ==

Tambahkan interface berikut (jangan hapus yang sudah ada):

// Stock Opname Types
export interface OpnameSession {
  id: string
  number: string
  warehouseId: string
  warehouseName: string
  status: 'draft' | 'counting' | 'finalized'
  totalItems: number
  countedItems: number
  itemsWithDifference: number
  notes?: string
  createdAt: string
  finalizedAt?: string
}

export interface OpnameItem {
  id: string
  opnameId: string
  productId: string
  productSku: string
  productName: string
  unitName?: string
  systemQty: number
  physicalQty: number | null
  difference: number | null
  notes?: string
  updatedAt: string
}

export interface OpnameSummary {
  adjustedItems: number
  totalAdded: number
  totalSubtracted: number
}

// Transfer Types
export interface TransferRecord {
  referenceNumber: string
  date: string
  productId: string
  productSku: string
  productName: string
  fromWarehouseId: string
  fromWarehouseName: string
  toWarehouseId: string
  toWarehouseName: string
  quantity: number
  notes?: string
}

== FILE: src/features/inventory/schema/opname-schema.ts ==

Buat file baru:

import { z } from 'zod'

export const createOpnameSchema = z.object({
  warehouseId: z.string().min(1, 'Gudang wajib dipilih'),
  notes: z.string().max(500).optional().or(z.literal('')),
})

export const updateOpnameItemSchema = z.object({
  items: z.array(z.object({
    id: z.string().uuid(),
    physicalQty: z.number().int().min(0, 'Qty tidak boleh negatif'),
    notes: z.string().max(500).optional().or(z.literal('')),
  })),
})

export type CreateOpnameValues = z.infer<typeof createOpnameSchema>
export type UpdateOpnameItemValues = z.infer<typeof updateOpnameItemSchema>

== FILE: src/features/inventory/schema/transfer-schema.ts ==

Buat file baru:

import { z } from 'zod'

export const transferSchema = z.object({
  productId: z.string().min(1, 'Produk wajib dipilih'),
  fromWarehouseId: z.string().min(1, 'Gudang asal wajib dipilih'),
  toWarehouseId: z.string().min(1, 'Gudang tujuan wajib dipilih'),
  quantity: z.number().int().min(1, 'Qty minimal 1'),
  notes: z.string().max(500).optional().or(z.literal('')),
}).refine(
  (data) => data.fromWarehouseId !== data.toWarehouseId,
  {
    message: 'Gudang asal dan tujuan tidak boleh sama',
    path: ['toWarehouseId'],
  }
)

export type TransferFormValues = z.infer<typeof transferSchema>

[OUTPUT]
Update file types/index.ts dengan menambahkan interface baru.
Buat file schema opname-schema.ts dan transfer-schema.ts.
Jangan hapus atau ubah yang sudah ada.
```

---

## 🔁 URUTAN EKSEKUSI YANG BENAR

```
STEP 1 → Prompt 6 (Types & Schema) — fondasi dulu
STEP 2 → Prompt 4 (Backend Endpoints) — siapkan API
STEP 3 → Prompt 1 (Stock Opname Frontend) — fitur utama
STEP 4 → Prompt 2 (Transfer Stok Frontend) — fitur kedua
STEP 5 → Prompt 3 (Enhancement Stock Adjustment) — upgrade yang ada
STEP 6 → Prompt 5 (Sidebar Update) — tambahkan menu navigasi
```

---

## 💡 TIPS PENGGUNAAN

```
1. SELALU paste Master Context di awal setiap sesi baru

2. SATU PROMPT = SATU SESI, jangan gabung 2 prompt sekaligus

3. SEBELUM mulai prompt apapun, minta AI untuk cek file yang ada:
   "Sebelum mulai, baca dulu file ini: [path file]"

4. JIKA AI SALAH POLA, tunjukkan contoh kode yang benar:
   "Pola yang benar adalah seperti ini (lihat movements.tsx):
    [paste kode contoh]
    Sekarang ikuti pola yang sama untuk fitur baru"

5. UNTUK DEBUG ERROR:
   "Error ini muncul: [paste error]
    File yang error: [paste isi file]
    Perbaiki tanpa mengubah logika yang sudah berjalan"

6. SETELAH selesai satu prompt, validasi dengan:
   "Cek apakah kode ini sudah menggunakan:
    ✓ createFileRoute dari @tanstack/react-router
    ✓ Header + Main layout
    ✓ TanStack Query untuk data fetching
    ✓ sonner toast untuk notifikasi
    ✓ shadcn/ui komponen"
```

---

*Generated for: yummy-addict-app*
*Stack: React 19 + Vite + TanStack Router + TanStack Query + shadcn/ui + Bun + Hono + Drizzle*
