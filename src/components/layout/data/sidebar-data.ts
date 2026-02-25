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
      title: '1. Kasir & Utama',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'POS (Point of Sale)',
          url: '/pos',
          icon: ShoppingCart,
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
              title: 'Paket / Bundling (TBA)',
              url: '#',
              icon: Boxes,
            },
          ],
        },
        {
          title: 'Manajemen Inventori',
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
              title: 'Barang Expired/Rusak',
              url: '/inventory/rejected',
              icon: AlertTriangle,
            },
            {
              title: 'Transfer Gudang',
              url: '/inventory/transfer',
              icon: Truck,
            },
          ],
        },
      ],
    },
    {
      title: '3. Transaksi & Pengiriman',
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
              title: 'Piutang Kasbon (TBA)',
              url: '#',
              icon: BookOpen,
            },
          ],
        },
        {
          title: 'Pengiriman',
          icon: Truck,
          items: [
            {
              title: 'Data Kurir',
              url: '/settings/couriers',
              icon: Truck,
            },
            {
              title: 'Tracking Resi (TBA)',
              url: '#',
              icon: Truck,
            },
          ],
        },
      ],
    },
    {
      title: '4. Pembelian & Supplier',
      items: [
        {
          title: 'Purchasing',
          icon: ShoppingBag,
          items: [
            {
              title: 'Purchase Orders (PO)',
              url: '/purchasing/orders',
              icon: FileCheck,
            },
            {
              title: 'Penerimaan Barang (TBA)',
              url: '#',
              icon: ClipboardList,
            },
          ],
        },
        {
          title: 'Supplier',
          icon: Truck,
          items: [
            {
              title: 'Data Supplier',
              url: '/purchasing/suppliers',
              icon: Truck,
            },
            {
              title: 'Hutang Dagang (TBA)',
              url: '#',
              icon: Calculator,
            },
          ],
        },
      ],
    },
    {
      title: '5. Relasi & Pegawai',
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
              title: 'Program Loyalitas (TBA)',
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
              title: 'Data Karyawan & Akses',
              url: '#',
              icon: Users,
            },
            {
              title: 'Shift Kasir (TBA)',
              url: '#',
              icon: ClipboardList,
            },
          ],
        },
      ],
    },
    {
      title: '6. Akuntansi & Laporan',
      items: [
        {
          title: 'Keuangan',
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
              title: 'Pengeluaran/Expenses (TBA)',
              url: '#',
              icon: Calculator,
            },
          ],
        },
        {
          title: 'Laporan (Reports)',
          icon: BarChart3,
          items: [
            {
              title: 'Dashboard Laporan (Master)',
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
            {
              title: 'Piutang Pelanggan',
              url: '/reports/receivable',
              icon: Wallet,
            },
            {
              title: 'Hutang Usaha',
              url: '/reports/payable',
              icon: Calculator,
            },
            {
              title: 'Pengiriman',
              url: '/reports/shipping',
              icon: Truck,
            },
          ],
        },
      ],
    },
    {
      title: '7. Sistem',
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
