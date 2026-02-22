import { ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { Return } from '../../api/returns'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export const columns: ColumnDef<Return>[] = [
  {
    accessorKey: 'number',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Return #" />
    ),
    cell: ({ row }) => <div className="font-mono text-xs">{row.getValue('number')}</div>,
    enableSorting: true,
  },
  {
    accessorKey: 'date',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => {
      return (
        <span className="truncate">
          {format(new Date(row.getValue('date')), 'dd MMM yyyy HH:mm')}
        </span>
      )
    },
  },
  {
    accessorKey: 'transaction.number',
    id: 'transactionNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Original TRX" />
    ),
    cell: ({ row }) => <div className="font-mono text-xs">{row.original.transaction?.number || '-'}</div>,
  },
  {
    accessorKey: 'reason',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Reason" />
    ),
    cell: ({ row }) => <div>{row.getValue('reason') || '-'}</div>,
  },
  {
    accessorKey: 'totalAmount',
    header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Amount" className="justify-end" />
    ),
    cell: ({ row }) => {
        const amount = parseFloat(row.getValue('totalAmount'))
        return <div className="text-right font-bold text-destructive tabular-nums">-{formatCurrency(amount)}</div>
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return (
        <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
          {status}
        </Badge>
      )
    },
  },
]
