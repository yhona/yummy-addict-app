import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCreatePurchase } from '@/features/purchasing/api'
import { PurchaseForm } from '@/features/purchasing/components/purchase-form'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export const Route = createFileRoute('/_authenticated/purchasing/orders/new')({
  component: NewOrderPage,
})

function NewOrderPage() {
    const createPurchase = useCreatePurchase()
    const navigate = useNavigate()

    const handleSubmit = (values: any) => {
        createPurchase.mutate(values, {
            onSuccess: () => {
                toast.success("Purchase Order Created")
                navigate({ to: '/purchasing/orders' })
            },
            onError: (e: any) => {
                toast.error("Failed to create PO", { description: e.message || "Unknown error" })
            }
        })
    }

    return (
        <div className="p-6 space-y-6 max-w-4xl mx-auto">
             <div className="flex items-center gap-4">
                 <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/purchasing/orders' })}>
                     <ArrowLeft className="h-5 w-5"/>
                 </Button>
                 <h1 className="text-3xl font-bold tracking-tight">New Purchase Order</h1>
             </div>
             
             <Card>
                 <CardHeader>
                     <CardTitle>Order Details</CardTitle>
                 </CardHeader>
                 <CardContent>
                     <PurchaseForm onSubmit={handleSubmit} isLoading={createPurchase.isPending} />
                 </CardContent>
             </Card>
        </div>
    )
}
