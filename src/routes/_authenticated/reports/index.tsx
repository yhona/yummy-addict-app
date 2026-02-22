import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useReportsDashboard } from '@/features/reports/api/reports'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RevenueChart } from './components/dashboard/revenue-chart'
import { PaymentDonut } from './components/dashboard/payment-donut'
import { TopProducts } from './components/dashboard/top-products'
import { formatCurrency } from '@/lib/utils'
import { 
  ArrowDownRight, ArrowUpRight, Loader2, Link, 
  ShoppingCart, Package, Truck, Wallet, FileText, AlertTriangle 
} from 'lucide-react'

export const Route = createFileRoute('/_authenticated/reports/')({
  component: DashboardReportsPage,
})

function DashboardReportsPage() {
  const navigate = useNavigate()
  const [period, setPeriod] = useState<string>('this_month')

  const { data, isLoading } = useReportsDashboard({ period })

  if (isLoading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const kpi = data?.kpi
  const alerts = data ? [
    { 
      label: 'Stok Habis / Menipis', 
      count: data.low_stock_alert_count, 
      color: 'text-red-600', 
      bg: 'bg-red-50', 
      icon: Package,
      path: 'inventory'
    },
    { 
      label: 'Piutang Jatuh Tempo', 
      count: data.overdue_receivable_count, 
      color: 'text-orange-600', 
      bg: 'bg-orange-50', 
      icon: Wallet,
      path: 'debts'
    },
    { 
      label: 'Hutang Jatuh Tempo', 
      count: data.overdue_payable_count, 
      color: 'text-blue-600', 
      bg: 'bg-blue-50', 
      icon: Truck,
      path: 'debts'
    }
  ] : []

  // Shortcuts grid
  const shortcuts = [
    { label: 'Penjualan', icon: ShoppingCart, path: 'sales', color: 'bg-blue-100 text-blue-700' },
    { label: 'Keuangan (P&L)', icon: FileText, path: 'finance', color: 'bg-emerald-100 text-emerald-700' },
    { label: 'Inventori', icon: Package, path: 'inventory', color: 'bg-amber-100 text-amber-700' },
    { label: 'Hutang / Piutang', icon: Wallet, path: 'debts', color: 'bg-purple-100 text-purple-700' },
    { label: 'Pengiriman', icon: Truck, path: 'shipping', color: 'bg-indigo-100 text-indigo-700' },
  ]

  const formatPercent = (val: number | undefined) => {
    if (val === undefined) return '0%'
    if (val > 0) return `+${val}%`
    return `${val}%`
  }

  const navigateToTab = (tabValue: string) => {
    // Navigate to the sales unified container but activate the specific tab
    navigate({ to: '/reports/sales', search: (prev: any) => ({ ...prev, tab: tabValue }) })
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Laporan</h1>
          <p className="text-muted-foreground mt-1 text-sm">Ringkasan performa bisnis dan kesehatan finansial toko.</p>
        </div>
        <ToggleGroup type="single" value={period} onValueChange={(v) => v && setPeriod(v)} className="bg-muted p-1 rounded-md justify-start self-start">
          <ToggleGroupItem value="today" className="px-4 text-xs sm:text-sm shadow-none data-[state=on]:bg-background data-[state=on]:shadow-sm">Hari Ini</ToggleGroupItem>
          <ToggleGroupItem value="this_week" className="px-4 text-xs sm:text-sm shadow-none data-[state=on]:bg-background data-[state=on]:shadow-sm">Minggu Ini</ToggleGroupItem>
          <ToggleGroupItem value="this_month" className="px-4 text-xs sm:text-sm shadow-none data-[state=on]:bg-background data-[state=on]:shadow-sm">Bulan Ini</ToggleGroupItem>
        </ToggleGroup>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        
        {/* Revenue */}
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Omset Pendapatan</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h2 className="text-2xl font-bold">{formatCurrency(kpi?.net_revenue || 0)}</h2>
            </div>
            <div className={`flex items-center text-xs mt-2 ${kpi && kpi.net_revenue_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {kpi && kpi.net_revenue_change >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
              <span className="font-semibold">{formatPercent(kpi?.net_revenue_change)}</span>
              <span className="text-muted-foreground ml-1 font-normal">vs {period === 'this_month' ? 'bulan lalu' : 'periode lalu'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Total Transaksi</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h2 className="text-2xl font-bold">{kpi?.total_transactions || 0} TRX</h2>
            </div>
            <div className={`flex items-center text-xs mt-2 ${kpi && kpi.transactions_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {kpi && kpi.transactions_change >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
              <span className="font-semibold">{formatPercent(kpi?.transactions_change)}</span>
              <span className="text-muted-foreground ml-1 font-normal">vs {period === 'this_month' ? 'bulan lalu' : 'periode lalu'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Net Profit */}
        <Card className="shadow-sm border-l-4 border-l-emerald-500">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Laba Bersih (Estimasi)</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h2 className="text-2xl font-bold">{formatCurrency(kpi?.net_profit || 0)}</h2>
            </div>
            <div className={`flex items-center text-xs mt-2 ${kpi && kpi.net_profit_change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {kpi && kpi.net_profit_change >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
              <span className="font-semibold">{formatPercent(kpi?.net_profit_change)}</span>
              <span className="text-muted-foreground ml-1 font-normal">vs {period === 'this_month' ? 'bulan lalu' : 'periode lalu'}</span>
            </div>
          </CardContent>
        </Card>

        {/* Expenses */}
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-muted-foreground">Pengeluaran & HPP</p>
            <div className="flex items-baseline gap-2 mt-1">
              <h2 className="text-2xl font-bold">{formatCurrency(kpi?.total_expenses || 0)}</h2>
            </div>
            <div className={`flex items-center text-xs mt-2 ${kpi && kpi.expenses_change <= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {kpi && kpi.expenses_change <= 0 ? <ArrowDownRight className="h-3 w-3 mr-1" /> : <ArrowUpRight className="h-3 w-3 mr-1" />}
              <span className="font-semibold">{formatPercent(kpi?.expenses_change)}</span>
              <span className="text-muted-foreground ml-1 font-normal">vs {period === 'this_month' ? 'bulan lalu' : 'periode lalu'}</span>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Main Charts Row */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-5">
        <RevenueChart data={data?.revenue_chart || []} />
        <PaymentDonut data={data?.payment_distribution || []} />
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        <TopProducts data={data?.top_products || []} />
        
        {/* Right Column: Alerts & Shortcuts */}
        <div className="col-span-1 space-y-6">
          
          {/* Quick Alerts */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" /> 
                Peringatan Sistem
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3">
              {alerts.map((alert, idx) => {
                const Icon = alert.icon
                return (
                  <div key={idx} 
                      onClick={() => navigateToTab(alert.path)}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${alert.bg} ${alert.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">{alert.label}</span>
                    </div>
                    {alert.count > 0 ? (
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${alert.bg} ${alert.color}`}>
                        {alert.count}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Aman</span>
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Quick Navigation Shortcuts */}
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <Link className="h-4 w-4 text-muted-foreground" />
                Jalan Pintas Modul
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 pb-4">
              <div className="grid grid-cols-2 gap-2">
                {shortcuts.map((sc, idx) => {
                  const Icon = sc.icon
                  return (
                    <div 
                      key={idx}
                      onClick={() => navigateToTab(sc.path)}
                      className="flex flex-col items-center justify-center p-3 text-center border rounded-lg hover:border-primary/50 hover:bg-muted/30 cursor-pointer transition-all gap-2"
                    >
                      <div className={`p-2 rounded-full ${sc.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-medium">{sc.label}</span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

    </div>
  )
}
