import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Minus, Equal, Package, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  stockAdjustmentSchema,
  StockAdjustmentFormValues,
  adjustmentReasons,
  StockAdjustment,
} from '@/features/inventory/schema/stock-adjustment-schema'
import {
  useProducts,
  useWarehouses,
  useAdjustStock,
  useStockAdjustments,
  useAdjustStockBatch,
} from '@/features/inventory/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export const Route = createFileRoute('/_authenticated/inventory/stock')({
  component: StockAdjustmentPage,
})

function StockAdjustmentPage() {
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const [isBatchMode, setIsBatchMode] = useState(false)
  const [pendingAdjustments, setPendingAdjustments] = useState<any[]>([])

  // Fetch data from API
  const { data: productsData, isLoading: isLoadingProducts } = useProducts({ limit: 100 })
  const { data: warehousesData, isLoading: isLoadingWarehouses } = useWarehouses()
  const { data: adjustmentsData, isLoading: isLoadingAdjustments } = useStockAdjustments({ limit: 10 })

  // Mutations
  // Mutations
  const adjustStock = useAdjustStock()
  const adjustStockBatch = useAdjustStockBatch()

  const products = productsData?.data || []
  const warehouses = warehousesData || []
  const adjustments = adjustmentsData || []
  const defaultWarehouse = warehouses.find((w) => w.isDefault) || warehouses[0]

  const isLoading = isLoadingProducts || isLoadingWarehouses

  // Find selected product
  const selectedProduct = products.find((p) => p.id === selectedProductId)

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

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId)
    form.setValue('productId', productId)
  }

  const handleSubmit = async (data: StockAdjustmentFormValues) => {
    if (!selectedProduct || !defaultWarehouse) return

    if (isBatchMode) {
      // Add to batch list
      const adjustment = {
        productId: data.productId,
        productName: selectedProduct.name, // For display
        productSku: selectedProduct.sku, // For display
        warehouseId: defaultWarehouse.id,
        adjustmentType: data.adjustmentType,
        quantity: data.quantity,
        reason: data.reason,
        notes: data.notes,
      }
      
      setPendingAdjustments([...pendingAdjustments, adjustment])
      toast.success('Added to batch list')
      
      // Reset logic
      form.reset({
        productId: data.productId,
        adjustmentType: 'add',
        quantity: 0,
        reason: '',
        notes: '',
      })
      return
    }

    try {
      await adjustStock.mutateAsync({
        productId: data.productId,
        warehouseId: defaultWarehouse.id,
        adjustmentType: data.adjustmentType,
        quantity: data.quantity,
        reason: data.reason,
        notes: data.notes,
      })

      toast.success('Stock adjustment saved successfully!')
      form.reset({
        productId: data.productId,
        adjustmentType: 'add',
        quantity: 0,
        reason: '',
        notes: '',
      })
      // Keep product selected to show updated stock
    } catch (error) {
      toast.error((error as Error).message || 'Failed to save adjustment')
    }
  }

  const handleBatchSubmit = async () => {
    if (pendingAdjustments.length === 0) return

    try {
      // Clean up display properties before sending
      const payload = pendingAdjustments.map(({ productName, productSku, ...rest }) => rest)
      
      await adjustStockBatch.mutateAsync(payload)
      
      toast.success(`Successfully processed ${pendingAdjustments.length} adjustments`)
      setPendingAdjustments([])
      setIsBatchMode(false) // Exit batch mode on success
    } catch (error) {
      toast.error('Failed to process batch adjustments')
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
        <h1 className="text-lg font-semibold">Stock Adjustment</h1>
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Stock Adjustment</h2>
              <p className="text-muted-foreground">
                Manually adjust product stock levels
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="batch-mode"
                checked={isBatchMode}
                onCheckedChange={setIsBatchMode}
              />
              <Label htmlFor="batch-mode">Batch Mode</Label>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-[400px] items-center justify-center">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Adjustment Form */}
            <Card>
              <CardHeader>
                <CardTitle>{isBatchMode ? 'Add to Batch' : 'New Adjustment'}</CardTitle>
                <CardDescription>
                  {isBatchMode 
                    ? 'Queue items for batch adjustment' 
                    : 'Select a product and adjust its stock quantity'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(handleSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="productId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product *</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value)
                              handleProductChange(value)
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a product" />
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
                              Current Stock:{' '}
                              <span className="font-semibold text-foreground">
                                {selectedProduct.currentStock || 0} {selectedProduct.unitName}
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
                          <FormLabel>Adjustment Type *</FormLabel>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={field.value === 'add' ? 'default' : 'outline'}
                              className="flex-1"
                              onClick={() => field.onChange('add')}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add
                            </Button>
                            <Button
                              type="button"
                              variant={field.value === 'subtract' ? 'default' : 'outline'}
                              className="flex-1"
                              onClick={() => field.onChange('subtract')}
                            >
                              <Minus className="mr-2 h-4 w-4" />
                              Subtract
                            </Button>
                            <Button
                              type="button"
                              variant={field.value === 'set' ? 'default' : 'outline'}
                              className="flex-1"
                              onClick={() => field.onChange('set')}
                            >
                              <Equal className="mr-2 h-4 w-4" />
                              Set To
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
                          <FormLabel>Quantity *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            {form.watch('adjustmentType') === 'set'
                              ? 'Set stock to this exact quantity'
                              : `Quantity to ${form.watch('adjustmentType')}`}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Reason *</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a reason" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {adjustmentReasons.map((reason) => (
                                <SelectItem key={reason} value={reason}>
                                  {reason}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                          
                          {/* Destructive Warning */}
                          {['Damaged Goods', 'Expired'].some(r => field.value?.includes(r)) && form.watch('adjustmentType') === 'subtract' && (
                            <div className="rounded-md bg-amber-500/15 p-3 text-sm text-amber-600 border border-amber-200 dark:border-amber-900/50 mt-2">
                              <div className="flex gap-2">
                                <span className="text-lg">⚠️</span>
                                <div>
                                  <span className="font-semibold">Items will be moved to Rejected Warehouse</span>
                                  <p className="text-xs opacity-90 mt-1">
                                    Stock will be transferred to the "Rejected / Rusak" warehouse for tracking purposes.
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
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Additional notes (optional)"
                              className="resize-none"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Separator />

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={(isBatchMode ? false : adjustStock.isPending) || !selectedProduct}
                    >
                      {isBatchMode 
                        ? 'Add to List' 
                        : (adjustStock.isPending ? 'Saving...' : 'Save Adjustment')}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            {/* Recent Adjustments or Batch List */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{isBatchMode ? 'Pending Adjustments' : 'Recent Adjustments'}</CardTitle>
                    <CardDescription>
                      {isBatchMode 
                        ? 'Items queued for bulk update' 
                        : 'Latest stock adjustment history'}
                    </CardDescription>
                  </div>
                  {isBatchMode && pendingAdjustments.length > 0 && (
                    <Button 
                      onClick={handleBatchSubmit} 
                      disabled={adjustStockBatch.isPending}
                    >
                      {adjustStockBatch.isPending ? 'Processing...' : 'Save All'}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingAdjustments ? (
                  <div className="flex h-[200px] items-center justify-center">
                    <div className="text-muted-foreground">Loading adjustments...</div>
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Change</TableHead>
                          <TableHead>Reason</TableHead>
                          {!isBatchMode && <TableHead>Date</TableHead>}
                          {isBatchMode && <TableHead>Action</TableHead>}
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
                                    <span className="text-xs text-muted-foreground line-clamp-1">
                                      {adj.productName}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={cn(
                                      adj.adjustmentType === 'add' && 'bg-green-500/10 text-green-500',
                                      adj.adjustmentType === 'subtract' && 'bg-red-500/10 text-red-500',
                                      adj.adjustmentType === 'set' && 'bg-blue-500/10 text-blue-500'
                                    )}
                                  >
                                    {adj.adjustmentType === 'add' && '+'}
                                    {adj.adjustmentType === 'subtract' && '-'}
                                    {adj.adjustmentType === 'set' && '='}
                                    {adj.quantity}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm max-w-[150px] truncate">
                                  {adj.reason}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removePendingAdjustment(index)}
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                No items in batch list
                              </TableCell>
                            </TableRow>
                          )
                        ) : (
                          // Normal History View
                          adjustments.length > 0 ? (
                            adjustments.map((adj) => (
                              <TableRow key={adj.id}>
                                <TableCell>
                                  <div className="flex flex-col">
                                    <span className="font-medium">{adj.product?.sku}</span>
                                    <span className="text-xs text-muted-foreground line-clamp-1">
                                      {adj.product?.name}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={cn(
                                      adj.quantityChange > 0 && 'bg-green-500/10 text-green-500',
                                      adj.quantityChange < 0 && 'bg-red-500/10 text-red-500',
                                      adj.quantityChange === 0 && 'bg-blue-500/10 text-blue-500'
                                    )}
                                  >
                                    {adj.quantityChange > 0 && '+'}
                                    {adj.quantityChange}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-sm max-w-[150px] truncate">
                                  {adj.notes}
                                </TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  {formatDate(adj.createdAt)}
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                No adjustments yet
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
