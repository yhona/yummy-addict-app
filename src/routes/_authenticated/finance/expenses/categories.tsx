import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Pencil, Trash } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import {
  useExpenseCategoryList,
  useCreateExpenseCategory,
  useUpdateExpenseCategory,
  useDeleteExpenseCategory,
} from '@/features/finance/api/expenses'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { DataTable } from '@/components/ui/data-table'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { ExpenseCategory } from '@/features/finance/types'

export const Route = createFileRoute('/_authenticated/finance/expenses/categories')({
  component: ExpenseCategoriesPage,
})

function ExpenseCategoriesPage() {
  const { data: categories } = useExpenseCategoryList()
  const createMutation = useCreateExpenseCategory()
  const updateMutation = useUpdateExpenseCategory()
  const deleteMutation = useDeleteExpenseCategory()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<ExpenseCategory | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const handleOpenDialog = (category?: ExpenseCategory) => {
    if (category) {
      setEditingCategory(category)
      setName(category.name)
      setDescription(category.description || '')
    } else {
      setEditingCategory(null)
      setName('')
      setDescription('')
    }
    setIsDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        await updateMutation.mutateAsync({
          id: editingCategory.id,
          data: { name, description },
        })
        toast.success('Kategori berhasil diperbarui')
      } else {
        await createMutation.mutateAsync({ name, description })
        toast.success('Kategori berhasil ditambahkan')
      }
      setIsDialogOpen(false)
    } catch (error) {
      // Error is handled globally by api-client toast
    }
  }

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Apakah Anda yakin ingin menonaktifkan kategori ini?')) return
    
    try {
      await deleteMutation.mutateAsync(categoryId)
      toast.success('Kategori dinonaktifkan')
    } catch (error) {
      // Handled globally
    }
  }

  const columns: ColumnDef<ExpenseCategory>[] = [
    {
      accessorKey: 'name',
      header: 'Nama Kategori',
      cell: ({ row }) => <div className="font-medium">{row.original.name}</div>,
    },
    {
      accessorKey: 'description',
      header: 'Deskripsi',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {row.original.description || '-'}
        </span>
      ),
    },
    {
      accessorKey: 'createdAt',
      header: 'Dibuat Pada',
      cell: ({ row }) => format(new Date(row.original.createdAt), 'dd MMM yyyy', { locale: id }),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        return (
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => handleOpenDialog(row.original)}
              title="Edit"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="destructive"
              size="icon"
              onClick={() => handleDelete(row.original.id)}
              title="Nonaktifkan"
            >
              <Trash className="w-4 h-4" />
            </Button>
          </div>
        )
      },
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-6 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Kategori Pengeluaran</h1>
          <p className="text-sm text-muted-foreground">
            Kelola daftar kategori untuk mengelompokkan pengeluaran operasional.
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()} className="gap-2">
              <Plus className="w-4 h-4" />
              Tambah Kategori
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Nama Kategori</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Contoh: Listrik, Gaji, dll"
                  required
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Deskripsi (Opsional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tambahkan keterangan jika perlu..."
                  rows={3}
                />
              </div>
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Batal
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  Simpan
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Daftar Kategori</CardTitle>
          <CardDescription>Semua kategori aktif</CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable
            columns={columns}
            data={categories || []}
          />
        </CardContent>
      </Card>
    </div>
  )
}
