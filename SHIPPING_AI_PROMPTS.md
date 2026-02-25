# 🚚 MODUL SHIPPING — AI CODING PROMPTS
## Repo: yummy-addict-app (setelah latest push)

---

## 📊 HASIL ANALISA REPO (TERBARU)

### ✅ Yang Sudah Ada & Bisa Dipakai:
- `Order` interface & `useOrders()`, `useOrder()`, `useUpdateOrder()` 
  → `src/features/orders/api/orders.ts`
- Order sudah punya field shipping: `shippingCost`, `deliveryMethod`, `courierName`, `trackingNumber`
- Order status sudah include `'shipped'` sebagai nilai valid
- `PUT /api/orders/:id` sudah bisa update field shipping
- `useCouriers()` → `src/features/settings/api/couriers.ts`
- `sales/orders/index.tsx` sudah ada badge status 'shipped' + display shippingCost
- `orderKeys` query key pattern sudah ada dan konsisten

### ❌ Yang Belum Ada:
- Tidak ada `/shipping` route sama sekali
- Tidak ada `src/features/shipping/` folder
- Tidak ada dedicated endpoint untuk shipping summary
- Tidak ada bulk update resi
- Tidak ada filter khusus `deliveryMethod=delivery` di list orders

### 💡 Strategi:
- **Tidak perlu buat tabel baru** — semua data dari tabel `orders` yang sudah ada
- Shipping module = filtered view dari orders (deliveryMethod = 'delivery')
- Tambah endpoint backend minimal: summary stats + bulk update
- Re-use `useUpdateOrder()` untuk update kurir/resi/status

---

## 📌 MASTER CONTEXT — WAJIB PASTE DI SETIAP SESI BARU

```
[MASTER CONTEXT — yummy-addict-app / Modul Shipping]

== TECH STACK ==
Frontend : React 19 + Vite + TypeScript
Router   : TanStack Router v1 (file-based routing)
UI       : Tailwind CSS v4 + shadcn/ui + Radix UI
Data     : TanStack Query v5
Forms    : React Hook Form + Zod
Toast    : Sonner
Icons    : Lucide React
Backend  : Bun + Hono + Drizzle ORM + PostgreSQL

== POLA ROUTE ==
File   : src/routes/_authenticated/shipping/[nama].tsx
Contoh : export const Route = createFileRoute('/_authenticated/shipping/')({ component: NamaPage })
         export const Route = createFileRoute('/_authenticated/shipping/$id')({ component: NamaPage })
         export const Route = createFileRoute('/_authenticated/shipping/bulk-update')({ component: NamaPage })

== POLA LAYOUT WAJIB ==
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'

<>
  <Header fixed>
    <h1 className="text-lg font-semibold">Judul</h1>
    <div className="ml-auto flex items-center space-x-4">
      <ThemeSwitch />
      <ProfileDropdown />
    </div>
  </Header>
  <Main>{/* konten */}</Main>
</>

== ORDER STATUS & BADGE PATTERN ==
Order status yang valid: 'pending' | 'processing' | 'shipped' | 'completed' | 'cancelled'

Shipping status (derived dari order status + trackingNumber):
- needs_action → deliveryMethod='delivery' AND trackingNumber IS NULL AND status IN ('pending','processing')
- shipped      → trackingNumber IS NOT NULL AND status = 'shipped'
- delivered    → status = 'completed'
- cancelled    → status = 'cancelled'

Badge warna:
- needs_action → bg-orange-500/10 text-orange-500  "Perlu Diproses"
- shipped      → bg-blue-500/10  text-blue-500    "Dalam Perjalanan"
- delivered    → bg-green-500/10 text-green-500   "Diterima"
- cancelled    → bg-slate-500/10 text-slate-500   "Dibatalkan"

== YANG SUDAH ADA & LANGSUNG BISA DIPAKAI ==
// Orders API - src/features/orders/api/orders.ts
import { useOrders, useOrder, useUpdateOrder, orderKeys } from '@/features/orders/api'
// Order interface sudah punya: shippingCost, deliveryMethod, courierName, trackingNumber, status
// useOrders(params) → { data: Order[], pagination: {...} }
// useUpdateOrder() → PUT /api/orders/:id

// Couriers - src/features/settings/api/couriers.ts
import { useCouriers } from '@/features/settings/api/couriers'
// useCouriers() → Courier[] { id, code, name, defaultCost, isActive }

// Utils
import { formatCurrency } from '@/lib/utils'
import { api } from '@/lib/api-client'

// API Client methods:
api.get<T>('/api/endpoint', params?)   // params = Record<string, string|number|boolean|undefined>
api.post<T>('/api/endpoint', body)
api.put<T>('/api/endpoint', body)

== NAVIGASI ==
import { useNavigate, Link } from '@tanstack/react-router'
const navigate = useNavigate()
navigate({ to: '/shipping/$id', params: { id: order.id } })
navigate({ to: '/shipping' })
const { id } = Route.useParams()
```

