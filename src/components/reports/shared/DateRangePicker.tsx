import { useState } from 'react'
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns'
import { Calendar as CalendarIcon } from 'lucide-react'
import { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

export type PeriodShortcut = 'today' | 'this_week' | 'this_month' | 'last_month' | 'this_year' | 'custom'

interface DateRangePickerProps {
  value: DateRange | undefined
  onChange: (date: DateRange | undefined) => void
  disabled?: boolean
}

export function DateRangePicker({ value, onChange, disabled }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const handlePresetSelect = (preset: PeriodShortcut) => {
    const today = new Date()
    switch (preset) {
      case 'today':
        onChange({ from: today, to: today })
        break
      case 'this_week':
        onChange({ from: startOfWeek(today, { weekStartsOn: 1 }), to: endOfWeek(today, { weekStartsOn: 1 }) })
        break
      case 'this_month':
        onChange({ from: startOfMonth(today), to: endOfMonth(today) })
        break
      case 'last_month':
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        onChange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) })
        break
      case 'this_year':
        onChange({ from: startOfYear(today), to: endOfYear(today) })
        break
    }
    if (preset !== 'custom') {
      setIsOpen(false)
    }
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          id="date"
          variant="outline"
          className={cn(
            'w-[260px] justify-start text-left font-normal',
            !value && 'text-muted-foreground'
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value?.from ? (
            value.to ? (
              <>
                {format(value.from, 'dd MMM yyyy')} - {format(value.to, 'dd MMM yyyy')}
              </>
            ) : (
              format(value.from, 'dd MMM yyyy')
            )
          ) : (
            <span>Pilih Periode Tanggal</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          {/* Presets Sidebar */}
          <div className="border-r px-3 py-4 space-y-2 flex flex-col min-w-[140px]">
            <span className="text-xs font-semibold text-muted-foreground uppercase mb-2">Pintas Cepat</span>
            <Button variant="ghost" className="justify-start w-full" onClick={() => handlePresetSelect('today')}>
              Hari ini
            </Button>
            <Button variant="ghost" className="justify-start w-full" onClick={() => handlePresetSelect('this_week')}>
              Minggu ini
            </Button>
            <Button variant="ghost" className="justify-start w-full" onClick={() => handlePresetSelect('this_month')}>
              Bulan ini
            </Button>
            <Button variant="ghost" className="justify-start w-full" onClick={() => handlePresetSelect('last_month')}>
              Bulan lalu
            </Button>
            <Button variant="ghost" className="justify-start w-full" onClick={() => handlePresetSelect('this_year')}>
              Tahun ini
            </Button>
          </div>
          {/* Calendar Picker */}
          <div className="p-3">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={value?.from || new Date()}
              selected={value}
              onSelect={onChange}
              numberOfMonths={2}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
