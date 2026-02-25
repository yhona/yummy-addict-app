# 🛍️ MODUL PEMBELIAN (PURCHASING) — FULL BREAKDOWN
## Repo: yummy-addict-app

---

## 📊 HASIL ANALISA REPO

### ✅ Yang Sudah Ada:
- `/purchasing/orders/new.tsx` → Form buat PO baru (sudah berfungsi)
- `/purchasing/suppliers/index.tsx` → List & CRUD supplier (sudah berfungsi)
- `backend/src/routes/purchases.ts`:
  - `GET /api/purchases` → list (tapi tanpa filter/pagination)
  - `POST /api/purchases` → buat PO baru
  - `POST /api/purchases/:id/receive` → terima barang + update stok
- Supplier API hooks: `useSuppliers`, `useCreateSupplier`, `useUpdateSupplier`, `useDeleteSupplier`
- Purchase API hooks: `usePurchases`, `useCreatePurchase`, `useReceivePurchase`
- DB Schema: `purchases` punya `paymentStatus`, `amountPaid`, `dueDate` (hutang dagang)

### ❌ Yang Belum Ada / Masih Placeholder:
- `/purchasing/orders/index.tsx` → Masih "Hello World" placeholder
- `/purchasing/orders/$id.tsx` → Detail PO belum ada
- `/purchasing/suppliers/$id.tsx` → Detail supplier belum ada
- Fitur bayar hutang ke supplier (paymentStatus tracking)
- Fitur cancel PO
- Backend filter & pagination untuk list PO
- Backend endpoint payment
- queryKeys pattern belum konsisten

---

## 🗺️ ROUTES LENGKAP

```
/purchasing
├── orders/
│   ├── index.tsx       ❌ Perlu dibangun ulang (masih placeholder)
│   ├── new.tsx         ✅ Sudah ada
│   └── $id.tsx         ❌ Belum ada
└── suppliers/
    ├── index.tsx       ✅ Sudah ada (perlu upgrade)
    └── $id.tsx         ❌ Belum ada
```

---

## 🖥️ UI/UX BREAKDOWN

