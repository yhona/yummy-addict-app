import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { DataTablePagination } from '@/components/data-table'
import { DataTableToolbar } from './data-table-toolbar'
import { useState } from 'react'
import { Trash2, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { Category, Product } from '../../types'
import { toast } from 'sonner'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  categories: Category[]
  onDelete?: (product: Product) => Promise<void>
  onBulkDelete?: (products: Product[]) => Promise<void>
}

export function ProductsTable<TData, TValue>({
  columns,
  data,
  categories,
  onDelete,
  onBulkDelete,
}: DataTableProps<TData, TValue>) {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false)
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    meta: {
      onDelete,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const hasSelection = selectedRows.length > 0

  const handleBulkDelete = async () => {
    if (onBulkDelete && selectedRows.length > 0) {
      setIsBulkDeleting(true)
      try {
        const products = selectedRows.map((row) => row.original as Product)
        await onBulkDelete(products)
        setShowBulkDeleteDialog(false)
        setRowSelection({})
        toast.success(`${products.length} products deactivated successfully`)
      } catch {
        toast.error('Failed to deactivate products')
      } finally {
        setIsBulkDeleting(false)
      }
    }
  }

  const handleExport = () => {
    // Get selected rows or all rows if nothing selected
    const rowsToExport = hasSelection
      ? selectedRows.map((row) => row.original as Product)
      : (data as Product[])

    // Create CSV content
    const headers = ['SKU', 'Name', 'Category', 'Stock', 'Cost Price', 'Selling Price', 'Status']
    const csvRows = [
      headers.join(','),
      ...rowsToExport.map((product) =>
        [
          product.sku,
          `"${product.name}"`,
          product.categoryName || '',
          product.currentStock,
          product.costPrice,
          product.sellingPrice,
          product.isActive ? 'Active' : 'Inactive',
        ].join(',')
      ),
    ]
    const csvContent = csvRows.join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `products_export_${new Date().toISOString().split('T')[0]}.csv`
    link.click()

    toast.success(
      `Exported ${rowsToExport.length} products to CSV`
    )
  }

  return (
    <div className="space-y-4">
      <DataTableToolbar table={table} categories={categories} />

      {/* Bulk Actions Bar */}
      {hasSelection && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-2">
          <span className="text-sm text-muted-foreground">
            {selectedRows.length} product(s) selected
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
            >
              <Download className="mr-2 h-4 w-4" />
              Export Selected
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowBulkDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Nonaktifkan Terpilih
            </Button>
          </div>
        </div>
      )}

      {/* Export All Button (when no selection) */}
      {!hasSelection && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export All to CSV
          </Button>
        </div>
      )}

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} colSpan={header.colSpan}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No products found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />

      <ConfirmDeleteDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        title="Nonaktifkan Produk Terpilih"
        description={`Anda akan menonaktifkan ${selectedRows.length} produk. Produk-produk ini tidak akan muncul lagi di halaman Transaksi, tetapi data logistik dan historisnya tetap aman.`}
        onConfirm={handleBulkDelete}
        isLoading={isBulkDeleting}
      />
    </div>
  )
}
