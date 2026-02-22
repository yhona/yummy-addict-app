# 🤖 AI CODING PROMPT TEMPLATES
## Aplikasi POS & Inventory — Modul Laporan
> Copy-paste langsung ke Cursor / Claude / Copilot / ChatGPT

---

## 📌 MASTER CONTEXT
> **Selalu paste ini di awal setiap sesi baru dengan AI**

```
[MASTER CONTEXT — POS & INVENTORY APP]

You are helping me build a POS & Inventory Management System.

== TECH STACK ==
Frontend  : Next.js 14 (App Router) + TypeScript
UI Kit    : Tailwind CSS + shadcn/ui
Charts    : Recharts
State     : Zustand
Backend   : Laravel 11 (REST API) / Node.js Express
Database  : PostgreSQL
ORM       : Prisma / Eloquent
Auth      : JWT (role-based)

== BUSINESS CONTEXT ==
- Multi outlet / cabang
- Multi role: Owner | Admin | Kasir | Gudang
- Currency: IDR (format: Rp 1.000.000)
- Timezone: Asia/Jakarta (UTC+7)
- Fiscal period: monthly

== ROLES & ACCESS ==
Owner  → semua fitur & laporan
Admin  → semua kecuali laporan keuangan & pengaturan bisnis
Kasir  → hanya transaksi & laporan shift sendiri
Gudang → hanya inventori & pembelian

== GLOBAL UI RULES ==
- Loading state  : gunakan Skeleton component dari shadcn
- Empty state    : tampilkan icon + pesan deskriptif
- Error state    : tampilkan Alert merah + tombol retry
- Mobile         : tabel berubah jadi card list (< 768px)
- Color positive : green-500 (#22C55E)
- Color negative : red-500  (#EF4444)
- Color neutral  : slate-500 (#64748B)
- Number format  : selalu gunakan Intl.NumberFormat('id-ID')
- Date format    : DD MMM YYYY (contoh: 01 Jan 2024)
```

---

## 📁 PROMPT 0 — FOLDER STRUCTURE & BASE SETUP

```
[TASK]
Buatkan folder structure untuk modul Laporan di Next.js 14 App Router.

[STRUCTURE YANG DIINGINKAN]
app/
  (dashboard)/
    reports/
      page.tsx                    → Dashboard utama laporan
      layout.tsx                  → Layout dengan sidebar navigasi laporan
      sales/
        page.tsx                  → Laporan Penjualan
      profit-loss/
        page.tsx                  → Laporan Laba Rugi
      inventory/
        page.tsx                  → Laporan Inventori
      purchasing/
        page.tsx                  → Laporan Pembelian
      receivable/
        page.tsx                  → Laporan Piutang
      payable/
        page.tsx                  → Laporan Hutang
      shipping/
        page.tsx                  → Laporan Pengiriman
      employee/
        page.tsx                  → Laporan Karyawan
      tax/
        page.tsx                  → Laporan Pajak

components/
  reports/
    shared/
      FilterBar.tsx               → Komponen filter global
      DateRangePicker.tsx         → Date picker dengan shortcut
      SummaryCard.tsx             → KPI card reusable
      ExportButton.tsx            → Tombol export CSV & PDF
      DataTable.tsx               → Tabel reusable dengan sort & search
      ChartWrapper.tsx            → Wrapper chart dengan loading state
    sales/
      SalesSummaryCards.tsx
      SalesChart.tsx
      TransactionTable.tsx
      TransactionDrawer.tsx
    profit-loss/
      PLSummary.tsx
      WaterfallChart.tsx
      ExpenseAccordion.tsx
    inventory/
      StockTable.tsx
      StockMovementChart.tsx
      StockAlertList.tsx
    ...dst

hooks/
  reports/
    useSalesReport.ts
    useProfitLoss.ts
    useInventoryReport.ts
    useShippingReport.ts
    useReceivable.ts
    usePayable.ts

types/
  reports.ts                      → Semua TypeScript types untuk laporan

lib/
  reports/
    api.ts                        → API call functions
    formatters.ts                 → Format IDR, tanggal, persen

[OUTPUT YANG DIHARAPKAN]
Buatkan file-file tersebut dengan boilerplate awal (belum perlu logic lengkap).
Termasuk types/reports.ts dengan semua interface yang akan dibutuhkan.
```

---

## 📁 PROMPT 1 — TYPESCRIPT TYPES