```
🛍️ MODUL PEMBELIAN
│
├── 📋 1. DAFTAR PURCHASE ORDER (/purchasing/orders)
│   │
│   ├── 📐 Layout
│   │   ├── [Header] "Purchase Order" + [Tombol: + Buat PO Baru]
│   │   ├── [Summary Cards — 4 kartu]
│   │   │   ├── 🟡 Menunggu Penerimaan (status=ordered)
│   │   │   ├── 🟢 Sudah Diterima (status=received)
│   │   │   ├── 🔴 Belum Dibayar (paymentStatus=UNPAID)
│   │   │   └── 💰 Total Hutang (sum outstanding)
│   │   ├── [Filter Bar]
│   │   │   ├── Search (no PO / nama supplier)
│   │   │   ├── Date Range Picker
│   │   │   ├── Filter Status PO: Semua | Ordered | Received | Cancelled
│   │   │   └── Filter Bayar: Semua | Belum | Sebagian | Lunas
│   │   └── [Tabel PO]
│   │       ├── Kolom: No PO | Supplier | Tgl | Total | Status PO |
│   │       │           Status Bayar | Jatuh Tempo | Aksi
│   │       └── Klik baris → /purchasing/orders/$id
│   │
│   ├── 🧩 Komponen UI
│   │   ├── Summary Card (clickable → filter tabel)
│   │   ├── Badge Status PO:
│   │   │   ├── ordered   → yellow "Menunggu"
│   │   │   ├── received  → green "Diterima"
│   │   │   └── cancelled → slate "Dibatalkan"
│   │   ├── Badge Status Bayar:
│   │   │   ├── UNPAID    → red "Belum Bayar"
│   │   │   ├── PARTIAL   → orange "Sebagian"
│   │   │   └── PAID      → green "Lunas"
│   │   ├── Jatuh Tempo (merah jika sudah lewat)
│   │   └── Pagination
│   │
│   └── 🔀 User Flow
│       ├── Landing → lihat summary
│       ├── Filter / search PO
│       ├── Klik baris → detail PO
│       └── Klik "+ Buat PO" → /purchasing/orders/new
│
├── 📄 2. DETAIL PURCHASE ORDER (/purchasing/orders/$id)
│   │
│   ├── 📐 Layout (2 kolom)
│   │   │
│   │   ├── [Kolom Kiri — Info PO]
│   │   │   ├── Card: Detail Order
│   │   │   │   ├── No PO (font-mono, besar)
│   │   │   │   ├── Status badge
│   │   │   │   ├── Tanggal Order
│   │   │   │   ├── Supplier (nama + link ke detail supplier)
│   │   │   │   └── Catatan
│   │   │   └── Card: Daftar Item
│   │   │       ├── Tabel: Produk | SKU | Qty | Harga Modal | Subtotal
│   │   │       └── Footer: Total Nilai PO
│   │   │
│   │   └── [Kolom Kanan — Status & Pembayaran]
│   │       ├── Card: Status Penerimaan
│   │       │   ├── Status badge (besar)
│   │       │   ├── Jika status=ordered:
│   │       │   │   └── [Tombol: ✅ Tandai Diterima]
│   │       │   ├── Jika status=ordered:
│   │       │   │   └── [Tombol: ❌ Batalkan PO]
│   │       │   └── Jika status=received:
│   │       │       └── Info: "Stok sudah diupdate otomatis"
│   │       └── Card: Status Pembayaran (Hutang)
│   │           ├── Total PO
│   │           ├── Sudah Dibayar (progress bar)
│   │           ├── Sisa Hutang (merah jika ada)
│   │           ├── Jatuh Tempo
│   │           ├── Riwayat Pembayaran (tabel)
│   │           └── [Tombol: + Catat Pembayaran]
│   │               → PaymentDialog
│   │
│   ├── 🧩 Komponen UI
│   │   ├── Progress bar pembayaran (% terbayar)
│   │   ├── PaymentDialog:
│   │   │   ├── Input jumlah bayar
│   │   │   ├── Date picker (tgl bayar)
│   │   │   ├── Select metode (Transfer/Cash/Giro)
│   │   │   └── Textarea catatan
│   │   ├── ConfirmDialog (saat terima/batalkan PO)
│   │   └── Timeline pembayaran
│   │
│   └── 🔀 User Flow
│       ├── Lihat detail PO + items
│       ├── Klik "Tandai Diterima" → konfirmasi → stok update
│       ├── Klik "Batalkan" → konfirmasi → status cancelled
│       └── Klik "Catat Pembayaran" → dialog → update hutang
│
├── 👥 3. DAFTAR SUPPLIER (/purchasing/suppliers) — Upgrade
│   │
│   ├── 📐 Yang Perlu Ditambahkan (sudah ada tapi perlu upgrade)
│   │   ├── Summary: Total Supplier Aktif | Total Hutang Outstanding
│   │   ├── Filter: Search | Status aktif/nonaktif
│   │   ├── Kolom tambahan di tabel: Total Pembelian | Hutang Outstanding
│   │   └── Klik baris → /purchasing/suppliers/$id
│   │
│   └── 🧩 Perlu Ditambahkan
│       ├── Kolom hutang outstanding per supplier
│       └── Row click → navigasi ke detail
│
└── 🏢 4. DETAIL SUPPLIER (/purchasing/suppliers/$id)
    │
    ├── 📐 Layout (2 kolom)
    │   │
    │   ├── [Kolom Kiri — Info Supplier]
    │   │   └── Card: Profile Supplier
    │   │       ├── Nama + Code (badge)
    │   │       ├── Kontak Person
    │   │       ├── Email + No HP
    │   │       ├── Alamat
    │   │       └── [Tombol: Edit Supplier]
    │   │
    │   └── [Kolom Kanan — Statistik & Riwayat]
    │       ├── Card: Ringkasan (3 mini cards)
    │       │   ├── Total PO
    │       │   ├── Total Pembelian (IDR)
    │       │   └── Hutang Outstanding (IDR, merah)
    │       ├── Card: Riwayat Purchase Order
    │       │   ├── Filter: Status PO
    │       │   ├── Tabel: No PO | Tgl | Total | Status | Bayar
    │       │   └── Klik → /purchasing/orders/$id
    │       └── Card: Riwayat Pembayaran
    │           └── Tabel: Tgl | Jumlah | Metode | Catatan
    │
    └── 🔀 User Flow
        ├── Lihat profil + statistik supplier
        ├── Klik edit → EditSupplierDialog
        ├── Klik PO di tabel → /purchasing/orders/$id
        └── [+ Buat PO untuk Supplier Ini] → /purchasing/orders/new?supplierId=X
```

