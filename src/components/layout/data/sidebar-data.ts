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
} from 'lucide-react'
import { type SidebarData } from '../types'

export const sidebarData: SidebarData = {
  user: {
    name: 'Admin',
    email: 'admin@retailerp.com',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'Retail ERP',
      logo: Store,
      plan: 'Enterprise',
    },
  ],
  navGroups: [
    {
      title: 'Main',
      items: [
        {
          title: 'Dashboard',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: 'Starter Kit',
          url: '/starter-kit',
          icon: ClipboardList,
        },
        {
          title: 'POS',
          url: '/pos',
          icon: ShoppingCart,
        },
      ],
    },
    {
      title: 'Operations',
      items: [
        {
          title: 'Inventory',
          icon: Package,
          items: [
            {
              title: 'Products',
              url: '/inventory/products',
              icon: Package,
            },
            {
              title: 'Categories',
              url: '/inventory/categories',
              icon: Layers,
            },
            {
              title: 'Units',
              url: '/inventory/units',
              icon: ClipboardList,
            },
            {
              title: 'Stock Adjustments',
              url: '/inventory/stock',
              icon: ClipboardList,
            },
            {
              title: 'Stock Movements',
              url: '/inventory/movements',
              icon: ClipboardList,
            },
            {
              title: 'Warehouses',
              url: '/inventory/warehouses',
              icon: Warehouse,
            },
            {
              title: 'Bulk Products',
              url: '/inventory/bulk-products',
              icon: Boxes,
            },
            {
              title: 'Rejected Items',
              url: '/inventory/rejected',
              icon: AlertTriangle,
            },
          ],
        },
        {
          title: 'Sales',
          icon: ShoppingCart,
          items: [
            {
              title: 'New Order',
              url: '/sales/orders/create',
              icon: ShoppingCart,
            },
            {
              title: 'Pending Orders',
              url: '/sales/orders',
              icon: ClipboardList,
            },
            {
              title: 'Transactions',
              url: '/transactions',
              icon: FileText,
            },
            {
              title: 'Customers',
              url: '/customers',
              icon: Users,
            },
            {
              title: 'Returns',
              url: '/returns',
              icon: RotateCcw,
            },
          ],
        },
        {
          title: 'Purchasing',
          icon: ShoppingBag,
          items: [
            {
              title: 'Suppliers',
              url: '/purchasing/suppliers',
              icon: Truck,
            },
            {
              title: 'Purchase Orders',
              url: '/purchasing/orders',
              icon: FileCheck,
            },
          ],
        },
        {
          title: 'Reports',
          icon: BarChart3,
          items: [
            {
              title: 'Sales Report',
              url: '/reports/sales',
              icon: BarChart3,
            },
          ],
        },
      ],
    },
    {
      title: 'Finance',
      items: [
        {
          title: 'Accounting',
          icon: Calculator,
          items: [
            {
              title: 'Chart of Accounts',
              url: '/accounting/coa',
              icon: BookOpen,
            },
            {
              title: 'Journal Entries',
              url: '/accounting/journals',
              icon: FileText,
            },
            {
              title: 'Reports',
              url: '/accounting/reports',
              icon: BarChart3,
            },
          ],
        },
      ],
    },
    {
      title: 'System',
      items: [
        {
          title: 'Settings',
          icon: Settings,
          items: [
            {
              title: 'Company',
              url: '/settings/company',
              icon: Building2,
            },
            {
              title: 'Branches',
              url: '/settings/branches',
              icon: GitBranch,
            },
            {
              title: 'Users',
              url: '/settings/users',
              icon: Users,
            },
            {
              title: 'Profile',
              url: '/settings',
              icon: UserCog,
            },
            {
              title: 'Notifications',
              url: '/settings/notifications',
              icon: Bell,
            },
            {
              title: 'Appearance',
              url: '/settings/appearance',
              icon: Palette,
            },
            {
              title: 'Appearance',
              url: '/settings/appearance',
              icon: Palette,
            },
            {
              title: 'Couriers',
              url: '/settings/couriers',
              icon: Truck,
            },
          ],
        },
      ],
    },
  ],
}