---

## 📁 PROMPT 1 — TYPES & API HOOKS

```
[CONTEXT]
Paste Master Context di atas.

[TASK]
Buatkan types dan API hooks khusus untuk modul Shipping.

== FILE: src/features/shipping/api/shipping.ts ==

[IMPORT yang dibutuhkan]
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import { orderKeys } from '@/features/orders/api'

[TYPES]

// Derived shipping status dari order
export type ShippingStatus = 'needs_action' | 'shipped' | 'delivered' | 'cancelled'

// Helper function untuk derive shipping status
export function getShippingStatus(order: {
  status: string
  deliveryMethod?: string
  trackingNumber?: string
}): ShippingStatus {
  if (order.status === 'completed') return 'delivered'
  if (order.status === 'cancelled') return 'cancelled'
  if (order.trackingNumber && order.status === 'shipped') return 'shipped'
  return 'needs_action'
}

export interface ShippingSummary {
  needs_action: number   // delivery orders tanpa resi
  shipped: number        // sudah ada resi, status shipped
  delivered: number      // status completed
  cancelled: number      // status cancelled
  total_shipping_cost: number
}

export interface ShippingFilter {
  page?: number
  limit?: number
  search?: string
  shippingStatus?: ShippingStatus | 'all'
  courierId?: string
  dateFrom?: string
  dateTo?: string
}

export interface UpdateShippingRequest {
  courierName?: string
  trackingNumber?: string
  shippingCost?: number
  status?: 'shipped' | 'completed' | 'cancelled'
}

export interface BulkUpdateItem {
  orderNumber: string
  courierName: string
  trackingNumber: string
}

export interface BulkUpdateResult {
  success: number
  failed: number
  errors: { orderNumber: string; reason: string }[]
}

[QUERY KEYS]

export const shippingKeys = {
  all: ['shipping'] as const,
  list: (params?: object) => [...shippingKeys.all, 'list', params] as const,
  summary: () => [...shippingKeys.all, 'summary'] as const,
}

[HOOKS]

1. useShipments(params?: ShippingFilter)
   Endpoint: GET /api/shipping/list
   queryKey: shippingKeys.list(params)
   Returns: { data: Order[], summary: ShippingSummary, pagination: {...} }
   
   Catatan: Endpoint ini adalah wrapper dari orders
   dengan filter deliveryMethod='delivery' otomatis

2. useShippingSummary()
   Endpoint: GET /api/shipping/summary
   queryKey: shippingKeys.summary()
   Returns: ShippingSummary

3. useUpdateShipping()
   Endpoint: PUT /api/shipping/:id
   Body: UpdateShippingRequest
   onSuccess: 
     queryClient.invalidateQueries({ queryKey: shippingKeys.all })
     queryClient.invalidateQueries({ queryKey: orderKeys.all })

4. useBulkUpdateResi()
   Endpoint: POST /api/shipping/bulk-update
   Body: { items: BulkUpdateItem[] }
   Returns: BulkUpdateResult
   onSuccess:
     queryClient.invalidateQueries({ queryKey: shippingKeys.all })
     queryClient.invalidateQueries({ queryKey: orderKeys.all })

[OUTPUT]
Buatkan file src/features/shipping/api/shipping.ts lengkap dengan semua types dan hooks di atas.
Juga buat src/features/shipping/api/index.ts yang export semuanya.
```