---

## 🤖 AI CODING PROMPTS

---

### 📌 MASTER CONTEXT — WAJIB PASTE DI SETIAP SESI BARU

```
[MASTER CONTEXT — yummy-addict-app / Modul Purchasing]

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
createFileRoute('/_authenticated/purchasing/orders/')
createFileRoute('/_authenticated/purchasing/orders/$id')
createFileRoute('/_authenticated/purchasing/suppliers/$id')

== POLA LAYOUT WAJIB ==
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
- ordered   → yellow-500/10  + text-yellow-500  "Menunggu"
- received  → green-500/10   + text-green-500   "Diterima"
- cancelled → slate-500/10   + text-slate-500   "Dibatalkan"
- UNPAID    → red-500/10     + text-red-500     "Belum Bayar"
- PARTIAL   → orange-500/10  + text-orange-500  "Sebagian"
- PAID      → green-500/10   + text-green-500   "Lunas"

== API CLIENT ==
import { api } from '@/lib/api-client'
api.get<T>('/api/endpoint', params?)
api.post<T>('/api/endpoint', body)
api.put<T>('/api/endpoint', body)
api.delete<T>('/api/endpoint')

== YANG SUDAH ADA & BISA DIPAKAI ==
- useSuppliers(), useCreateSupplier(), useUpdateSupplier(), useDeleteSupplier()
  → src/features/purchasing/api/suppliers.ts
- useCreatePurchase(), useReceivePurchase()
  → src/features/purchasing/api/purchases.ts
- PurchaseForm component → src/features/purchasing/components/purchase-form.tsx
- SupplierForm component → src/features/purchasing/components/supplier-form.tsx
- Supplier, Purchase, PurchaseItem interfaces → src/lib/api-types.ts
- formatCurrency() → src/lib/utils.ts

== DATABASE SCHEMA ==
purchases: {
  id, number, date, supplierId,
  totalAmount, status (ordered/received/cancelled),
  paymentStatus (PAID/UNPAID/PARTIAL),
  amountPaid, dueDate, notes
}
purchaseItems: { id, purchaseId, productId, quantity, costPrice, subtotal }
suppliers: { id, code, name, contactPerson, email, phone, address, isActive }
```

---

### 📁 PROMPT 1 — UPGRADE TYPES & API HOOKS