```
[TASK]
Buatkan semua TypeScript interface & type untuk modul Laporan.

[TYPES YANG DIBUTUHKAN]

// === SHARED ===
type DateRange = { start_date: string; end_date: string }
type PeriodShortcut = 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom'
type ExportFormat = 'csv' | 'pdf'
type TransactionStatus = 'SUCCESS' | 'VOID' | 'RETURN'
type PaymentMethod = 'cash' | 'transfer' | 'qris' | 'credit_card' | 'debit_card' | 'cod' | 'credit'
type ShippingStatus = 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'RETURNED' | 'FAILED'
type DebtStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE'

// === SUMMARY CARD ===
interface SummaryCard {
  label: string
  value: number
  type: 'currency' | 'number' | 'percent'
  change_percent?: number   // + naik, - turun vs periode lalu
  color?: 'positive' | 'negative' | 'neutral'
}

// === LAPORAN PENJUALAN ===
interface SalesFilter extends DateRange {
  cashier_id?: number
  category_id?: number
  payment_method?: PaymentMethod
  channel?: string
  outlet_id?: number
}

interface SalesSummary {
  total_transactions: number
  gross_revenue: number
  total_discount: number
  total_return: number
  net_revenue: number
  comparison: { change_percent: number }
}

interface SalesChartData {
  date: string
  gross_revenue: number
  net_revenue: number
  total_transactions: number
}

interface Transaction {
  id: number
  invoice_number: string
  date: string
  customer_name: string | null
  cashier_name: string
  outlet_name: string
  gross_total: number
  discount: number
  net_total: number
  payment_method: PaymentMethod
  status: TransactionStatus
  items: TransactionItem[]
}

interface TransactionItem {
  product_name: string
  sku: string
  qty: number
  price: number
  discount: number
  subtotal: number
}

// === LAPORAN LABA RUGI ===
interface ProfitLossData {
  period: string
  gross_revenue: number
  discount: number
  returns: number
  net_revenue: number
  cogs: number
  gross_profit: number
  gross_margin_percent: number
  operational_expenses: OperationalExpense[]
  total_operational_expenses: number
  other_income: number
  ebit: number
  tax: number
  net_profit: number
  net_margin_percent: number
}

interface OperationalExpense {
  category: string
  amount: number
  percent_of_revenue: number
  items: { label: string; amount: number }[]
}

// === LAPORAN INVENTORI ===
interface StockItem {
  product_id: number
  product_name: string
  sku: string
  category: string
  warehouse: string
  qty: number
  unit: string
  cost_price: number
  stock_value: number
  min_stock: number
  status: 'normal' | 'low' | 'empty' | 'expired_soon'
  expired_date?: string
}

interface StockMovement {
  date: string
  product_name: string
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'TRANSFER'
  qty: number
  reference: string
  note?: string
}

// === LAPORAN PIUTANG & HUTANG ===
interface ReceivableItem {
  customer_id: number
  customer_name: string
  total_debt: number
  paid: number
  outstanding: number
  aging_0_30: number
  aging_31_60: number
  aging_61_90: number
  aging_over_90: number
  last_transaction_date: string
  status: DebtStatus
}

interface PayableItem {
  supplier_id: number
  supplier_name: string
  total_debt: number
  paid: number
  outstanding: number
  due_date: string
  aging_0_30: number
  aging_31_60: number
  aging_61_90: number
  aging_over_90: number
  status: DebtStatus
}

// === LAPORAN PENGIRIMAN ===
interface ShipmentItem {
  id: number
  tracking_number: string
  order_date: string
  recipient_name: string
  courier: string
  service_type: string
  shipping_cost: number
  charged_to: 'store' | 'customer'
  status: ShippingStatus
  delivered_date?: string
  weight_kg: number
}

interface ShippingSummary {
  total_shipments: number
  delivered: number
  in_transit: number
  returned: number
  failed: number
  total_shipping_cost: number
  cost_charged_to_store: number
  cost_charged_to_customer: number
}

[OUTPUT]
Buat file types/reports.ts yang berisi semua interface di atas,
lengkap dengan JSDoc comment singkat di setiap interface.
```

---

## 📁 PROMPT 2 — SHARED COMPONENTS