---

## 📁 PROMPT 2 — BACKEND ENDPOINTS

```
[CONTEXT]
Paste Master Context di atas.

[TASK]
Buatkan backend endpoints untuk modul Shipping.
File baru: backend/src/routes/shipping.ts

Stack: Bun + Hono + Drizzle ORM
Ikuti pola dari: backend/src/routes/couriers.ts

Import yang dibutuhkan:
import { Hono } from 'hono'
import { db } from '../db'
import { orders, customers } from '../db/schema'
import { eq, and, desc, like, gte, lte, isNotNull, isNull, sql, or } from 'drizzle-orm'
import { z } from 'zod'

== ENDPOINT 1: GET /api/shipping/summary ==

Logic:
- Query orders WHERE deliveryMethod = 'delivery'
- Hitung per kategori:
    needs_action = status IN ('pending','processing') AND trackingNumber IS NULL
    shipped      = status = 'shipped' (trackingNumber sudah ada)
    delivered    = status = 'completed'
    cancelled    = status = 'cancelled'
- Sum total shippingCost dari semua delivery orders

Response:
{
  needs_action: number,
  shipped: number,
  delivered: number,
  cancelled: number,
  total_shipping_cost: number
}

== ENDPOINT 2: GET /api/shipping/list ==

Query params: page, limit, search, shippingStatus, courierId, dateFrom, dateTo

Logic:
- Base filter: deliveryMethod = 'delivery'
- Tambah filter berdasarkan shippingStatus:
    needs_action → status IN ('pending','processing') AND trackingNumber IS NULL
    shipped      → status = 'shipped'
    delivered    → status = 'completed'
    cancelled    → status = 'cancelled'
- Search: LIKE pada orderNumber, customerName, trackingNumber
- Filter courierId: WHERE courierName = (nama kurir dari id)
- Filter dateFrom/dateTo: WHERE date >= dateFrom AND date <= dateTo
- Pagination: offset = (page-1) * limit
- Order by: createdAt DESC
- Include summary di response

Response:
{
  data: Order[],  // sama seperti response dari /api/orders
  summary: ShippingSummary,
  pagination: { page, limit, total, totalPages }
}

== ENDPOINT 3: PUT /api/shipping/:id ==

Body schema (Zod):
{
  courierName: string (optional),
  trackingNumber: string (optional),
  shippingCost: number (optional),
  status: 'shipped' | 'completed' | 'cancelled' (optional)
}

Logic:
- Fetch order, validasi exists & deliveryMethod = 'delivery'
- Update orders table:
    courierName jika ada
    trackingNumber jika ada
    shippingCost jika ada
    status jika ada
    updatedAt = now()
- Return updated order

== ENDPOINT 4: POST /api/shipping/bulk-update ==

Body schema (Zod):
{
  items: z.array(z.object({
    orderNumber: z.string(),
    courierName: z.string(),
    trackingNumber: z.string(),
  }))
}

Logic:
- Loop setiap item
- Find order by number WHERE deliveryMethod = 'delivery'
- Jika tidak ketemu → push ke errors
- Jika ketemu → update courierName + trackingNumber + status='shipped'
- Track success/failed count

Response:
{
  success: number,
  failed: number,
  errors: [{ orderNumber: string, reason: string }]
}

== DAFTARKAN DI backend/src/index.ts ==

Tambahkan:
import { shippingRoutes } from './routes/shipping'
app.route('/api/shipping', shippingRoutes)

[OUTPUT]
Buatkan file backend/src/routes/shipping.ts lengkap.
Berikan juga baris kode yang perlu ditambahkan ke backend/src/index.ts.
```

---

