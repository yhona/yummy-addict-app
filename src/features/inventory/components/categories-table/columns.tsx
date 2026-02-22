import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { DataTableRowActions } from './data-table-row-actions'
import { Category } from '../../types'
import { FolderTree, Folder } from 'lucide-react'

// Extended category type with stats
interface CategoryWithStats extends Category {
  childrenCount?: number
  parentName?: string
}

export const columns: ColumnDef<CategoryWithStats>[] = [
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
    accessorKey: 'code',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Code" />
    ),
    cell: ({ row }) => (
      <div className="font-mono text-sm">{row.getValue('code')}</div>
    ),
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category Name" />
    ),
    cell: ({ row }) => {
      const category = row.original
      const isParent = !category.parentId
      return (
        <div className="flex items-center gap-2">
          {isParent ? (
            <FolderTree className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Folder className="h-4 w-4 text-muted-foreground ml-4" />
          )}
          <span className="font-medium">{row.getValue('name')}</span>
        </div>
      )
    },
  },
  {
    accessorKey: 'parentName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Parent Category" />
    ),
    cell: ({ row }) => {
      const parentName = row.original.parentName
      return parentName ? (
        <Badge variant="outline">{parentName}</Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  },
  {
    accessorKey: 'childrenCount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Sub-categories" />
    ),
    cell: ({ row }) => {
      const count = row.original.childrenCount || 0
      return count > 0 ? (
        <Badge variant="secondary">{count} sub</Badge>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
  },
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => {
      const description = row.getValue('description') as string
      return description ? (
        <span className="text-muted-foreground line-clamp-1 max-w-[200px]">
          {description}
        </span>
      ) : (
        <span className="text-muted-foreground">-</span>
      )
    },
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
      const meta = table.options.meta as {
        onEdit?: (category: Category) => void
        onDelete?: (category: Category) => Promise<void>
      } | undefined
      return (
        <DataTableRowActions
          row={row}
          onEdit={meta?.onEdit}
          onDelete={meta?.onDelete}
        />
      )
    },
  },
]
