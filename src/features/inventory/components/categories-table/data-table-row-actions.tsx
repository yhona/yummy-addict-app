import { Row } from '@tanstack/react-table'
import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash2, Copy } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog'
import { Category } from '../../types'
import { toast } from 'sonner'

interface DataTableRowActionsProps {
  row: Row<Category>
  onEdit?: (category: Category) => void
  onDelete?: (category: Category) => Promise<void>
}

export function DataTableRowActions({ row, onEdit, onDelete }: DataTableRowActionsProps) {
  const category = row.original
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleEdit = () => {
    if (onEdit) {
      onEdit(category)
    } else {
      toast.info(`Edit category: ${category.name}`)
    }
  }

  const handleCopyCode = () => {
    navigator.clipboard.writeText(category.code || '')
    toast.success('Category code copied to clipboard')
  }

  const handleDelete = async () => {
    if (onDelete) {
      setIsDeleting(true)
      try {
        await onDelete(category)
        setShowDeleteDialog(false)
        toast.success(`Category "${category.name}" deleted successfully`)
      } catch (error) {
        toast.error('Failed to delete category')
      } finally {
        setIsDeleting(false)
      }
    } else {
      setShowDeleteDialog(false)
      toast.success(`Category "${category.name}" deleted successfully`)
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
          <DropdownMenuItem onClick={handleEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleCopyCode}>
            <Copy className="mr-2 h-4 w-4" />
            Copy Code
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Delete Category"
        itemName={category.name}
        onConfirm={handleDelete}
        isLoading={isDeleting}
      />
    </>
  )
}