```
[CONTEXT]
Paste Master Context di atas.

[TASK]
Upgrade dan tambahkan types & API hooks untuk modul Purchasing.

== FILE 1: Tambahkan di src/lib/api-types.ts ==

// Tambahkan field yang kurang di interface Purchase yang sudah ada:
// (jangan hapus yang sudah ada, hanya extend)

export interface Purchase {
  id: string
  number: string
  date: string
  supplierId: string
  supplier?: Supplier
  totalAmount: string
  status: 'ordered' | 'received' | 'cancelled'
  paymentStatus: 'PAID' | 'UNPAID' | 'PARTIAL'  // tambah
  amountPaid: string                              // tambah
  dueDate?: string                                // tambah
  notes?: string
  items?: PurchaseItem[]
  createdAt: string                               // tambah
  updatedAt: string                               // tambah
}

export interface PurchasePayment {               // tambah baru
  id: string
  purchaseId: string
  amount: string
  paymentMethod: 'cash' | 'transfer' | 'giro'
  date: string
  notes?: string
  createdAt: string
}

export interface PurchaseSummary {              // tambah baru
  totalOrdered: number
  totalReceived: number
  totalCancelled: number
  totalOutstanding: string
}

export interface PurchasesResponse {            // tambah baru
  data: Purchase[]
  summary: PurchaseSummary
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface SupplierStats {               // tambah baru
  totalPurchases: number
  totalAmount: string
  outstanding: string
}

== FILE 2: Ganti src/features/purchasing/api/purchases.ts ==

Ganti seluruh isi file dengan versi yang lebih lengkap:

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api-client'
import {
  CreatePurchaseRequest,
  PurchasesResponse,
  Purchase,
  PurchasePayment
} from '@/lib/api-types'

export interface PurchasesParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  paymentStatus?: string
  supplierId?: string
  dateFrom?: string
  dateTo?: string
}

// Query Keys
export const purchaseKeys = {
  all: ['purchases'] as const,
  lists: () => [...purchaseKeys.all, 'list'] as const,
  list: (params?: object) => [...purchaseKeys.lists(), params] as const,
  detail: (id: string) => [...purchaseKeys.all, 'detail', id] as const,
  payments: (id: string) => [...purchaseKeys.all, 'payments', id] as const,
}

// Hooks
export const usePurchases = (params?: PurchasesParams) => {
  return useQuery({
    queryKey: purchaseKeys.list(params),
    queryFn: () => api.get<PurchasesResponse>('/api/purchases', params),
  })
}

export const usePurchase = (id: string) => {
  return useQuery({
    queryKey: purchaseKeys.detail(id),
    queryFn: () => api.get<Purchase>(`/api/purchases/${id}`),
    enabled: !!id,
  })
}

export const usePurchasePayments = (id: string) => {
  return useQuery({
    queryKey: purchaseKeys.payments(id),
    queryFn: () => api.get<PurchasePayment[]>(`/api/purchases/${id}/payments`),
    enabled: !!id,
  })
}

export const useCreatePurchase = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: CreatePurchaseRequest) =>
      api.post<Purchase>('/api/purchases', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all })
    },
  })
}

export const useReceivePurchase = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ message: string }>(`/api/purchases/${id}/receive`, {}),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all })
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['stock'] })
    },
  })
}

export const useCancelPurchase = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) =>
      api.post<{ message: string }>(`/api/purchases/${id}/cancel`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all })
    },
  })
}

export const useAddPayment = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: {
      id: string
      data: { amount: number; paymentMethod: string; date: string; notes?: string }
    }) => api.post<PurchasePayment>(`/api/purchases/${id}/payments`, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.detail(id) })
      queryClient.invalidateQueries({ queryKey: purchaseKeys.payments(id) })
      queryClient.invalidateQueries({ queryKey: purchaseKeys.lists() })
    },
  })
}

[OUTPUT]
Update kedua file di atas. Jangan hapus yang sudah ada di api-types.ts, hanya tambahkan.
```

---

### 📁 PROMPT 2 — BACKEND UPGRADE

```
[CONTEXT]
Paste Master Context di atas.

[TASK]
Upgrade backend purchases routes.
File: backend/src/routes/purchases.ts

Yang perlu ditambahkan/diubah (JANGAN hapus endpoint yang sudah ada):

== 1. UPGRADE GET / (List dengan filter & pagination) ==

Ganti endpoint GET / yang sudah ada dengan versi yang support:
Query params: page, limit, search, status, paymentStatus, supplierId, dateFrom, dateTo

Logic:
- WHERE clause berdasarkan filter
- JOIN dengan suppliers untuk search by nama supplier
- Pagination: offset = (page-1) * limit
- Include summary count: totalOrdered, totalReceived, totalCancelled, totalOutstanding
- Response: { data: Purchase[], summary: PurchaseSummary, pagination: {...} }

== 2. TAMBAH POST /:id/cancel ==

Logic:
- Validasi: hanya bisa cancel jika status = 'ordered'
- Update purchases.status = 'cancelled'
- Return updated purchase

== 3. TAMBAH GET /:id/payments ==

Perlu tabel baru purchase_payments.
Tambahkan ke schema (backend/src/db/schema/index.ts):

export const purchasePayments = pgTable('purchase_payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  purchaseId: uuid('purchase_id').notNull().references(() => purchases.id),
  amount: decimal('amount', { precision: 15, scale: 2 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 20 }).notNull().default('transfer'),
  date: timestamp('date').notNull().defaultNow(),
  notes: text('notes'),
  createdBy: uuid('created_by').references(() => users.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

Endpoint GET /:id/payments:
- Return list pembayaran untuk PO tersebut

== 4. TAMBAH POST /:id/payments ==

Body: { amount: number, paymentMethod: string, date: string, notes?: string }

Logic:
- Validasi: purchase harus exists & status = 'received' (tidak bisa bayar sebelum barang datang)
- Validasi: amount tidak boleh melebihi sisa hutang
- db.transaction:
  a. Insert purchase_payments
  b. Update purchases.amountPaid += amount
  c. Hitung payment status baru:
     - amountPaid >= totalAmount → PAID
     - amountPaid > 0 → PARTIAL
     - amountPaid = 0 → UNPAID
  d. Update purchases.paymentStatus

== 5. TAMBAH GET /supplier/:supplierId/stats ==

Response: {
  totalPurchases: number,
  totalAmount: string,
  outstanding: string   // total unpaid + partial
}

[OUTPUT]
Upgrade file backend/src/routes/purchases.ts.
Tambahkan schema purchasePayments ke backend/src/db/schema/index.ts.
Sertakan instruksi: cd backend && bun run db:generate && bun run db:migrate
```

