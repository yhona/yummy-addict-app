import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Minus, Equal, Package, Trash2, TrendingUp, TrendingDown, BarChart3, Search, Loader2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  stockAdjustmentSchema, StockAdjustmentFormValues, adjustmentReasons,
} from '@/features/inventory/schema/stock-adjustment-schema'
import {
  useProducts, useWarehouses, useAdjustStock, useStockAdjustments,
  useAdjustStockBatch, useMovementStats, useWarehouseStock,
} from '@/features/inventory/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/inventory/stock')({
  component: StockAdjustmentPage,
})

function StockAdjustmentPage() {
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('')
  const [isBatchMode, setIsBatchMode] = useState(false)
  const [pendingAdjustments, setPendingAdjustments] = useState<any[]>([])

  // History filters
  const [historyPage, setHistoryPage] = useState(1)
  const [historySearch, setHistorySearch] = useState('')
  const [historyTypeFilter, setHistoryTypeFilter] = useState('all')
  const historyLimit = 10

  // Fetch data
  const { data: productsData, isLoading: isLoadingProducts } = useProducts({ limit: 200 })
  const { data: warehousesData, isLoading: isLoadingWarehouses } = useWarehouses()
  const { data: adjustmentsData, isLoading: isLoadingAdjustments } = useStockAdjustments({
    limit: historyLimit,
    ...(historySearch && { productId: historySearch }),
  })
  const { data: stats } = useMovementStats({ period: 'month' })

  // Mutations
  const adjustStock = useAdjustStock()
  const adjustStockBatch = useAdjustStockBatch()

  const products = productsData?.data || []
  const warehouses = (warehousesData || []).filter((w: any) => w.isActive)
  const adjustments = adjustmentsData || []

  // Auto-select default warehouse
  const defaultWarehouse = warehouses.find((w: any) => w.isDefault) || warehouses[0]
  const activeWarehouseId = selectedWarehouseId || defaultWarehouse?.id || ''

  // Product stock in selected warehouse
  const { data: warehouseStockData } = useWarehouseStock(activeWarehouseId)
  const selectedProduct = products.find((p) => p.id === selectedProductId)

  // Get stock for the selected product in the selected warehouse
  const productStockInWarehouse = useMemo(() => {
    if (!warehouseStockData || !selectedProductId) return 0
    const record = warehouseStockData.find((s: any) => s.productId === selectedProductId)
    return record?.quantity ?? 0
  }, [warehouseStockData, selectedProductId])

  const isLoading = isLoadingProducts || isLoadingWarehouses

  const form = useForm<StockAdjustmentFormValues>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      productId: '',
      adjustmentType: 'add',
      quantity: 0,
      reason: '',
      notes: '',
    },
  })

  const watchType = form.watch('adjustmentType')
  const watchQty = form.watch('quantity')

  // Preview calculation
  const preview = useMemo(() => {
    if (!selectedProduct || !watchQty || watchQty <= 0) return null
    const currentStock = productStockInWarehouse
    let newStock: number
    let change: number

    switch (watchType) {
      case 'add':
        newStock = currentStock + watchQty
        change = watchQty
        break
      case 'subtract':
        newStock = currentStock - watchQty
        change = -watchQty
        break
      case 'set':
        newStock = watchQty
        change = watchQty - currentStock
        break
      default:
        return null
    }

    return { currentStock, newStock, change }
  }, [selectedProduct, watchType, watchQty, productStockInWarehouse])

  // History filtering
  const filteredAdjustments = useMemo(() => {
    let result = adjustments
    if (historySearch) {
      const term = historySearch.toLowerCase()
      result = result.filter((a: any) =>
        a.product?.sku?.toLowerCase().includes(term) ||
        a.product?.name?.toLowerCase().includes(term))
    }
    if (historyTypeFilter !== 'all') {
      result = result.filter((a: any) => {
        if (historyTypeFilter === 'add') return a.quantityChange > 0
        if (historyTypeFilter === 'subtract') return a.quantityChange < 0
        if (historyTypeFilter === 'set') return a.quantityChange === 0
        return true
      })
    }
    return result
  }, [adjustments, historySearch, historyTypeFilter])

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId)
    form.setValue('productId', productId)
  }

  const handleSubmit = async (data: StockAdjustmentFormValues) => {
    if (!selectedProduct || !activeWarehouseId) return

    if (isBatchMode) {
      const adjustment = {
        productId: data.productId,
        productName: selectedProduct.name,
        productSku: selectedProduct.sku,
        warehouseId: activeWarehouseId,
        adjustmentType: data.adjustmentType,
        quantity: data.quantity,
        reason: data.reason,
        notes: data.notes,
      }
      setPendingAdjustments([...pendingAdjustments, adjustment])
      toast.success('Ditambahkan ke daftar batch')
      form.reset({ productId: data.productId, adjustmentType: 'add', quantity: 0, reason: '', notes: '' })
      return
    }

    try {
      await adjustStock.mutateAsync({
        productId: data.productId,
        warehouseId: activeWarehouseId,
        adjustmentType: data.adjustmentType,
        quantity: data.quantity,
        reason: data.reason,
        notes: data.notes,
      })
      toast.success('Penyesuaian stok berhasil disimpan!')
      form.reset({ productId: data.productId, adjustmentType: 'add', quantity: 0, reason: '', notes: '' })
    } catch (error) {
      toast.error((error as Error).message || 'Gagal menyimpan penyesuaian')
    }
  }

  const handleBatchSubmit = async () => {
    if (pendingAdjustments.length === 0) return
    try {
      const payload = pendingAdjustments.map(({ productName, productSku, ...rest }: any) => rest)
      await adjustStockBatch.mutateAsync(payload)
      toast.success(`${pendingAdjustments.length} penyesuaian berhasil diproses`)
      setPendingAdjustments([])
      setIsBatchMode(false)
    } catch {
      toast.error('Gagal memproses penyesuaian batch')
    }
  }

  const removePendingAdjustment = (index: number) => {
    const newList = [...pendingAdjustments]
    newList.splice(index, 1)
    setPendingAdjustments(newList)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('id-ID', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(dateString))
  }

  return (
    <>
      <Header fixed>
        <h1 className="text-lg font-semibold">Penyesuaian Stok</h1>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Penyesuaian Stok</h2>
              <p className="text-muted-foreground">Koreksi manual jumlah stok produk di gudang</p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="batch-mode" checked={isBatchMode} onCheckedChange={setIsBatchMode} />
              <Label htmlFor="batch-mode">Batch Mode</Label>
            </div>
          </div>
        </div>

        {/* ── Summary Stats Cards ─────────────────── */}
        <div className="grid gap-4 md:grid-cols-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Adjustment</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.movementCount ?? 0}</div>
              <p className="text-xs text-muted-foreground">bulan ini</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Ditambah</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">+{stats?.totalIn ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Dikurangi</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">-{stats?.totalOut ?? 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Perubahan Bersih</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={cn("text-2xl font-bold",
                (stats?.netChange ?? 0) > 0 && "text-green-500",
                (stats?.netChange ?? 0) < 0 && "text-red-500",
              )}>
                {(stats?.netChange ?? 0) > 0 ? '+' : ''}{stats?.netChange ?? 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {isLoading ? (
          <div className="flex h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* ── Adjustment Form ───────────────────── */}
            <Card>
              <CardHeader>
                <CardTitle>{isBatchMode ? 'Tambah ke Batch' : 'Adjustment Baru'}</CardTitle>
                <CardDescription>
                  {isBatchMode ? 'Antri item untuk adjustment sekaligus' : 'Pilih produk, gudang, dan tipe penyesuaian'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    {/* Warehouse Select (NEW) */}
                    <div className="space-y-2">
                      <Label>Gudang</Label>
                      <Select value={activeWarehouseId} onValueChange={setSelectedWarehouseId}>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih gudang" />
                        </SelectTrigger>
                        <SelectContent>
                          {warehouses.map((wh: any) => (
                            <SelectItem key={wh.id} value={wh.id}>
                              {wh.name} ({wh.code})
                              {wh.isDefault && ' ★'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <FormField
                      control={form.control}
                      name="productId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Produk *</FormLabel>
                          <Select
                            onValueChange={(value) => { field.onChange(value); handleProductChange(value) }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih produk" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.sku} - {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {selectedProduct && (
                      <div className="rounded-lg bg-muted p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded bg-background">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium">{selectedProduct.name}</p>
                            <p className="text-sm text-muted-foreground">
                              Stok di gudang ini:{' '}
                              <span className="font-semibold text-foreground">
                                {productStockInWarehouse} {selectedProduct.unitName}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="adjustmentType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipe Adjustment *</FormLabel>
                          <div className="flex gap-2">
                            <Button type="button" variant={field.value === 'add' ? 'default' : 'outline'} className="flex-1"
                              onClick={() => field.onChange('add')}>
                              <Plus className="mr-2 h-4 w-4" /> Tambah
                            </Button>
                            <Button type="button" variant={field.value === 'subtract' ? 'default' : 'outline'} className="flex-1"
                              onClick={() => field.onChange('subtract')}>
                              <Minus className="mr-2 h-4 w-4" /> Kurangi
                            </Button>
                            <Button type="button" variant={field.value === 'set' ? 'default' : 'outline'} className="flex-1"
                              onClick={() => field.onChange('set')}>
                              <Equal className="mr-2 h-4 w-4" /> Set
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qty *</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0" {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))} />
                          </FormControl>
                          <FormDescription>
                            {watchType === 'set' ? 'Stok akan diset ke angka ini' : `Jumlah yang akan di-${watchType === 'add' ? 'tambah' : 'kurang'}`}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* ── Preview (NEW) ───────────────────── */}
                    {preview && (
                      <div className="rounded-md border p-3 space-y-1">
                        <p className="text-xs font-medium text-muted-foreground mb-2">Preview Perubahan:</p>
                        <div className="flex items-center gap-2 text-sm">
                          <span>{preview.currentStock}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className={cn("font-bold",
                            preview.change > 0 && "text-green-500",
                            preview.change < 0 && "text-red-500",
                            preview.change === 0 && "text-blue-500",
                          )}>
                            {preview.newStock}
                          </span>
                          <span className={cn("text-xs",
                            preview.change > 0 && "text-green-500",
                            preview.change < 0 && "text-red-500",
                          )}>
                            ({preview.change > 0 ? '+' : ''}{preview.change})
                          </span>
                        </div>
                      </div>
                    )}

                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alasan *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Pilih alasan" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {adjustmentReasons.map((reason) => (
                                <SelectItem key={reason} value={reason}>{reason}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />

                          {['Damaged Goods', 'Expired'].some(r => field.value?.includes(r)) && watchType === 'subtract' && (
                            <div className="rounded-md bg-amber-500/15 p-3 text-sm text-amber-600 border border-amber-200 dark:border-amber-900/50 mt-2">
                              <div className="flex gap-2">
                                <span className="text-lg">⚠️</span>
                                <div>
                                  <span className="font-semibold">Barang akan dipindah ke Gudang Rusak</span>
                                  <p className="text-xs opacity-90 mt-1">
                                    Stok akan otomatis ditransfer ke gudang "Rejected / Rusak" untuk pelacakan.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Catatan</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Catatan tambahan (opsional)" className="resize-none" rows={2} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <Button type="submit" className="w-full"
                      disabled={(isBatchMode ? false : adjustStock.isPending) || !selectedProduct}>
                      {isBatchMode
                        ? 'Tambahkan ke Daftar'
                        : (adjustStock.isPending ? 'Menyimpan...' : 'Simpan Adjustment')}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* ── History / Batch List ──────────────── */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{isBatchMode ? 'Daftar Antrian' : 'Riwayat Adjustment'}</CardTitle>
                    <CardDescription>
                      {isBatchMode ? 'Item yang siap diproses bersamaan' : 'Riwayat penyesuaian stok terbaru'}
                    </CardDescription>
                  </div>
                  {isBatchMode && pendingAdjustments.length > 0 && (
                    <Button onClick={handleBatchSubmit} disabled={adjustStockBatch.isPending}>
                      {adjustStockBatch.isPending ? 'Memproses...' : 'Proses Semua'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {/* History Filters (NEW) */}
                {!isBatchMode && (
                  <div className="mb-4 flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Cari produk..."
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        className="pl-9 h-9"
                      />
                    </div>
                    <Select value={historyTypeFilter} onValueChange={setHistoryTypeFilter}>
                      <SelectTrigger className="w-[130px] h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Semua</SelectItem>
                        <SelectItem value="add">Tambah</SelectItem>
                        <SelectItem value="subtract">Kurang</SelectItem>
                        <SelectItem value="set">Set</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {isLoadingAdjustments ? (
                  <div className="flex h-[200px] items-center justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Produk</TableHead>
                          <TableHead>Perubahan</TableHead>
                          <TableHead>Alasan</TableHead>
                          {!isBatchMode && <TableHead>Tanggal</TableHead>}
                          {isBatchMode && <TableHead>Aksi</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isBatchMode ? (
                          pendingAdjustments.length > 0 ? (
                            pendingAdjustments.map((adj, index) => (
                              <TableRow key={index}>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{adj.productSku}</span>
                                    <span className="text-xs text-muted-foreground line-clamp-1">{adj.productName}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={cn(
                                    adj.adjustmentType === 'add' && 'bg-green-500/10 text-green-500',
                                    adj.adjustmentType === 'subtract' && 'bg-red-500/10 text-red-500',
                                    adj.adjustmentType === 'set' && 'bg-blue-500/10 text-blue-500',
                                  )}>
                                    {adj.adjustmentType === 'add' && '+'}
                                    {adj.adjustmentType === 'subtract' && '-'}
                                    {adj.adjustmentType === 'set' && '='}
                                    {adj.quantity}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm max-w-[150px] truncate">{adj.reason}</TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="icon" onClick={() => removePendingAdjustment(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                Belum ada item dalam daftar
                              </TableCell>
                            </TableRow>
                          )
                        ) : (
                          filteredAdjustments.length > 0 ? (
                            filteredAdjustments.map((adj: any) => (
                              <TableRow key={adj.id}>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{adj.product?.sku}</span>
                                    <span className="text-xs text-muted-foreground line-clamp-1">{adj.product?.name}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge className={cn(
                                    adj.quantityChange > 0 && 'bg-green-500/10 text-green-500',
                                    adj.quantityChange < 0 && 'bg-red-500/10 text-red-500',
                                    adj.quantityChange === 0 && 'bg-blue-500/10 text-blue-500',
                                  )}>
                                    {adj.quantityChange > 0 && '+'}{adj.quantityChange}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm max-w-[150px] truncate">{adj.notes}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">{formatDate(adj.createdAt)}</TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                Belum ada riwayat penyesuaian
                              </TableCell>
                            </TableRow>
                          )
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </Main>
    </>
  )
}
