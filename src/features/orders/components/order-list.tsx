import { Order } from '@/features/orders/api'
import { formatCurrency } from '@/lib/utils'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Package, 
  Clock, 
  CheckCircle2, 
  Truck, 
  XCircle,
  MoreHorizontal,
  Printer,
  User,
  MapPin,
  Calendar,
  CreditCard,
  ArrowRight,
  Eye,
  Edit,
  Trash2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface OrderListProps {
  orders: Order[]
  onView: (order: Order) => void
  onAction: (order: Order, action: string) => void
}

export function OrderList({ orders, onView, onAction }: OrderListProps) {
  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-muted/10 border-2 border-dashed rounded-xl h-[400px] animate-in fade-in zoom-in duration-500">
        <div className="p-6 bg-primary/5 rounded-full mb-6">
            <Package className="h-12 w-12 text-primary/40" />
        </div>
        <h3 className="text-xl font-bold text-foreground">No orders found</h3>
        <p className="text-muted-foreground text-center max-w-sm mt-2 mb-6">
            There are no orders matching your criteria. Try adjusting your filters or create a new order.
        </p>
        <Button onClick={() => window.location.href='/sales/orders/create'}>
            Create New Order
        </Button>
      </div>
    )
  }

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

  const getPrimaryAction = (order: Order) => {
    switch (order.status) {
      case 'pending':
        return (
          <Button size="sm" className="w-full font-semibold shadow-sm" onClick={() => onAction(order, 'pay')}>
             Process Payment <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )
      case 'processing':
        return (
          <Button size="sm" className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm" onClick={() => onAction(order, 'ship')}>
             Ship Order <Truck className="h-4 w-4 ml-2" />
          </Button>
        )
      case 'shipped':
        return (
          <Button size="sm" variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary/5" onClick={() => onAction(order, 'complete')}>
             Mark Completed <CheckCircle2 className="h-4 w-4 ml-2" />
          </Button>
        )
      default:
        return (
          <Button size="sm" variant="outline" className="w-full" onClick={() => onView(order)}>
             View Details
          </Button>
        )
    }
  }

  // Mobile Card View
  const MobileView = () => (
    <div className="grid grid-cols-1 gap-6 md:hidden">
      {orders.map((order) => {
        const status = getStatusConfig(order.status)
        const StatusIcon = status.icon
        const remainingItems = order.items.length - 2

        return (
        <Card key={order.id} className="overflow-hidden border-muted/60 shadow-sm hover:shadow-md transition-all duration-200 group bg-card/50 hover:bg-card">
          {/* Header */}
          <div className="px-6 py-4 flex flex-col justify-between items-start gap-4 border-b bg-muted/10">
            <div className="flex items-center gap-3 w-full justify-between">
               <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs ring-2 ring-background">
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
               <Badge variant="outline" className={`${status.color} border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide flex items-center gap-1 shadow-sm`}>
                  <StatusIcon className="h-3 w-3" />
                  {status.label}
               </Badge>
            </div>
          </div>
          
          <div className="flex flex-col">
             {/* Main Content */}
             <div className="p-6 space-y-6">
                {/* Customer Info */}
                <div className="flex items-start gap-3">
                   <Avatar className="h-8 w-8 border">
                      <AvatarFallback className="bg-muted text-muted-foreground text-xs"><User className="h-4 w-4" /></AvatarFallback>
                   </Avatar>
                   <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{order.customerName || 'Walk-in Customer'}</p>
                      {order.customerAddress && (
                         <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {order.customerAddress}
                         </p>
                      )}
                   </div>
                </div>

                <Separator className="bg-border/50" />

                {/* Items Preview */}
                <div className="space-y-3">
                   {order.items.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center group/item hover:bg-muted/30 p-2 rounded-lg -mx-2 transition-colors">
                         <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-muted rounded-md border flex items-center justify-center overflow-hidden shrink-0">
                               {item.product?.image ? <img src={item.product.image} className="w-full h-full object-cover" /> : <Package className="h-5 w-5 opacity-30" />}
                            </div>
                            <div>
                               <p className="text-sm font-medium line-clamp-1">{item.product?.name}</p>
                               <span className="text-xs text-muted-foreground">x{item.quantity}</span>
                            </div>
                         </div>
                         <p className="text-sm font-medium tabular-nums">{formatCurrency(item.quantity * Number(item.price))}</p>
                      </div>
                   ))}
                   {remainingItems > 0 && (
                      <div className="text-xs text-muted-foreground font-medium pl-2 pt-1">
                         + {remainingItems} more items...
                      </div>
                   )}
                </div>
             </div>

             {/* Sidebar / Actions */}
             <div className="w-full bg-muted/5 border-t p-6 flex flex-col justify-between gap-6">
                <div className="space-y-2">
                   <div className="flex justify-between items-baseline">
                      <span className="text-sm text-muted-foreground">Total Amount</span>
                      <span className="text-xl font-bold text-primary">{formatCurrency(Number(order.totalAmount))}</span>
                   </div>
                   {Number(order.discountAmount) > 0 && (
                      <div className="flex justify-end">
                        <span className="text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-100">
                          - {formatCurrency(Number(order.discountAmount))}
                        </span>
                      </div>
                   )}
                </div>

                <div className="space-y-3">
                   {getPrimaryAction(order)}
                   
                   <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 bg-background" onClick={() => onAction(order, 'print')}>
                         <Printer className="h-4 w-4 mr-2" /> Print
                      </Button>
                      <DropdownMenu>
                         <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="px-2 bg-background">
                               <MoreHorizontal className="h-4 w-4" />
                            </Button>
                         </DropdownMenuTrigger>
                         <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onView(order)}>
                               View Full Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onAction(order, 'edit')}>
                               Edit Order
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onAction(order, 'cancel')}>
                               Cancel Order
                            </DropdownMenuItem>
                         </DropdownMenuContent>
                      </DropdownMenu>
                   </div>
                </div>
             </div>
          </div>
        </Card>
      )})}
    </div>
  )

  // Desktop Table View
  const DesktopTableView = () => (
     <div className="hidden md:block rounded-md border bg-card">
        <Table>
           <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                 <TableHead className="w-[140px]">Order #</TableHead>
                 <TableHead className="w-[180px]">Date</TableHead>
                 <TableHead>Customer</TableHead>
                 <TableHead>Status</TableHead>
                 <TableHead>Items</TableHead>
                 <TableHead className="text-right">Total</TableHead>
                 <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
           </TableHeader>
           <TableBody>
              {orders.map((order) => {
                 const status = getStatusConfig(order.status)
                 const StatusIcon = status.icon
                 return (
                    <TableRow key={order.id} className="group hover:bg-muted/50 cursor-default">
                       <TableCell className="font-medium">
                          <div className="flex flex-col">
                             <span className="text-sm font-semibold">{order.number}</span>
                             {order.paymentMethod && (
                                <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-1 mt-0.5">
                                   <CreditCard className="h-3 w-3" /> {order.paymentMethod}
                                </span>
                             )}
                          </div>
                       </TableCell>
                       <TableCell>
                          <div className="flex flex-col text-sm text-muted-foreground">
                             <span>{format(new Date(order.date), 'dd MMM yyyy')}</span>
                             <span className="text-xs">{format(new Date(order.date), 'HH:mm')}</span>
                          </div>
                       </TableCell>
                       <TableCell>
                          <div className="flex items-center gap-2">
                             <Avatar className="h-6 w-6">
                                <AvatarFallback className="text-[10px]"><User className="h-3 w-3" /></AvatarFallback>
                             </Avatar>
                             <div className="flex flex-col">
                                <span className="text-sm font-medium">{order.customerName || 'Walk-in'}</span>
                                {order.customerAddress && <span className="text-xs text-muted-foreground truncate max-w-[150px]">{order.customerAddress}</span>}
                             </div>
                          </div>
                       </TableCell>
                       <TableCell>
                          <Badge variant="outline" className={`${status.color} border font-normal`}>
                             <StatusIcon className="h-3 w-3 mr-1" />
                             {status.label}
                          </Badge>
                       </TableCell>
                       <TableCell>
                          <div className="text-sm text-muted-foreground">
                             {order.items.length} items
                             {order.shippingCost && Number(order.shippingCost) > 0 ? (
                                <span className="text-xs ml-1 opacity-70">(+Ship)</span>
                             ) : null}
                          </div>
                       </TableCell>
                       <TableCell className="text-right">
                          <div className="flex flex-col items-end">
                             <span className="font-bold">{formatCurrency(Number(order.totalAmount))}</span>
                             {Number(order.discountAmount) > 0 && (
                                <span className="text-xs text-red-500">-{formatCurrency(Number(order.discountAmount))}</span>
                             )}
                          </div>
                       </TableCell>
                       <TableCell className="text-right">
                          <DropdownMenu>
                             <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                   <MoreHorizontal className="h-4 w-4" />
                                </Button>
                             </DropdownMenuTrigger>
                             <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuItem onClick={() => onView(order)}>
                                   <Eye className="h-4 w-4 mr-2" /> View Details
                                </DropdownMenuItem>
                                
                                {order.status === 'pending' && (
                                   <DropdownMenuItem onClick={() => onAction(order, 'pay')}>
                                      <CreditCard className="h-4 w-4 mr-2" /> Process Payment
                                   </DropdownMenuItem>
                                )}
                                
                                {order.status === 'processing' && (
                                   <DropdownMenuItem onClick={() => onAction(order, 'ship')}>
                                      <Truck className="h-4 w-4 mr-2" /> Ship Order
                                   </DropdownMenuItem>
                                )}

                                {order.status === 'shipped' && (
                                   <DropdownMenuItem onClick={() => onAction(order, 'complete')}>
                                      <CheckCircle2 className="h-4 w-4 mr-2" /> Mark Complete
                                   </DropdownMenuItem>
                                )}
                                
                                <DropdownMenuItem onClick={() => onAction(order, 'print')}>
                                   <Printer className="h-4 w-4 mr-2" /> Print Receipt
                                </DropdownMenuItem>
                                
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => onAction(order, 'edit')}>
                                   <Edit className="h-4 w-4 mr-2" /> Edit Order
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => onAction(order, 'cancel')}>
                                   <Trash2 className="h-4 w-4 mr-2" /> Cancel Order
                                </DropdownMenuItem>
                             </DropdownMenuContent>
                          </DropdownMenu>
                       </TableCell>
                    </TableRow>
                 )
              })}
           </TableBody>
        </Table>
     </div>
  )

  return (
    <>
      <MobileView />
      <DesktopTableView />
    </>
  )
}
