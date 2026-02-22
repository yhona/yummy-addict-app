import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useOrders, useCompleteOrder, useUpdateOrder, useCancelOrder, OrdersParams, CompleteOrderRequest } from '@/features/orders/api'
import { formatCurrency } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { DataTable, DataTableDateRangeFilter } from '@/components/data-table'
import { columns as orderColumns } from '@/features/orders/components/columns'
import { useTableUrlState } from '@/hooks/use-table-url-state'
import { z } from 'zod'

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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { 
  Loader2, 
  Check,
  Save,
  Plus,
  Minus,
  Trash2,
  Printer,
  User,
  Phone,
  MapPin,
  Calendar,
  Package,
  Truck,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react'
import { toast } from 'sonner'
import { format, startOfMonth, endOfMonth } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { DateRange } from 'react-day-picker'

const ordersSearchSchema = z.object({
  page: z.number().catch(1),
  limit: z.number().optional().catch(20),
  search: z.string().optional(),
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
})

export const Route = createFileRoute('/_authenticated/sales/orders/')({
  component: OrdersPage,
  validateSearch: (search) => ordersSearchSchema.parse(search),
})

function OrdersPage() {
  const navigate = Route.useNavigate()
  const searchParams = Route.useSearch()

  const {
      pagination,
      globalFilter,
      columnFilters,
      onColumnFiltersChange
  } = useTableUrlState({
      search: searchParams,
      navigate: navigate as any,
      pagination: { defaultPageSize: 20 },
      columnFilters: [
           { columnId: 'status', searchKey: 'status', type: 'string' }
      ]
  })

  // Date Filter State
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
      from: searchParams.dateFrom ? new Date(searchParams.dateFrom) : startOfMonth(new Date()),
      to: searchParams.dateTo ? new Date(searchParams.dateTo) : endOfMonth(new Date()),
  })
  
  // Update URL when dates change
  const handleDateChange = (newDate: DateRange | undefined) => {
      setDateRange(newDate)
      navigate({
          search: (prev) => ({
              ...prev,
              dateFrom: newDate?.from ? format(newDate.from, 'yyyy-MM-dd') : undefined,
              dateTo: newDate?.to ? format(newDate.to, 'yyyy-MM-dd') : undefined,
              page: 1, // Reset page on filter change
          })
      })
  }
  
  // Extract status from columnFilters or URL
  const statusFilter = columnFilters.find(f => f.id === 'status')?.value as string || undefined

  const params = useMemo<OrdersParams>(() => ({
    page: pagination.pageIndex + 1,
    limit: pagination.pageSize,
    status: statusFilter === 'all' ? undefined : statusFilter,
    search: globalFilter || undefined,
    dateFrom: dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    dateTo: dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
  }), [pagination, statusFilter, globalFilter, dateRange])
  
  const { data, isLoading } = useOrders(params)
  const completeOrderMut = useCompleteOrder()
  const updateOrderMut = useUpdateOrder()
  const cancelOrderMut = useCancelOrder()
  
  const orders = data?.data || []

  // Dialog states
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [paymentOrder, setPaymentOrder] = useState<any>(null)
  const [cancelOrder, setCancelOrder] = useState<any>(null)
  
  // Payment form
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'transfer'>('cash')
  const [cashAmount, setCashAmount] = useState('')
  const [discount, setDiscount] = useState('')
  
  // Edit Order state
  const [editOrder, setEditOrder] = useState<any>(null)
  const [editItems, setEditItems] = useState<any[]>([])
  
  // Completed transaction for printing
  const [completedTx, setCompletedTx] = useState<any>(null)

  // Use the standardized columns
  const columns = useMemo(() => orderColumns(
      setSelectedOrder,
      (order, action) => {
          if (action === 'pay') handleOpenPayment(order)
          if (action === 'edit') handleOpenEdit(order)
          if (action === 'cancel') setCancelOrder(order)
          if (action === 'ship') toast.info("Shipment logic here")
          if (action === 'complete') handleOpenPayment(order)
          if (action === 'print') handlePrint(order)
      }
  ), [])

  // Pre-fill payment data when opening dialog
  const handleOpenPayment = (order: any) => {
    setPaymentOrder(order)
    setPaymentMethod(order.paymentMethod || 'cash')
    setCashAmount(order.cashAmount || '')
    setDiscount(order.discountAmount || '')
  }
  
  const handleSavePayment = async () => {
    if (!paymentOrder) return

    try {
      await updateOrderMut.mutateAsync({ 
        id: paymentOrder.id, 
        data: {
          paymentMethod,
          cashAmount: paymentMethod === 'cash' ? Number(cashAmount) : null
        }
      })
      toast.success('Payment info saved!')
      setPaymentOrder(null)
    } catch (error) {
      toast.error('Failed to save payment info')
    }
  }

  const handleCompletePayment = async () => {
    if (!paymentOrder) return
    
    const paymentData: CompleteOrderRequest = {
      paymentMethod,
      cashAmount: paymentMethod === 'cash' ? Number(cashAmount) : undefined,
      discountAmount: Number(discount || 0),
    }
    
    try {
      const result = await completeOrderMut.mutateAsync({ id: paymentOrder.id, data: paymentData })
      toast.success('Payment completed!')
      setCompletedTx({ ...((result as object) || {}), order: paymentOrder })
      setPaymentOrder(null)
      setCashAmount('')
      setDiscount('')
    } catch (error) {
      toast.error((error as Error).message || 'Payment failed')
    }
  }
  
  const handleCancelOrder = async () => {
    if (!cancelOrder) return
    
    try {
      await cancelOrderMut.mutateAsync(cancelOrder.id)
      toast.success('Order cancelled')
      setCancelOrder(null)
    } catch (error) {
      toast.error((error as Error).message || 'Failed to cancel order')
    }
  }
  
  // Edit Order Handlers
  const handleOpenEdit = (order: any) => {
    setEditOrder(order)
    setEditItems(order.items?.map((item: any) => ({
      ...item,
      productId: item.productId,
      productName: item.product?.name || 'Unknown',
      price: Number(item.price),
      quantity: item.quantity,
    })) || [])
  }
  
  const handleUpdateEditItem = (productId: string, delta: number) => {
    setEditItems(prev => prev.map(item => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta)
        return { ...item, quantity: newQty }
      }
      return item
    }))
  }
  
  const handleRemoveEditItem = (productId: string) => {
    setEditItems(prev => prev.filter(item => item.productId !== productId))
  }
  
  const handleSaveEdit = async () => {
    if (!editOrder || editItems.length === 0) {
      toast.error('Order must have at least one item')
      return
    }
    
    try {
      await updateOrderMut.mutateAsync({
        id: editOrder.id,
        data: {
          items: editItems.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          }))
        }
      })
      toast.success('Order updated!')
      setEditOrder(null)
      setEditItems([])
    } catch (error) {
      toast.error((error as Error).message || 'Failed to update order')
    }
  }
  
  const editTotal = editItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  
  // Print Receipt
  const handlePrint = (tx: any) => {
    const printWindow = window.open('', '_blank', 'width=300,height=600')
    if (!printWindow) return
    
    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 12px; width: 58mm; margin: 0; padding: 10px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .line { border-top: 1px dashed #000; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; }
          .items { margin: 10px 0; }
          .item { margin: 5px 0; }
          h2 { margin: 5px 0; font-size: 16px; }
        </style>
      </head>
      <body>
        <div class="center">
          <h2>RECEIPT</h2>
          <p>${tx.number || 'N/A'}</p>
          <p>${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
        </div>
        <div class="line"></div>
        <p><strong>Customer:</strong> ${tx.order?.customerName || 'Walk-in'}</p>
        <div class="line"></div>
        <div class="items">
          ${(tx.items || tx.order?.items || []).map((item: any) => `
            <div class="item">
              <div>${item.product?.name || item.productName || 'Item'}</div>
              <div class="row">
                <span>${item.quantity} x Rp ${Number(item.price).toLocaleString('id-ID')}</span>
                <span>Rp ${(item.quantity * Number(item.price)).toLocaleString('id-ID')}</span>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="line"></div>
        <div class="row"><span>Subtotal</span><span>Rp ${Number(tx.totalAmount).toLocaleString('id-ID')}</span></div>
        ${Number(tx.discountAmount) > 0 ? `<div class="row"><span>Discount</span><span>-Rp ${Number(tx.discountAmount).toLocaleString('id-ID')}</span></div>` : ''}
        <div class="row bold"><span>TOTAL</span><span>Rp ${Number(tx.finalAmount).toLocaleString('id-ID')}</span></div>
        ${tx.paymentMethod === 'cash' ? `
          <div class="row"><span>Cash</span><span>Rp ${Number(tx.cashAmount).toLocaleString('id-ID')}</span></div>
          <div class="row"><span>Change</span><span>Rp ${Number(tx.changeAmount).toLocaleString('id-ID')}</span></div>
        ` : `<div class="row"><span>Payment</span><span>${tx.paymentMethod?.toUpperCase()}</span></div>`}
        <div class="line"></div>
        <p class="center">Thank You!</p>
      </body>
      </html>
    `
    printWindow.document.write(receiptHtml)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => printWindow.print(), 250)
  }
  
  
  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm')
  }

  // Helper for Mobile View
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending': return { color: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900', icon: Clock, label: 'Payment Pending' }
      case 'processing': return { color: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-900', icon: Package, label: 'Processing' }
      case 'shipped': return { color: 'bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900', icon: Truck, label: 'On Delivery' }
      case 'completed': return { color: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-200 dark:border-green-900', icon: CheckCircle2, label: 'Completed' }
      case 'cancelled': return { color: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-200 dark:border-red-900', icon: XCircle, label: 'Cancelled' }
      default: return { color: 'bg-gray-100 text-gray-800', icon: Clock, label: status }
    }
  }

  return (
    <Page>
      <PageHeader fixed>
         <PageHeaderHeading>
            <PageHeaderTitle>Orders</PageHeaderTitle>
            <PageHeaderDescription>Manage and view all orders</PageHeaderDescription>
         </PageHeaderHeading>
      </PageHeader>
      
      <PageBody>
        <div className="space-y-4">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
           <Card className="bg-primary/5 border-primary/20 shadow-none">
              <CardContent className="p-4 flex flex-col gap-1">
                 <span className="text-xs font-semibold text-muted-foreground uppercase">Total Orders</span>
                 <span className="text-2xl font-bold text-primary">{data?.pagination?.total || 0}</span>
              </CardContent>
           </Card>
           
           <Card className="bg-yellow-500/5 border-yellow-500/20 shadow-none">
               <CardContent className="p-4 flex flex-col gap-1">
                 <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-500 uppercase">Pending</span>
                 <span className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
                    {orders.filter((o) => o.status === 'pending').length} 
                 </span>
              </CardContent>
           </Card>
           
           <Card className="bg-blue-500/5 border-blue-500/20 shadow-none">
               <CardContent className="p-4 flex flex-col gap-1">
                 <span className="text-xs font-semibold text-blue-600 dark:text-blue-500 uppercase">Processing</span>
                 <span className="text-2xl font-bold text-blue-700 dark:text-blue-400">
                    {orders.filter((o) => o.status === 'processing').length}
                 </span>
              </CardContent>
           </Card>

           <Card className="bg-green-500/5 border-green-500/20 shadow-none">
               <CardContent className="p-4 flex flex-col gap-1">
                 <span className="text-xs font-semibold text-green-600 dark:text-green-500 uppercase">Completed</span>
                 <span className="text-2xl font-bold text-green-700 dark:text-green-400">
                    {orders.filter((o) => o.status === 'completed').length}
                 </span>
              </CardContent>
           </Card>
        </div>
        
        {/* Custom Toolbar Actions for Date Range & Create Button */}
        <div className="hidden md:block">
            <DataTable
              data={orders}
              columns={columns}
              searchKey="customerName" // or use 'search' for global if handled by server
              searchPlaceholder="Search customers..."
              filters={[
                {
                  columnId: 'status',
                  title: 'Status',
                  options: [
                    { label: 'Pending', value: 'pending', icon: Clock },
                    { label: 'Processing', value: 'processing', icon: Package },
                    { label: 'Shipped', value: 'shipped', icon: Truck },
                    { label: 'Completed', value: 'completed', icon: CheckCircle2 },
                    { label: 'Cancelled', value: 'cancelled', icon: XCircle },
                  ]
                }
              ]}
              onReset={() => setDateRange(undefined)}
              isFiltered={!!dateRange?.from}
              toolbar={
                  <div className="flex items-center gap-2">
                    <DataTableDateRangeFilter
                        date={dateRange}
                        setDate={handleDateChange}
                    />
                    <Button size="sm" asChild>
                        <Link to="/sales/orders/create">
                            <Plus className="h-4 w-4 mr-1" /> Create Order
                        </Link>
                    </Button>
                  </div>
              }
            />
        </div>

        {/* Mobile View (Card List) */}
        <div className="grid grid-cols-1 gap-6 md:hidden">
            <div className="flex flex-col gap-4 mb-4">
                 <div className="flex gap-2 overflow-x-auto pb-2">
                     {['all', 'pending', 'processing', 'shipped', 'completed', 'cancelled'].map(s => (
                         <Button 
                            key={s} 
                            variant={statusFilter === s || (!statusFilter && s === 'all') ? 'default' : 'outline'} 
                            size="sm"
                            className="text-xs h-7 whitespace-nowrap"
                            onClick={() => {
                                onColumnFiltersChange([{ id: 'status', value: s === 'all' ? undefined : s }])
                            }}
                         >
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                         </Button>
                     ))}
                 </div>
                 <Button size="sm" className="w-full" asChild>
                    <Link to="/sales/orders/create">
                        <Plus className="h-4 w-4 mr-1" /> Create Order
                    </Link>
                </Button>
            </div>
          
            {orders.map((order) => {
                const status = getStatusConfig(order.status)
                const StatusIcon = status.icon
                const remainingItems = order.items.length - 2

                return (
                 <Card key={order.id} className="overflow-hidden border-muted/60 shadow-sm">
                  <div className="px-6 py-4 flex flex-col justify-between items-start gap-4 border-b bg-muted/10">
                    <div className="flex items-center gap-3 w-full justify-between">
                       <div className="flex items-center gap-3">
                          <div className="h-10 w-10 number-badge rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs ring-2 ring-background">
                              #{order.number.slice(-4)}
                          </div>
                          <div>
                              <h4 className="font-semibold text-foreground flex items-center gap-2">
                                {order.number}
                              </h4>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {format(new Date(order.date), 'dd MMM yyyy')}</span>
                              </div>
                          </div>
                       </div>
                       <Badge variant="outline" className={`${status.color} border px-2 py-0.5 text-[10px] uppercase flex items-center gap-1`}>
                          <StatusIcon className="h-3 w-3" />
                          {status.label}
                       </Badge>
                    </div>
                  </div>
                  
                  <div className="p-6 space-y-4">
                     {/* Customer & Items (Simplified) */}
                     <div className="flex items-center gap-2 text-sm font-medium">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {order.customerName || 'Walk-in'}
                     </div>
                     
                     <div className="space-y-2">
                       {order.items.slice(0, 2).map((item, idx) => (
                           <div key={idx} className="flex justify-between text-sm">
                               <span className="text-muted-foreground">{item.product?.name} x{item.quantity}</span>
                               <span>{formatCurrency(Number(item.price) * item.quantity)}</span>
                           </div>
                       ))}
                       {remainingItems > 0 && <p className="text-xs text-muted-foreground">+{remainingItems} more items</p>}
                     </div>
                     
                     <Separator />
                     
                     <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-muted-foreground">Total</span>
                        <span className="text-lg font-bold text-primary">{formatCurrency(Number(order.totalAmount))}</span>
                     </div>
                     
                     {/* Mobile Actions */}
                     <div className="grid grid-cols-2 gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>View</Button>
                        {order.status === 'pending' ? (
                            <Button size="sm" onClick={() => handleOpenPayment(order)}>Pay Now</Button>
                        ) : (
                            <Button variant="secondary" size="sm" onClick={() => handlePrint(order)}>Print</Button>
                        )}
                     </div>
                  </div>
                 </Card>
            )})}
            {orders.length === 0 && !isLoading && (
                <div className="text-center py-10 text-muted-foreground">No orders found.</div>
            )}
        </div>
      </div>
      </PageBody>
      
      {/* View Order Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order {selectedOrder?.number}</DialogTitle>
            <DialogDescription>
              {selectedOrder && formatDateTime(selectedOrder.date)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {selectedOrder.customerName}
                </p>
                {selectedOrder.customerPhone && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    {selectedOrder.customerPhone}
                  </p>
                )}
                {selectedOrder.customerAddress && (
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {selectedOrder.customerAddress}
                  </p>
                )}
              </div>
              
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.product?.name} x{item.quantity}</span>
                      <span>{formatCurrency(Number(item.subtotal || (item.price * item.quantity)))}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(Number(selectedOrder.totalAmount) + Number(selectedOrder.discountAmount || 0))}</span>
                </div>
                {Number(selectedOrder.discountAmount) > 0 && (
                  <div className="flex justify-between text-sm text-red-600">
                    <span>Discount</span>
                    <span>- {formatCurrency(Number(selectedOrder.discountAmount))}</span>
                  </div>
                )}
                {Number(selectedOrder.shippingCost) > 0 && (
                   <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span>{formatCurrency(Number(selectedOrder.shippingCost))}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg pt-2 border-t">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(Number(selectedOrder.finalAmount || selectedOrder.totalAmount))}</span>
                </div>
              </div>
              
              {selectedOrder.notes && (
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-1">Notes</h4>
                  <p className="text-sm text-muted-foreground">{selectedOrder.notes}</p>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Payment Dialog */}
      <Dialog open={!!paymentOrder} onOpenChange={(open) => !open && setPaymentOrder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payment</DialogTitle>
            <DialogDescription>
              Order {paymentOrder?.number} - {paymentOrder?.customerName}
            </DialogDescription>
          </DialogHeader>
          
          {paymentOrder && (
            <div className="space-y-4 py-4">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">
                  {formatCurrency(Number(paymentOrder.totalAmount) - Number(discount || 0))}
                </span>
              </div>
              
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="qris">QRIS</SelectItem>
                    <SelectItem value="transfer">Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Discount</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={discount}
                  onChange={(e) => setDiscount(e.target.value)}
                />
              </div>
              
              {paymentMethod === 'cash' && (
                <div className="space-y-2">
                  <Label>Cash Amount</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                  />
                  {Number(cashAmount) >= Number(paymentOrder.totalAmount) - Number(discount || 0) && (
                    <p className="text-green-600 font-bold">
                      Change: {formatCurrency(Number(cashAmount) - (Number(paymentOrder.totalAmount) - Number(discount || 0)))}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentOrder(null)}>
              Cancel
            </Button>
            <Button 
              variant="secondary"
              onClick={handleSavePayment}
              disabled={updateOrderMut.isPending}
            >
              {updateOrderMut.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Draft
            </Button>
            <Button 
              onClick={handleCompletePayment}
              disabled={completeOrderMut.isPending || (paymentMethod === 'cash' && Number(cashAmount) < Number(paymentOrder?.totalAmount || 0) - Number(discount || 0))}
            >
              {completeOrderMut.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Complete Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Cancel Confirmation */}
      <ConfirmDeleteDialog
        open={!!cancelOrder}
        onOpenChange={(open) => !open && setCancelOrder(null)}
        title="Cancel Order"
        itemName={cancelOrder?.number}
        description="Are you sure you want to cancel this order?"
        onConfirm={handleCancelOrder}
        isLoading={cancelOrderMut.isPending}
      />
      
      {/* Edit Order Dialog */}
      <Dialog open={!!editOrder} onOpenChange={(open) => !open && setEditOrder(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Order</DialogTitle>
            <DialogDescription>
              {editOrder?.number} - Modify items before payment
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {editItems.map((item) => (
              <div key={item.productId} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.productName || item.product?.name}</p>
                  <p className="text-xs text-muted-foreground">{formatCurrency(item.price)} / unit</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleUpdateEditItem(item.productId, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center font-medium">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleUpdateEditItem(item.productId, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <p className="w-24 text-right font-medium">{formatCurrency(item.price * item.quantity)}</p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => handleRemoveEditItem(item.productId)}
                  disabled={editItems.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <div className="border-t pt-4 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(editTotal)}</span>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOrder(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateOrderMut.isPending || editItems.length === 0}>
              {updateOrderMut.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Print Receipt Dialog */}
      <Dialog open={!!completedTx} onOpenChange={(open) => !open && setCompletedTx(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-green-600">
              <Check className="h-12 w-12 mx-auto mb-2" />
              Order Completed
            </DialogTitle>
            <DialogDescription className="text-center">
              Transaction has been recorded successfully.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-4">
             <Button onClick={() => {
                 setCompletedTx(null)
                 window.print() // Simple print for now
             }}>
                 <Printer className="mr-2 h-4 w-4" /> Print Receipt
             </Button>
             <Button variant="outline" onClick={() => setCompletedTx(null)}>
                 Close
             </Button>
          </div>
        </DialogContent>
      </Dialog>

    </Page>
  )
}
