# 🚚 MODUL PENGIRIMAN — FULL BREAKDOWN
## Repo: yummy-addict-app

---

## 📊 HASIL ANALISA REPO

### ✅ Yang Sudah Ada:
- `/settings/couriers` → CRUD manajemen kurir (di settings)
- `backend/src/routes/couriers.ts` → API kurir sudah lengkap
- Field shipping di `orders` & `transactions`:
  - `shippingCost`, `deliveryMethod`, `courierName`, `trackingNumber`
- `reports/shipping.tsx` → Laporan pengiriman sudah ada
- `ShipmentTable` + `CourierChart` component di reports

### ❌ Yang Belum Ada (Dedicated Shipping Module):
- Tidak ada `/shipping` route sama sekali
- Tidak ada `src/features/shipping/` folder
- Tidak ada halaman daftar semua pengiriman
- Tidak ada manajemen status pengiriman per order
- Tidak ada fitur update tracking number secara dedicated
- Tidak ada bulk update status pengiriman

---

## 🗺️ ROUTES YANG AKAN DIBUAT

```
/shipping
├── index.tsx              → Dashboard + Daftar semua pengiriman
├── $id.tsx                → Detail pengiriman + update status/tracking
└── bulk-update.tsx        → Update tracking number massal
```

---

## 🖥️ UI/UX BREAKDOWN

