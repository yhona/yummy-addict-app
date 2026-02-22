import React from 'react'
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
} from '@tanstack/react-table'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Search, Inbox } from 'lucide-react'

// Generic Pagination signature if we map it to standard limits
export interface PaginationConfig {
  page: number
  total: number
  perPage: number
  onPageChange: (page: number) => void
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  isLoading?: boolean
  searchable?: boolean
  searchPlaceholder?: string
  globalFilter?: string
  onGlobalFilterChange?: (value: string) => void
  onRowClick?: (row: TData) => void
  pagination?: PaginationConfig
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading = false,
  searchable = false,
  searchPlaceholder = 'Cari data...',
  globalFilter,
  onGlobalFilterChange,
  onRowClick,
  pagination,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    // Allow external manual filtering or internal tracking
    state: {
      sorting,
      globalFilter,
    },
    onGlobalFilterChange,
    getFilteredRowModel: getFilteredRowModel(),
  })

  return (
    <div className="space-y-4">
      {/* Optional Search Bar */}
      {searchable && onGlobalFilterChange && (
        <div className="flex items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={globalFilter ?? ''}
              onChange={(event) => onGlobalFilterChange(event.target.value)}
              className="pl-8"
            />
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="rounded-md border bg-card">
        <div className="overflow-x-auto w-full">
          <Table>
            <TableHeader className="bg-muted/50">
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="whitespace-nowrap">
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
              {isLoading ? (
                // LOADING SKELETON
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    {columns.map((_, cellIdx) => (
                      <TableCell key={`cell-skeleton-${cellIdx}`}>
                        <Skeleton className="h-6 w-full" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : table.getRowModel().rows?.length ? (
                // ACTUAL DATA ROWS
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                    onClick={() => onRowClick && onRowClick(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="whitespace-nowrap">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                // EMPTY STATE
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-48 text-center">
                    <div className="flex flex-col items-center justify-center text-muted-foreground space-y-3">
                      <Inbox className="h-10 w-10 text-muted-foreground/50" />
                      <p>Belum ada rekaman data ditemukan.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Simple Pagination UI Placeholder if passed */}
      {pagination && (
        <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
          <div>
            Menampilkan data {(pagination.page - 1) * pagination.perPage + 1} s/d {Math.min(pagination.page * pagination.perPage, pagination.total)} dari {pagination.total} rekaman.
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => pagination.onPageChange(pagination.page - 1)}
            >
              Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={pagination.page * pagination.perPage >= pagination.total}
              onClick={() => pagination.onPageChange(pagination.page + 1)}
            >
              Selanjutnya
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
