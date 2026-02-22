import { createFileRoute } from '@tanstack/react-router'
import { Card } from '@/components/ui/card'
import { AlertCircle } from 'lucide-react'
import { ReportsLayout } from './components/reports-layout'

export const Route = createFileRoute('/_authenticated/reports/tax')({
  component: TaxReportPage,
})

function TaxReportPage() {
  return (
    <ReportsLayout 
      title="Laporan Pajak & Regulasi" 
      description="Rekap PPN Keluaran & PPN Masukan, dan utilitas Ekspor PPh ke format DJP."
    >
      <div className="pt-6 mt-8">
        <Card className="border-dashed bg-muted/40 p-12">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <AlertCircle className="h-10 w-10 text-muted-foreground mb-4" />
            <h3 className="text-2xl font-bold">Laporan Pajak Tertunda</h3>
            <p className="text-muted-foreground max-w-[500px] leading-relaxed">
              Modul laporan ini sedang dalam antrian blueprint pengembangan kami.
              Check kembali dalam waktu dekat!
            </p>
          </div>
        </Card>
      </div>
    </ReportsLayout>
  )
}
