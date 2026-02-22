import { useEffect, useState } from 'react'
import { Outlet, useNavigate, useSearch } from '@tanstack/react-router'
import { subDays, format } from 'date-fns'
import { CalendarIcon, FilterX } from 'lucide-react'
import { DateRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useCategories } from '@/features/inventory/api/categories'

// The search params signature that all report routes will share
export type ReportSearchParams = {
  startDate?: string
  endDate?: string
  cashierId?: string
  categoryId?: string
  paymentMethod?: string
}

export function ReportsLayout({
  title,
  description,
  children
}: {
  title: string
  description: string
  children?: React.ReactNode
}) {
  const search = useSearch({ strict: false }) as ReportSearchParams
  const navigate = useNavigate()

  // Local state synced with URL Search Params
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: search.startDate ? new Date(search.startDate) : subDays(new Date(), 30),
    to: search.endDate ? new Date(search.endDate) : new Date(),
  })
  
  const [cashierId, setCashierId] = useState<string>(search.cashierId || 'all')
  const [categoryId, setCategoryId] = useState<string>(search.categoryId || 'all')
  const [paymentMethod, setPaymentMethod] = useState<string>(search.paymentMethod || 'all')

  const { data: categoriesResult } = useCategories()
  const usersData = [{ id: '123e4567-e89b-12d3-a456-426614174000', name: 'John Doe (Dev)' }]

  // Push changes to URL whenever local state changes so children can react
  useEffect(() => {
    navigate({
      search: {
        startDate: dateRange?.from?.toISOString().split('T')[0],
        endDate: dateRange?.to?.toISOString().split('T')[0],
        cashierId: cashierId !== 'all' ? cashierId : undefined,
        categoryId: categoryId !== 'all' ? categoryId : undefined,
        paymentMethod: paymentMethod !== 'all' ? paymentMethod : undefined,
      } as any, // Cast to any because Layout shouldn't know which strict Route it's inside
      replace: true
    })
  }, [dateRange, cashierId, categoryId, paymentMethod, navigate])

  return (
    <div className="space-y-6 p-8">
      {/* Universal Reports Header Layer */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 border-b pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
        
        <div className="flex flex-col md:flex-row items-end gap-3 w-full xl:w-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full md:w-auto">
            <Select value={cashierId} onValueChange={setCashierId}>
              <SelectTrigger className="w-full md:w-[130px]">
                <SelectValue placeholder="Kasir" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kasir</SelectItem>
                {usersData.map((user) => (
                  <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger className="w-full md:w-[130px]">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Kategori</SelectItem>
                {(categoriesResult || []).map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="w-full md:w-[140px]">
                <SelectValue placeholder="Pembayaran" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Metode</SelectItem>
                <SelectItem value="cash">Tunai (Cash)</SelectItem>
                <SelectItem value="qris">QRIS</SelectItem>
                <SelectItem value="card">Kartu (Card)</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              className="w-full text-muted-foreground" 
              onClick={() => {
                setCashierId('all')
                setCategoryId('all')
                setPaymentMethod('all')
              }}
            >
              <FilterX className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full md:w-[240px] justify-start text-left font-normal bg-white dark:bg-slate-950">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dateRange?.from ? (
                  dateRange.to ? (
                    <>
                      {format(dateRange.from, 'MMM d')} - {format(dateRange.to, 'MMM d, yyyy')}
                    </>
                  ) : (
                    format(dateRange.from, 'MMM d, yyyy')
                  )
                ) : (
                  <span>Pilih Tanggal</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                defaultMonth={dateRange?.from}
                selected={dateRange}
                onSelect={setDateRange}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Render the specific report route */}
      <div className="pt-2">
        {children || <Outlet />}
      </div>
    </div>
  )
}
