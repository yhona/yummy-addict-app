import { MoreHorizontal, Eye, Trash, RefreshCcw } from 'lucide-react'
import { Row } from '@tanstack/react-table'
import { OpnameSession } from '../../types'
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useState } from 'react'
import { useDeleteOpname } from '../../api/opname'
import { useNavigate } from '@tanstack/react-router'

interface DataTableRowActionsProps {
  row: Row<OpnameSession>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const session = row.original
  const navigate = useNavigate()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const deleteMutation = useDeleteOpname()

  const isFinalized = session.status === 'finalized'

  const handleDelete = () => {
    deleteMutation.mutate(session.id, {
      onSuccess: () => {
        setShowDeleteDialog(false)
      },
      onError: (error) => {
        setShowDeleteDialog(false)
        console.error('Failed to delete opname:', error)
      },
    })
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
            <span className="sr-only">Buka menu aksi</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuLabel>Aksi</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() =>
              navigate({ to: `/inventory/opname/${session.id}` })
            }
          >
            {isFinalized ? (
              <Eye className="mr-2 h-4 w-4" />
            ) : (
              <RefreshCcw className="mr-2 h-4 w-4" />
            )}
            {isFinalized ? 'Lihat Laporan' : 'Lanjutkan Hitung'}
          </DropdownMenuItem>
          {!isFinalized && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash className="mr-2 h-4 w-4" />
                Batalkan Sesi
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Batalkan Sesi Opname?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini akan membatalkan dan menghapus permanen draf perhitungan stok untuk sesi <strong>{session.number}</strong>. Data yang sudah diinput tidak dapat dikembalikan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Kembali
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Membatalkan...' : 'Ya, Batalkan'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
