import { ProfitLossResponse } from '@/features/reports/api/reports'
import { formatCurrency } from '@/lib/utils'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

interface ExpenseBreakdownProps {
  data: ProfitLossResponse | undefined
}

export function ExpenseBreakdown({ data }: ExpenseBreakdownProps) {
  if (!data || !data.operational_expenses?.length) return null

  return (
    <div className="w-full">
      <h3 className="text-sm font-semibold mb-4 text-muted-foreground uppercase tracking-wider">
        Rincian Biaya Operasional
      </h3>
      
      <Accordion type="single" collapsible className="w-full">
        {data.operational_expenses.map((expense, idx) => (
          <AccordionItem key={`exp-${idx}`} value={`item-${idx}`} className="border-b border-border/50">
            <AccordionTrigger className="hover:no-underline py-3">
              <div className="flex w-full justify-between items-center pr-4">
                <span className="font-medium">{expense.category}</span>
                <span className="font-semibold text-red-500">
                  {formatCurrency(expense.amount)}
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="pl-4 pr-11 py-2 space-y-2 bg-muted/20">
                {expense.items.map((item, itemIdx) => (
                  <div key={itemIdx} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">• {item.label}</span>
                    <span>{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                {expense.items.length === 0 && (
                  <div className="text-sm text-muted-foreground italic">
                    Tidak ada rincian item.
                  </div>
                )}
                
                {/* Visual Ratio relative to this category */}
                <div className="mt-3 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                   <div 
                      className="h-full bg-red-400" 
                      style={{ width: `${expense.percent_of_revenue}%` }} 
                    />
                </div>
                <p className="text-xs text-right text-muted-foreground mt-1">
                  {expense.percent_of_revenue}% dari omset
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
      
      <div className="flex justify-between items-center p-4 mt-2 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-100 dark:border-red-900/30">
        <span className="font-semibold text-red-700 dark:text-red-400">Total Biaya Operasional</span>
        <span className="font-bold text-red-700 dark:text-red-400 text-lg">
          {formatCurrency(data.total_operational_expenses)}
        </span>
      </div>
    </div>
  )
}
