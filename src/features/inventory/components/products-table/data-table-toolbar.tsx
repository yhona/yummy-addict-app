import { Cross2Icon } from '@radix-ui/react-icons'
import { Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Scan } from 'lucide-react'
import { BarcodeScanner } from '@/components/ui/barcode-scanner'
import { toast } from 'sonner'
import { useState } from 'react'
import { DataTableViewOptions } from '@/components/data-table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Category } from '../../types'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  categories: Category[]
}

export function DataTableToolbar<TData>({
  table,
  categories,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const [isScannerOpen, setIsScannerOpen] = useState(false)

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Search products..."
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('name')?.setFilterValue(event.target.value)
          }
          className="h-9 w-[150px] lg:w-[250px]"
        />
        <Button
          variant="outline"
          size="icon"
          onClick={() => setIsScannerOpen(true)}
          title="Scan Barcode to Search"
          className="h-9 w-9 shrink-0"
        >
          <Scan className="h-4 w-4" />
        </Button>

        {/* Category Filter */}
        <Select
          value={
            (table.getColumn('categoryName')?.getFilterValue() as string) ?? ''
          }
          onValueChange={(value) =>
            table
              .getColumn('categoryName')
              ?.setFilterValue(value === 'all' ? '' : value)
          }
        >
          <SelectTrigger className="h-9 w-[150px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.name}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={
            (table.getColumn('isActive')?.getFilterValue() as string) ?? 'all'
          }
          onValueChange={(value) =>
            table.getColumn('isActive')?.setFilterValue(value)
          }
        >
          <SelectTrigger className="h-9 w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>

        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-9 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <DataTableViewOptions table={table} />
      <BarcodeScanner
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
        onScan={(code) => {
          table.getColumn('barcode')?.setFilterValue(code)
          toast.success(`Scanning for: ${code}`)
        }}
      />
    </div>
  )
}
