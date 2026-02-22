import { Dialog, DialogContent, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Printer, CheckCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export function ReceiptDialog({ open, onOpenChange, transaction }: any) {
    const handlePrint = () => {
        window.print()
    }

    if (!transaction) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[400px]">
                <div className="flex flex-col items-center gap-4 py-4 print:hidden">
                    <CheckCircle className="h-12 w-12 text-green-500" />
                    <h2 className="text-xl font-bold">Payment Successful</h2>
                    <p className="text-muted-foreground text-center">
                        Transaction #{transaction.number} completed.
                    </p>
                </div>
                
                {/* Print Preview Area */}
                <div className="border rounded-md p-4 bg-muted/20 text-xs font-mono max-h-[400px] overflow-y-auto print:max-h-none print:overflow-visible print:border-none print:bg-transparent print:p-0">
                    <div id="receipt-print-area" className="bg-white p-4 text-black print:p-0">
                        <div className="text-center mb-4">
                            <h3 className="font-bold text-lg">RETAIL STORE</h3>
                            <p>Jl. Jend. Sudirman No. 1</p>
                            <p>Telp: 0812-3456-7890</p>
                        </div>
                        <div className="border-b border-dashed border-black my-2"></div>
                        <div className="flex justify-between">
                            <span>Date: {new Date(transaction.date).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>TRX: {transaction.number}</span>
                        </div>
                         <div className="flex justify-between">
                            <span>Cashier: {transaction.cashier?.name || 'Admin'}</span>
                        </div>
                         {transaction.customer && (
                            <div className="flex justify-between">
                                <span>Cust: {transaction.customer.name}</span>
                            </div>
                        )}
                        <div className="border-b border-dashed border-black my-2"></div>
                        <div className="space-y-2">
                            {transaction.items?.map((item: any) => (
                                <div key={item.id}>
                                    <div className="font-bold">{item.product?.name || 'Unknown Item'}</div>
                                    <div className="flex justify-between">
                                        <span>{item.quantity} x {formatCurrency(Number(item.price))}</span>
                                        <span>{formatCurrency(Number(item.subtotal))}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="border-b border-dashed border-black my-2"></div>
                        <div className="flex justify-between font-bold text-sm">
                            <span>TOTAL</span>
                            <span>{formatCurrency(Number(transaction.totalAmount))}</span>
                        </div>
                        {Number(transaction.cashAmount) > 0 && (
                             <>
                                <div className="flex justify-between mt-1">
                                    <span>CASH</span>
                                    <span>{formatCurrency(Number(transaction.cashAmount))}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>CHANGE</span>
                                    <span>{formatCurrency(Number(transaction.changeAmount))}</span>
                                </div>
                             </>
                        )}
                         <div className="border-b border-dashed border-black my-2"></div>
                         <div className="text-center mt-4">
                             <p>Thank you for shopping!</p>
                             <p>Powered by RetailERP</p>
                         </div>
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2 print:hidden">
                    <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>Close</Button>
                    <Button className="w-full" onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/> Print Receipt</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
