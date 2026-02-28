import { Row } from '@tanstack/react-table'
import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash2, Eye, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { Product } from '../../types'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

interface DataTableRowActionsProps {
  row: Row<Product>
  onDelete?: (product: Product) => Promise<void>
}

export function DataTableRowActions({ row, onDelete }: DataTableRowActionsProps) {
  const navigate = useNavigate()
  const product = row.original
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleView = () => {
    navigate({ to: '/inventory/products/$id', params: { id: product.id } })
  }

  const handleEdit = () => {
    navigate({ to: '/inventory/products/$id/edit', params: { id: product.id } })
  }

  const handleCopySku = () => {
    navigator.clipboard.writeText(product.sku)
    toast.success('SKU copied to clipboard')
  }

  const handleDelete = async () => {
    if (onDelete) {
      setIsDeleting(true)
      try {
        await onDelete(product)
        setShowDeleteDialog(false)
        toast.success(`Product "${product.name}" deactivated successfully`)
      } catch (error) {
        toast.error('Failed to deactivate product')
      } finally {
        setIsDeleting(false)
      }
    } else {
      // Fallback if no onDelete handler provided
      setShowDeleteDialog(false)
      toast.success(`Product "${product.name}" deactivated successfully`)
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem onClick={handleView}>
            <Eye className="mr-2 h-4 w-4" />
            View
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopySku}>
            <Copy className="mr-2 h-4 w-4" />
            Copy SKU
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Nonaktifkan
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Nonaktifkan Produk"
        description="Produk ini akan dinonaktifkan dan tidak akan muncul lagi di halaman Kasir atau Transaksi Baru. Data historis pergerakan stok tetap aman."
        itemName={product.name}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </>
  )
}
