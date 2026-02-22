import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { DataTableRowActions } from './data-table-row-actions'
import { format } from 'date-fns'
import { Link } from '@tanstack/react-router'

export interface Customer {
  id: string
  name: string
  phone: string | null
  email: string | null
  address: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export const columns: ColumnDef<Customer>[] = [
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
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <Link
        to={`/customers/${row.original.id}`}
        className="font-medium hover:text-primary hover:underline"
      >
        {row.getValue('name')}
      </Link>
    ),
  },
  {
    accessorKey: 'phone',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phone" />
    ),
    cell: ({ row }) => {
      const phone = row.getValue('phone') as string | null
      return <span className="text-muted-foreground">{phone || '-'}</span>
    },
  },
  {
    accessorKey: 'email',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
    cell: ({ row }) => {
      const email = row.getValue('email') as string | null
      return <span className="text-muted-foreground">{email || '-'}</span>
    },
  },
  {
    accessorKey: 'address',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Address" />
    ),
    cell: ({ row }) => {
      const address = row.getValue('address') as string | null
      return (
        <span className="text-muted-foreground max-w-[200px] truncate block">
          {address || '-'}
        </span>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      const date = row.getValue('createdAt') as string
      return (
        <span className="text-muted-foreground">
          {format(new Date(date), 'MMM d, yyyy')}
        </span>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row, table }) => {
      const meta = table.options.meta as { 
        onEdit?: (customer: Customer) => void
        onDelete?: (customer: Customer) => Promise<void> 
      } | undefined
      return <DataTableRowActions row={row} onEdit={meta?.onEdit} onDelete={meta?.onDelete} />
    },
  },
]