```
[TASK]
Buatkan shared components yang dipakai di semua halaman laporan.

== COMPONENT 1: DateRangePicker ==
File: components/reports/shared/DateRangePicker.tsx

Props:
  value: DateRange
  onChange: (range: DateRange) => void

Fitur:
- Shortcut buttons: Hari ini | Minggu ini | Bulan ini | Tahun ini | Custom
- Jika Custom → tampilkan 2 input date (from - to)
- Format tanggal tampilan: DD MMM YYYY
- Format value yang dikirim: YYYY-MM-DD (ISO)

---

== COMPONENT 2: SummaryCard ==
File: components/reports/shared/SummaryCard.tsx

Props:
  label: string
  value: number
  type: 'currency' | 'number' | 'percent'
  change_percent?: number
  color?: 'positive' | 'negative' | 'neutral'
  isLoading?: boolean

Tampilan:
- Label kecil di atas
- Value besar di tengah (format IDR jika currency)
- Badge kecil di bawah: "▲ 12.5% vs bulan lalu" (hijau) atau "▼ 5% vs bulan lalu" (merah)
- Skeleton jika isLoading = true

---

== COMPONENT 3: ExportButton ==
File: components/reports/shared/ExportButton.tsx

Props:
  onExport: (format: 'csv' | 'pdf') => void
  isLoading?: boolean

Tampilan:
- Button dengan icon download
- Dropdown: Export CSV | Export PDF
- Loading spinner saat export berlangsung

---

== COMPONENT 4: DataTable ==
File: components/reports/shared/DataTable.tsx

Props:
  columns: ColumnDef[]
  data: any[]
  isLoading?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  onRowClick?: (row: any) => void
  pagination?: { page: number; total: number; perPage: number; onPageChange: fn }

Fitur:
- Header sortable (klik header → sort asc/desc)
- Search bar opsional di atas tabel
- Loading: Skeleton rows (5 baris)
- Empty: icon + teks "Belum ada data"
- Mobile: horizontal scroll wrapper
- Row hover: highlight + cursor pointer jika ada onRowClick

[OUTPUT]
Buatkan keempat komponen di atas dengan TypeScript + shadcn/ui + Tailwind.
```

---

## 📁 PROMPT 3 — HALAMAN LAPORAN PENJUALAN

```
[TASK]
Buatkan halaman Laporan Penjualan lengkap.
File: app/(dashboard)/reports/sales/page.tsx

[API ENDPOINT]
GET /api/reports/sales

Query params:
{
  start_date: string       // required, YYYY-MM-DD
  end_date: string         // required, YYYY-MM-DD  
  cashier_id?: number
  category_id?: number
  payment_method?: string
  page?: number            // default: 1
  per_page?: number        // default: 20
}

Response:
{
  "summary": {
    "total_transactions": 120,
    "gross_revenue": 15000000,
    "total_discount": 500000,
    "total_return": 200000,
    "net_revenue": 14300000,
    "comparison": { "change_percent": 12.5 }
  },
  "chart_data": [
    {
      "date": "2024-01-01",
      "gross_revenue": 500000,
      "net_revenue": 480000,
      "total_transactions": 5
    }
  ],
  "transactions": {
    "data": [
      {
        "id": 1,
        "invoice_number": "INV-20240101-001",
        "date": "2024-01-01T10:30:00Z",
        "customer_name": "John Doe",
        "cashier_name": "Budi",
        "outlet_name": "Toko Pusat",
        "gross_total": 100000,
        "discount": 10000,
        "net_total": 90000,
        "payment_method": "cash",
        "status": "SUCCESS",
        "items": [
          {
            "product_name": "Produk A",
            "sku": "SKU-001",
            "qty": 2,
            "price": 50000,
            "discount": 5000,
            "subtotal": 95000
          }
        ]
      }
    ],
    "meta": {
      "current_page": 1,
      "total": 120,
      "per_page": 20,
      "last_page": 6
    }
  }
}

[COMPONENTS YANG DIBUTUHKAN]

1. FilterBar
   - DateRangePicker (default: bulan ini)
   - Dropdown: Pilih Kasir (fetch dari /api/employees?role=kasir)
   - Dropdown: Pilih Kategori (fetch dari /api/categories)
   - Dropdown: Metode Bayar [Semua, Tunai, Transfer, QRIS, Kartu, COD, Kredit]
   - Tombol: Terapkan Filter | Reset

2. SummaryCards (4 kartu horizontal)
   - Total Transaksi (number)
   - Pendapatan Kotor (currency, green)
   - Total Diskon (currency, red)
   - Pendapatan Bersih (currency, green + badge % change)

3. SalesChart
   - Bar chart (Recharts)
   - X: tanggal, Y: revenue dalam IDR
   - Toggle: Pendapatan Kotor | Pendapatan Bersih | Jumlah Transaksi
   - Tooltip: format IDR
   - Responsive width

4. TransactionTable
   Kolom:
   - No
   - Tanggal (DD MMM YYYY HH:mm)
   - No Invoice
   - Pelanggan (atau "Umum" jika null)
   - Kasir
   - Total (IDR)
   - Diskon (IDR)
   - Bayar (IDR)
   - Metode Bayar (badge)
   - Status (badge: SUCCESS=green | VOID=red | RETURN=orange)
   
   Fitur:
   - Search by invoice / pelanggan
   - Sort by: tanggal, total
   - Pagination
   - Klik baris → buka TransactionDrawer

5. TransactionDrawer (slide dari kanan)
   - Header: No Invoice + Status badge
   - Info: Tanggal, Kasir, Pelanggan, Metode Bayar
   - Tabel item: Produk, SKU, Qty, Harga, Diskon, Subtotal
   - Footer: Subtotal, Diskon, Total Bayar
   - Tombol: Cetak Struk (dummy) | Tutup

[HOOKS]
Buatkan custom hook: hooks/reports/useSalesReport.ts
- Manage state: filters, data, loading, error
- Function: fetchReport(), exportReport(format)
- Auto fetch saat filter berubah (debounce 300ms)

[OUTPUT]
Buatkan page.tsx + semua komponen + hook lengkap dengan TypeScript.
Gunakan shadcn/ui untuk UI components.
```

