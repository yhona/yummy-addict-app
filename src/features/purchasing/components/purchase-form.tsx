import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { useSuppliers } from '@/features/purchasing/api'
import { useProducts } from '@/features/inventory/api'
import { Plus, Trash2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'

const formSchema = z.object({
  supplierId: z.string().min(1, 'Select a supplier'),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1, 'Select product'),
    quantity: z.number().min(1),
    costPrice: z.number().min(0),
  })).min(1, 'Add at least one item')
})

export function PurchaseForm({ onSubmit, isLoading }: { onSubmit: (data: any) => void, isLoading: boolean }) {
  const { data: suppliers } = useSuppliers()
  const { data: products } = useProducts({ limit: 1000 }) // Load many for now
  
  const form = useForm({
      resolver: zodResolver(formSchema),
      defaultValues: {
          supplierId: '',
          notes: '',
          items: [{ productId: '', quantity: 1, costPrice: 0 }]
      }
  })
  
  const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: "items"
  })
  
  const handleProductChange = (index: number, productId: string) => {
      const product = products?.data.find((p: any) => p.id === productId)
      if (product) {
          form.setValue(`items.${index}.costPrice`, Number(product.costPrice) || 0)
      }
  }

  const items = form.watch('items')
  const total = items.reduce((sum, item) => sum + (item.quantity * item.costPrice), 0)

  return (
      <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="supplierId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Supplier</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select Supplier" /></SelectTrigger></FormControl>
                                <SelectContent>
                                    {suppliers?.data.map((s: any) => (
                                        <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                      <FormItem>
                          <FormLabel>Notes (Optional)</FormLabel>
                          <FormControl><Input {...field} placeholder="PO Reference..." /></FormControl>
                      </FormItem>
                  )}
              />
              </div>
              
              <div className="border rounded-md bg-card">
                  <div className="flex justify-between items-center p-4 border-b">
                      <h3 className="font-semibold">Order Items</h3>
                      <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: '', quantity: 1, costPrice: 0 })}>
                          <Plus className="mr-2 h-4 w-4"/> Add Item
                      </Button>
                  </div>
                  
                  <div className="p-4 space-y-4">
                      {fields.length === 0 && (
                          <div className="text-center text-muted-foreground py-8">
                              No items added. Click "Add Item" to start.
                          </div>
                      )}
                      
                      {fields.map((field, index) => (
                          <div key={field.id} className="flex gap-4 items-end animate-in slide-in-from-left-2 duration-200">
                              <FormField
                                  control={form.control}
                                  name={`items.${index}.productId`}
                                  render={({ field }) => (
                                      <FormItem className="flex-1">
                                          <FormLabel className={index !== 0 ? "sr-only" : ""}>Product</FormLabel>
                                          <Select onValueChange={(val) => { field.onChange(val); handleProductChange(index, val) }} defaultValue={field.value}>
                                              <FormControl><SelectTrigger><SelectValue placeholder="Select Product" /></SelectTrigger></FormControl>
                                              <SelectContent className="max-h-[200px]">
                                                  <ScrollArea className="h-[200px]">
                                                    {products?.data.map((p: any) => (
                                                        <SelectItem key={p.id} value={p.id}>{p.name} ({p.sku})</SelectItem>
                                                    ))}
                                                  </ScrollArea>
                                              </SelectContent>
                                          </Select>
                                      </FormItem>
                                  )}
                              />
                              <FormField
                                  control={form.control}
                                  name={`items.${index}.minStock`} // Stupid workaround for typescript if needed? No, Name is string key.
                                  // Just matching name logic
                                  name={`items.${index}.quantity`}
                                  render={({ field }) => (
                                      <FormItem className="w-24">
                                          <FormLabel className={index !== 0 ? "sr-only" : ""}>Qty</FormLabel>
                                          <FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                                      </FormItem>
                                  )}
                              />
                               <FormField
                                  control={form.control}
                                  name={`items.${index}.costPrice`}
                                  render={({ field }) => (
                                      <FormItem className="w-32">
                                          <FormLabel className={index !== 0 ? "sr-only" : ""}>Cost (Rp)</FormLabel>
                                          <FormControl><Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} /></FormControl>
                                      </FormItem>
                                  )}
                              />
                              <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="hover:bg-destructive/10 hover:text-destructive">
                                  <Trash2 className="h-4 w-4"/>
                              </Button>
                          </div>
                      ))}
                  </div>
                  
                  <div className="flex justify-between items-center p-4 border-t bg-muted/10">
                      <div className="text-sm text-muted-foreground">{fields.length} Items</div>
                      <div className="text-xl font-bold">
                          Total: {formatCurrency(total)}
                      </div>
                  </div>
              </div>
              
              <div className="flex justify-end gap-4">
                  <Button type="submit" size="lg" disabled={isLoading || fields.length === 0}>
                      {isLoading ? "Creating Order..." : "Create Purchase Order"}
                  </Button>
              </div>
          </form>
      </Form>
  )
}