```
🚚 MODUL PENGIRIMAN
│
├── 📋 1. HALAMAN UTAMA (/shipping)
│   │
│   ├── 📐 Layout
│   │   ├── [Header] "Manajemen Pengiriman" + [Tombol: Update Massal]
│   │   ├── [Summary Cards] — 4 kartu status
│   │   │   ├── 🔵 Perlu Diproses  → order delivery yg belum ada tracking
│   │   │   ├── 🟡 Dalam Perjalanan → sudah ada tracking, belum delivered
│   │   │   ├── 🟢 Diterima         → status delivered
│   │   │   └── 🔴 Retur / Gagal   → status returned/failed
│   │   ├── [Filter Bar]
│   │   │   ├── Search (no order / nama customer / no resi)
│   │   │   ├── Date Range Picker
│   │   │   ├── Filter Kurir (dropdown)
│   │   │   └── Filter Status (chip tabs)
│   │   └── [Tabel Pengiriman]
│   │       ├── Kolom: No Order | Customer | Kurir | No Resi | Ongkir | Status | Tgl | Aksi
│   │       ├── Klik baris → /shipping/$id
│   │       └── Inline action: [Input Resi] untuk yang belum ada resi
│   │
│   ├── 🧩 Komponen UI
│   │   ├── SummaryCard (clickable → filter tabel)
│   │   ├── Filter chips status (All | Perlu Proses | Dikirim | Diterima | Retur)
│   │   ├── Badge Status:
│   │   │   ├── 🔵 PENDING    → "Perlu Diproses"
│   │   │   ├── 🟡 SHIPPED    → "Dalam Perjalanan"
│   │   │   ├── 🟢 DELIVERED  → "Diterima"
│   │   │   └── 🔴 RETURNED   → "Retur"
│   │   ├── Inline input resi (expand row)
│   │   └── Pagination
│   │
│   └── 🔀 User Flow
│       ├── Landing → lihat summary cards
│       ├── Klik card "Perlu Diproses" → tabel auto filter
│       ├── Input resi inline di tabel
│       └── Klik baris → detail pengiriman
│
├── 🔍 2. DETAIL PENGIRIMAN (/shipping/$id)
│   │
│   ├── 📐 Layout (2 kolom)
│   │   │
│   │   ├── [Kolom Kiri — Info Pengiriman]
│   │   │   ├── Card: Info Pesanan
│   │   │   │   ├── No Order + link ke order
│   │   │   │   ├── Tanggal Order
│   │   │   │   └── Items yang dipesan (list)
│   │   │   └── Card: Info Customer / Penerima
│   │   │       ├── Nama penerima
│   │   │       ├── No HP
│   │   │       └── Alamat lengkap
│   │   │
│   │   └── [Kolom Kanan — Detail Pengiriman]
│   │       ├── Card: Status Pengiriman
│   │       │   ├── Status badge (besar)
│   │       │   ├── Timeline history status
│   │       │   │   ├── 📦 Order dibuat — [tanggal]
│   │       │   │   ├── 🚚 Dikirim — [tanggal]
│   │       │   │   └── ✅ Diterima — [tanggal]
│   │       │   └── Tombol update status
│   │       └── Card: Info Kurir & Resi
│   │           ├── Nama Kurir (Select dropdown)
│   │           ├── No Resi (Input)
│   │           ├── Ongkos Kirim (IDR)
│   │           ├── Metode (Pickup / Delivery)
│   │           └── [Tombol Simpan Perubahan]
│   │
│   ├── 🧩 Komponen UI
│   │   ├── Timeline vertikal (status history)
│   │   ├── Form inline edit kurir & resi
│   │   ├── Status update dialog
│   │   │   ├── Select status baru
│   │   │   ├── Input tanggal
│   │   │   └── Textarea catatan
│   │   └── Link "Lacak di website kurir" (new tab)
│   │
│   └── 🔀 User Flow
│       ├── Lihat info lengkap pengiriman
│       ├── Edit kurir / input no resi → simpan
│       ├── Update status → dialog konfirmasi
│       └── Klik "Lacak" → buka tab baru ke website kurir
│
└── 📦 3. BULK UPDATE RESI (/shipping/bulk-update)
    │
    ├── 📐 Layout
    │   ├── [Header] "Update Resi Massal"
    │   ├── [Info] "Upload CSV atau input manual untuk update banyak resi sekaligus"
    │   ├── [Tab: Upload CSV | Input Manual]
    │   │
    │   ├── Tab CSV:
    │   │   ├── Template download (No Order, Kurir, No Resi)
    │   │   ├── Drag & drop upload CSV
    │   │   └── Preview tabel sebelum submit
    │   │
    │   └── Tab Manual:
    │       ├── Tabel input:
    │       │   ├── Search & pilih order
    │       │   ├── Input No Resi
    │       │   └── Select Kurir
    │       ├── Tombol [+ Tambah Baris]
    │       └── Tombol [Simpan Semua]
    │
    ├── 🧩 Komponen UI
    │   ├── Tab Navigation
    │   ├── Drag & Drop zone (CSV)
    │   ├── Preview table (sebelum submit)
    │   ├── Validation row (merah jika no order tidak ditemukan)
    │   └── Progress dialog (saat submit batch)
    │
    └── 🔀 User Flow
        ├── Pilih tab CSV atau Manual
        ├── Input / upload data
        ├── Preview & validasi
        ├── Submit → loading progress
        └── Sukses → redirect ke /shipping
```

---

## 🤖 AI CODING PROMPTS

---

### 📌 MASTER CONTEXT — WAJIB PASTE DI SETIAP SESI

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
File     : src/routes/_authenticated/shipping/[nama].tsx
Cara buat: export const Route = createFileRoute('/_authenticated/shipping/[nama]')({ component: NamaPage })

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

== BADGE COLOR PATTERN ==
- blue-500/10  + text-blue-500   → pending / dalam perjalanan
- green-500/10 + text-green-500  → delivered / sukses
- red-500/10   + text-red-500    → returned / gagal
- yellow-500/10 + text-yellow-500 → processing / warning
- slate-500/10 + text-slate-500  → pickup / netral

== API CLIENT ==
import { api } from '@/lib/api-client'
api.get<T>('/api/endpoint', params?)
api.post<T>('/api/endpoint', body)
api.put<T>('/api/endpoint', body)

== YANG SUDAH ADA DAN BISA DIPAKAI ==
- useCouriers() → src/features/settings/api/couriers.ts
- Courier interface → { id, code, name, defaultCost, isActive }
- Shipping fields di orders: shippingCost, deliveryMethod, courierName, trackingNumber
- formatCurrency() → src/lib/utils.ts

