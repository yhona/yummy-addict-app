
import { useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { Plus, Search, Edit2, Trash2, Loader2, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCouriers, useCreateCourier, useUpdateCourier, useDeleteCourier, type Courier } from '@/features/settings/api/couriers'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

export const Route = createFileRoute('/_authenticated/settings/couriers/')({
  component: CouriersPage,
})

function CouriersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCourier, setEditingCourier] = useState<Courier | null>(null)

  const { data: couriers, isLoading } = useCouriers()
  
  const createMutation = useCreateCourier()
  const updateMutation = useUpdateCourier()
  const deleteMutation = useDeleteCourier()

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    defaultCost: '',
    isActive: true
  })

  const resetForm = () => {
    setFormData({ code: '', name: '', description: '', defaultCost: '', isActive: true })
    setEditingCourier(null)
  }

  const handleEdit = (courier: Courier) => {
    setEditingCourier(courier)
    setFormData({
      code: courier.code,
      name: courier.name,
      description: courier.description || '',
      defaultCost: courier.defaultCost ? String(courier.defaultCost) : '',
      isActive: courier.isActive
    })
    setIsDialogOpen(true)
  }

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this courier?')) {
      try {
        await deleteMutation.mutateAsync(id)
        toast.success('Courier deleted successfully')
      } catch (error) {
        toast.error('Failed to delete courier')
      }
    }
  }

  const handleSubmit = async () => {
    if (!formData.code || !formData.name) {
      toast.error('Code and Name are required')
      return
    }

    try {
      if (editingCourier) {
        await updateMutation.mutateAsync({
           id: editingCourier.id,
           data: {
             ...formData,
             defaultCost: formData.defaultCost ? Number(formData.defaultCost) : 0
           }
        })
        toast.success('Courier updated successfully')
      } else {
        await createMutation.mutateAsync({
           ...formData,
           defaultCost: formData.defaultCost ? Number(formData.defaultCost) : 0
        })
        toast.success('Courier created successfully')
      }
      setIsDialogOpen(false)
      resetForm()
    } catch (error) {
      toast.error('Failed to save courier')
    }
  }

  const filteredCouriers = couriers?.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Couriers</h1>
          <p className="text-muted-foreground">Manage shipping couriers and default rates.</p>
        </div>
        <Button onClick={() => { resetForm(); setIsDialogOpen(true) }}>
          <Plus className="mr-2 h-4 w-4" /> Add Courier
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search couriers..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Default Cost</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
               <TableRow>
                 <TableCell colSpan={5} className="h-24 text-center">
                   <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                 </TableCell>
               </TableRow>
            ) : filteredCouriers?.length === 0 ? (
               <TableRow>
                 <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                   No couriers found.
                 </TableCell>
               </TableRow>
            ) : (
               filteredCouriers?.map((courier) => (
                 <TableRow key={courier.id}>
                   <TableCell className="font-mono">{courier.code}</TableCell>
                   <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-muted-foreground" />
                        {courier.name}
                      </div>
                   </TableCell>
                   <TableCell>{formatCurrency(courier.defaultCost || 0)}</TableCell>
                   <TableCell>
                      <Badge variant={courier.isActive ? 'default' : 'secondary'}>
                        {courier.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                   </TableCell>
                   <TableCell className="text-right">
                     <Button variant="ghost" size="icon" onClick={() => handleEdit(courier)}>
                       <Edit2 className="h-4 w-4" />
                     </Button>
                     <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(courier.id)}>
                       <Trash2 className="h-4 w-4" />
                     </Button>
                   </TableCell>
                 </TableRow>
               ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCourier ? 'Edit Courier' : 'Add New Courier'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code <span className="text-red-500">*</span></Label>
                <Input 
                   placeholder="e.g. JNE" 
                   value={formData.code}
                   onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})}
                />
              </div>
              <div className="space-y-2">
                 <Label>Default Cost (Est.)</Label>
                 <Input 
                    type="number"
                    placeholder="0"
                    value={formData.defaultCost}
                    onChange={e => setFormData({...formData, defaultCost: e.target.value})}
                 />
              </div>
            </div>
            <div className="space-y-2">
               <Label>Courier Name <span className="text-red-500">*</span></Label>
               <Input 
                  placeholder="e.g. JNE Regular" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
               />
            </div>
            <div className="space-y-2">
               <Label>Description</Label>
               <Textarea 
                  placeholder="Additional details..." 
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
               />
            </div>
            <div className="flex items-center gap-2">
               <input 
                  type="checkbox" 
                  id="isActive"
                  className="h-4 w-4"
                  checked={formData.isActive}
                  onChange={e => setFormData({...formData, isActive: e.target.checked})}
               />
               <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
               {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin"/>}
               Save Courier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
