import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api-client'

interface SalesReportParams extends Record<string, string | number | undefined> {
  startDate?: string
  endDate?: string
}

interface SalesSummary {
  totalSales: number
  totalOrders: number
  avgOrder: number
}

interface DailySales {
  date: string
  total: number
  orders: number
}

interface SalesReportResponse {
  summary: SalesSummary
  dailySales: DailySales[]
  period: { start: string; end: string }
}

interface TopProduct {
  productId: string
  productName: string
  productSku: string
  totalQty: number
  totalSales: number
}

interface SalesByCategory {
  categoryId: string | null
  categoryName: string
  totalQty: number
  totalSales: number
}

export const useSalesReport = (params: SalesReportParams = {}) => {
  return useQuery<SalesReportResponse>({
    queryKey: ['reports', 'sales', params],
    queryFn: async () => {
      return api.get('/api/reports/sales', params)
    },
  })
}

export const useTopProducts = (params: SalesReportParams & { limit?: number } = {}) => {
  return useQuery<{ data: TopProduct[] }>({
    queryKey: ['reports', 'top-products', params],
    queryFn: async () => {
      return api.get('/api/reports/top-products', params)
    },
  })
}

export const useSalesByCategory = (params: SalesReportParams = {}) => {
  return useQuery<{ data: SalesByCategory[] }>({
    queryKey: ['reports', 'sales-by-category', params],
    queryFn: async () => {
      return api.get('/api/reports/sales-by-category', params)
    },
  })
}

export interface NetProfitBreakdown {
  grossSales: number
  discounts: number
  returns: number
  netSales: number
  cogs: number
  grossProfit: number
  operationalCosts: number
  otherIncome: number
  taxes: number
  netProfit: number
}

export interface NetProfitResponse {
  breakdown: NetProfitBreakdown
  period: { start: string; end: string }
}

export const useNetProfitReport = (params: SalesReportParams = {}) => {
  return useQuery<NetProfitResponse>({
    queryKey: ['reports', 'net-profit', params],
    queryFn: async () => {
      return api.get('/api/reports/net-profit', params)
    },
  })
}

export interface AgingReportItem {
  customer_id?: string
  customer_name?: string
  supplier_id?: string
  supplier_name?: string
  phone?: string
  total_debt: number
  paid: number
  outstanding: number
  aging_0_30: number
  aging_31_60: number
  aging_61_90: number
  aging_over_90: number
  last_transaction_date?: string
  due_date?: string
  status: string
}

export const useReceivableReport = (params = {}) => {
  return useQuery<{ data: AgingReportItem[] }>({
    queryKey: ['reports', 'receivable', params],
    queryFn: async () => {
      return api.get('/api/reports/receivable', params)
    },
  })
}

export const usePayableReport = (params = {}) => {
  return useQuery<{ data: AgingReportItem[] }>({
    queryKey: ['reports', 'payable', params],
    queryFn: async () => {
      return api.get('/api/reports/payable', params)
    },
  })
}

export interface TransactionReportItem {
  id: string
  invoice_number: string
  date: string
  customer_name: string
  cashier_name: string
  gross_total: number
  discount: number
  net_total: number
  payment_method: string
  status: string
  // Extended
  cash_amount?: number
  change_amount?: number
  delivery_method?: string
  shipping_cost?: number
  courier_name?: string
  tracking_number?: string
  notes?: string
}

export interface TransactionReportResponse {
  data: TransactionReportItem[]
  meta: {
    current_page: number
    total: number
    per_page: number
    last_page: number
  }
}

export const useTransactionsReport = (params = {}) => {
  return useQuery<TransactionReportResponse>({
    queryKey: ['reports', 'transactions', params],
    queryFn: async () => {
      return api.get('/api/reports/transactions', params)
    },
  })
}

export interface TransactionLineItem {
  product_name: string
  sku: string
  qty: number
  price: number
  discount: number
  subtotal: number
}

// Pass txId string natively or via params
export const useTransactionItems = (txId: string | null) => {
  return useQuery<{ data: TransactionLineItem[] }>({
    queryKey: ['reports', 'transactions', txId, 'items'],
    queryFn: async () => {
      return api.get(`/api/reports/transactions/${txId}/items`)
    },
    enabled: !!txId, // Only fetch if txId is not null
  })
}