== DATABASE SCHEMA RELEVAN ==
orders: {
  id, number, customerName, customerPhone, customerAddress,
  shippingCost, deliveryMethod (pickup/delivery),
  courierName, trackingNumber,
  status (pending/processing/completed/cancelled),
  finalAmount, createdAt
}
transactions: {
  id, number, shippingCost, deliveryMethod,
  courierName, trackingNumber, paymentStatus
}
couriers: { id, code, name, defaultCost, isActive }
```

---

### 📁 PROMPT 1 — TYPES & API HOOKS

```
[CONTEXT]
Paste Master Context di atas.

[TASK]
Buatkan types dan API hooks untuk modul Shipping.

== FILE 1: src/features/shipping/types/index.ts ==

export type ShippingStatus = 'pending' | 'shipped' | 'delivered' | 'returned' | 'failed'
export type DeliveryMethod = 'pickup' | 'delivery'

export interface Shipment {
  id: string               // order id
  orderNumber: string
  orderDate: string
  customerName: string
  customerPhone?: string
  customerAddress?: string
  items: ShipmentItem[]
  courierId?: string
  courierName?: string
  courierCode?: string
  trackingNumber?: string
  shippingCost: number
  deliveryMethod: DeliveryMethod
  shippingStatus: ShippingStatus
  statusHistory: ShipmentStatusHistory[]
  orderStatus: string
  finalAmount: number
  notes?: string
  createdAt: string
  updatedAt: string
}

export interface ShipmentItem {
  productName: string
  sku: string
  qty: number
  price: number
  subtotal: number
}

export interface ShipmentStatusHistory {
  status: ShippingStatus
  date: string
  note?: string
  updatedBy?: string
}

export interface ShipmentSummary {
  pending: number     // delivery, belum ada resi
  shipped: number     // sudah ada resi, belum delivered
  delivered: number
  returned: number
  failed: number
  totalShippingCost: number
}

