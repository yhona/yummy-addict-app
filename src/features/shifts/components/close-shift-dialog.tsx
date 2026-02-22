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
import { useCloseShift } from '../api/shifts'
import { toast } from 'sonner'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Printer, AlertTriangle, CheckCircle2 } from 'lucide-react'

interface CloseShiftDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    shiftId: string
    onSuccess?: () => void
}

export function CloseShiftDialog({ open, onOpenChange, shiftId, onSuccess }: CloseShiftDialogProps) {
    const [amount, setAmount] = useState('')
    const [notes, setNotes] = useState('')
    const [summary, setSummary] = useState<any>(null)
    const closeShift = useCloseShift()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const result = await closeShift.mutateAsync({
                id: shiftId,
                data: {
                    endCash: Number(amount),
                    notes
                }
            })
            setSummary(result.summary)
            toast.success('Shift closed successfully')
        } catch (error) {
            toast.error('Failed to close shift')
        }
    }

    const handleClose = () => {
        onOpenChange(false)
        onSuccess?.()
    }

    if (summary) {
        const diff = summary.difference
        const isShort = diff < 0
        const isOver = diff > 0

        return (
            <Dialog open={open} onOpenChange={handleClose}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Shift Closed</DialogTitle>
                        <DialogDescription>Shift summary report.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="text-muted-foreground">Start Cash:</div>
                            <div className="text-right font-medium">Rp {summary.startCash.toLocaleString()}</div>
                            
                            <div className="text-muted-foreground">Cash Sales:</div>
                            <div className="text-right font-medium">+ Rp {summary.cashSales.toLocaleString()}</div>
                            
                            <div className="text-muted-foreground border-t pt-2 mt-2">Expected Cash:</div>
                            <div className="text-right font-medium border-t pt-2 mt-2">Rp {summary.expectedCash.toLocaleString()}</div>
                            
                            <div className="text-muted-foreground">Actual Cash:</div>
                            <div className="text-right font-medium">Rp {summary.actualCash.toLocaleString()}</div>
                        </div>

                        {diff !== 0 && (
                             <Alert variant={isShort ? "destructive" : "default"} className={isOver ? "border-green-500 text-green-700 bg-green-50" : ""}>
                                <div className="flex items-center gap-2">
                                    {isShort ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                    <AlertTitle>{isShort ? 'Shortage' : 'Overage'}</AlertTitle>
                                </div>
                                <AlertDescription>
                                    Difference: Rp {Math.abs(diff).toLocaleString()}
                                </AlertDescription>
                            </Alert>
                        )}
                        
                        {diff === 0 && (
                            <Alert className="border-green-500 bg-green-50 text-green-700">
                                <CheckCircle2 className="h-4 w-4" />
                                <AlertTitle>Balanced</AlertTitle>
                                <AlertDescription>No discrepancy found.</AlertDescription>
                            </Alert>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => window.print()}>
                            <Printer className="mr-2 h-4 w-4" /> Print Report
                        </Button>
                        <Button onClick={handleClose}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Close Register</DialogTitle>
                    <DialogDescription>
                        Count money in drawer and enter final amount.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Ending Cash</Label>
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
                        <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
                        <Button type="submit" disabled={closeShift.isPending} variant="destructive">
                            {closeShift.isPending ? 'Closing...' : 'Close Register'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