---

### 📁 PROMPT 3 — HALAMAN DAFTAR PO (/purchasing/orders)

```
[CONTEXT]
Paste Master Context di atas.

[TASK]
Bangun ulang halaman daftar Purchase Order.
File: src/routes/_authenticated/purchasing/orders/index.tsx
(Saat ini masih placeholder "Hello World")

[API yang dipakai]
- usePurchases(params) dari src/features/purchasing/api/purchases.ts

[LAYOUT]

HEADER:
- Judul: "Purchase Order"
- Kanan: [Button: + Buat PO Baru → /purchasing/orders/new]

SUMMARY CARDS (4 kartu, clickable):
- 🟡 Menunggu Penerimaan → filter status=ordered
- 🟢 Sudah Diterima → filter status=received
- 🔴 Belum Dibayar → filter paymentStatus=UNPAID
- 💰 Total Hutang → jumlah total outstanding (formatCurrency, tidak clickable)

FILTER BAR:
- Input search (no PO / nama supplier)
- Date range: dari - sampai
- Select filter status PO: [Semua] [Menunggu] [Diterima] [Dibatalkan]
- Select filter bayar: [Semua] [Belum Bayar] [Sebagian] [Lunas]
- Tombol Reset Filter

TABEL PO:
Kolom:
- No PO (font-mono, text-sm)
- Supplier (nama bold + code text-muted)
- Tanggal Order
- Total (formatCurrency, font-semibold)
- Status PO (badge)
- Status Bayar (badge)
- Jatuh Tempo (merah + bold jika sudah lewat hari ini)
- Aksi: [Lihat →]

EMPTY STATE:
- Icon ShoppingCart + "Belum ada purchase order"
- Button: [+ Buat PO Pertama]

PAGINATION:
- Rows per page: 10, 20, 50
- Info: "Menampilkan X-Y dari Z PO"
- Prev / Next

[OUTPUT]
Buatkan halaman lengkap. Gunakan Header + Main layout.
Gunakan createFileRoute('/_authenticated/purchasing/orders/').
```

---

### 📁 PROMPT 4 — HALAMAN DETAIL PO (/purchasing/orders/$id)

