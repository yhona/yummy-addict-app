import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useSuppliers, useCreateSupplier, useUpdateSupplier, useDeleteSupplier } from '@/features/purchasing/api'
import { SupplierForm } from '@/features/purchasing/components/supplier-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Plus, MoreHorizontal, Pencil, Trash, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'

export const Route = createFileRoute('/_authenticated/purchasing/suppliers/')({
  component: SuppliersPage,
})

function SuppliersPage() {
    const navigate = useNavigate()
    const { data: suppliersData, isLoading } = useSuppliers()
    const createSupplier = useCreateSupplier()
    const updateSupplier = useUpdateSupplier()
    const deleteSupplier = useDeleteSupplier()
    
    const [createOpen, setCreateOpen] = useState(false)
    const [editOpen, setEditOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [selectedSupplier, setSelectedSupplier] = useState<any>(null)

    const handleCreate = (values: any) => {
        createSupplier.mutate(values, {
            onSuccess: () => {
                toast.success("Supplier created")
                setCreateOpen(false)
            },
            onError: (err: any) => {
                toast.error("Failed to create", { description: err.message || "Unknown error" })
            }
        })
    }

    const handleUpdate = (values: any) => {
        if (!selectedSupplier) return
        updateSupplier.mutate({ id: selectedSupplier.id, data: values }, {
            onSuccess: () => {
                toast.success("Supplier updated")
                setEditOpen(false)
                setSelectedSupplier(null)
            },
            onError: (err: any) => {
                toast.error("Failed to update", { description: err.message || "Unknown error" })
            }
        })
    }

    const handleDelete = () => {
        if (!selectedSupplier) return
        deleteSupplier.mutate(selectedSupplier.id, {
            onSuccess: () => {
                toast.success("Supplier deleted")
                setDeleteOpen(false)
                setSelectedSupplier(null)
            },
            onError: (err: any) => {
                toast.error("Failed to delete", { description: err.message || "Unknown error" })
            }
        })
    }

    const openEdit = (supplier: any) => {
        setSelectedSupplier(supplier)
        setEditOpen(true)
    }

    const openDelete = (supplier: any) => {
        setSelectedSupplier(supplier)
        setDeleteOpen(true)
    }

    return (
        <div className="p-6 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
                <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                        <Button><Plus className="mr-2 h-4 w-4"/> Add Supplier</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>New Supplier</DialogTitle>
                        </DialogHeader>
                        <SupplierForm onSubmit={handleCreate} isLoading={createSupplier.isPending} />
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Supplier List</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? <div>Loading...</div> : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="w-[80px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {suppliersData?.data.map((supplier: any) => (
                                    <TableRow key={supplier.id}>
                                        <TableCell className="font-mono text-xs">{supplier.code}</TableCell>
                                        <TableCell>
                                            <div 
                                                className="font-medium hover:underline cursor-pointer text-primary"
                                                onClick={() => navigate({ to: `/purchasing/suppliers/${supplier.id}` })}
                                            >
                                                {supplier.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>{supplier.contactPerson}</TableCell>
                                        <TableCell>{supplier.phone}</TableCell>
                                        <TableCell>{supplier.isActive ? "Active" : "Inactive"}</TableCell>
                                        <TableCell>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem onClick={() => navigate({ to: `/purchasing/suppliers/${supplier.id}` })}>
                                                        <FileText className="mr-2 h-4 w-4" /> View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openEdit(supplier)}>
                                                        <Pencil className="mr-2 h-4 w-4" /> Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => openDelete(supplier)} className="text-destructive focus:text-destructive">
                                                        <Trash className="mr-2 h-4 w-4" /> Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {suppliersData?.data.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center text-muted-foreground h-20">No suppliers found</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={editOpen} onOpenChange={setEditOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Supplier</DialogTitle>
                    </DialogHeader>
                    {selectedSupplier && (
                        <SupplierForm 
                            key={selectedSupplier.id}
                            onSubmit={handleUpdate} 
                            isLoading={updateSupplier.isPending} 
                            defaultValues={selectedSupplier}
                        />
                    )}
                </DialogContent>
            </Dialog>

            {/* Delete Alert */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the supplier "{selectedSupplier?.name}".
                            This action cannot be undone.
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
