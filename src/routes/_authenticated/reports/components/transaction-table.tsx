import { useState } from 'react'
import { format } from 'date-fns'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/reports/shared/DataTable'
import { useTransactionsReport, TransactionReportItem } from '@/features/reports/api/reports'
import { formatCurrency } from '@/lib/utils'
import { TransactionDrawer } from './transaction-drawer'
import { Badge } from '@/components/ui/badge'

interface TransactionTableProps {
  startDate?: string
  endDate?: string
  cashierId?: string
  paymentMethod?: string
}

export function TransactionTable({ startDate, endDate, cashierId, paymentMethod }: TransactionTableProps) {
  const [page, setPage] = useState(1)
  const [selectedTx, setSelectedTx] = useState<TransactionReportItem | null>(null)
  
  const { data: response, isLoading } = useTransactionsReport({
    startDate,
    endDate,
    cashierId,
    paymentMethod,
    page,
    per_page: 20
  })

  // Table Columns Setup
  const columns: ColumnDef<TransactionReportItem>[] = [
    {
      accessorKey: 'date',
      header: 'Tanggal',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {format(new Date(row.original.date), 'dd MMM yyyy, HH:mm')}
        </span>
      ),
    },
    {
      accessorKey: 'invoice_number',
      header: 'No. Invoice',
      cell: ({ row }) => <span className="font-mono font-medium">{row.original.invoice_number}</span>,
    },
    {
      accessorKey: 'customer_name',
      header: 'Pelanggan',
    },
    {
      accessorKey: 'cashier_name',
      header: 'Kasir',
    },
    {
      accessorKey: 'gross_total',
      header: 'Total',
      cell: ({ row }) => formatCurrency(Number(row.original.gross_total)),
    },
    {
      accessorKey: 'discount',
      header: 'Diskon',
      cell: ({ row }) => {
        const disc = Number(row.original.discount)
        return disc > 0 ? <span className="text-red-500">-{formatCurrency(disc)}</span> : '-'
      },
    },
    {
      accessorKey: 'net_total',
      header: 'Bayar',
      cell: ({ row }) => <span className="font-bold">{formatCurrency(Number(row.original.net_total))}</span>,
    },
    {
      accessorKey: 'payment_method',
      header: 'Metode',
      cell: ({ row }) => <Badge variant="secondary" className="capitalize">{row.original.payment_method}</Badge>,
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status.toUpperCase()
        if (s === 'SUCCESS' || s === 'COMPLETED') return <Badge className="bg-green-100 text-green-700 hover:bg-green-100">SUCCESS</Badge>
        if (s === 'VOID' || s === 'CANCELLED') return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">VOID</Badge>
        return <Badge className="bg-orange-100 text-orange-700 hover:bg-orange-100">{s}</Badge>
      },
    }
  ]

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold tracking-tight">Riwayat Transaksi</h3>
      <DataTable
        columns={columns}
        data={response?.data || []}
        isLoading={isLoading}
        onRowClick={(row) => setSelectedTx(row)}
        pagination={response?.meta ? {
          page: response.meta.current_page,
          total: response.meta.total,
          perPage: response.meta.per_page,
          onPageChange: (newPage) => setPage(newPage)
        } : undefined}
      />
      
      {/* Sliding Drawer for Transaction Details */}
      <TransactionDrawer 
        transaction={selectedTx} 
        open={!!selectedTx} 
        onClose={() => setSelectedTx(null)} 
      />
    </div>
  )
}
