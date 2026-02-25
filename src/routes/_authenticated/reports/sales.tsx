import { createFileRoute, useSearch } from '@tanstack/react-router'
import { useSalesReport, useTopProducts, useSalesByCategory, useNetProfitReport } from '@/features/reports/api/reports'
import { formatCurrency } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, ShoppingCart, DollarSign, Package, Loader2, ArrowUpRight, Minus } from 'lucide-react'
import { format } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { ExportButton } from '@/components/reports/shared/ExportButton'
import { TransactionTable } from './components/transaction-table'
import { ReportsLayout, type ReportSearchParams } from './components/reports-layout'

export const Route = createFileRoute('/_authenticated/reports/sales')({
  component: SalesReportPage,
})

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300']

function SalesReportPage() {
  const search = useSearch({ strict: false }) as ReportSearchParams
  
  const params = {
    startDate: search.startDate,
    endDate: search.endDate,
    ...(search.cashierId && search.cashierId !== 'all' && { cashierId: search.cashierId }),
    ...(search.categoryId && search.categoryId !== 'all' && { categoryId: search.categoryId }),
    ...(search.paymentMethod && search.paymentMethod !== 'all' && { paymentMethod: search.paymentMethod }),
  }
  
  const { data: salesData, isLoading: salesLoading } = useSalesReport(params)
  const { data: topProducts, isLoading: productsLoading } = useTopProducts({ ...params, limit: 10 })
  const { data: categoryData, isLoading: categoryLoading } = useSalesByCategory(params)
  const { data: netProfitData, isLoading: profitLoading } = useNetProfitReport(params)
  
  const isLoading = salesLoading || productsLoading || categoryLoading || profitLoading
  
  // Prepare PDF & CSV Configs
  const exportColumns = [
    { key: 'rank', label: 'Peringkat' },
    { key: 'productName', label: 'Nama Produk' },
    { key: 'productSku', label: 'SKU' },
    { key: 'totalQty', label: 'Terjual (Qty)' },
    { key: 'totalSales', label: 'Pendapatan (Rp)', format: 'currency' as const }
  ]

  const exportData = (topProducts?.data || []).map((p, idx) => ({
    ...p,
    rank: idx + 1
  }))

  const pdfConfig = {
    title: 'Laporan Penjualan (Top Produk)',
    subtitle: `Periode: ${search.startDate ? format(new Date(search.startDate), 'dd MMM yyyy') : '-'} s/d ${search.endDate ? format(new Date(search.endDate), 'dd MMM yyyy') : '-'}`,
    company_name: 'Yummy Addict',
    columns: exportColumns.map(c => ({ header: c.label, dataKey: c.key })),
    summary: [
      { label: 'Total Penjualan Bersih', value: formatCurrency(salesData?.summary.totalSales || 0) },
      { label: 'Total Transaksi', value: `${salesData?.summary.totalOrders || 0} Trx` }
    ]
  }
  
  return (
    <ReportsLayout 
      title="Laporan Penjualan (Sales)" 
      description="Analisa performa barang keluar dan kasir Anda."
    >
      <div className="flex justify-end mb-4">
        <ExportButton 
          filename="Laporan_Penjualan_TopProducts"
          data={exportData}
          csvColumns={exportColumns}
          pdfConfig={pdfConfig}
        />
      </div>

      {isLoading ? (
        <div className="flex h-96 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(salesData?.summary.totalSales || 0)}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{salesData?.summary.totalOrders || 0}</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Order</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(salesData?.summary.avgOrder || 0)}</div>
              </CardContent>
            </Card>
          </div>
          
          {/* Net Profit Breakdown Card */}
          <Card className="bg-slate-50 dark:bg-slate-900 border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Laporan Laba Bersih (Net Profit)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Revenue Section */}
                <div className="flex justify-between items-center text-sm py-1">
                  <span className="text-muted-foreground">Total Penjualan Kotor</span>
                  <span className="font-medium flex items-center gap-1"><ArrowUpRight className="h-3 w-3 text-green-500"/> {formatCurrency(netProfitData?.breakdown.grossSales || 0)}</span>
                </div>
                <div className="flex justify-between items-center text-sm py-1">
                  <span className="text-muted-foreground ml-4">- Diskon Penjualan</span>
                  <span className="font-medium text-red-500 flex items-center gap-1"><Minus className="h-3 w-3"/> {formatCurrency(netProfitData?.breakdown.discounts || 0)}</span>
                </div>
                <div className="flex justify-between items-center text-sm py-1">
                  <span className="text-muted-foreground ml-4">- Retur Penjualan</span>
                  <span className="font-medium text-red-500 flex items-center gap-1"><Minus className="h-3 w-3"/> {formatCurrency(netProfitData?.breakdown.returns || 0)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-semibold border-t pt-2 mt-2">
                  <span>Pendapatan Bersih (Net Sales)</span>
                  <span>{formatCurrency(netProfitData?.breakdown.netSales || 0)}</span>
                </div>

                {/* COGS Section */}
                <div className="flex justify-between items-center text-sm py-1 mt-4">
                  <span className="text-muted-foreground">- Harga Pokok Penjualan (HPP / COGS)</span>
                  <span className="font-medium text-red-500 flex items-center gap-1"><Minus className="h-3 w-3"/> {formatCurrency(netProfitData?.breakdown.cogs || 0)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-semibold border-t pt-2 mt-2">
                  <span>Laba Kotor (Gross Profit)</span>
                  <span>{formatCurrency(netProfitData?.breakdown.grossProfit || 0)}</span>
                </div>

                {/* Operations & Tax Section */}
                <div className="flex justify-between items-center text-sm py-1 mt-4">
                  <span className="text-muted-foreground">- Biaya Operasional</span>
                  <span className="font-medium text-red-500 flex items-center gap-1"><Minus className="h-3 w-3"/> {formatCurrency(netProfitData?.breakdown.operationalCosts || 0)}</span>
                </div>
                <div className="flex justify-between items-center text-sm py-1">
                  <span className="text-muted-foreground ml-4">+ Pendapatan Lain (Ongkir)</span>
                  <span className="font-medium text-green-500 flex items-center gap-1"><ArrowUpRight className="h-3 w-3"/> {formatCurrency(netProfitData?.breakdown.otherIncome || 0)}</span>
                </div>
                <div className="flex justify-between items-center text-sm font-semibold border-t pt-2 mt-2">
                  <span>Laba Operasional (EBIT)</span>
                  <span>{formatCurrency((netProfitData?.breakdown.grossProfit || 0) + (netProfitData?.breakdown.otherIncome || 0) - (netProfitData?.breakdown.operationalCosts || 0))}</span>
                </div>

                <div className="flex justify-between items-center text-sm py-1 mt-4">
                  <span className="text-muted-foreground">- Pajak & Pungutan</span>
                  <span className="font-medium text-red-500 flex items-center gap-1"><Minus className="h-3 w-3"/> {formatCurrency(netProfitData?.breakdown.taxes || 0)}</span>
                </div>
                
                {/* Final Net Profit */}
                <div className="flex justify-between items-center text-lg font-bold border-t-2 border-primary/20 pt-4 mt-2 bg-primary/5 p-4 rounded-md">
                  <span className="text-primary">LABA BERSIH (Net Profit)</span>
                  <span className="text-primary">{formatCurrency(netProfitData?.breakdown.netProfit || 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Charts Row */}
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Daily Sales Chart */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Daily Sales</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={salesData?.dailySales || []}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(v) => format(new Date(v), 'MMM d')}
                      className="text-xs"
                    />
                    <YAxis 
                      tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                      className="text-xs"
                    />
                    <Tooltip 
                      formatter={(value: number | undefined) => formatCurrency(value || 0)}
                      labelFormatter={(label) => format(new Date(label), 'MMM d, yyyy')}
                    />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            {/* Sales by Category Pie Chart */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle>Sales by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={(categoryData?.data || []) as any[]}
                      dataKey="totalSales"
                      nameKey="categoryName"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    >
                      {(categoryData?.data || []).map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number | undefined) => formatCurrency(value || 0)} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          
          {/* Top Products Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Top Selling Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="p-3 text-left font-medium">#</th>
                      <th className="p-3 text-left font-medium">Product</th>
                      <th className="p-3 text-left font-medium">SKU</th>
                      <th className="p-3 text-right font-medium">Qty Sold</th>
                      <th className="p-3 text-right font-medium">Total Sales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(topProducts?.data || []).map((product, index) => (
                      <tr key={product.productId} className="border-b hover:bg-muted/50">
                        <td className="p-3 font-medium">{index + 1}</td>
                        <td className="p-3">{product.productName}</td>
                        <td className="p-3 font-mono text-muted-foreground">{product.productSku}</td>
                        <td className="p-3 text-right">{product.totalQty}</td>
                        <td className="p-3 text-right font-medium">{formatCurrency(product.totalSales)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          
          <div className="pt-6 mt-6">
            <TransactionTable 
              startDate={search.startDate}
              endDate={search.endDate}
              cashierId={search.cashierId}
              paymentMethod={search.paymentMethod}
            />
          </div>
        </>
      )}
    </ReportsLayout>
  )
}
