import { ColumnDef } from '@tanstack/react-table'
import { OpnameSession } from '../../types'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { DataTableRowActions } from './data-table-row-actions'

export const columns: ColumnDef<OpnameSession>[] = [
  {
    accessorKey: 'number',
    header: 'Nomor Dokumen',
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue('number')}</div>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: 'Tanggal Dibuat',
    cell: ({ row }) => {
      const date = new Date(row.getValue('createdAt'))
      return (
        <div className="text-muted-foreground">
          {format(date, 'dd MMM yyyy, HH:mm', { locale: id })}
        </div>
      )
    },
  },
  {
    accessorKey: 'warehouseName',
    header: 'Gudang',
  },
  {
    accessorKey: 'progress',
    header: 'Progres Hitung',
    cell: ({ row }) => {
      const counted = row.original.countedItems
      const total = row.original.totalItems
      const percentage = total > 0 ? Math.round((counted / total) * 100) : 0
      
      return (
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between text-xs">
            <span>{counted} / {total} item</span>
            <span className="font-medium">{percentage}%</span>
          </div>
          <div className="h-1.5 w-full bg-secondary overflow-hidden rounded-full">
            <div 
              className={`h-full ${percentage === 100 ? 'bg-primary' : 'bg-primary/60'}`} 
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'itemsWithDifference',
    header: 'Selisih',
    cell: ({ row }) => {
      const withDiff = row.getValue('itemsWithDifference') as number
      if (withDiff === 0) return <span className="text-muted-foreground">-</span>
      return (
        <Badge variant="destructive" className="font-semibold">
          {withDiff} Item Selisih
        </Badge>
      )
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      switch (status) {
        case 'finalized':
          return <Badge variant="default" className="bg-emerald-500 hover:bg-emerald-600">Selesai</Badge>
        case 'counting':
          return <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border-amber-500/20">Proses Hitung</Badge>
        case 'draft':
        default:
          return <Badge variant="outline" className="text-muted-foreground">Draft</Badge>
      }
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
