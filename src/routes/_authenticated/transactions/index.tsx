import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { 
  useTransactions, 
  useTransactionsSummary, 
  useCashiers, 
  TransactionsParams 
} from '@/features/pos/api/transactions'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Page, PageHeader, PageHeaderHeading, PageHeaderTitle, PageHeaderDescription, PageBody } from '@/components/layout/page'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { Calendar } from '@/components/ui/calendar'
import { 
  Search, 
  Calendar as CalendarIcon, 
  X, 
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Package,
  ChevronLeft,
  ChevronRight,
  Truck
} from 'lucide-react'
import { TransactionDetailSheet } from '@/features/pos/components/transaction-detail-sheet'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'
import { Transaction } from '@/lib/api-types'

// Setup Columns for TanStack Table
const columns: ColumnDef<Transaction>[] = [
  {
    accessorKey: 'number',
    header: 'No. Transaksi',
    cell: ({ row }) => <div className="font-mono font-medium text-primary whitespace-nowrap">{row.original.number}</div>,
  },
  {
    accessorKey: 'date',
    header: 'Tanggal',
    cell: ({ row }) => (
      <div className="text-muted-foreground whitespace-nowrap">
        {format(new Date(row.original.date), 'dd/MM/yyyy HH:mm')}
      </div>
    ),
  },
  {
    id: 'customer',
    header: 'Pelanggan',
    cell: ({ row }) => <div>{row.original.customer?.name || 'Umum'}</div>,
  },
  {
    id: 'cashier',
    header: 'Kasir',
    cell: ({ row }) => <div>{row.original.cashier?.name || '-'}</div>,
  },
  {
    accessorKey: 'paymentMethod',
    header: 'Metode',
    cell: ({ row }) => <Badge variant="outline" className="capitalize whitespace-nowrap">{row.original.paymentMethod}</Badge>,
  },
  {
    accessorKey: 'deliveryMethod',
    header: 'Tipe',
    cell: ({ row }) => {
      const isDelivery = row.original.deliveryMethod === 'delivery'
      return isDelivery ? (
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-400 dark:border-orange-800 whitespace-nowrap">
          <Truck className="h-3 w-3 mr-1" /> Kirim
        </Badge>
      ) : (
        <Badge variant="outline" className="text-muted-foreground whitespace-nowrap">Pickup</Badge>
      )
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status
      return (
        <Badge 
          className={cn(
            'whitespace-nowrap',
            status === 'completed' 
              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' 
              : status === 'unpaid'
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
              : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400'
          )}
          variant="outline"
        >
          {status === 'completed' ? 'Selesai' : status === 'unpaid' ? 'Belum Lunas' : 'Batal'}
        </Badge>
      )
    }
  },
  {
    accessorKey: 'finalAmount',
    header: () => <div className="text-right">Total</div>,
    cell: ({ row }) => {
      const tx = row.original as any // type casting for fallback properties
      return (
        <div className="text-right font-semibold tabular-nums">
          <TooltipProvider delayDuration={300}>
            <Tooltip>
              <TooltipTrigger className="cursor-help decoration-muted-foreground/50 underline-offset-4 hover:underline">
                {formatCurrency(tx.finalAmount)}
              </TooltipTrigger>
              <TooltipContent side="left" className="w-48 p-3 font-normal text-foreground bg-popover border shadow-md">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal:</span>
                    <span>{formatCurrency(tx.totalAmount || tx.gross_total || 0)}</span>
                  </div>
                  {(tx.discountAmount > 0 || tx.discount > 0) && (
                    <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                      <span>Diskon:</span>
                      <span>-{formatCurrency(tx.discountAmount || tx.discount)}</span>
                    </div>
                  )}
                  {(tx.shippingCost > 0 || tx.shipping_cost > 0) && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Ongkir:</span>
                      <span>+{formatCurrency(tx.shippingCost || tx.shipping_cost)}</span>
                    </div>
                  )}
                  <div className="pt-1.5 mt-1.5 border-t flex justify-between font-semibold">
                    <span>Total:</span>
                    <span>{formatCurrency(tx.finalAmount || tx.net_total || 0)}</span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )
    }
  }
]

export const Route = createFileRoute('/_authenticated/transactions/')({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      search: (search.search as string) || '',
    }
  },
  component: TransactionsPage,
})