```
[CONTEXT]
Paste Master Context di atas.

[TASK]
Buatkan halaman detail Purchase Order.
File: src/routes/_authenticated/purchasing/orders/$id.tsx

[API yang dipakai]
- usePurchase(id) → GET /api/purchases/:id
- usePurchasePayments(id) → GET /api/purchases/:id/payments
- useReceivePurchase() → POST /api/purchases/:id/receive
- useCancelPurchase() → POST /api/purchases/:id/cancel
- useAddPayment() → POST /api/purchases/:id/payments

[LAYOUT — 2 kolom di desktop (lg:grid-cols-3), 1 kolom mobile]

HEADER:
- [← Kembali] button (navigate(-1))
- Judul: "Detail PO #[number]"
- Badge status PO (kanan)

KOLOM KIRI (lg:col-span-2):

  Card 1 — Info Purchase Order:
  - Grid 2 kolom:
    - No PO (font-mono)
    - Tanggal Order
    - Supplier (link ke /purchasing/suppliers/$id)
    - Status
  - Catatan (jika ada)

  Card 2 — Daftar Item:
  - Tabel: No | Produk | SKU | Qty | Harga Modal | Subtotal
  - Footer tabel: Total = formatCurrency(totalAmount)

KOLOM KANAN (lg:col-span-1):

  Card 3 — Aksi & Status:
  - Status badge (besar, centered)
  - Jika status = 'ordered':
    - [✅ Tandai Barang Diterima] → ConfirmDialog → useReceivePurchase()
    - [❌ Batalkan PO] → ConfirmDialog → useCancelPurchase()
  - Jika status = 'received':
    - Info banner: "✅ Stok telah diupdate otomatis"
  - Jika status = 'cancelled':
    - Info banner: "❌ PO ini telah dibatalkan"

  Card 4 — Status Pembayaran:
  - Total PO: formatCurrency(totalAmount)
  - Sudah Dibayar: formatCurrency(amountPaid) (hijau)
  - Sisa Hutang: formatCurrency(totalAmount - amountPaid) (merah)
  - Progress bar (amountPaid / totalAmount * 100)%
  - Jatuh Tempo: [tanggal] dengan warna merah jika sudah lewat
  - Badge paymentStatus
  - Tombol [+ Catat Pembayaran] → AddPaymentDialog
    HANYA tampil jika: status=received AND paymentStatus != PAID

  Card 5 — Riwayat Pembayaran:
  - Jika belum ada → "Belum ada pembayaran"
  - Tabel: Tanggal | Jumlah | Metode | Catatan

AddPaymentDialog:
  Fields:
  - Jumlah Bayar (number, max = sisa hutang)
  - Tanggal Bayar (date, default hari ini)
  - Metode: Cash | Transfer Bank | Giro
  - Catatan (optional)
  - [Batal] [Simpan Pembayaran]

ConfirmDialog (reuse):
  - Terima PO: "Yakin mau tandai PO ini sebagai diterima? Stok akan diupdate otomatis."
  - Cancel PO: "Yakin mau batalkan PO ini? Aksi ini tidak bisa diurungkan."

[OUTPUT]
Buatkan halaman lengkap dengan TypeScript.
Gunakan createFileRoute('/_authenticated/purchasing/orders/$id').
Gunakan const { id } = Route.useParams().
```

---

### 📁 PROMPT 5 — HALAMAN DETAIL SUPPLIER (/purchasing/suppliers/$id)

```
[CONTEXT]
Paste Master Context di atas.

[TASK]
Buatkan halaman detail Supplier.
File: src/routes/_authenticated/purchasing/suppliers/$id.tsx

[API yang dipakai]
- useSupplier(id) → GET /api/suppliers/:id
- useUpdateSupplier() → untuk edit
- usePurchases({ supplierId: id }) → riwayat PO supplier ini
- /api/purchases/supplier/:id/stats → statistik supplier

Perlu tambah hook baru di src/features/purchasing/api/suppliers.ts:
export const useSupplierStats = (id: string) => {
  return useQuery({
    queryKey: ['supplier', id, 'stats'],
    queryFn: () => api.get<SupplierStats>(`/api/purchases/supplier/${id}/stats`),
    enabled: !!id,
  })
}

[LAYOUT — 2 kolom di desktop]

HEADER:
- [← Kembali ke Supplier]
- Judul: nama supplier
- Badge: Active / Inactive
- [Tombol: + Buat PO → /purchasing/orders/new?supplierId=id]

KOLOM KIRI:
  Card — Profil Supplier:
  - Code (badge, font-mono)
  - Nama
  - Kontak Person (ikon user)
  - Email (ikon mail)
  - No HP (ikon phone)
  - Alamat (ikon map-pin)
  - [Tombol: Edit Supplier] → EditSupplierDialog (gunakan SupplierForm yang sudah ada)

KOLOM KANAN:
  Section — Statistik (3 mini cards horizontal):
  - Total PO: number
  - Total Pembelian: formatCurrency
  - Hutang Outstanding: formatCurrency (merah jika > 0)

  Card — Riwayat Purchase Order:
  - Filter chip: [Semua] [Menunggu] [Diterima] [Dibatalkan]
  - Tabel: No PO | Tanggal | Total | Status PO | Status Bayar
  - Klik baris → /purchasing/orders/$poId
  - Pagination sederhana (load more atau prev/next)

EditSupplierDialog:
- Gunakan SupplierForm yang sudah ada di:
  src/features/purchasing/components/supplier-form.tsx
- Pre-fill dengan data supplier saat ini
- onSubmit → useUpdateSupplier()

[OUTPUT]
Buatkan halaman lengkap.
Gunakan createFileRoute('/_authenticated/purchasing/suppliers/$id').
Re-use SupplierForm component yang sudah ada.
```