## 📁 PROMPT 3 — HALAMAN UTAMA (/shipping)

```
[CONTEXT]
Paste Master Context di atas.

[TASK]
Buatkan halaman utama Manajemen Pengiriman.
File: src/routes/_authenticated/shipping/index.tsx

[API yang dipakai]
import { useShipments, useShippingSummary, getShippingStatus } from '@/features/shipping/api'
import { useCouriers } from '@/features/settings/api/couriers'

[LAYOUT LENGKAP]

HEADER:
- Kiri: Judul "Manajemen Pengiriman"
- Kanan: Button [📦 Update Resi Massal] → navigate ke /shipping/bulk-update

SUMMARY CARDS (4 kartu horizontal, masing-masing clickable):
Saat diklik → set filter shippingStatus ke nilai tersebut

Card 1 — Perlu Diproses:
  icon: PackageSearch (orange)
  value: summary.needs_action
  label: "Perlu Diproses"
  border-left: border-l-4 border-l-orange-500

Card 2 — Dalam Perjalanan:
  icon: Truck (blue)
  value: summary.shipped
  label: "Dalam Perjalanan"
  border-left: border-l-4 border-l-blue-500

Card 3 — Diterima:
  icon: PackageCheck (green)
  value: summary.delivered
  label: "Diterima"
  border-left: border-l-4 border-l-green-500

Card 4 — Total Ongkir:
  icon: Wallet (slate)
  value: formatCurrency(summary.total_shipping_cost)
  label: "Total Ongkir"
  border-left: border-l-4 border-l-slate-400
  (tidak clickable)

FILTER BAR (sticky, flex-wrap gap-2):
1. Input search placeholder "Cari no order, nama customer, no resi..."
2. Chip tabs status (gunakan Button variant):
   [Semua] [Perlu Diproses] [Dalam Perjalanan] [Diterima] [Dibatalkan]
   - Active chip: variant="default"
   - Inactive chip: variant="outline"
3. Select kurir (dari useCouriers)
4. DateRange picker: dari - sampai
5. Button Reset (muncul jika ada filter aktif)

TABEL PENGIRIMAN:
Gunakan komponen Table dari shadcn/ui.

Kolom:
- No Order (font-mono text-sm)
  sub: nama customer (text-xs text-muted-foreground)
- Kurir
  Jika ada courierName → badge dengan nama kurir
  Jika tidak → text-muted-foreground italic "Belum ditentukan"
- No Resi
  Jika ada → font-mono text-sm
  Jika tidak → Badge orange "Input Resi"
- Ongkir: formatCurrency(shippingCost)
- Status: Badge dengan warna sesuai getShippingStatus(order)
- Tgl Order: format date (DD MMM YYYY)
- Aksi: Button [Lihat →] size="sm" variant="ghost"

TableRow: className="cursor-pointer hover:bg-muted/50"
onClick → navigate({ to: '/shipping/$id', params: { id: order.id } })

EMPTY STATE:
- Jika filter = needs_action & data kosong → "🎉 Semua pesanan sudah diproses!"
- Default → Icon Truck + "Belum ada data pengiriman"

LOADING STATE:
- Skeleton untuk summary cards (4 kartu)
- Skeleton untuk tabel (5 baris)

PAGINATION:
- Rows per page select: 10, 20, 50
- Info: "Menampilkan X-Y dari Z pengiriman"
- Button Previous / Next

[STATE MANAGEMENT]
const [page, setPage] = useState(1)
const [search, setSearch] = useState('')
const [shippingStatus, setShippingStatus] = useState<string>('all')
const [courierId, setCourierId] = useState<string>('all')
const [dateFrom, setDateFrom] = useState<Date | undefined>()
const [dateTo, setDateTo] = useState<Date | undefined>()
const [limit, setLimit] = useState(20)

// Reset page saat filter berubah
// Debounce search 300ms dengan useDebounce dari @/hooks/use-debounce

[OUTPUT]
Buatkan halaman lengkap dengan semua komponen di atas.
Gunakan createFileRoute('/_authenticated/shipping/').
Ikuti pola layout dari: src/routes/_authenticated/inventory/movements.tsx
```