---

## 📁 PROMPT 4 — HALAMAN LABA RUGI

```
[TASK]
Buatkan halaman Laporan Laba Rugi (P&L).
File: app/(dashboard)/reports/profit-loss/page.tsx

[API ENDPOINT]
GET /api/reports/profit-loss

Query params:
{
  start_date: string
  end_date: string
  view: 'monthly' | 'yearly'   // default: monthly
}

Response:
{
  "period": "Januari 2024",
  "gross_revenue": 50000000,
  "discount": 2000000,
  "returns": 500000,
  "net_revenue": 47500000,
  "cogs": 28000000,
  "gross_profit": 19500000,
  "gross_margin_percent": 41.05,
  "operational_expenses": [
    {
      "category": "Biaya Pengiriman",
      "amount": 1500000,
      "percent_of_revenue": 3.16,
      "items": [
        { "label": "JNE", "amount": 900000 },
        { "label": "SiCepat", "amount": 600000 }
      ]
    },
    {
      "category": "Biaya Karyawan",
      "amount": 5000000,
      "percent_of_revenue": 10.53,
      "items": [
        { "label": "Gaji Pokok", "amount": 4000000 },
        { "label": "Komisi", "amount": 1000000 }
      ]
    },
    {
      "category": "Biaya Operasional Lain",
      "amount": 2000000,
      "percent_of_revenue": 4.21,
      "items": []
    }
  ],
  "total_operational_expenses": 8500000,
  "other_income": 300000,
  "ebit": 11300000,
  "tax": 1130000,
  "net_profit": 10170000,
  "net_margin_percent": 21.41
}

[COMPONENTS YANG DIBUTUHKAN]

1. FilterBar
   - DateRangePicker
   - Toggle view: Bulanan | Tahunan

2. PLWaterfall — KOMPONEN UTAMA
   Tampilkan P&L sebagai visual flow dari atas ke bawah:

   ┌─────────────────────────────────┐
   │ Pendapatan Kotor    Rp 50.000.000  ████████████████ (green) │
   │ (-) Diskon          Rp  2.000.000  ██ (red)                  │
   │ (-) Retur           Rp    500.000  █ (red)                   │
   │ = Pendapatan Bersih Rp 47.500.000  ███████████████ (green)   │
   │ (-) HPP             Rp 28.000.000  █████████ (red)           │
   │ = Laba Kotor        Rp 19.500.000  ██████ (green)            │
   │ (-) Biaya Operasional Rp 8.500.000 ███ (red)                 │
   │ (+) Pendapatan Lain Rp    300.000  (green)                   │
   │ = Laba Operasional  Rp 11.300.000  ████ (green)              │
   │ (-) Pajak           Rp  1.130.000  (red)                     │
   │ ══ LABA BERSIH      Rp 10.170.000  ████ (green, highlighted) │
   └─────────────────────────────────┘

   Setiap baris:
   - Label + nilai IDR + progress bar relatif terhadap revenue
   - Persen dari pendapatan (small text)
   - Color: hijau = positif, merah = pengurang

3. ExpenseBreakdown
   - Accordion untuk setiap kategori biaya operasional
   - Header: nama kategori + total + % dari revenue
   - Expand: tabel item detail
   - Progress bar visual per kategori

4. MarginIndicator
   - Gauge / card yang menampilkan:
     Gross Margin: 41%
     Net Margin: 21.41%
   - Color coding: > 20% = green, 10-20% = yellow, < 10% = red

[OUTPUT]
Buatkan halaman lengkap dengan semua komponen.
Fokus pada visualisasi yang mudah dipahami owner/non-akuntan.
```