export interface ShipmentsResponse {
  data: Shipment[]
  summary: ShipmentSummary
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface UpdateShipmentRequest {
  courierId?: string
  courierName?: string
  trackingNumber?: string
  shippingStatus?: ShippingStatus
  shippingCost?: number
  statusNote?: string
}

export interface BulkUpdateResiRequest {
  items: {
    orderNumber: string
    courierName: string
    trackingNumber: string
  }[]
}

== FILE 2: src/features/shipping/api/shipping.ts ==

Hooks yang dibutuhkan:

export const shipmentKeys = {
  all: ['shipments'] as const,
  list: (params?: object) => [...shipmentKeys.all, 'list', params] as const,
  detail: (id: string) => [...shipmentKeys.all, 'detail', id] as const,
  summary: () => [...shipmentKeys.all, 'summary'] as const,
}

1. useShipments(params?)
   GET /api/shipping
   Params: { page, limit, search, status, courierId, dateFrom, dateTo }
   Returns: ShipmentsResponse

2. useShipment(id)
   GET /api/shipping/:id
   Returns: Shipment (detail dengan items + statusHistory)

3. useUpdateShipment()
   PUT /api/shipping/:id
   Body: UpdateShipmentRequest
   onSuccess: invalidate shipmentKeys.all

4. useBulkUpdateResi()
   POST /api/shipping/bulk-update
   Body: BulkUpdateResiRequest
   Returns: { success: number, failed: number, errors: string[] }
   onSuccess: invalidate shipmentKeys.all

[OUTPUT]
Buatkan kedua file di atas dengan TypeScript lengkap dan queryKeys pattern.
```

---

### 📁 PROMPT 2 — BACKEND ENDPOINTS

```
[CONTEXT]
Paste Master Context di atas.

[TASK]
Buatkan backend endpoint untuk modul Shipping.
File: backend/src/routes/shipping.ts

Stack: Bun + Hono + Drizzle ORM + PostgreSQL + Zod
Referensi pola: lihat backend/src/routes/couriers.ts

== ENDPOINTS ==

GET /api/shipping
  Query: page, limit, search, status, courierId, dateFrom, dateTo
  Logic:
    - Fetch dari tabel orders WHERE deliveryMethod = 'delivery'
    - Join customers (untuk nama, phone, address)
    - Mapping shippingStatus:
        pending   = order.status IN ('pending','processing') AND trackingNumber IS NULL
        shipped   = trackingNumber IS NOT NULL AND order.status != 'completed'  
        delivered = order.status = 'completed'
        returned  = order.status = 'cancelled' AND trackingNumber IS NOT NULL
    - Include summary count per status
    - Paginate hasil
  Response: ShipmentsResponse

GET /api/shipping/:id
  Logic:
    - Fetch order by id WITH items, customer
    - Fetch order_items WITH product info
    - Build statusHistory dari order fields (created, shipped, completed dates)
  Response: Shipment detail

PUT /api/shipping/:id
  Body: { courierId?, courierName?, trackingNumber?, shippingStatus?, shippingCost?, statusNote? }
  Logic:
    - Update orders table: courierName, trackingNumber, shippingCost
    - Jika shippingStatus = 'delivered' → update order.status = 'completed'
    - Jika shippingStatus = 'returned' → update order.status = 'cancelled'
    - Return updated shipment
  
POST /api/shipping/bulk-update
  Body: { items: [{ orderNumber, courierName, trackingNumber }] }
  Logic:
    - Loop setiap item
    - Find order by number
    - Update courierName + trackingNumber
    - Track sukses/gagal
  Response: { success: number, failed: number, errors: string[] }

GET /api/shipping/summary
  Logic: Count per status dari orders WHERE deliveryMethod='delivery'
  Response: ShipmentSummary

== CATATAN PENTING ==
Tidak perlu tabel baru. Semua data dari tabel orders yang sudah ada.
shippingStatus adalah computed field dari order.status + trackingNumber.

[OUTPUT]
Buatkan file backend/src/routes/shipping.ts lengkap.
Daftarkan juga di backend/src/index.ts: app.route('/api/shipping', shippingRoutes)
```

---

### 📁 PROMPT 3 — HALAMAN UTAMA (/shipping)

```
[CONTEXT]
Paste Master Context di atas.

[TASK]
Buatkan halaman utama Manajemen Pengiriman.
File: src/routes/_authenticated/shipping/index.tsx

[API yang dipakai]
- useShipments(params) → dari src/features/shipping/api/shipping.ts
- useCouriers() → dari src/features/settings/api/couriers.ts

[LAYOUT]

HEADER:
- Judul: "Manajemen Pengiriman"
- Kanan: [Button: Update Resi Massal → /shipping/bulk-update]

SUMMARY CARDS (4 kartu, clickable):
- 🔵 Perlu Diproses (status=pending) → klik filter ke pending
- 🟡 Dalam Perjalanan (status=shipped)
- 🟢 Diterima (status=delivered, warna hijau)
- 🔴 Retur/Gagal (status=returned+failed, warna merah)

Setiap card:
- Icon + Label + Angka besar
- Klik → tabel auto filter ke status tersebut

FILTER BAR:
- Input search (no order / nama customer / no resi)
- Date range: dari - sampai
- Select kurir (dari useCouriers)
- Chip filter status: [Semua] [Perlu Proses] [Dikirim] [Diterima] [Retur]

TABEL PENGIRIMAN:
Kolom:
- No Order (font-mono, link ke /sales/orders)
- Customer
- Kurir (badge dengan nama kurir)
- No Resi (font-mono, atau "-" jika belum)
- Ongkir (formatCurrency)
- Status (badge berwarna)
- Tgl Order
- Aksi: [Detail →] button

STATUS BADGE:
pending  → bg-blue-500/10 text-blue-500 "Perlu Diproses"
shipped  → bg-yellow-500/10 text-yellow-500 "Dikirim"
delivered→ bg-green-500/10 text-green-500 "Diterima"
returned → bg-red-500/10 text-red-500 "Retur"
failed   → bg-red-500/10 text-red-500 "Gagal"

Klik baris → navigasi ke /shipping/$id

EMPTY STATE:
- Jika filter status=pending & data=0 → "Semua pesanan sudah diproses! 🎉"
- Default → "Belum ada data pengiriman"

PAGINATION:
- Rows per page: 10, 20, 50
- Previous / Next button
- Info: "Halaman X dari Y (Z total)"

[OUTPUT]
Buatkan halaman lengkap dengan TypeScript.
Gunakan createFileRoute('/_authenticated/shipping/').
Ikuti pola layout Header + Main seperti movements.tsx.
```

---

### 📁 PROMPT 4 — HALAMAN DETAIL (/shipping/$id)

```
[CONTEXT]
Paste Master Context di atas.

[TASK]
Buatkan halaman detail pengiriman.
File: src/routes/_authenticated/shipping/$id.tsx

[API yang dipakai]
- useShipment(id) → GET /api/shipping/:id
- useUpdateShipment() → PUT /api/shipping/:id
- useCouriers() → untuk select kurir

[LAYOUT — 2 kolom di desktop, 1 kolom di mobile]

HEADER:
- Judul: "Detail Pengiriman #[orderNumber]"
- Badge status (besar)
- Tombol Back: ← Kembali ke Daftar Pengiriman

KOLOM KIRI:
  Card 1 — Info Pesanan:
  - No Order (link ke /sales/orders jika ada)
  - Tanggal Order
  - Total Pesanan (formatCurrency)
  - Tabel items: Produk | Qty | Harga | Subtotal