---

## 📁 PROMPT 4 — HALAMAN DETAIL (/shipping/$id)

```
[CONTEXT]
Paste Master Context di atas.

[TASK]
Buatkan halaman detail pengiriman.
File: src/routes/_authenticated/shipping/$id.tsx

[API yang dipakai]
import { useOrder } from '@/features/orders/api'
import { useUpdateShipping, getShippingStatus } from '@/features/shipping/api'
import { useCouriers } from '@/features/settings/api/couriers'
import { useNavigate } from '@tanstack/react-router'

const { id } = Route.useParams()

[LAYOUT — lg:grid-cols-3, gap-6]

HEADER:
- Button [← Kembali] → navigate({ to: '/shipping' })
- Judul: "Pengiriman #{order.number}"
- Badge status (getShippingStatus(order))

KOLOM KIRI (lg:col-span-2):

  Card 1 — Info Pesanan:
  - Grid 2 kolom:
    - No Order: {order.number} (font-mono)
    - Tanggal: format(order.date, 'dd MMM yyyy HH:mm')
    - Status Order: badge
    - Total: formatCurrency(order.finalAmount)
  - Catatan jika ada

  Card 2 — Items Pesanan:
  - Tabel: Produk | Qty | Harga | Subtotal
  - Footer: Subtotal, Ongkir, Total

  Card 3 — Info Penerima:
  - Grid 2 kolom:
    - Nama: {order.customerName || order.customer?.name || 'Umum'}
    - Phone: {order.customerPhone || order.customer?.phone || '-'}
  - Alamat lengkap (full width)

KOLOM KANAN (lg:col-span-1):

  Card 4 — Update Pengiriman (FORM UTAMA):
  - Judul: "Info Pengiriman"
  - Form fields (gunakan React Hook Form + Zod):
    
    a. Select Kurir:
       - Dropdown dari useCouriers()
       - Default value: order.courierName
       - Saat pilih kurir → auto isi nama kurir
    
    b. Input No Resi:
       - Placeholder: "Masukkan nomor resi..."
       - Default: order.trackingNumber || ''
    
    c. Input Ongkos Kirim:
       - Type: number
       - Default: Number(order.shippingCost)
       - Prefix: "Rp"
    
    d. Select Status:
       - Options sesuai alur logis:
         Jika status saat ini 'needs_action':
           [Perlu Diproses, Dalam Perjalanan, Diterima, Dibatalkan]
         Jika status 'shipped':
           [Dalam Perjalanan, Diterima, Dibatalkan]
         Jika 'delivered' atau 'cancelled':
           disabled (tidak bisa diubah)
       - Map ke order status:
         "Dalam Perjalanan" → status: 'shipped'
         "Diterima"         → status: 'completed'
         "Dibatalkan"       → status: 'cancelled'
    
    e. Button [Simpan Perubahan] (full width)
       - disabled jika tidak ada perubahan
       - loading state saat submit
       - onSubmit → useUpdateShipping().mutateAsync({ id, ...data })
       - onSuccess → toast.success("Pengiriman berhasil diupdate") + invalidate

  Card 5 — Tracking Link (conditional):
  Tampilkan hanya jika ada trackingNumber.
  
  Tombol lacak per kurir:
  const trackingUrls: Record<string, string> = {
    'JNE': `https://www.jne.co.id/id/tracking/trace`,
    'SICEPAT': `https://www.sicepat.com/checkAwb`,
    'JT': `https://jet.co.id/track`,
    'ANTERAJA': `https://anteraja.id/tracking`,
    'GOSEND': `https://www.gojek.com/gosend/`,
    'GRAB': `https://www.grab.com/`,
  }
  
  - Tampilkan no resi (font-mono, bisa di-copy)
  - Button [🔗 Lacak Paket] → window.open(url, '_blank')
  - Jika kurir tidak ada di map → Google: "https://www.google.com/search?q=cek+resi+${trackingNumber}"

