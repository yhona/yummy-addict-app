import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { DataTableRowActions } from './data-table-row-actions'
import { Product } from '../../types'

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

// Format currency to IDR
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(value)
}

// Get stock status
const getStockStatus = (product: Product) => {
  if (product.currentStock === 0) {
    return { label: 'Out of Stock', variant: 'destructive' as const }
  }
  if (product.currentStock <= product.minStock) {
    return { label: 'Low Stock', variant: 'warning' as const }
  }
  return { label: 'In Stock', variant: 'success' as const }
}

export const columns: ColumnDef<Product>[] = [
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
    accessorKey: 'image',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Image" />
    ),
    cell: ({ row }) => {
      const image = row.getValue('image') as string | undefined
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'

      return (
        <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border bg-muted">
          {image ? (
            <img
              src={image.startsWith('http') ? image : `${apiUrl}${image}`}
              alt={row.getValue('name')}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
              -
            </div>
          )}
        </div>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'barcode',
    header: 'Barcode',
    enableHiding: true,
    filterFn: 'includesString',
    size: 0,
    cell: () => null, // Hidden visually in table body if shown, but usually we hide the whole column
  },
  {
    accessorKey: 'sku',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="SKU" />
    ),
    cell: ({ row }) => (
      <div className="font-mono text-sm">{row.getValue('sku')}</div>
    ),
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Product Name" />
    ),
    cell: ({ row }) => {
      const product = row.original
      return (
        <div className='flex flex-col gap-1'>
          <div className='flex items-center gap-2'>
            <span className='font-medium'>{product.name}</span>
            {product.isBulk && (
              <Badge
                variant='secondary'
                className='h-4 border-blue-200 bg-blue-100 px-1 text-[10px] uppercase text-blue-700 hover:bg-blue-200'
              >
                Bulk
              </Badge>
            )}
            {product.type === 'bundle' && (
              <Badge
                variant='secondary'
                className='h-4 border-amber-200 bg-amber-100 px-1 text-[10px] uppercase text-amber-700 hover:bg-amber-200'
              >
                Bundle
              </Badge>
            )}
            {product.parentId && (
              <Badge
                variant='secondary'
                className='h-4 border-purple-200 bg-purple-100 px-1 text-[10px] uppercase text-purple-700 hover:bg-purple-200'
              >
                Retail
              </Badge>
            )}
          </div>
          <div className='flex items-center gap-2'>
            {product.barcode && (
              <span className='font-mono text-xs text-muted-foreground'>
                {product.barcode}
              </span>
            )}
            {product.parentId && product.parentName && (
              <span className='text-[10px] text-muted-foreground'>
                From: <span className="font-medium text-foreground/70">{product.parentName}</span>
              </span>
            )}
            {product.conversionRatio !== 1 && (
              <span className='text-[10px] italic text-muted-foreground'>
                (1 Bulk = {1 / product.conversionRatio} Unit)
              </span>
            )}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'categoryName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" />
    ),
    cell: ({ row }) => {
      const category = row.getValue('categoryName') as string
      return category ? (
        <Badge variant="outline">{category}</Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'currentStock',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Stock" />
    ),
    cell: ({ row }) => {
      const product = row.original
      const stockStatus = getStockStatus(product)
      return (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex flex-col items-start gap-1 cursor-help">
                <span
                  className={cn(
                    'font-medium',
                    product.currentStock === 0 && 'text-destructive',
                    product.currentStock <= product.minStock &&
                      product.currentStock > 0 &&
                      'text-warning'
                  )}
                >
                  {product.currentStock} {product.unitName}
                </span>
                <Badge
                  variant={
                    stockStatus.variant === 'success'
                      ? 'default'
                      : stockStatus.variant === 'warning'
                        ? 'secondary'
                        : 'destructive'
                  }
                  className={cn(
                    'text-xs',
                    stockStatus.variant === 'success' &&
                      'bg-green-500/10 text-green-500 hover:bg-green-500/20',
                    stockStatus.variant === 'warning' &&
                      'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
                  )}
                >
                  {stockStatus.label}
                </Badge>
              </div>
            </TooltipTrigger>
            <TooltipContent className="w-50">
              <div className="grid gap-1">
                <h4 className="font-medium leading-none mb-1">Stock Details</h4>
                {product.stockDetails && product.stockDetails.length > 0 ? (
                  product.stockDetails.map((detail, index) => (
                    <div key={index} className="flex justify-between gap-4 text-xs">
                      <span className="text-muted-foreground">{detail.warehouseName}:</span>
                      <span className="font-mono">{detail.quantity}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground">No details available</span>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )
    },
  },
  {
    accessorKey: 'costPrice',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Cost" />
    ),
    cell: ({ row }) => (
      <div className="text-muted-foreground">
        {formatCurrency(row.getValue('costPrice'))}
      </div>
    ),
  },
  {
    accessorKey: 'sellingPrice',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Selling Price" />
    ),
    cell: ({ row }) => (
      <div className="font-medium">
        {formatCurrency(row.getValue('sellingPrice'))}
      </div>
    ),
  },
  {
    accessorKey: 'isActive',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const isActive = row.getValue('isActive') as boolean
      return (
        <Badge variant={isActive ? 'default' : 'secondary'}>
          {isActive ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      if (value === 'all') return true
      if (value === 'active') return row.getValue(id) === true
      if (value === 'inactive') return row.getValue(id) === false
      return true
    },
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const meta = table.options.meta as { onDelete?: (product: Product) => Promise<void> } | undefined
      return <DataTableRowActions row={row} onDelete={meta?.onDelete} />
    },
  },
]
