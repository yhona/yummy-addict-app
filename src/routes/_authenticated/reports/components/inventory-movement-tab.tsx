import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/reports/shared/DataTable'
import { useInventoryMovement, InventoryMovementItem } from '@/features/reports/api/reports'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'

export function InventoryMovementTab() {
  const { data: response, isLoading } = useInventoryMovement()

  const columns: ColumnDef<InventoryMovementItem>[] = [
    {
      accessorKey: 'date',
      header: 'Tanggal',
      cell: ({ row }) => (
        <span className="text-muted-foreground whitespace-nowrap">
          {format(new Date(row.original.date), 'dd MMM yyyy, HH:mm')}
        </span>
      ),
    },
    {
      accessorKey: 'product_name',
      header: 'Produk',
      cell: ({ row }) => <span className="font-medium">{row.original.product_name}</span>,
    },
    {
      accessorKey: 'type',
      header: 'Tipe',
      cell: ({ row }) => {
        const t = row.original.type
        if (t === 'IN' || t === 'PURCHASE') return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Masuk</Badge>
        if (t === 'OUT' || t === 'SALE') return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Keluar</Badge>
        if (t === 'ADJUSTMENT') return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Penyesuaian</Badge>
        return <Badge variant="outline" className="capitalize">{t}</Badge>
      },
    },
    {
      accessorKey: 'qty',
      header: 'Kuantitas',
      cell: ({ row }) => {
        const t = row.original.type
        const isOut = t === 'OUT' || t === 'SALE'
        return (
          <span className={`font-semibold ${isOut ? 'text-red-500' : 'text-green-600'}`}>
            {isOut ? '-' : '+'}{row.original.qty}
          </span>
        )
      },
    },
    {
      accessorKey: 'reference',
      header: 'Referensi',
      cell: ({ row }) => <span className="font-mono text-xs">{row.original.reference || '-'}</span>,
    },
    {
      accessorKey: 'note',
      header: 'Keterangan',
      cell: ({ row }) => <span className="text-muted-foreground">{row.original.note || '-'}</span>,
    },
  ]

  return (
    <div className="space-y-4">
      <DataTable
        columns={columns}
        data={response?.data || []}
        isLoading={isLoading}
      />
    </div>
  )
}
