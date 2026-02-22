import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router'
import { useSupplier, useDeleteSupplier, useUpdateSupplier } from '@/features/purchasing/api'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Pencil, Trash, Mail, Phone, MapPin, Building2, User } from 'lucide-react'
import { toast } from 'sonner'
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { SupplierForm } from '@/features/purchasing/components/supplier-form'
import { Skeleton } from '@/components/ui/skeleton'

export const Route = createFileRoute('/_authenticated/purchasing/suppliers/$id')({
  component: SupplierDetailPage,
})

function SupplierDetailPage() {
  const { id } = Route.useParams()
  const navigate = useNavigate()
  const { data: supplier, isLoading } = useSupplier(id)
  const deleteSupplier = useDeleteSupplier()
  const updateSupplier = useUpdateSupplier()
  
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)

  const handleDelete = () => {
    deleteSupplier.mutate(id, {
      onSuccess: () => {
        toast.success("Supplier deleted")
        navigate({ to: '/purchasing/suppliers' })
      },
      onError: (err: any) => {
        toast.error("Failed to delete", { description: err.message })
      }
    })
  }

  const handleUpdate = (values: any) => {
    updateSupplier.mutate({ id, data: values }, {
      onSuccess: () => {
        toast.success("Supplier updated")
        setEditOpen(false)
      },
      onError: (err: any) => {
        toast.error("Failed to update", { description: err.message })
      }
    })
  }

  if (isLoading) {
    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
            <Skeleton className="h-[200px] w-full" />
        </div>
    )
  }

  if (!supplier) {
      return <div className="p-6">Supplier not found</div>
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate({ to: '/purchasing/suppliers' })}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              {supplier.name}
              <Badge variant={supplier.isActive ? 'default' : 'secondary'}>
                {supplier.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </h1>
            <p className="text-muted-foreground font-mono text-sm">{supplier.code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
            <Trash className="mr-2 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Info */}
        <Card className="md:col-span-2">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5" /> Company Details
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1">
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <User className="h-4 w-4" /> Contact Person
                        </span>
                        <p className="text-lg">{supplier.contactPerson || '-'}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Phone className="h-4 w-4" /> Phone
                        </span>
                        <p className="text-lg">{supplier.phone || '-'}</p>
                    </div>
                    <div className="space-y-1">
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Mail className="h-4 w-4" /> Email
                        </span>
                        <p className="text-lg">{supplier.email || '-'}</p>
                    </div>
                    <div className="space-y-1 sm:col-span-2">
                        <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <MapPin className="h-4 w-4" /> Address
                        </span>
                        <p className="text-lg">{supplier.address || '-'}</p>
                    </div>
                </div>
            </CardContent>
        </Card>

        {/* Stats / Quick Actions or Future Purchase History */}
        <div className="space-y-6">
             <Card>
                <CardHeader>
                    <CardTitle>Purchase Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No purchase history yet.</p>
                        <Button variant="link" className="mt-2">Create Purchase Order</Button>
                    </div>
                </CardContent>
             </Card>
        </div>
      </div>

       {/* Edit Dialog */}
       <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Supplier</DialogTitle>
                </DialogHeader>
                <SupplierForm 
                    key={supplier.id}
                    onSubmit={handleUpdate} 
                    isLoading={updateSupplier.isPending} 
                    defaultValues={supplier}
                />
            </DialogContent>
        </Dialog>

         {/* Delete Alert */}
         <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Delete Supplier?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This will permanently delete "{supplier.name}". 
                        Ensure there are no active Purchase Orders linked to this supplier.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                        {deleteSupplier.isPending ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  )
}
