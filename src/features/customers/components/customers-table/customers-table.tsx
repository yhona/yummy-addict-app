import {
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
import { toast } from 'sonner'
import { columns, Customer } from './columns'

interface CustomersTableProps {
  data: Customer[]
  onEdit?: (customer: Customer) => void
  onDelete?: (customer: Customer) => Promise<void>
  onBulkDelete?: (customers: Customer[]) => Promise<void>
}

export function CustomersTable({
  data,
  onEdit,
  onDelete,
  onBulkDelete,
}: CustomersTableProps) {
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
      onEdit,
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
        const customers = selectedRows.map((row) => row.original)
        await onBulkDelete(customers)
        setShowBulkDeleteDialog(false)
        setRowSelection({})
        toast.success(`${customers.length} customers deleted successfully`)
      } catch {
        toast.error('Failed to delete customers')
      } finally {
        setIsBulkDeleting(false)
      }
    }
  }

  const handleExport = () => {
    const rowsToExport = hasSelection
      ? selectedRows.map((row) => row.original)
      : data

    const headers = ['Name', 'Phone', 'Email', 'Address', 'Created']
    const csvRows = [
      headers.join(','),
      ...rowsToExport.map((customer) =>
        [
          `"${customer.name}"`,
          customer.phone || '',
          customer.email || '',
          `"${customer.address || ''}"`,
          new Date(customer.createdAt).toLocaleDateString(),
        ].join(',')
      ),
    ]
    const csvContent = csvRows.join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `customers_export_${new Date().toISOString().split('T')[0]}.csv`
    link.click()

    toast.success(`Exported ${rowsToExport.length} customers to CSV`)
  }

  return (
    <div className="space-y-4">
      <DataTableToolbar table={table} />

      {/* Bulk Actions Bar */}
      {hasSelection && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-2">
          <span className="text-sm text-muted-foreground">
            {selectedRows.length} customer(s) selected
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Export Selected
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowBulkDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Selected
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
                  No customers found.
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
        title="Delete Selected Customers"
        description={`This will permanently delete ${selectedRows.length} selected customer(s). This action cannot be undone.`}
        onConfirm={handleBulkDelete}
        isLoading={isBulkDeleting}
      />
    </div>
  )
}
