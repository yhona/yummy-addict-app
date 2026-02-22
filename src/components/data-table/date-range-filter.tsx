import * as React from 'react'
import { CalendarIcon, Cross2Icon } from '@radix-ui/react-icons'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DataTableDateRangeFilterProps
  extends React.HTMLAttributes<HTMLDivElement> {
  date: DateRange | undefined
  setDate: (date: DateRange | undefined) => void
  title?: string
}

export function DataTableDateRangeFilter({
  date,
  setDate,
  className,
  title = 'Date',
}: DataTableDateRangeFilterProps) {
  return (
    <div className={cn('grid gap-2', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id='date'
            variant={'outline'}
            size='sm'
            className={cn(
              'h-8 w-[250px] justify-start text-left font-normal border-dashed',
              !date && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className='mr-2 h-4 w-4' />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'LLL dd, y')} -{' '}
                  {format(date.to, 'LLL dd, y')}
                </>
              ) : (
                format(date.from, 'LLL dd, y')
              )
            ) : (
              <span>{title}</span>
            )}
            {date?.from && (
              <div
                role="button"
                tabIndex={0}
                className="ml-auto flex h-4 w-4 items-center justify-center rounded-sm opacity-50 hover:opacity-100"
                onClick={(e) => {
                  e.stopPropagation()
                  setDate(undefined)
                }}
              >
                <Cross2Icon className="h-4 w-4" />
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <Calendar
            initialFocus
            mode='range'
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
