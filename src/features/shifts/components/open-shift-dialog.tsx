import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useOpenShift } from '../api/shifts'
import { toast } from 'sonner'

interface OpenShiftDialogProps {
    open: boolean
    userId: string
    onSuccess?: () => void
}

export function OpenShiftDialog({ open, userId, onSuccess }: OpenShiftDialogProps) {
    const [amount, setAmount] = useState('')
    const [notes, setNotes] = useState('')
    const openShift = useOpenShift()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            await openShift.mutateAsync({
                userId,
                startCash: Number(amount),
                notes
            })
            toast.success('Shift opened successfully')
            onSuccess?.()
        } catch (error) {
            toast.error('Failed to open shift')
        }
    }

    return (
        <Dialog open={open}>
            <DialogContent className="sm:max-w-[425px]" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Open Register</DialogTitle>
                    <DialogDescription>
                        Please enter the starting cash amount to begin your shift.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Starting Cash</Label>
                        <Input 
                            type="number" 
                            placeholder="0" 
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            required
                            min="0"
                            autoFocus
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Notes (Optional)</Label>
                        <Input 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={openShift.isPending}>
                            {openShift.isPending ? 'Opening...' : 'Open Register'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
