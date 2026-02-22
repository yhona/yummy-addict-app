import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useCreateCustomer } from '@/features/customers/api/customers'
import { toast } from 'sonner'
import { CreateCustomerRequest } from '@/lib/api-types'

interface NewCustomerDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    onSuccess?: (customer: { id: string, name: string }) => void
    defaultName?: string
}

export function NewCustomerDialog({ open, onOpenChange, onSuccess, defaultName }: NewCustomerDialogProps) {
    const createCustomer = useCreateCustomer()
    const [formData, setFormData] = useState<CreateCustomerRequest>({
        name: defaultName || '',
        phone: '',
        address: '',
        email: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        createCustomer.mutate(formData, {
            onSuccess: (data) => {
                toast.success("Customer created")
                onSuccess?.(data)
                onOpenChange(false)
                setFormData({ name: '', phone: '', address: '', email: '' })
            },
            onError: (err: any) => toast.error("Failed to create customer", { description: err.message })
        })
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader><DialogTitle>Add New Customer</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label>Name *</Label>
                        <Input 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                            required 
                            placeholder="John Doe"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input 
                                value={formData.phone} 
                                onChange={e => setFormData({...formData, phone: e.target.value})} 
                                placeholder="08..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input 
                                type="email"
                                value={formData.email} 
                                onChange={e => setFormData({...formData, email: e.target.value})} 
                                placeholder="john@example.com"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Address</Label>
                        <Textarea 
                            value={formData.address} 
                            onChange={e => setFormData({...formData, address: e.target.value})} 
                            placeholder="Alamat lengkap..."
                        />
                    </div>
                    <div className="flex justify-end gap-2 pt-2">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={createCustomer.isPending}>
                            {createCustomer.isPending ? "Creating..." : "Create Customer"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
