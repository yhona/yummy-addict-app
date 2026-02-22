import { useState } from 'react'
import { Download, FileText, Loader2, Table } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { exportToCSV, exportToPDF, type ExportColumn, type PDFExportConfig } from '@/lib/reports/exportUtils'

interface ExportButtonProps {
  filename?: string
  data?: any[]
  csvColumns?: ExportColumn[]
  pdfConfig?: Omit<PDFExportConfig, 'data'>
  isLoading?: boolean
}

export function ExportButton({ 
  filename = 'laporan', 
  data = [], 
  csvColumns = [], 
  pdfConfig,
  isLoading = false 
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState<'csv' | 'pdf' | null>(null)

  const handleExportCSV = () => {
    if (!data.length) return
    setIsExporting('csv')
    setTimeout(() => {
      exportToCSV(data, filename, csvColumns)
      setIsExporting(null)
    }, 500)
  }

  const handleExportPDF = () => {
    if (!data.length || !pdfConfig) return
    setIsExporting('pdf')
    setTimeout(() => {
      exportToPDF({
        ...pdfConfig,
        data
      })
      setIsExporting(null)
    }, 500)
  }

  const isWorking = isLoading || isExporting !== null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={isWorking}>
          {isWorking ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Export Data
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={handleExportPDF}
          disabled={isWorking || !data.length || !pdfConfig}
          className="cursor-pointer"
        >
          <FileText className="mr-2 h-4 w-4 text-red-600" />
          Export as PDF
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleExportCSV}
          disabled={isWorking || !data.length || !csvColumns.length}
          className="cursor-pointer"
        >
          <Table className="mr-2 h-4 w-4 text-green-600" />
          Export as CSV / Excel
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