LOADING STATE: Skeleton 2 kolom

ERROR STATE: Alert merah "Pesanan tidak ditemukan" + Button kembali

[ZOD SCHEMA untuk form]
const updateShippingSchema = z.object({
  courierName: z.string().optional(),
  trackingNumber: z.string().optional(),
  shippingCost: z.number().min(0).optional(),
  status: z.enum(['shipped', 'completed', 'cancelled']).optional(),
})

[OUTPUT]
Buatkan halaman lengkap.
Gunakan createFileRoute('/_authenticated/shipping/$id').
```

---

## 📁 PROMPT 5 — HALAMAN BULK UPDATE (/shipping/bulk-update)

```
[CONTEXT]
Paste Master Context di atas.

[TASK]
Buatkan halaman Update Resi Massal.
File: src/routes/_authenticated/shipping/bulk-update.tsx

[API yang dipakai]
import { useBulkUpdateResi } from '@/features/shipping/api'
import { useCouriers } from '@/features/settings/api/couriers'

[LAYOUT]

HEADER:
- Button [← Kembali ke Pengiriman] → navigate({ to: '/shipping' })
- Judul: "Update Resi Massal"
- Deskripsi: "Update nomor resi untuk banyak pesanan sekaligus"

TAB NAVIGATION (shadcn Tabs):
Tab 1: "📥 Upload CSV"
Tab 2: "✏️ Input Manual"

=== TAB 1: UPLOAD CSV ===

Step 1 — Download Template:
  - Card dengan instruksi singkat
  - Tabel contoh format CSV:
    | no_order     | nama_kurir | no_resi      |
    | ORD-001      | JNE        | JNE123456789 |
    | ORD-002      | SiCepat    | SCP987654321 |
  - Button [⬇ Download Template CSV]
  - onClick: generate CSV dan download via browser

Step 2 — Upload File:
  - Drag & drop zone (div dengan border-dashed)
  - Atau Button [Pilih File CSV]
  - Input type="file" accept=".csv" hidden
  - Tampilkan nama file yang dipilih

Step 3 — Preview (muncul setelah upload):
  - Parse CSV dengan FileReader + split(',')
  - Tampilkan tabel preview:
    Kolom: No Order | Kurir | No Resi | Validasi
  - Validasi client-side: cek row tidak kosong
  - Button [🚀 Proses Semua] → disabled jika ada baris kosong

=== TAB 2: INPUT MANUAL ===

Dynamic table dengan useState:
const [rows, setRows] = useState([{ orderNumber: '', courierName: '', trackingNumber: '' }])

Tabel input:
- Header: No Pesanan | Kurir | No Resi | Hapus
- Setiap baris:
  a. Input no pesanan (text)
  b. Select kurir (dari useCouriers, tampilkan nama)
  c. Input no resi (text)
  d. Button hapus baris (Icon Trash2, hanya jika rows > 1)
- Button [+ Tambah Baris] di bawah tabel

Validation sebelum submit:
- Semua field harus diisi
- Minimal 1 baris
- Button [Simpan Semua] → disabled jika ada field kosong

=== SUBMIT FLOW (sama untuk kedua tab) ===

1. Klik submit → tampilkan ConfirmDialog:
   - "Anda akan mengupdate resi untuk X pesanan"
   - [Batal] [Ya, Proses]

2. Konfirmasi → useBulkUpdateResi().mutateAsync({ items })

3. Loading state: Dialog dengan Loader2 "Memproses X pesanan..."

4. Selesai → tampilkan ResultDialog:
   ✅ Berhasil: X pesanan diupdate
   ❌ Gagal: Y pesanan
   
   Jika ada errors, tampilkan tabel:
   | No Order | Alasan Gagal |
   
   Button [Kembali ke Daftar Pengiriman] → navigate({ to: '/shipping' })

=== HELPER: Download CSV Template ===

