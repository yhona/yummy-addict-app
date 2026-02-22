import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table/column-header'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
    Clock, 
    Package, 
    Truck, 
    CheckCircle2, 
    XCircle, 
    MoreHorizontal, 
    Eye, 
    CreditCard, 
    Printer, 
    Edit, 
    Trash2,
    User
} from 'lucide-react'
import { format } from 'date-fns'
import { formatCurrency } from '@/lib/utils'
import { Order } from '@/features/orders/api'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export const columns = (
  onView: (order: Order) => void,
  onAction: (order: Order, action: string) => void
): ColumnDef<Order>[] => [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'number',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Order #" />
    ),
    cell: ({ row }) => <div className="font-semibold">{row.getValue('number')}</div>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'date',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Date" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue('date'))
      return (
        <div className="flex flex-col text-sm text-muted-foreground">
             <span>{format(date, 'dd MMM yyyy')}</span>
             <span className="text-xs">{format(date, 'HH:mm')}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'customerName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Customer" />
    ),
    cell: ({ row }) => {
        return (
            <div className="flex items-center gap-2">
                 <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-[10px]"><User className="h-3 w-3" /></AvatarFallback>
                 </Avatar>
                 <div className="flex flex-col">
                    <span className="text-sm font-medium">{row.original.customerName || 'Walk-in'}</span>
                    {row.original.customerAddress && <span className="text-xs text-muted-foreground truncate max-w-[150px]">{row.original.customerAddress}</span>}
                 </div>
              </div>
        )
    }
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      
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

      const config = getStatusConfig(status)
      const Icon = config.icon

      return (
        <Badge variant="outline" className={`${config.color} border font-normal`}>
            <Icon className="h-3 w-3 mr-1" />
            {config.label}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'totalAmount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Total" />
    ),
    cell: ({ row }) => {
        const amount = parseFloat(row.getValue('totalAmount'))
        const discount = Number(row.original.discountAmount || 0)

        return (
            <div className="flex flex-col items-end font-medium">
                <span>{formatCurrency(amount)}</span>
                {discount > 0 && (
                    <span className="text-xs text-red-500">-{formatCurrency(discount)}</span>
                )}
            </div>
        )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const order = row.original
      return (
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
      )
    },
  },
]