export interface ExpenseCategory {
  category: string
  amount: number
  percent_of_revenue: number
  items: { label: string, amount: number }[]
}

export interface ProfitLossResponse {
  period: string
  gross_revenue: number
  discount: number
  returns: number
  net_revenue: number
  cogs: number
  gross_profit: number
  gross_margin_percent: number
  operational_expenses: ExpenseCategory[]
  total_operational_expenses: number
  other_income: number
  ebit: number
  tax: number
  net_profit: number
  net_margin_percent: number
}

export const useProfitLossReport = (params = {}) => {
  return useQuery<ProfitLossResponse>({
    queryKey: ['reports', 'profit-loss', params],
    queryFn: async () => {
      return api.get('/api/reports/profit-loss', params)
    },
  })
}

// --- INVENTORY REPORTS ---

export interface InventoryStockItem {
  product_id: string
  product_name: string
  sku: string
  category: string
  warehouse: string
  qty: number
  unit: string
  cost_price: number
  stock_value: number
  min_stock: number
  status: string
}

export interface InventoryMovementItem {
  date: string
  product_name: string
  type: string
  qty: number
  reference: string
  note: string
}

export interface InventoryAlertsResponse {
  empty: any[]
  low: any[]
  expired_soon: any[]
}

export const useInventoryStock = (params = {}) => {
  return useQuery<{ data: InventoryStockItem[] }>({
    queryKey: ['reports', 'inventory', 'stock', params],
    queryFn: async () => {
      return api.get('/api/reports/inventory/stock', params)
    }
  })
}

export const useInventoryMovement = (params = {}) => {
  return useQuery<{ data: InventoryMovementItem[] }>({
    queryKey: ['reports', 'inventory', 'movement', params],
    queryFn: async () => {
      return api.get('/api/reports/inventory/movement', params)
    }
  })
}

export const useInventoryAlerts = () => {
  return useQuery<InventoryAlertsResponse>({
    queryKey: ['reports', 'inventory', 'alerts'],
    queryFn: async () => {
      return api.get('/api/reports/inventory/alerts')
    }
  })
}

// --- SHIPPING REPORTS ---

export interface ShippingSummary {
  total_shipments: number
  delivered: number
  in_transit: number
  returned: number
  failed: number
  total_shipping_cost: number
  cost_charged_to_store: number
  cost_charged_to_customer: number
}

export interface CourierPerformance {
  courier: string
  total: number
  delivered: number
  returned: number
  cost: number
}

export interface ShipmentItem {
  id: string
  tracking_number: string
  order_date: string
  recipient_name: string
  recipient_address: string
  courier: string
  service_type: string
  shipping_cost: number
  charged_to: 'store' | 'customer'
  weight_kg: number
  status: 'DELIVERED' | 'IN_TRANSIT' | 'PROCESSED' | 'RETURNED' | 'FAILED'
  delivered_date: string | null
}

export interface ShippingReportResponse {
  summary: ShippingSummary
  by_courier: CourierPerformance[]
  shipments: {
    data: ShipmentItem[]
    meta: { current_page: number, total: number, per_page: number, last_page: number }
  }
}

export const useShippingReport = (params = {}) => {
  return useQuery<ShippingReportResponse>({
    queryKey: ['reports', 'shipping', params],
    queryFn: async () => {
      return api.get('/api/reports/shipping', params)
    }
  })
}

// --- MASTER DASHBOARD REPORTS ---

export interface DashboardKPI {
  net_revenue: number
  net_revenue_change: number
  total_transactions: number
  transactions_change: number
  net_profit: number
  net_profit_change: number
  total_expenses: number
  expenses_change: number
}

export interface DashboardResponse {
  period: string
  kpi: DashboardKPI
  revenue_chart: { date: string, revenue: number }[]
  top_products: { rank: number, product_name: string, qty_sold: number, revenue: number }[]
  payment_distribution: { method: string, count: number, amount: number, percent: number }[]
  low_stock_alert_count: number
  overdue_receivable_count: number
  overdue_payable_count: number
}

export const useReportsDashboard = (params = {}) => {
  return useQuery<DashboardResponse>({
    queryKey: ['reports', 'dashboard', params],
    queryFn: async () => {
      return api.get('/api/reports/dashboard', params)
    }
  })
}
