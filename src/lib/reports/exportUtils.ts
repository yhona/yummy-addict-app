import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { format } from 'date-fns'
import { id } from 'date-fns/locale'
import { formatCurrency } from '../utils'

// ==========================================
// EXPORT TYPES
// ==========================================

export interface ExportColumn {
  key: string
  label: string
  format?: 'currency' | 'date' | 'percent' | 'text'
}

export interface PDFExportConfig {
  title: string
  subtitle: string
  company_name: string
  columns: { header: string; dataKey: string }[]
  data: any[]
  summary?: { label: string; value: string }[]
}

// ==========================================
// CSV EXPORT ENGINE
// ==========================================

export const exportToCSV = (data: any[], filename: string, columns: ExportColumn[]) => {
  if (!data || !data.length) {
    console.warn("No data provided for CSV export")
    return
  }

  // Generate Header Row
  const headers = columns.map(col => `"${col.label}"`).join(',')
  
  // Map Data Rows
  const rows = data.map(item => {
    return columns.map(col => {
      let value = item[col.key]
      
      if (value === null || value === undefined) {
        return '""'
      }

      // Apply Formatting Rules
      switch (col.format) {
        case 'currency':
          // Pure numbers for Excel compatibility (no Rp, no dots if possible)
          // Since Excel struggles with periods vs commas depending on region,
          // a safe trick is passing it as raw integer without Rp.
          value = Number(value).toString()
          break
        case 'date':
          try {
            value = format(new Date(value), 'dd/MM/yyyy')
          } catch (e) {
            // fallback if invalid date
          }
          break
        case 'percent':
          value = `${value}%`
          break
        default:
          // force string and escape quotes
          value = String(value).replace(/"/g, '""')
          break
      }

      // Wrap every cell in quotes to escape internal commas/newlines
      return `"${value}"`
    }).join(',')
  })

  // Assemble CSV raw string
  const csvContent = [headers, ...rows].join('\n')

  // Prepend UTF-8 BOM so Excel opens it with the correct encoding (useful for Indonesian characters)
  const bom = '\uFEFF'
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' })
  
  // Trigger Browser Download via hidden anchor
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  const timestamp = format(new Date(), 'yyyyMMdd_HHmm')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}_${timestamp}.csv`)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// ==========================================
// PDF EXPORT ENGINE
// ==========================================

export const exportToPDF = (config: PDFExportConfig) => {
  // Use Landscape for tables with many columns
  const orientation = config.columns.length > 6 ? 'landscape' : 'portrait'
  const doc = new jsPDF(orientation, 'pt', 'a4')
  
  const pageWidth = doc.internal.pageSize.getWidth()
  let currentY = 40

  // 1. HEADER SECTIONS
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(config.company_name, 40, currentY)
  
  currentY += 20
  doc.setFontSize(14)
  doc.text(config.title, 40, currentY)
  
  currentY += 15
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100) // Gray text
  doc.text(config.subtitle, 40, currentY)
  
  currentY += 25

  // 2. DATA TABLE GENERATION
  autoTable(doc, {
    startY: currentY,
    head: [config.columns.map(c => c.header)],
    body: config.data.map(row => config.columns.map(c => row[c.dataKey] ?? '-')),
    theme: 'grid',
    headStyles: { 
      fillColor: [15, 23, 42], // Slate-900 
      textColor: [255, 255, 255], 
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: { 
      fontSize: 9, 
      cellPadding: 4,
      valign: 'middle'
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252] // Slate-50
    },
    didDrawPage: (data) => {
      // Print Footer on each page
      const pageCount = doc.internal.pages.length - 1
      const footerY = doc.internal.pageSize.getHeight() - 30
      
      doc.setFontSize(8)
      doc.setTextColor(150, 150, 150)
      
      // Left Footer: User & Date
      const printDate = format(new Date(), 'dd MMM yyyy HH:mm', { locale: id })
      doc.text(`Dicetak pada: ${printDate}`, 40, footerY)
      
      // Right Footer: Paging
      doc.text(`Halaman ${data.pageNumber}`, pageWidth - 40, footerY, { align: 'right' })
    }
  })

  // @ts-ignore - autotable adds lastAutoTable property
  const finalY = doc.lastAutoTable.finalY + 30

  // 3. SUMMARY SECTION (If provided)
  if (config.summary && config.summary.length > 0) {
    doc.setFontSize(11)
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'bold')
    doc.text('RINGKASAN LAPORAN', 40, finalY)
    
    let sumY = finalY + 20
    doc.setFont('helvetica', 'normal')
    
    config.summary.forEach(sum => {
      doc.text(`${sum.label}:`, 40, sumY)
      // Bold the value
      doc.setFont('helvetica', 'bold')
      doc.text(sum.value, 200, sumY)
      doc.setFont('helvetica', 'normal')
      sumY += 15
    })
  }

  // Finally, trigger save/download
  const timestamp = format(new Date(), 'yyyyMMdd_HHmm')
  const safeFilename = config.title.toLowerCase().replace(/[^a-z0-9]/g, '-')
  doc.save(`${safeFilename}_${timestamp}.pdf`)
}
