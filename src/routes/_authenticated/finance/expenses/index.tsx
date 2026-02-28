import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash, Search } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { ColumnDef } from '@tanstack/react-table'

import {
  useExpenseList,
  useDeleteExpense,
} from '@/features/finance/api/expenses'
import { Expense } from '@/features/finance/types'
import { DataTable } from '@/components/ui/data-table'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { ExpenseDialog } from '@/features/finance/components/expense-dialog'

export const Route = createFileRoute('/_authenticated/finance/expenses/')({
  component: ExpensesPage,
})

function ExpensesPage() {
  const [page, setPage] = useState(1)
  const limit = 10
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)

  const { data } = useExpenseList({
    page,
    limit,
    search: debouncedSearch,
  })

  // Debounce search
  useState(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 500)
    return () => clearTimeout(handler)
  })

  const deleteMutation = useDeleteExpense()

  const handleEdit = (expense: Expense) => {
    setSelectedExpense(expense)
    setIsDialogOpen(true)
  }

  const handleCreate = () => {
    setSelectedExpense(null)
    setIsDialogOpen(true)
  }

  const handleDelete = async (expenseId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data pengeluaran ini?')) return
    try {
      await deleteMutation.mutateAsync(expenseId)
      toast.success('Pengeluaran berhasil dihapus')
    } catch (error) {
      // Handled globally
    }
  }

  const paymentMethodBadge = (method: string) => {
    switch (method) {
      case 'cash':
        return <Badge variant="outline">Tunai</Badge>
      case 'transfer':
        return <Badge className="bg-blue-600">Transfer</Badge>
      case 'credit':
        return <Badge variant="secondary">Kredit</Badge>
      default:
        return <Badge variant="outline">{method}</Badge>
    }
  }

  const columns: ColumnDef<Expense>[] = [
    {
      accessorKey: 'number',
      header: 'No. Ref',
      cell: ({ row }) => <span className="font-mono text-sm">{row.original.number}</span>,
    },
    {
      accessorKey: 'date',
      header: 'Tanggal',
      cell: ({ row }) => format(new Date(row.original.date), 'dd MMM yyyy', { locale: id }),
    },
    {
      accessorKey: 'title',
      header: 'Keterangan',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.original.title}</span>
          {row.original.notes && (
            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
              {row.original.notes}
            </span>
          )}
        </div>
      ),
    },
    {
      accessorKey: 'categoryName',
      header: 'Kategori',
      cell: ({ row }) => <Badge variant="secondary">{row.original.categoryName}</Badge>,
    },
    {
      accessorKey: 'paymentMethod',
      header: 'Metode',
      cell: ({ row }) => paymentMethodBadge(row.original.paymentMethod),
    },
    {
      accessorKey: 'amount',
      header: 'Nominal',
      cell: ({ row }) => (
        <span className="font-semibold text-red-600">
          {formatCurrency(Number(row.original.amount))}
        </span>
      ),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        return (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleEdit(row.original)}
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => handleDelete(row.original.id)}
              title="Hapus"
            >
              <Trash className="w-4 h-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  // Calculate total for summary cards
  const totalAmountThisPage = data?.data.reduce((sum, item) => sum + Number(item.amount), 0) || 0

  return (
    <div className="flex flex-col gap-6 p-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pengeluaran</h1>
          <p className="text-sm text-muted-foreground">
            Monitor dan catat seluruh pengeluaran operasional di sini.
          </p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Catat Pengeluaran
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total di Halaman Ini</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(totalAmountThisPage)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Daftar Riwayat</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Cari referensi atau judul..."
                  className="pl-8"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={data?.data || []}
          />
          
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <div className="text-sm">
                Hal {page} dari {data.pagination.totalPages}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <ExpenseDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        expense={selectedExpense}
      />
    </div>
  )
}
