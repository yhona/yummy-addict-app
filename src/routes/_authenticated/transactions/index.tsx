import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { 
  useTransactions, 
  useTransactionsSummary, 
  useCashiers, 
  useVoidTransaction,
  TransactionsParams 
} from '@/features/pos/api/transactions'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Page, PageHeader, PageHeaderHeading, PageHeaderTitle, PageHeaderDescription, PageBody } from '@/components/layout/page'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
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
import { Calendar } from '@/components/ui/calendar'
import { 
  Eye, 
  Loader2, 
  Search, 
  Calendar as CalendarIcon, 
  X, 
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Package,
  ChevronLeft,
  ChevronRight,
  Ban
} from 'lucide-react'
import { ReceiptDialog } from '@/features/pos/components/receipt-dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

export const Route = createFileRoute('/_authenticated/transactions/')({
  component: TransactionsPage,
})

function TransactionsPage() {
  // Filters state
  const [page, setPage] = useState(1)
  const [dateFrom, setDateFrom] = useState<Date | undefined>()
  const [dateTo, setDateTo] = useState<Date | undefined>()
  const [status, setStatus] = useState<string>('')
  const [cashierId, setCashierId] = useState<string>('')
  const [search, setSearch] = useState('')
  
  // Dialog states
  const [selectedTx, setSelectedTx] = useState<any>(null)
  const [voidingTx, setVoidingTx] = useState<any>(null)
  
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
  const voidTransaction = useVoidTransaction()
  
  const handleVoid = async () => {
    if (!voidingTx) return
    try {
      await voidTransaction.mutateAsync(voidingTx.id)
      toast.success(`Transaction ${voidingTx.number} has been voided`)
      setVoidingTx(null)
    } catch (error) {
      toast.error((error as Error).message || 'Failed to void transaction')
    }
  }
  
  const clearFilters = () => {
    setDateFrom(undefined)
    setDateTo(undefined)
    setStatus('')
    setCashierId('')
    setSearch('')
    setPage(1)
  }
  
  const hasActiveFilters = dateFrom || dateTo || status || cashierId || search
  
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return `${date.toLocaleDateString('id-ID')} ${date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`
  }

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
        
        {/* Table */}
        <div className="rounded-md border bg-card">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="p-4 text-left font-medium">Number</th>
                <th className="p-4 text-left font-medium">Date</th>
                <th className="p-4 text-left font-medium">Customer</th>
                <th className="p-4 text-left font-medium">Cashier</th>
                <th className="p-4 text-left font-medium">Method</th>
                <th className="p-4 text-left font-medium">Status</th>
                <th className="p-4 text-right font-medium">Total</th>
                <th className="p-4 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <div className="flex justify-center">
                      <Loader2 className="animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : (data?.data || []).length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-muted-foreground">
                    No transactions found
                  </td>
                </tr>
              ) : (
                (data?.data || []).map((tx: any) => (
                  <tr key={tx.id} className="border-b hover:bg-muted/50 transition-colors">
                    <td className="p-4 font-mono font-medium">{tx.number}</td>
                    <td className="p-4 text-muted-foreground">{formatDateTime(tx.date)}</td>
                    <td className="p-4">{tx.customer?.name || '-'}</td>
                    <td className="p-4">{tx.cashier?.name || '-'}</td>
                    <td className="p-4">
                      <Badge variant="outline" className="capitalize">{tx.paymentMethod}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge variant={tx.status === 'completed' ? 'default' : 'destructive'}>
                        {tx.status === 'completed' ? 'Completed' : 'Cancelled'}
                      </Badge>
                    </td>
                    <td className="p-4 text-right font-medium">{formatCurrency(tx.finalAmount)}</td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => setSelectedTx(tx)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {tx.status === 'completed' && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-destructive hover:text-destructive"
                            onClick={() => setVoidingTx(tx)}
                          >
                            <Ban className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {data?.pagination && data.pagination.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between">
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

      {/* Receipt Dialog */}
      <ReceiptDialog 
        open={!!selectedTx} 
        onOpenChange={(v: boolean) => !v && setSelectedTx(null)} 
        transaction={selectedTx} 
      />
      
      {/* Void Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={!!voidingTx}
        onOpenChange={(open) => !open && setVoidingTx(null)}
        title="Void Transaction"
        itemName={voidingTx?.number}
        description="This will cancel the transaction and restore stock to the warehouse. This action cannot be undone."
        onConfirm={handleVoid}
        isLoading={voidTransaction.isPending}
      />
    </Page>
  )
}
