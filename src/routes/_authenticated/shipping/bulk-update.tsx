import { useState } from 'react'
import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useBulkUpdateResi } from '@/features/shipping/api/shipping'
import { toast } from 'sonner'
import {
  ArrowLeft, Upload, Plus, Trash2, Loader2, Download,
  CheckCircle2, XCircle, FileSpreadsheet
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog'

export const Route = createFileRoute('/_authenticated/shipping/bulk-update')({
  component: BulkUpdatePage,
})

interface BulkRow {
  orderNumber: string
  courierName: string
  trackingNumber: string
}

function BulkUpdatePage() {
  const navigate = useNavigate()
  const bulkUpdate = useBulkUpdateResi()

  // CSV state
  const [csvRows, setCsvRows] = useState<BulkRow[]>([])
  const [csvFileName, setCsvFileName] = useState('')

  // Manual state
  const [manualRows, setManualRows] = useState<BulkRow[]>([
    { orderNumber: '', courierName: '', trackingNumber: '' },
  ])

  // Dialogs
  const [showConfirm, setShowConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState('manual')
  const [resultDialog, setResultDialog] = useState<{ success: number; failed: number; errors: string[] } | null>(null)

  // ==========================================
  // CSV HANDLING
  // ==========================================

  const handleDownloadTemplate = () => {
    const csv = 'no_order,nama_kurir,no_resi\nORD-001,JNE,123456789\nORD-002,J&T,987654321'
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template_resi.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCsvFileName(file.name)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.trim().split('\n')
      const rows: BulkRow[] = []

      for (let i = 1; i < lines.length; i++) { // skip header
        const cols = lines[i].split(',').map(s => s.trim())
        if (cols.length >= 3 && cols[0] && cols[1] && cols[2]) {
          rows.push({
            orderNumber: cols[0],
            courierName: cols[1],
            trackingNumber: cols[2],
          })
        }
      }

      setCsvRows(rows)
    }
    reader.readAsText(file)
  }

  // ==========================================
  // MANUAL HANDLING
  // ==========================================

  const addManualRow = () => {
    setManualRows([...manualRows, { orderNumber: '', courierName: '', trackingNumber: '' }])
  }

  const updateManualRow = (idx: number, field: keyof BulkRow, value: string) => {
    const updated = [...manualRows]
    updated[idx] = { ...updated[idx], [field]: value }
    setManualRows(updated)
  }

  const removeManualRow = (idx: number) => {
    setManualRows(manualRows.filter((_, i) => i !== idx))
  }

  // ==========================================
  // SUBMIT
  // ==========================================

  const getSubmitRows = () => {
    return activeTab === 'csv'
      ? csvRows
      : manualRows.filter(r => r.orderNumber && r.courierName && r.trackingNumber)
  }

  const handleSubmit = () => {
    const rows = getSubmitRows()
    if (rows.length === 0) {
      toast.error('Tidak ada data untuk diproses')
      return
    }
    setShowConfirm(true)
  }

  const handleConfirmSubmit = () => {
    setShowConfirm(false)
    const rows = getSubmitRows()

    bulkUpdate.mutate({ items: rows }, {
      onSuccess: (data) => {
        setResultDialog(data)
        if (data.success > 0) toast.success(`${data.success} resi berhasil diupdate`)
      },
      onError: (e: any) => toast.error(e.message || 'Gagal memproses bulk update'),
    })
  }

  const submitRows = getSubmitRows()

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/shipping' })}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Update Resi Massal</h1>
          <p className="text-sm text-muted-foreground">
            Upload CSV atau input manual untuk update banyak resi sekaligus
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="manual">📝 Input Manual</TabsTrigger>
          <TabsTrigger value="csv">📁 Upload CSV</TabsTrigger>
        </TabsList>

        {/* ========== TAB: CSV ========== */}
        <TabsContent value="csv" className="space-y-4 mt-4">
          {/* Download Template */}
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium">1. Download template CSV</p>
                <p className="text-sm text-muted-foreground">Kolom: no_order, nama_kurir, no_resi</p>
              </div>
              <Button variant="outline" onClick={handleDownloadTemplate}>
                <Download className="mr-2 h-4 w-4" /> Download Template
              </Button>
            </CardContent>
          </Card>

          {/* Upload Area */}
          <Card>
            <CardContent className="p-4">
              <p className="font-medium mb-3">2. Upload file CSV</p>
              <label className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {csvFileName || 'Klik atau drag file CSV ke sini'}
                </p>
                <input
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleCsvUpload}
                />
              </label>
            </CardContent>
          </Card>

          {/* Preview */}
          {csvRows.length > 0 && (
            <Card>
              <CardHeader className="pb-3 border-b">
                <CardTitle className="flex items-center gap-2">
                  <FileSpreadsheet className="h-5 w-5" />
                  Preview ({csvRows.length} baris)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>No Order</TableHead>
                      <TableHead>Kurir</TableHead>
                      <TableHead>No Resi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvRows.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="font-mono text-sm">{row.orderNumber}</TableCell>
                        <TableCell>{row.courierName}</TableCell>
                        <TableCell className="font-mono text-sm">{row.trackingNumber}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ========== TAB: MANUAL ========== */}
        <TabsContent value="manual" className="space-y-4 mt-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>No Pesanan</TableHead>
                    <TableHead>Kurir</TableHead>
                    <TableHead>No Resi</TableHead>
                    <TableHead className="w-[60px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {manualRows.map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>
                        <Input
                          placeholder="ORD-XXXXX"
                          value={row.orderNumber}
                          onChange={(e) => updateManualRow(idx, 'orderNumber', e.target.value)}
                          className="font-mono"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="JNE / J&T / SiCepat"
                          value={row.courierName}
                          onChange={(e) => updateManualRow(idx, 'courierName', e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          placeholder="No. Resi"
                          value={row.trackingNumber}
                          onChange={(e) => updateManualRow(idx, 'trackingNumber', e.target.value)}
                          className="font-mono"
                        />
                      </TableCell>
                      <TableCell>
                        {manualRows.length > 1 && (
                          <Button variant="ghost" size="icon" onClick={() => removeManualRow(idx)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Button variant="outline" onClick={addManualRow}>
            <Plus className="mr-2 h-4 w-4" /> Tambah Baris
          </Button>
        </TabsContent>
      </Tabs>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button
          size="lg"
          disabled={submitRows.length === 0 || bulkUpdate.isPending}
          onClick={handleSubmit}
        >
          {bulkUpdate.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Upload className="mr-2 h-4 w-4" />
          )}
          Proses {submitRows.length} Resi
        </Button>
      </div>

      {/* ========== CONFIRM DIALOG ========== */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Update Resi</AlertDialogTitle>
            <AlertDialogDescription>
              Yakin mau update <strong>{submitRows.length}</strong> resi sekaligus?
              Aksi ini akan mengubah data tracking number pada pesanan yang bersangkutan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSubmit}>
              Ya, Proses Semua
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ========== RESULT DIALOG ========== */}
      <Dialog open={!!resultDialog} onOpenChange={() => setResultDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hasil Update Resi</DialogTitle>
          </DialogHeader>
          {resultDialog && (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950/20 rounded-md">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="font-medium">Berhasil: {resultDialog.success} pesanan</span>
              </div>

              {resultDialog.failed > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950/20 rounded-md">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="font-medium">Gagal: {resultDialog.failed} pesanan</span>
                  </div>
                  {resultDialog.errors.length > 0 && (
                    <div className="text-sm space-y-1 pl-8">
                      {resultDialog.errors.map((err, i) => (
                        <p key={i} className="text-red-600">• {err}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <Button className="w-full" onClick={() => navigate({ to: '/shipping' })}>
                Kembali ke Daftar Pengiriman
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