---

## 📁 PROMPT 5 — HALAMAN LAPORAN INVENTORI

```
[TASK]
Buatkan halaman Laporan Inventori dengan Tab Navigation.
File: app/(dashboard)/reports/inventory/page.tsx

[TABS]
Tab 1: Stok Saat Ini
Tab 2: Pergerakan Stok
Tab 3: Peringatan Stok

== TAB 1: STOK SAAT INI ==

API: GET /api/reports/inventory/stock
Query: { warehouse_id?, category_id?, status?, search? }

Response item:
{
  "product_id": 1,
  "product_name": "Produk A",
  "sku": "SKU-001",
  "category": "Elektronik",
  "warehouse": "Gudang Utama",
  "qty": 50,
  "unit": "pcs",
  "cost_price": 100000,
  "stock_value": 5000000,
  "min_stock": 10,
  "status": "normal",   // normal | low | empty | expired_soon
  "expired_date": null
}

Komponen:
- Filter: Warehouse, Kategori, Status Stok, Search
- Summary: Total SKU | Total Qty | Total Nilai Stok
- Tabel: Produk, SKU, Kategori, Gudang, Qty, Nilai Stok, Status
- Status badge: 
    normal = green
    low = yellow (qty <= min_stock)  
    empty = red (qty = 0)
    expired_soon = orange

== TAB 2: PERGERAKAN STOK ==

API: GET /api/reports/inventory/movement
Query: { start_date, end_date, product_id?, type? }

Response item:
{
  "date": "2024-01-15",
  "product_name": "Produk A",
  "type": "IN",   // IN | OUT | ADJUSTMENT | TRANSFER
  "qty": 100,
  "reference": "PO-20240115-001",
  "note": "Pembelian dari Supplier X"
}

Komponen:
- Filter: DateRange, Produk, Tipe (IN/OUT/ADJUSTMENT/TRANSFER)
- Chart: Stacked bar chart masuk vs keluar per hari
- Tabel: Tanggal, Produk, Tipe, Qty, Referensi, Keterangan
- Tipe badge: IN=green | OUT=red | ADJUSTMENT=blue | TRANSFER=purple

== TAB 3: PERINGATAN STOK ==

API: GET /api/reports/inventory/alerts

Response:
{
  "empty": [ ...StockItem[] ],
  "low": [ ...StockItem[] ],
  "expired_soon": [ ...StockItem[] ]
}

Komponen:
- 3 section dengan card list (bukan tabel)
- Section "Stok Habis" → badge merah
- Section "Stok Menipis" → badge kuning
- Section "Mendekati Expired" → badge orange + tanggal expired
- Setiap card: nama produk + SKU + qty sisa + tombol "Buat PO"
- Tombol "Buat PO" → redirect ke /purchasing/create?product_id=X

[OUTPUT]
Buatkan halaman dengan Tab Navigation dan ketiga tab di atas.
```

---

## 📁 PROMPT 6 — HALAMAN PIUTANG & HUTANG

