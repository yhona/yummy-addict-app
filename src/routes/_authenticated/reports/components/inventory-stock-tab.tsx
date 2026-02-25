import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/reports/shared/DataTable'
import { useInventoryStock, InventoryStockItem } from '@/features/reports/api/reports'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ExportButton } from '@/components/reports/shared/ExportButton'
import { format } from 'date-fns'

export function InventoryStockTab() {
  const { data: response, isLoading } = useInventoryStock()

  const columns: ColumnDef<InventoryStockItem>[] = [
    {
      accessorKey: 'product_name',
      header: 'Produk',
      cell: ({ row }) => <span className="font-medium">{row.original.product_name}</span>,
    },
    {
      accessorKey: 'sku',
      header: 'SKU',
      cell: ({ row }) => <span className="font-mono text-muted-foreground">{row.original.sku}</span>,
    },
    {
      accessorKey: 'category',
      header: 'Kategori',
    },
    {
      accessorKey: 'warehouse',
      header: 'Gudang',
      cell: ({ row }) => row.original.warehouse || <span className="italic text-muted-foreground">Pusat</span>
    },
    {
      accessorKey: 'qty',
      header: 'Kuantitas',
      cell: ({ row }) => (
        <span className={`font-semibold ${row.original.qty <= row.original.min_stock ? 'text-red-600' : ''}`}>
          {row.original.qty} {row.original.unit}
        </span>
      ),
    },
    {
      accessorKey: 'stock_value',
      header: 'Nilai Stok (HPP)',
      cell: ({ row }) => formatCurrency(Number(row.original.stock_value)),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status
        if (s === 'normal') return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Aman</Badge>
        if (s === 'low') return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">Menipis</Badge>
        if (s === 'empty') return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Habis</Badge>
        return <Badge variant="outline" className="capitalize">{s}</Badge>
      },
    }
  ]

  const exportData = (response?.data || []).map((item, idx) => ({
    ...item,
    no: idx + 1,
    status_label: item.status === 'normal' ? 'Aman' : item.status === 'low' ? 'Menipis' : 'Habis'
  }))

  const exportColumns = [
    { key: 'no', label: 'No.' },
    { key: 'product_name', label: 'Nama Produk' },
    { key: 'sku', label: 'SKU' },
    { key: 'category', label: 'Kategori' },
    { key: 'qty', label: 'Stok Saat Ini' },
    { key: 'unit', label: 'Satuan' },
    { key: 'stock_value', label: 'Nilai Stok (HPP)', format: 'currency' as const },
    { key: 'status_label', label: 'Status' },
  ]

  const pdfConfig = {
    title: 'Laporan Ketersediaan Stok',
    subtitle: `Dicetak Tanggal: ${format(new Date(), 'dd MMMM yyyy')}`,
    company_name: 'Yummy Addict',
    columns: exportColumns.map(c => ({ header: c.label, dataKey: c.key })),
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg border">
        <div>
          <h3 className="text-lg font-medium">Data Ketersediaan Stok Saat Ini</h3>
          <p className="text-sm text-muted-foreground">Monitoring level kuantitas barang fisik.</p>
        </div>
        <ExportButton 
          filename="Laporan_Stok_Barang"
          data={exportData}
          csvColumns={exportColumns}
          pdfConfig={pdfConfig}
        />
      </div>

      <DataTable
        columns={columns}
        data={response?.data || []}
        isLoading={isLoading}
      />
    </div>
  )
}
