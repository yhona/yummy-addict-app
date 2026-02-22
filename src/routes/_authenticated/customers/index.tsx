import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { useCustomers, useCreateCustomer, useUpdateCustomer, useDeleteCustomer } from '@/features/customers/api/customers'
import { CustomersTable, Customer } from '@/features/customers/components/customers-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Users, Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export const Route = createFileRoute('/_authenticated/customers/')({
  component: CustomersPage,
})

interface CustomerForm {
  name: string
  phone: string
  email: string
  address: string
}

function CustomersPage() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [formData, setFormData] = useState<CustomerForm>({
    name: '',
    phone: '',
    email: '',
    address: '',
  })

  const { data, isLoading, refetch } = useCustomers({ limit: 500 })
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const deleteCustomer = useDeleteCustomer()

  const customers: Customer[] = data?.data || []

  const openCreateDialog = () => {
    setEditingCustomer(null)
    setFormData({ name: '', phone: '', email: '', address: '' })
    setDialogOpen(true)
  }

  const openEditDialog = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      email: customer.email || '',
      address: customer.address || '',
    })
    setDialogOpen(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (editingCustomer) {
      updateCustomer.mutate(
        { id: editingCustomer.id, data: formData },
        {
          onSuccess: () => {
            toast.success('Customer updated')
            setDialogOpen(false)
            refetch()
          },
          onError: (err: any) => toast.error(err.message || 'Failed to update'),
        }
      )
    } else {
      createCustomer.mutate(formData, {
        onSuccess: () => {
          toast.success('Customer created')
          setDialogOpen(false)
          refetch()
        },
        onError: (err: any) => toast.error(err.message || 'Failed to create'),
      })
    }
  }

  const handleDelete = async (customer: Customer) => {
    return new Promise<void>((resolve, reject) => {
      deleteCustomer.mutate(customer.id, {
        onSuccess: () => {
          toast.success('Customer deleted')
          refetch()
          resolve()
        },
        onError: (err: any) => {
          toast.error(err.message || 'Failed to delete')
          reject(err)
        },
      })
    })
  }

  const handleBulkDelete = async (selectedCustomers: Customer[]) => {
    for (const customer of selectedCustomers) {
      await handleDelete(customer)
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-6 w-6" />
            Customers
          </h1>
          <p className="text-muted-foreground">Manage your customer database</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* TanStack Table */}
      <CustomersTable
        data={customers}
        onEdit={openEditDialog}
        onDelete={handleDelete}
        onBulkDelete={handleBulkDelete}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Customer name"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="08..."
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="email@example.com"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Full address..."
                rows={2}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createCustomer.isPending || updateCustomer.isPending}
              >
                {createCustomer.isPending || updateCustomer.isPending
                  ? 'Saving...'
                  : editingCustomer
                    ? 'Update'
                    : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