```
[TASK]
Buatkan halaman Laporan Piutang & Hutang.
File: app/(dashboard)/reports/receivable/page.tsx (sama layout untuk payable)

[LAYOUT]
- Toggle utama di atas: [Piutang Pelanggan] | [Hutang Supplier]
- Konten berubah sesuai toggle

== PIUTANG PELANGGAN ==
API: GET /api/reports/receivable
Query: { status?, search?, sort_by? }

Response item:
{
  "customer_id": 1,
  "customer_name": "Toko Maju",
  "phone": "08123456789",
  "total_debt": 5000000,
  "paid": 2000000,
  "outstanding": 3000000,
  "aging_0_30": 1000000,
  "aging_31_60": 1500000,
  "aging_61_90": 500000,
  "aging_over_90": 0,
  "last_transaction_date": "2024-01-10",
  "status": "PARTIAL"
}

== HUTANG SUPPLIER ==
API: GET /api/reports/payable
(struktur response sama, customer_name → supplier_name)

[COMPONENTS]

1. Toggle: Piutang | Hutang

2. SummaryCards (3 kartu)
   - Total Outstanding (semua yang belum lunas)
   - Jatuh Tempo Hari Ini (merah jika ada)
   - Sudah Lewat Jatuh Tempo (merah)

3. AgingTable — KOMPONEN UTAMA
   Kolom:
   - Nama Pelanggan / Supplier
   - Total Tagihan
   - Sudah Dibayar
   - Outstanding
   - 0-30 hari (normal)
   - 31-60 hari (yellow)
   - 61-90 hari (orange)
   - > 90 hari (red)
   - Status (badge)
   - Aksi

   Color gradient aging:
   - 0-30 hari: text normal
   - 31-60 hari: text yellow-600
   - 61-90 hari: text orange-600
   - > 90 hari: text red-600 + bold

4. PaymentDrawer (slide dari kanan)
   Trigger: klik nama atau tombol "Lihat Detail"
   Isi:
   - Info pelanggan / supplier
   - Riwayat tagihan (tabel: invoice, tanggal, total, status)
   - Riwayat pembayaran (tabel: tanggal, jumlah, metode)
   - Progress bar: % terbayar
   - Tombol: "Catat Pembayaran" → form modal

5. PaymentForm (Modal)
   Fields:
   - Tanggal Bayar (date picker, default: hari ini)
   - Jumlah Bayar (number input, max: outstanding)
   - Metode Bayar (dropdown)
   - Keterangan (textarea, optional)
   - Tombol: Simpan | Batal

[OUTPUT]
Buatkan halaman lengkap dengan toggle, aging table, dan drawer detail.
```

---

## 📁 PROMPT 7 — HALAMAN LAPORAN PENGIRIMAN

```
[TASK]
Buatkan halaman Laporan Pengiriman.
File: app/(dashboard)/reports/shipping/page.tsx

[API ENDPOINT]
GET /api/reports/shipping

Query params:
{
  start_date: string
  end_date: string
  courier?: string
  status?: ShippingStatus
  page?: number
}

Response:
{
  "summary": {
    "total_shipments": 200,
    "delivered": 150,
    "in_transit": 30,
    "returned": 15,
    "failed": 5,
    "total_shipping_cost": 8000000,
    "cost_charged_to_store": 2000000,
    "cost_charged_to_customer": 6000000
  },
  "by_courier": [
    { "courier": "JNE", "total": 80, "delivered": 65, "returned": 10, "cost": 3200000 },
    { "courier": "SiCepat", "total": 70, "delivered": 60, "returned": 5, "cost": 2800000 }
  ],
  "shipments": {
    "data": [
      {
        "id": 1,
        "tracking_number": "JNE123456789",
        "order_date": "2024-01-01",
        "recipient_name": "Budi Santoso",
        "recipient_address": "Jl. Merdeka No. 1, Jakarta",
        "courier": "JNE",
        "service_type": "REG",
        "shipping_cost": 25000,
        "charged_to": "customer",
        "weight_kg": 1.5,
        "status": "DELIVERED",
        "delivered_date": "2024-01-03"
      }
    ],
    "meta": { "current_page": 1, "total": 200, "per_page": 20, "last_page": 10 }
  }
}

[COMPONENTS]

1. FilterBar
   - DateRangePicker
   - Dropdown: Kurir (JNE, SiCepat, AnterAja, dll + Semua)
   - Filter chip status:
     [Semua] [Diproses] [Dikirim] [Diterima] [Retur] [Gagal]

2. SummaryCards (clickable → filter tabel)
   - Total Pengiriman
   - Berhasil Diterima (green)
   - Sedang Dikirim (blue)
   - Retur / Gagal (red)

3. CourierPerformanceChart
   - Grouped bar chart per kurir
   - Bar: Berhasil | Retur | Gagal
   - Tampil di samping: tabel ringkasan per kurir

4. ShipmentTable
   Kolom:
   - No Resi
   - Tanggal Order
   - Penerima
   - Kurir + Layanan
   - Berat (kg)
   - Ongkir (IDR)
   - Ditanggung (badge: Toko | Pembeli)
   - Status (badge dengan warna)
   - Klik → ShipmentDrawer

5. ShipmentDrawer
   - No Resi + tombol copy
   - Info penerima + alamat
   - Timeline tracking status (jika tersedia)
   - Info biaya pengiriman
   - Tombol: Lacak di website kurir (new tab)

[OUTPUT]
Buatkan halaman lengkap dengan semua komponen.
```

