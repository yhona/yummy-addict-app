import { useState } from 'react'
import { useShippingReport } from '@/features/reports/api/reports'
import { Card, CardContent } from '@/components/ui/card'
import { PackageCheck, Truck, AlertTriangle, PackageSearch } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { CourierChart } from './courier-chart'
import { ShipmentTable } from './shipment-table'
import { Loader2 } from 'lucide-react'

export function ShippingTab() {
  const [courierFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const { data: report, isLoading } = useShippingReport({
    courier: courierFilter !== 'all' ? courierFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined
  })

  if (isLoading) {
    return (
      <div className="flex h-96 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const { summary, by_courier } = report || { summary: null, by_courier: [] }

  return (
    <div className="space-y-6 mt-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Laporan Pengiriman Ekspedisi</h2>
          <p className="text-sm text-muted-foreground">Analisis performa kurir logistik dan resolusi paket.</p>
        </div>
      </div>

      {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card className="shadow-sm border-l-4 border-l-slate-400">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase">Total Kiriman</p>
                <p className="text-2xl font-bold">{summary.total_shipments}</p>
                <p className="text-xs text-muted-foreground mt-1">Biaya: {formatCurrency(summary.total_shipping_cost)}</p>
              </div>
              <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                <PackageSearch className="h-5 w-5 text-slate-600 dark:text-slate-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-green-500 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter(statusFilter === 'delivered' ? 'all' : 'delivered')}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-green-600 dark:text-green-500 uppercase">Diterima</p>
                <p className="text-2xl font-bold">{summary.delivered}</p>
              </div>
              <div className="h-10 w-10 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <PackageCheck className="h-5 w-5 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-blue-500 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter(statusFilter === 'in_transit' ? 'all' : 'in_transit')}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-500 uppercase">Dalam Perjalanan</p>
                <p className="text-2xl font-bold">{summary.in_transit}</p>
              </div>
              <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-red-500 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setStatusFilter(statusFilter === 'returned' ? 'all' : 'returned')}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-red-600 dark:text-red-500 uppercase">Retur / Gagal</p>
                <p className="text-2xl font-bold">{summary.returned + summary.failed}</p>
              </div>
              <div className="h-10 w-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Courier Chart */}
      <div className="h-80 w-full mb-8">
        <CourierChart data={by_courier} />
      </div>

      {/* detailed shipment tracking table */}
      <div className="mt-8 pt-6 border-t">
        <h3 className="text-lg font-medium mb-4">Semua Resi Pengiriman {statusFilter !== 'all' ? `(${statusFilter.toUpperCase()})` : ''}</h3>
        <ShipmentTable data={report?.shipments.data || []} />
      </div>
    </div>
  )
}
