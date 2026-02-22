import { useState } from 'react'
import { Check, ChevronsUpDown, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useCustomers } from '@/features/customers/api/customers'
import { NewCustomerDialog } from '@/features/customers/components/new-customer-dialog'
import { Label } from '@/components/ui/label'

interface CustomerSelectorProps {
  value?: string
  onChange: (value: string | undefined) => void
}

export function CustomerSelector({ value, onChange }: CustomerSelectorProps) {
  const [open, setOpen] = useState(false)
  const [newCustomerOpen, setNewCustomerOpen] = useState(false)
  const [search, setSearch] = useState('')
  
  const { data: customersData, isLoading } = useCustomers({ search })
  
  const customers = customersData?.data || []
  const selectedCustomer = customers.find((c: any) => c.id === value)

  const handleCreateSuccess = (newCustomer: any) => {
      onChange(newCustomer.id)
      setNewCustomerOpen(false)
  }

  return (
    <div className="space-y-2">
      <Label>Customer (Optional)</Label>
      <div className="flex gap-2">
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={open}
                className="w-full justify-between"
              >
                {value
                  ? customers.find((c: any) => c.id === value)?.name || selectedCustomer?.name || "Select Customer..."
                  : "Walk-in Customer"}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command shouldFilter={false}>
                <CommandInput placeholder="Search customer..." onValueChange={setSearch} value={search} />
                <CommandList>
                    <CommandEmpty>
                        <div className="p-2 text-sm text-center">
                            No customer found.
                            <Button variant="link" size="sm" className="h-auto p-0 ml-1" onClick={() => { setOpen(false); setNewCustomerOpen(true); }}>
                                Create "{search}"?
                            </Button>
                        </div>
                    </CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="walk-in"
                        onSelect={() => {
                          onChange(undefined)
                          setOpen(false)
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            !value ? "opacity-100" : "opacity-0"
                          )}
                        />
                        Walk-in Customer
                      </CommandItem>
                      {customers.map((customer: any) => (
                        <CommandItem
                          key={customer.id}
                          value={customer.id}
                          onSelect={(currentValue) => {
                            onChange(currentValue === value ? undefined : currentValue)
                            setOpen(false)
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              value === customer.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                              <span>{customer.name}</span>
                              {customer.phone && <span className="text-xs text-muted-foreground">{customer.phone}</span>}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
          
          <Button variant="outline" size="icon" onClick={() => setNewCustomerOpen(true)} title="New Customer">
              <UserPlus className="h-4 w-4" />
          </Button>
      </div>

      <NewCustomerDialog 
        open={newCustomerOpen} 
        onOpenChange={setNewCustomerOpen} 
        onSuccess={handleCreateSuccess}
        defaultName={search}
      />
    </div>
  )
}