function TransactionsPage() {
  const searchParams = Route.useSearch()
  
  // Filters state
  const [page, setPage] = useState(1)
  const [dateFrom, setDateFrom] = useState<Date | undefined>()
  const [dateTo, setDateTo] = useState<Date | undefined>()
  const [status, setStatus] = useState<string>('')
  const [cashierId, setCashierId] = useState<string>('')
  const [search, setSearch] = useState(searchParams.search)
  
  // Dialog states
  const [selectedTx, setSelectedTx] = useState<any>(null)
  
  // Custom columns that need component state
  const tableColumns = useMemo(() => {
    return [
      ...columns,
      {
        id: 'actions',
        header: '',
        cell: ({ row }: { row: any }) => (
          <div className="text-right">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTx(row.original)}
            >
              Detail
            </Button>
          </div>
        )
      }
    ]
  }, [setSelectedTx])
  
  // Build params
  const params = useMemo<TransactionsParams>(() => ({
    page,
    limit: 20,
    dateFrom: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined,
    dateTo: dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined,
    status: status && status !== 'all' ? status : undefined,
    cashierId: cashierId && cashierId !== 'all' ? cashierId : undefined,
    search: search || undefined,
  }), [page, dateFrom, dateTo, status, cashierId, search])
  
  const summaryParams = useMemo(() => ({
    dateFrom: dateFrom ? format(dateFrom, 'yyyy-MM-dd') : undefined,
    dateTo: dateTo ? format(dateTo, 'yyyy-MM-dd') : undefined,
  }), [dateFrom, dateTo])
  
  // Queries
  const { data, isLoading } = useTransactions(params)
  const { data: summary } = useTransactionsSummary(summaryParams)
  const { data: cashiers } = useCashiers()
  
  const clearFilters = () => {
    setDateFrom(undefined)
    setDateTo(undefined)
    setStatus('')
    setCashierId('')
    setSearch('')
    setPage(1)
  }
  
  const hasActiveFilters = dateFrom || dateTo || status || cashierId || search
  
  return (
    <Page>
      <PageHeader fixed>
        <PageHeaderHeading>
          <PageHeaderTitle>Transactions</PageHeaderTitle>
          <PageHeaderDescription>View and manage sales transactions</PageHeaderDescription>
        </PageHeaderHeading>
      </PageHeader>

      <PageBody>
        
        {/* Summary Cards */}
        <div className="mb-6 grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Transactions</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary?.totalTransactions || 0}</div>
              <p className="text-xs text-muted-foreground">
                {hasActiveFilters ? 'filtered results' : 'all time'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary?.totalSales || 0)}</div>
              <p className="text-xs text-muted-foreground">
                {hasActiveFilters ? 'filtered results' : 'all time'}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summary?.avgTransaction || 0)}</div>
              <p className="text-xs text-muted-foreground">per transaction</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Items Sold</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(summary?.totalItems || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">total units</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative min-w-[200px] flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by TRX number..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-9"
            />
          </div>
          
          {/* Date From */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-[140px] justify-start text-left font-normal', !dateFrom && 'text-muted-foreground')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateFrom ? format(dateFrom, 'dd/MM/yyyy') : 'From'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={(d) => { setDateFrom(d); setPage(1) }} initialFocus />
            </PopoverContent>
          </Popover>
          
          {/* Date To */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('w-[140px] justify-start text-left font-normal', !dateTo && 'text-muted-foreground')}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateTo ? format(dateTo, 'dd/MM/yyyy') : 'To'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateTo} onSelect={(d) => { setDateTo(d); setPage(1) }} initialFocus />
            </PopoverContent>
          </Popover>
          
          {/* Status */}
          <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Cashier */}
          <Select value={cashierId} onValueChange={(v) => { setCashierId(v); setPage(1) }}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Cashier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cashiers</SelectItem>
              {(cashiers || []).map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button variant="ghost" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
        
        {/* Data Table */}
        <div className="rounded-md border bg-card">
          <DataTable
            columns={tableColumns}
            data={data?.data || []}
            isLoading={isLoading}
            pagination={false} // Disable internal pagination
          />
        </div>
        
        {/* Pagination (Server-side) */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between px-2">
            <p className="text-sm text-muted-foreground">
              Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= data.pagination.totalPages}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </PageBody>

      {/* Transaction Detail Sheet */}
      <TransactionDetailSheet
        transaction={selectedTx}
        open={!!selectedTx}
        onClose={() => setSelectedTx(null)}
      />
    </Page>
  )
}
