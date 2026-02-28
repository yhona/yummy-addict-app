import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Layers,
  Warehouse,
  ClipboardList,
  ShoppingBag,
  Truck,
  FileCheck,
  Calculator,
  BookOpen,
  FileText,
  BarChart3,
  Settings,
  Building2,
  GitBranch,
  Users,
  UserCog,
  Bell,
  Palette,
  Store,
  RotateCcw,
  Boxes,
  AlertTriangle,
  Wallet,
  Clock,
  RefreshCcw,
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'Admin',
    email: 'admin@yummyaddict.id',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Yummy Addict',
      logo: Store,
      plan: 'Enterprise',
    },
  ],
  navGroups: [
    {
      title: '1. Utama / Kasir',
      items: [
        {
          title: 'Kasir (POS)',
          url: '/pos',
          icon: ShoppingCart,
        },
        {
          title: 'Riwayat Transaksi',
          url: '/transactions',
          icon: Clock,
        },
        {
          title: 'Retur Penjualan',
          url: '/returns',
          icon: RefreshCcw,
        },
      ],
    },
    {
      title: '2. Produk & Inventori',
      items: [
        {
          title: 'Manajemen Produk',
          icon: Package,
          items: [
            {
              title: 'Daftar Produk',
              url: '/inventory/products',
              icon: Package,
            },
            {
              title: 'Kategori',
              url: '/inventory/categories',
              icon: Layers,
            },
            {
              title: 'Satuan (Units)',
              url: '/inventory/units',
              icon: ClipboardList,
            },
            {
              title: 'Varian Produk (TBA)',
              url: '#',
              icon: GitBranch,
            },
            {
              title: 'Paket / Bundling',
              url: '/inventory/products?type=bundle',
              icon: Boxes,
            },
          ],
        },
        {
          title: 'Inventori & Gudang',
          icon: Warehouse,
          items: [
            {
              title: 'Pergerakan Stok',
              url: '/inventory/movements',
              icon: ClipboardList,
            },
            {
              title: 'Penyesuaian Stok',
              url: '/inventory/stock',
              icon: ClipboardList,
            },
            {
              title: 'Stock Opname',
              url: '/inventory/opname',
              icon: ClipboardList,
            },
            {
              title: 'Gudang & Lokasi',
              url: '/inventory/warehouses',
              icon: Warehouse,
            },
            {
              title: 'Transfer Gudang',
              url: '/inventory/transfer',
              icon: Truck,
            },
            {
              title: 'Barang Expired/Rusak',
              url: '/inventory/rejected',
              icon: AlertTriangle,
            },
          ],
        },
      ],
    },
    {
      title: '3. Transaksi & Operasional',
      items: [
        {
          title: 'Penjualan',
          icon: ShoppingCart,
          items: [
            {
              title: 'Semua Transaksi',
              url: '/transactions',
              icon: FileText,
            },
            {
              title: 'Pesanan Online',
              url: '/sales/orders',
              icon: ClipboardList,
            },
            {
              title: 'Retur Penjualan',
              url: '/returns',
              icon: RotateCcw,
            },
            {
              title: 'Piutang / Kasbon',
              url: '/finance/receivables',
              icon: BookOpen,
            },
          ],
        },
        {
          title: 'Pembelian & Supplier',
          icon: ShoppingBag,
          items: [
            {
              title: 'Daftar PO',
              url: '/purchasing/orders',
              icon: FileCheck,
            },
            {
              title: 'Data Supplier',
              url: '/purchasing/suppliers',
              icon: Building2,
            },
          ],
        },
        {
          title: 'Pengiriman',
          icon: Truck,
          items: [
            {
              title: 'Daftar Pengiriman',
              url: '/shipping',
              icon: Truck,
            },
            {
              title: 'Update Resi Massal',
              url: '/shipping/bulk-update',
              icon: ClipboardList,
            },
            {
              title: 'Manajemen Kurir',
              url: '/settings/couriers',
              icon: Truck,
            },
          ],
        },
      ],
    },
    {
      title: '4. Keuangan & Laporan',
      items: [
        {
          title: 'Akuntansi',
          icon: Calculator,
          items: [
            {
              title: 'Chart of Accounts',
              url: '/accounting/coa',
              icon: BookOpen,
            },
            {
              title: 'Jurnal Umum',
              url: '/accounting/journals',
              icon: FileText,
            },
            {
              title: 'Kategori Pengeluaran',
              url: '/finance/expenses/categories',
              icon: Layers,
            },
            {
              title: 'Data Pengeluaran',
              url: '/finance/expenses',
              icon: Wallet,
            },
          ],
        },
        {
          title: 'Pusat Laporan',
          icon: BarChart3,
          items: [
            {
              title: 'Dashboard Laporan',
              url: '/reports',
              icon: LayoutDashboard,
            },
            {
              title: 'Laporan Penjualan',
              url: '/reports/sales',
              icon: ShoppingCart,
            },
            {
              title: 'Laba Rugi (P&L)',
              url: '/reports/profit-loss',
              icon: FileText,
            },
            {
              title: 'Laporan Inventori',
              url: '/reports/inventory',
              icon: Package,
            },
          ],
        },
      ],
    },
    {
      title: '5. SDM & Ekosistem',
      items: [
        {
          title: 'Pelanggan (CRM)',
          icon: Users,
          items: [
            {
              title: 'Data Pelanggan',
              url: '/customers',
              icon: Users,
            },
            {
              title: 'Customer Loyalty (TBA)',
              url: '#',
              icon: Palette,
            },
          ],
        },
        {
          title: 'Karyawan (SDM)',
          icon: UserCog,
          items: [
            {
              title: 'Data Karyawan',
              url: '#',
              icon: Users,
            },
            {
              title: 'Atur Shift (TBA)',
              url: '#',
              icon: ClipboardList,
            },
          ],
        },
      ],
    },
    {
      title: '6. Sistem',
      items: [
        {
          title: 'Pengaturan',
          icon: Settings,
          items: [
            {
              title: 'Profil Perusahaan',
              url: '/settings/company',
              icon: Building2,
            },
            {
              title: 'Cabang / Branch',
              url: '/settings/branches',
              icon: GitBranch,
            },
            {
              title: 'Notifikasi',
              url: '/settings/notifications',
              icon: Bell,
            },
          ],
        },
      ],
    },
  ],
}