const downloadTemplate = () => {
  const headers = 'no_order,nama_kurir,no_resi'
  const example = 'ORD-20240101-001,JNE,JNE123456789'
  const csvContent = `${headers}\n${example}`
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'template-update-resi.csv'
  link.click()
  URL.revokeObjectURL(url)
}

[OUTPUT]
Buatkan halaman lengkap dengan kedua tab.
Gunakan createFileRoute('/_authenticated/shipping/bulk-update').
Parsing CSV menggunakan FileReader API (tidak perlu library tambahan).
```

---

## 📁 PROMPT 6 — SIDEBAR NAVIGATION UPDATE

```
[CONTEXT]
Paste Master Context di atas.

[TASK]
Update sidebar navigation untuk menambahkan menu Pengiriman.
File: src/components/layout/data/sidebar-data.ts

Cek dulu isi file tersebut, lalu tambahkan di section 
"3. Transaksi & Pengiriman" (sudah ada di sidebar).

Tambahkan sub-menu Pengiriman:
{
  title: 'Pengiriman',
  icon: Truck,
  items: [
    {
      title: 'Daftar Pengiriman',
      url: '/shipping',
      icon: Package,
    },
    {
      title: 'Update Resi Massal',
      url: '/shipping/bulk-update',
      icon: PackagePlus,
    },
    {
      title: 'Manajemen Kurir',
      url: '/settings/couriers',
      icon: Truck,
    },
  ],
}

Import icons yang mungkin perlu ditambahkan:
import { Package, PackagePlus, Truck } from 'lucide-react'
(cek apakah sudah di-import, jika belum tambahkan)

[OUTPUT]
Update file sidebar-data.ts.
Jangan hapus atau ubah menu yang sudah ada, hanya tambahkan menu Pengiriman.
```

---

## 📋 URUTAN EKSEKUSI

```
STEP 1 → Prompt 1  (Types & API Hooks)      → fondasi data
STEP 2 → Prompt 2  (Backend Endpoints)      → siapkan API  
STEP 3 → Prompt 3  (Halaman Utama /shipping) → list pengiriman
STEP 4 → Prompt 4  (Halaman Detail)         → detail + update
STEP 5 → Prompt 5  (Bulk Update)            → fitur massal
STEP 6 → Prompt 6  (Sidebar Navigation)     → tambah menu
```

---

## 📊 SUMMARY ROUTES SHIPPING

| Route | Status | Deskripsi |
|---|---|---|
| `/shipping` | ❌ Buat baru | Daftar semua pengiriman + summary cards + filter |
| `/shipping/$id` | ❌ Buat baru | Detail + form update kurir/resi/status + tracking link |
| `/shipping/bulk-update` | ❌ Buat baru | Update resi massal (CSV upload + input manual) |
| `/settings/couriers` | ✅ Sudah ada | CRUD manajemen kurir (tidak perlu diubah) |
| `/reports/shipping` | ✅ Sudah ada | Laporan pengiriman (tidak perlu diubah) |

---

## 💡 CATATAN PENTING UNTUK AI

```
1. JANGAN buat tabel baru di database
   → Semua data dari tabel 'orders' yang sudah ada

2. GUNAKAN useUpdateOrder() BUKAN buat mutation baru
   → Kecuali untuk bulk update yang perlu endpoint sendiri

3. shippingStatus adalah COMPUTED field
   → Derive dari order.status + order.trackingNumber
   → Gunakan helper getShippingStatus(order)

4. Filter delivery orders dengan:
   → deliveryMethod = 'delivery' di backend
   → Jangan filter di frontend (akan miss data)

5. Re-use komponen yang sudah ada:
   → Header, Main, ProfileDropdown, ThemeSwitch dari layout
   → formatCurrency dari @/lib/utils
   → Badge, Table, Dialog, dll dari shadcn/ui
```

*Generated for: yummy-addict-app*
*Stack: React 19 + TanStack Router + TanStack Query + shadcn/ui + Bun + Hono + Drizzle*
*Berdasarkan analisa repo terbaru setelah latest push*
