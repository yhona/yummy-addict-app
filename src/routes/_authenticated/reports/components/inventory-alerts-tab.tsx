import { useInventoryAlerts } from '@/features/reports/api/reports'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AlertCircle, PlusCircle, Package } from 'lucide-react'
import { Loader2 } from 'lucide-react'
import { ExportButton } from '@/components/reports/shared/ExportButton'
import { format } from 'date-fns'

export function InventoryAlertsTab() {
  const { data: alerts, isLoading } = useInventoryAlerts()

  if (isLoading) {
    return (
      <div className="flex h-64 w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const emptyStock = alerts?.empty || []
  const lowStock = alerts?.low || []

  if (emptyStock.length === 0 && lowStock.length === 0) {
    return (
      <div className="mt-8">
        <Card className="border-dashed bg-muted/40 p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <Package className="h-10 w-10 text-green-500 mb-2" />
            <h3 className="text-2xl font-bold">Stok Produk Terkendali Secara Menyeluruh</h3>
            <p className="text-muted-foreground max-w-[500px]">
              Kabar baik! Tidak ada produk yang kehabisan stok maupun menyentuh batas minimum pemesanan hari ini.
            </p>
          </div>
        </Card>
      </div>
    )
  }

  const renderStockCard = (item: any, type: 'empty' | 'low') => (
    <Card key={item.product_id} className={`border-l-4 ${type === 'empty' ? 'border-l-red-500 bg-red-50/50 dark:bg-red-950/10' : 'border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/10'}`}>
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h4 className="font-semibold">{item.product_name}</h4>
            <Badge variant="outline" className={type === 'empty' ? 'text-red-600 border-red-200 bg-red-100' : 'text-yellow-600 border-yellow-200 bg-yellow-100'}>
              {type === 'empty' ? 'Habis' : 'Menipis'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground font-mono">{item.sku}</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="text-center sm:text-right">
            <p className="text-xs text-muted-foreground">Sisa Stok</p>
            <p className={`text-lg font-bold ${type === 'empty' ? 'text-red-500' : 'text-yellow-600'}`}>
              {item.qty}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Min: {item.min_stock}</p>
          </div>
          <Button variant="outline" size="sm" className="w-full sm:w-auto mt-2 sm:mt-0" onClick={() => window.open(`/purchases/create?product_id=${item.product_id}`, '_blank')}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Buat PO
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  const exportData = [
    ...emptyStock.map((item, idx) => ({ ...item, no: idx + 1, status_label: 'Habis' })),
    ...lowStock.map((item, idx) => ({ ...item, no: emptyStock.length + idx + 1, status_label: 'Menipis' }))
  ]

  const exportColumns = [
    { key: 'no', label: 'No.' },
    { key: 'product_name', label: 'Nama Produk' },
    { key: 'sku', label: 'SKU' },
    { key: 'qty', label: 'Sisa Stok' },
    { key: 'min_stock', label: 'Batas Minimum' },
    { key: 'status_label', label: 'Status Peringatan' },
  ]

  const pdfConfig = {
    title: 'Laporan Peringatan Stok (Alerts)',
    subtitle: `Dicetak Tanggal: ${format(new Date(), 'dd MMMM yyyy')}`,
    company_name: 'Desaprima ERP',
    columns: exportColumns.map(c => ({ header: c.label, dataKey: c.key })),
    summary: [
      { label: 'Total Barang Habis', value: String(emptyStock.length) },
      { label: 'Total Barang Menipis', value: String(lowStock.length) }
    ]
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg border">
        <div>
          <h3 className="text-lg font-medium">Monitoring Penipisan Stok</h3>
          <p className="text-sm text-muted-foreground">Daftar barang yang wajib segera dipesan kembali.</p>
        </div>
        <ExportButton 
          filename="Laporan_Peringatan_Stok"
          data={exportData}
          csvColumns={exportColumns}
          pdfConfig={pdfConfig}
        />
      </div>

      {emptyStock.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-500">
            <AlertCircle className="h-5 w-5" />
            <h3 className="text-lg font-bold tracking-tight">Stok Habis Membutuhkan Tindakan Segera ({emptyStock.length})</h3>
          </div>
          <div className="grid gap-3">
            {emptyStock.map(item => renderStockCard(item, 'empty'))}
          </div>
        </div>
      )}

      {lowStock.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
            <AlertCircle className="h-5 w-5" />
            <h3 className="text-lg font-bold tracking-tight">Stok Menipis ({lowStock.length})</h3>
          </div>
          <div className="grid gap-3">
            {lowStock.map(item => renderStockCard(item, 'low'))}
          </div>
        </div>
      )}
    </div>
  )
}