---

### 📁 PROMPT 6 — UPGRADE HALAMAN DAFTAR SUPPLIER

```
[CONTEXT]
Paste Master Context di atas.

[TASK]
Upgrade halaman daftar supplier yang sudah ada.
File: src/routes/_authenticated/purchasing/suppliers/index.tsx

[YANG PERLU DITAMBAHKAN]
(jangan hapus logika yang sudah berfungsi)

1. SUMMARY STATS di atas:
   - Total Supplier Aktif
   - Total Hutang Outstanding (dari semua supplier, warna merah)

2. KOLOM TAMBAHAN di tabel:
   - Total Pembelian (IDR) → fetch dari stats
   - Hutang Outstanding (IDR) → merah jika > 0
   (Untuk efisiensi, ini bisa di-fetch sekaligus dari endpoint list)

3. KLIK BARIS → navigasi ke /purchasing/suppliers/$id:
   Tambahkan onClick di TableRow:
   onClick={() => navigate({ to: '/purchasing/suppliers/$id', params: { id: supplier.id } })}
   Tambahkan cursor-pointer + hover:bg-muted/50 di TableRow

4. SEARCH & FILTER:
   Supplier list saat ini sudah ada search.
   Tambahkan filter: [Semua] [Aktif] [Nonaktif] (toggle/tabs kecil)

[OUTPUT]
Modifikasi file yang sudah ada.
Tambahkan fitur di atas tanpa merusak CRUD yang sudah berfungsi.
```

---

### 📁 PROMPT 7 — SIDEBAR NAVIGATION UPDATE

```
[CONTEXT]
Paste Master Context di atas.

[TASK]
Pastikan sidebar navigation untuk modul Purchasing sudah lengkap.

Cari file sidebar dengan:
grep -r "purchasing\|inventory" src/components --include="*.tsx" -l

Yang perlu dicek/ditambahkan di sidebar:
{
  title: "Pembelian",
  icon: ShoppingBag,  // dari lucide-react
  children: [
    { title: "Purchase Order", url: "/purchasing/orders" },
    { title: "Buat PO Baru", url: "/purchasing/orders/new" },
    { title: "Supplier", url: "/purchasing/suppliers" },
  ]
}

[OUTPUT]
Temukan file sidebar, update navigasi Pembelian dengan sub-menu lengkap.
```

---

## 📋 URUTAN EKSEKUSI

```
STEP 1 → Prompt 1  (Upgrade Types & Hooks)       → fondasi data
STEP 2 → Prompt 2  (Backend Upgrade)             → siapkan API
STEP 3 → Prompt 3  (Halaman Daftar PO)           → halaman utama
STEP 4 → Prompt 4  (Halaman Detail PO)           → detail + payment
STEP 5 → Prompt 5  (Halaman Detail Supplier)     → profil supplier
STEP 6 → Prompt 6  (Upgrade List Supplier)       → upgrade yang ada
STEP 7 → Prompt 7  (Sidebar Navigation)          → tambah menu
```

---

## 📊 SUMMARY ROUTES PEMBELIAN

| Route | Status | Deskripsi |
|---|---|---|
| `/purchasing/orders` | ❌ Bangun ulang | Daftar PO + summary + filter |
| `/purchasing/orders/new` | ✅ Sudah ada | Form buat PO |
| `/purchasing/orders/$id` | ❌ Buat baru | Detail + terima + bayar hutang |
| `/purchasing/suppliers` | ✅ Upgrade | Tambah stats + row click |
| `/purchasing/suppliers/$id` | ❌ Buat baru | Profil + riwayat PO supplier |

*Generated for: yummy-addict-app*
*Stack: React 19 + TanStack Router + TanStack Query + shadcn/ui + Bun + Hono + Drizzle*