  Card 2 — Info Penerima:
  - Nama penerima
  - No HP (dengan ikon phone)
  - Alamat lengkap (dengan ikon map-pin)

KOLOM KANAN:
  Card 3 — Status Pengiriman:
  - Status badge saat ini (besar, di atas)
  - Timeline vertikal riwayat status:
    ● Order Dibuat     [tanggal]
    ● Dikirim          [tanggal] (abu jika belum)
    ● Diterima         [tanggal] (abu jika belum)
  - Tombol [Update Status] → buka UpdateStatusDialog

  Card 4 — Info Kurir & Resi (form inline):
  - Select Kurir (dropdown dari useCouriers)
  - Input No Resi
  - Input Ongkos Kirim
  - Badge Metode: [Pickup] atau [Delivery]
  - Tombol [Simpan Perubahan]
    → onSubmit: useUpdateShipment()
    → toast.success / toast.error

UpdateStatusDialog:
  - Select status baru (shipped / delivered / returned / failed)
  - Input tanggal (default hari ini)
  - Textarea catatan (optional)
  - Tombol [Batalkan] [Update Status]

TRACKING LINK (conditional):
  Jika ada trackingNumber, tampilkan:
  - "Lacak di website kurir →" (link new tab)
  - URL mapping per kurir:
      JNE     → https://www.jne.co.id/id/tracking/trace
      JT      → https://jet.co.id/track
      SICEPAT → https://www.sicepat.com/checkAwb
      ANTERAJA→ https://anteraja.id/tracking
      Default → Google search "tracking [trackingNumber]"

[OUTPUT]
Buatkan halaman detail lengkap.
Gunakan createFileRoute('/_authenticated/shipping/$id').
Gunakan const { id } = Route.useParams() untuk ambil id dari URL.
```

---

### 📁 PROMPT 5 — HALAMAN BULK UPDATE RESI (/shipping/bulk-update)

```
[CONTEXT]
Paste Master Context di atas.

[TASK]
Buatkan halaman Update Resi Massal.
File: src/routes/_authenticated/shipping/bulk-update.tsx

[API yang dipakai]
- useBulkUpdateResi() → POST /api/shipping/bulk-update
- useCouriers() → untuk select kurir per row

[LAYOUT]

HEADER:
- Judul: "Update Resi Massal"
- Tombol Back: ← Kembali ke Pengiriman

INFO BANNER:
- "Gunakan fitur ini untuk mengupdate no resi banyak pesanan sekaligus"

TAB NAVIGATION: [Upload CSV] [Input Manual]

=== TAB 1: UPLOAD CSV ===

Step 1 — Download Template:
  - Tombol [Download Template CSV]
  - Template columns: no_order, nama_kurir, no_resi
  - Generate CSV template dan trigger download

Step 2 — Upload File:
  - Drag & drop zone atau klik browse
  - Accepted: .csv only
  - Tampilkan nama file yang dipilih

Step 3 — Preview & Validasi:
  Setelah upload, tampilkan tabel preview:
  Kolom: No Order | Nama Kurir | No Resi | Status Validasi
  - Status validasi: 
      ✅ Valid (no order ditemukan)
      ❌ Error: "Order tidak ditemukan"
      ⚠️ Warning: "Order sudah punya resi"
  - Tombol [Proses Semua] (disabled jika ada error)

=== TAB 2: INPUT MANUAL ===

Tabel input dynamic:
- Header: No Pesanan | Kurir | No Resi | Aksi
- Setiap baris:
    - Input no pesanan (dengan search/autocomplete)
    - Select kurir (dropdown)
    - Input no resi
    - Button delete baris (icon trash)
- Tombol [+ Tambah Baris] di bawah tabel
- Tombol [Simpan Semua] di kanan bawah

SUBMIT BEHAVIOR (kedua tab):
1. Klik [Proses/Simpan] → tampilkan ConfirmDialog
2. Konfirmasi → show Loading dialog "Memproses X pesanan..."
3. Selesai → tampilkan ResultDialog:
   ✅ Berhasil: X pesanan
   ❌ Gagal: Y pesanan
   - List error jika ada
4. Tombol [Kembali ke Daftar Pengiriman]

[OUTPUT]
Buatkan halaman lengkap dengan kedua tab.
Gunakan createFileRoute('/_authenticated/shipping/bulk-update').
Parsing CSV bisa menggunakan FileReader API native (tidak perlu library).
```

---

### 📁 PROMPT 6 — SIDEBAR NAVIGATION UPDATE

```
[CONTEXT]
Paste Master Context di atas.

[TASK]
Tambahkan menu Pengiriman di sidebar navigasi.

Cari file sidebar dengan:
grep -r "inventory\|purchasing\|customers" src/components --include="*.tsx" -l

Setelah menemukan file sidebar:
Tambahkan menu item Pengiriman dengan sub-menu:

{
  title: "Pengiriman",
  icon: Truck,  // dari lucide-react
  children: [
    { title: "Daftar Pengiriman", url: "/shipping" },
    { title: "Update Resi Massal", url: "/shipping/bulk-update" },
    { title: "Manajemen Kurir", url: "/settings/couriers" },
  ]
}

Letakkan di antara menu Penjualan dan Laporan.

[OUTPUT]
Temukan file sidebar, tambahkan menu dengan pola yang sudah ada persis.
```

---

## 📋 URUTAN EKSEKUSI

```
STEP 1 → Prompt 1  (Types & API Hooks)   → fondasi data
STEP 2 → Prompt 2  (Backend Endpoints)   → siapkan API
STEP 3 → Prompt 3  (Halaman Utama)       → list pengiriman
STEP 4 → Prompt 4  (Halaman Detail)      → detail + edit
STEP 5 → Prompt 5  (Bulk Update)         → fitur massal
STEP 6 → Prompt 6  (Sidebar Navigation)  → tambah menu
```

---

## 📊 SUMMARY ROUTES PENGIRIMAN

| Route | Status | Deskripsi |
|---|---|---|
| `/shipping` | ❌ Buat baru | Daftar semua pengiriman + summary |
| `/shipping/$id` | ❌ Buat baru | Detail + update kurir/resi/status |
| `/shipping/bulk-update` | ❌ Buat baru | Update resi massal (CSV/manual) |
| `/settings/couriers` | ✅ Sudah ada | CRUD manajemen kurir |
| `/reports/shipping` | ✅ Sudah ada | Laporan pengiriman |

*Generated for: yummy-addict-app*
*Stack: React 19 + TanStack Router + TanStack Query + shadcn/ui + Bun + Hono + Drizzle*