---

## 📁 PROMPT 8 — DASHBOARD UTAMA LAPORAN

```
[TASK]
Buatkan halaman Dashboard utama Laporan (landing page modul laporan).
File: app/(dashboard)/reports/page.tsx

[API ENDPOINT]
GET /api/reports/dashboard
Query: { period: 'today' | 'this_week' | 'this_month' }

Response:
{
  "period": "this_month",
  "kpi": {
    "net_revenue": 47500000,
    "net_revenue_change": 12.5,
    "total_transactions": 320,
    "transactions_change": 8.3,
    "net_profit": 10170000,
    "net_profit_change": 15.2,
    "total_expenses": 37330000,
    "expenses_change": 11.1
  },
  "revenue_chart": [ ...SalesChartData[] ],
  "top_products": [
    { "rank": 1, "product_name": "Produk A", "qty_sold": 150, "revenue": 7500000 }
  ],
  "payment_distribution": [
    { "method": "Tunai", "count": 120, "amount": 15000000, "percent": 31.5 },
    { "method": "QRIS", "count": 100, "amount": 12000000, "percent": 25.3 }
  ],
  "low_stock_alert_count": 5,
  "overdue_receivable_count": 3,
  "overdue_payable_count": 2
}

[LAYOUT]
┌────────────────────────────────────────────┐
│  LAPORAN                    [Filter Periode] │
├────────────────────────────────────────────┤
│  [KPI Card] [KPI Card] [KPI Card] [KPI Card] │
├─────────────────────┬──────────────────────┤
│   Revenue Chart     │   Top 5 Produk       │
│   (Line/Bar)        │   (Table/List)        │
├─────────────────────┴──────────────────────┤
│   Payment Distribution    │  Quick Alerts   │
│   (Donut Chart)           │  - Stok menipis │
│                           │  - Piutang jatuh│
└───────────────────────────┴─────────────────┘
│         [Quick Links ke Sub Laporan]         │
└────────────────────────────────────────────┘

[COMPONENTS]

1. PeriodSelector
   - Pill toggle: Hari Ini | Minggu Ini | Bulan Ini

2. KPICards (4 kartu)
   - Pendapatan Bersih + % change
   - Total Transaksi + % change
   - Laba Bersih + % change
   - Total Pengeluaran + % change

3. RevenueChart (Recharts Line Chart)
   - X: tanggal, Y: revenue
   - Tooltip IDR format

4. TopProductsTable
   - Rank, Produk, Qty Terjual, Revenue
   - Max 5 baris

5. PaymentDonutChart
   - Donut chart per metode bayar
   - Legend di samping

6. QuickAlerts (card kecil)
   - "5 produk stok menipis" → link ke inventory
   - "3 piutang jatuh tempo" → link ke receivable
   - "2 hutang jatuh tempo" → link ke payable

7. QuickNavigation (bottom)
   - Grid 3x3 icon menu ke sub laporan
   - Setiap tile: icon + label

[OUTPUT]
Buatkan halaman dashboard yang informatif & clean.
Prioritaskan info terpenting di atas (above the fold).
```

---

## 📁 PROMPT 9 — EXPORT FUNCTIONALITY

