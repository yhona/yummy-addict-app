import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { format } from 'date-fns'
import { ArrowDownLeft, ArrowUpRight, RefreshCw, Filter, Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { PageHeaderHeading, PageHeaderTitle, PageHeaderDescription } from '@/components/layout/page'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { useMovements, useMovementStats, useWarehouses, StockMovement } from '@/features/inventory/api'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/inventory/movements')({
  component: StockMovementsPage,
})

function StockMovementsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [warehouseFilter, setWarehouseFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState<Date | undefined>()
  const [dateTo, setDateTo] = useState<Date | undefined>()
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [selectedMovement, setSelectedMovement] = useState<StockMovement | null>(null)

  // Fetch data from API
  const { data: warehousesData } = useWarehouses()
  const { data: movementsData, isLoading: isLoadingMovements } = useMovements({
    type: typeFilter !== 'all' ? typeFilter : undefined,
    warehouseId: warehouseFilter !== 'all' ? warehouseFilter : undefined,
    search: searchTerm || undefined,
    dateFrom: dateFrom ? dateFrom.toISOString() : undefined,
    dateTo: dateTo ? dateTo.toISOString() : undefined,
    page,
    limit,
  })
  const { data: stats, isLoading: isLoadingStats } = useMovementStats({ period: 'month' })

  const warehouses = warehousesData || []
  const movements = movementsData?.data || []
  const pagination = movementsData?.pagination
  const isLoading = isLoadingMovements || isLoadingStats

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateString))
  }

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'in':
        return <ArrowDownLeft className="h-4 w-4 text-green-500" />
      case 'out':
        return <ArrowUpRight className="h-4 w-4 text-red-500" />
      default:
        return <RefreshCw className="h-4 w-4 text-blue-500" />
    }
  }

  const getMovementTypeBadge = (type: string) => {
    switch (type) {
      case 'in':
        return (
          <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">
            Stock In
          </Badge>
        )
      case 'out':
        return (
          <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">
            Stock Out
          </Badge>
        )
      default:
        return (
          <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">
            Adjustment
          </Badge>
        )
    }
  }

  const getReferenceTypeBadge = (type: string) => {
    const variants: Record<string, string> = {
      purchase: 'bg-purple-500/10 text-purple-500',
      sale: 'bg-orange-500/10 text-orange-500',
      adjustment: 'bg-blue-500/10 text-blue-500',
      transfer: 'bg-cyan-500/10 text-cyan-500',
      return: 'bg-yellow-500/10 text-yellow-500',
    }
    return (
      <Badge variant="outline" className={variants[type] || 'bg-gray-500/10 text-gray-500'}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    )
  }

  const clearFilters = () => {
    setSearchTerm('')
    setTypeFilter('all')
    setWarehouseFilter('all')
    setDateFrom(undefined)
    setDateTo(undefined)
    setPage(1)
  }

  const hasActiveFilters = searchTerm || typeFilter !== 'all' || warehouseFilter !== 'all' || dateFrom || dateTo

  return (
    <>
      <Header fixed>
        <h1 className="text-lg font-semibold">Stock Movements</h1>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <PageHeaderHeading className="mb-4">
          <PageHeaderTitle>Stock Movement History</PageHeaderTitle>
          <PageHeaderDescription>
            Track all stock in, out, and adjustment transactions
          </PageHeaderDescription>
        </PageHeaderHeading>

        {isLoading ? (
          <div className="flex h-[400px] items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="mb-6 grid gap-4 md:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Stock In</CardTitle>
                  <ArrowDownLeft className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">+{stats?.totalIn || 0}</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Stock Out</CardTitle>
                  <ArrowUpRight className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">-{stats?.totalOut || 0}</div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Net Change</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={cn(
                    "text-2xl font-bold",
                    (stats?.netChange || 0) > 0 && "text-green-500",
                    (stats?.netChange || 0) < 0 && "text-red-500"
                  )}>
                    {(stats?.netChange || 0) > 0 && '+'}{stats?.netChange || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">This month</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Adjustments</CardTitle>
                  <RefreshCw className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats?.totalAdjustments || 0}</div>
                  <p className="text-xs text-muted-foreground">Manual corrections</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="mb-4 flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[200px]">
                <Input
                  placeholder="Search by product, SKU, or reference..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1) }}
                />
              </div>
              <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
                <SelectTrigger className="w-[140px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="in">Stock In</SelectItem>
                  <SelectItem value="out">Stock Out</SelectItem>
                  <SelectItem value="adjustment">Adjustment</SelectItem>
                </SelectContent>
              </Select>
              <Select value={warehouseFilter} onValueChange={(v) => { setWarehouseFilter(v); setPage(1) }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Warehouse" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Warehouses</SelectItem>
                  {warehouses.map((w) => (
                    <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Date From */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal", !dateFrom && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, 'dd/MM/yy') : 'From'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={(d) => { setDateFrom(d); setPage(1) }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {/* Date To */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[140px] justify-start text-left font-normal", !dateTo && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, 'dd/MM/yy') : 'To'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={(d) => { setDateTo(d); setPage(1) }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>

              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="mr-1 h-4 w-4" />
                  Clear
                </Button>
              )}
            </div>

            {/* Movements Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]"></TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Warehouse</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                    <TableHead className="text-right">Before → After</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movements.length > 0 ? (
                    movements.map((movement) => (
                      <TableRow 
                        key={movement.id} 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setSelectedMovement(movement)}
                      >
                        <TableCell>
                          {getMovementIcon(movement.movementType)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{movement.product?.sku}</span>
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {movement.product?.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {movement.warehouse?.name || '-'}
                        </TableCell>
                        <TableCell>
                          {getMovementTypeBadge(movement.movementType)}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            {getReferenceTypeBadge(movement.referenceType)}
                            {movement.referenceNumber && (
                              <span className="text-xs font-mono text-muted-foreground">
                                {movement.referenceNumber}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={cn(
                              'font-semibold',
                              movement.quantityChange > 0 && 'text-green-500',
                              movement.quantityChange < 0 && 'text-red-500'
                            )}
                          >
                            {movement.quantityChange > 0 && '+'}
                            {movement.quantityChange}
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-sm">
                          <span className="text-muted-foreground">
                            {movement.quantityBefore}
                          </span>
                          <span className="mx-1">→</span>
                          <span className="font-medium">{movement.quantityAfter}</span>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {formatDate(movement.createdAt)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={8} className="h-24 text-center">
                        No movements found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>Rows per page:</span>
                  <Select value={limit.toString()} onValueChange={(v) => { setLimit(Number(v)); setPage(1) }}>
                    <SelectTrigger className="w-[70px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                  <span className="ml-4">
                    Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                    disabled={page >= pagination.totalPages}
                  >
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </Main>

      {/* Movement Detail Dialog */}
      <Dialog open={!!selectedMovement} onOpenChange={(open) => !open && setSelectedMovement(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedMovement && getMovementIcon(selectedMovement.movementType)}
              Movement Detail
            </DialogTitle>
            <DialogDescription>
              {selectedMovement?.referenceNumber}
            </DialogDescription>
          </DialogHeader>
          {selectedMovement && (
            <div className="space-y-4">
              {/* Product Info */}
              <div className="rounded-lg bg-muted p-4">
                <p className="text-sm text-muted-foreground">Product</p>
                <p className="font-semibold">{selectedMovement.product?.name}</p>
                <p className="text-sm text-muted-foreground">{selectedMovement.product?.sku}</p>
              </div>

              <Separator />

              {/* Movement Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  {getMovementTypeBadge(selectedMovement.movementType)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Reference</p>
                  {getReferenceTypeBadge(selectedMovement.referenceType)}
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Warehouse</p>
                  <p className="font-medium">{selectedMovement.warehouse?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium">{formatDate(selectedMovement.createdAt)}</p>
                </div>
              </div>

              <Separator />

              {/* Quantity Change */}
              <div className="rounded-lg border p-4 text-center">
                <div className="flex items-center justify-center gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Before</p>
                    <p className="text-2xl font-bold">{selectedMovement.quantityBefore}</p>
                  </div>
                  <div className={cn(
                    "text-3xl font-bold px-4",
                    selectedMovement.quantityChange > 0 && "text-green-500",
                    selectedMovement.quantityChange < 0 && "text-red-500"
                  )}>
                    {selectedMovement.quantityChange > 0 && '+'}
                    {selectedMovement.quantityChange}
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">After</p>
                    <p className="text-2xl font-bold">{selectedMovement.quantityAfter}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedMovement.notes && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Notes</p>
                    <p className="text-sm bg-muted rounded-md p-3">{selectedMovement.notes}</p>
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
