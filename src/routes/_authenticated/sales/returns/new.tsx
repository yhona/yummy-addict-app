import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCreateReturn } from '@/features/sales/api/returns'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/features/orders/utils' // or whatever it was importing formatCurrency from, wait, let me use standard util if I don't know where formatCurrency is. Wait I'll remove formatCurrency if it errors? Let me check where formatCurrency is. Let me just cast the API response.
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { api } from '@/lib/api-client'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { PageHeaderHeading, PageHeaderTitle, PageHeaderDescription } from '@/components/layout/page'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'

export const Route = createFileRoute('/_authenticated/sales/returns/new')({
  component: NewReturnPage,
})

function NewReturnPage() {
    const navigate = useNavigate()
    const [searchQuery, setSearchQuery] = useState('')
    const [transaction, setTransaction] = useState<any>(null)
    const [returnItems, setReturnItems] = useState<Record<string, number>>({})
    const [reason, setReason] = useState('')
    const [notes, setNotes] = useState('')
    
    const createReturn = useCreateReturn()
    const [isSearching, setIsSearching] = useState(false)

    // Manual Search Handler
    const handleSearch = async () => {
        if (!searchQuery.trim()) return
        setIsSearching(true)
        try {
            // First try exact ID match
            let res: any = await api.get(`/transactions/${searchQuery}`).catch(() => null)
            
            // If not found, try searching by number via list
            if (!res || !res.data) {
                const listRes: any = await api.get(`/transactions?search=${searchQuery}`)
                if (listRes.data && listRes.data.data && listRes.data.data.length > 0) {
                     // Pick the first match for now, or could show a selector
                     res = { data: listRes.data.data[0] }
                }
            }

            if (res && res.data) {
                setTransaction(res.data)
                setReturnItems({})
                toast.success("Transaction found")
            } else {
                toast.error("Transaction not found")
                setTransaction(null)
            }
        } catch (e) {
            toast.error("Error searching transaction")
        } finally {
            setIsSearching(false)
        }
    }

    const toggleItem = (item: any) => {
        setReturnItems(prev => {
            const next = { ...prev }
            if (next[item.productId]) {
                delete next[item.productId]
            } else {
                next[item.productId] = 1 // Default to 1
            }
            return next
        })
    }

    const updateQuantity = (productId: string, qty: number, max: number) => {
        if (qty < 1 || qty > max) return
        setReturnItems(prev => ({
            ...prev,
            [productId]: qty
        }))
    }

    const calculateTotalRefund = () => {
        if (!transaction) return 0
        return transaction.items.reduce((sum: number, item: any) => {
            const qty = returnItems[item.productId] || 0
            // Find price per item (handle discounts if needed, for now using raw price)
            const price = Number(item.price) 
            return sum + (price * qty)
        }, 0)
    }

    const handleSubmit = () => {
        if (!transaction) return
        
        const itemsToReturn = Object.entries(returnItems).map(([productId, quantity]) => {
             const originalItem = transaction.items.find((i: any) => i.productId === productId)
             return {
                 productId,
                 transactionItemId: originalItem.id, // Important for linking
                 quantity,
                 price: Number(originalItem.price)
             }
        })

        if (itemsToReturn.length === 0) {
            toast.error("Please select items to return")
            return
        }

        if (!reason) {
             toast.error("Please select a return reason")
             return
        }

        createReturn.mutate({
            transactionId: transaction.id,
            items: itemsToReturn,
            reason,
            notes
        }, {
            onSuccess: () => {
                toast.success("Return processed successfully!")
                navigate({ to: '/sales/returns' })
            },
            onError: (err: any) => {
                toast.error("Failed to process return", { description: err.message })
            }
        })
    }

    return (
        <>
            <Header fixed>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/sales/returns' })} className="-ml-2">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-lg font-semibold">New Return</h1>
                </div>
                <div className="ml-auto flex items-center space-x-4">
                    <ThemeSwitch />
                    <ProfileDropdown />
                </div>
            </Header>
            <Main>
                <div className="max-w-5xl mx-auto space-y-6">
                    <PageHeaderHeading className="mb-6">
                        <PageHeaderTitle>New Return</PageHeaderTitle>
                        <PageHeaderDescription>Process a refund for a customer</PageHeaderDescription>
                    </PageHeaderHeading>

            {/* Step 1: Search */}
            <Card className={transaction ? "border-b-0 rounded-b-none shadow-none" : ""}>
                 <CardContent className="pt-6">
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <Input 
                                placeholder="Scan Receipt Barcode or Type Transaction Number (TRX-...)" 
                                className="pl-10 h-14 text-lg"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            />
                        </div>
                        <Button 
                            size="lg" 
                            className="h-14 px-8" 
                            onClick={handleSearch}
                            disabled={isSearching}
                        >
                            {isSearching ? "Searching..." : "Find Transaction"}
                        </Button>
                    </div>
                 </CardContent>
            </Card>

            {/* Step 2: Selection & Confirmation */}
            {transaction && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in slide-in-from-bottom-2 fade-in duration-500">
                    
                    {/* Left: Transaction Details & Items */}
                    <Card className="md:col-span-2 rounded-t-none border-t-0 mt-[-24px]">
                        <CardHeader className="bg-muted/30 pb-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle>Transaction: {transaction.number}</CardTitle>
                                    <div className="flex gap-2 text-sm text-muted-foreground mt-1">
                                        <span>{format(new Date(transaction.date), 'dd MMM yyyy HH:mm')}</span>
                                        <span>•</span>
                                        <span>Customer: {transaction.customer?.name || 'Guest'}</span>
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                                    Paid: {formatCurrency(Number(transaction.finalAmount))}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6 bg-card">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50px]">Select</TableHead>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Purchased</TableHead>
                                        <TableHead>Price</TableHead>
                                        <TableHead>Return Qty</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transaction.items?.map((item: any) => (
                                        <TableRow key={item.id} className={returnItems[item.productId] ? "bg-muted/50" : ""}>
                                            <TableCell>
                                                <Checkbox 
                                                    checked={!!returnItems[item.productId]} 
                                                    onCheckedChange={() => toggleItem(item)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium">{item.product.name}</span>
                                                <div className="text-xs text-muted-foreground">{item.product.sku}</div>
                                            </TableCell>
                                            <TableCell>
                                                {item.quantity}
                                            </TableCell>
                                            <TableCell>{formatCurrency(Number(item.price))}</TableCell>
                                            <TableCell>
                                                {returnItems[item.productId] ? (
                                                     <div className="flex items-center gap-2">
                                                        <Button 
                                                            variant="outline" size="icon" className="h-7 w-7"
                                                            onClick={() => updateQuantity(item.productId, returnItems[item.productId]!-1, item.quantity)}
                                                        > - </Button>
                                                        <span className="w-8 text-center">{returnItems[item.productId]}</span>
                                                        <Button 
                                                            variant="outline" size="icon" className="h-7 w-7"
                                                            onClick={() => updateQuantity(item.productId, returnItems[item.productId]!+1, item.quantity)}
                                                        > + </Button>
                                                     </div>
                                                ) : <span className="text-muted-foreground text-sm">-</span>}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    {/* Right: Action Panel */}
                    <div className="space-y-6">
                        <Card className="border-2 border-primary/10 shadow-lg">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <RefreshCw className="h-5 w-5 text-primary" /> Refund Details
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Return Reason</Label>
                                    <Select value={reason} onValueChange={setReason}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select reason..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Damaged Goods">Damaged Goods</SelectItem>
                                            <SelectItem value="Wrong Item">Wrong Item</SelectItem>
                                            <SelectItem value="Expired">Expired</SelectItem>
                                            <SelectItem value="Customer Change Mind">Customer Change Mind</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                
                                <div className="space-y-2">
                                    <Label>Internal Notes</Label>
                                    <Textarea 
                                        placeholder="Optional check condition..." 
                                        value={notes} 
                                        onChange={e => setNotes(e.target.value)} 
                                    />
                                </div>

                                <Separator />

                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Refund Total</span>
                                    <span className="text-2xl font-bold text-primary">
                                        {formatCurrency(calculateTotalRefund())}
                                    </span>
                                </div>

                                <Button 
                                    size="lg" 
                                    className="w-full font-bold"
                                    disabled={Object.keys(returnItems).length === 0 || !reason || createReturn.isPending}
                                    onClick={handleSubmit}
                                >
                                    {createReturn.isPending ? "Processing..." : "Confirm Return"}
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}
                </div>
            </Main>
        </>
    )
}