```
[TASK]
Buatkan utility untuk fitur Export (CSV & PDF) yang dipakai semua halaman laporan.

File: lib/reports/exportUtils.ts

[CSV EXPORT]
Function: exportToCSV(data: any[], filename: string, columns: ExportColumn[])

Interface ExportColumn:
{
  key: string
  label: string
  format?: 'currency' | 'date' | 'percent' | 'text'
}

Rules:
- Header row: label dari columns
- Format currency: angka tanpa Rp & titik (untuk Excel compatibility)
- Format date: DD/MM/YYYY
- Encoding: UTF-8 BOM (agar Excel bisa baca karakter Indonesia)
- Download otomatis via browser

[PDF EXPORT]
Library: jsPDF + jspdf-autotable
Function: exportToPDF(config: PDFExportConfig)

Interface PDFExportConfig:
{
  title: string
  subtitle: string    // contoh: "Periode: 01 Jan 2024 - 31 Jan 2024"
  company_name: string
  columns: { header: string; dataKey: string }[]
  data: any[]
  summary?: { label: string; value: string }[]   // ringkasan di bawah tabel
}

PDF Layout:
- Header: Logo (jika ada) + Nama Toko + Judul Laporan + Periode
- Tabel data dengan styling
- Footer: ringkasan + tanggal cetak + "Dicetak oleh: [nama user]"
- Page number: "Halaman X dari Y"

[USAGE EXAMPLE]
// Di komponen:
const handleExport = async (format: 'csv' | 'pdf') => {
  if (format === 'csv') {
    exportToCSV(transactions, 'laporan-penjualan-jan-2024', [
      { key: 'invoice_number', label: 'No Invoice' },
      { key: 'date', label: 'Tanggal', format: 'date' },
      { key: 'customer_name', label: 'Pelanggan' },
      { key: 'net_total', label: 'Total', format: 'currency' },
      { key: 'status', label: 'Status' }
    ])
  } else {
    exportToPDF({
      title: 'Laporan Penjualan',
      subtitle: 'Periode: 01 Jan 2024 - 31 Jan 2024',
      company_name: 'Toko Saya',
      columns: [...],
      data: transactions,
      summary: [
        { label: 'Total Transaksi', value: '120' },
        { label: 'Pendapatan Bersih', value: 'Rp 47.500.000' }
      ]
    })
  }
}

[OUTPUT]
Buatkan file exportUtils.ts yang bisa langsung diimport di semua halaman laporan.
Install dependency yang dibutuhkan dan beri instruksi npm install.
```

---

## 🔁 PROMPT 10 — ROLE-BASED ACCESS

```
[TASK]
Buatkan middleware/guard untuk proteksi akses halaman laporan berdasarkan role.

[ROLE ACCESS MATRIX]
                        Owner  Admin  Kasir  Gudang
Dashboard Laporan         ✅     ✅     ❌     ❌
Laporan Penjualan         ✅     ✅     ✅*    ❌
Laporan Laba Rugi         ✅     ❌     ❌     ❌
Laporan Inventori         ✅     ✅     ❌     ✅
Laporan Pembelian         ✅     ✅     ❌     ✅
Laporan Piutang/Hutang    ✅     ✅     ❌     ❌
Laporan Pengiriman        ✅     ✅     ✅     ✅
Laporan Karyawan          ✅     ❌     ❌     ❌
Laporan Pajak             ✅     ❌     ❌     ❌

* Kasir: hanya data shift sendiri, bukan semua kasir

[IMPLEMENTATION]
1. Buat HOC: withReportAccess(allowedRoles: Role[])
2. Buat hook: useReportAccess(reportType: ReportType)
3. Di setiap page: cek role dari JWT/session
4. Jika tidak punya akses: redirect ke /unauthorized
5. Untuk kasir di laporan penjualan: 
   - otomatis set filter cashier_id = current user id
   - sembunyikan dropdown pilih kasir

[OUTPUT]
Buatkan middleware, HOC, dan hook untuk role-based access control di modul laporan.
```

---

## 💡 TIPS PENGGUNAAN PROMPT

```
1. URUTAN EKSEKUSI YANG BENAR:
   Prompt 0 (Setup) → Prompt 1 (Types) → Prompt 2 (Shared Components)
   → Prompt 3-8 (Per Halaman) → Prompt 9 (Export) → Prompt 10 (Auth)

2. SATU PROMPT = SATU SESI (jangan gabung 2 prompt sekaligus)

3. SELALU PASTE MASTER CONTEXT DI AWAL SETIAP SESI BARU

4. JIKA AI HASILNYA TIDAK SESUAI, TAMBAHKAN:
   "Perbaiki dengan aturan:
   - Gunakan shadcn/ui bukan custom CSS
   - Tambahkan TypeScript typing yang proper
   - Tambahkan loading dan empty state"

5. UNTUK DEBUG, GUNAKAN PROMPT:
   "File ini error: [paste error]. 
    Ini kode saya: [paste kode].
    Perbaiki tanpa mengubah fungsi yang sudah benar."
```

---

*Generated for POS & Inventory App — Modul Laporan*
*Stack: Next.js 14 + TypeScript + Tailwind + shadcn/ui + Recharts*
