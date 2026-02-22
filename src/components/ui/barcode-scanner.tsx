import { useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface BarcodeScannerProps {
  onScan: (result: string) => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function BarcodeScanner({ onScan, open, onOpenChange }: BarcodeScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  useEffect(() => {
    if (open) {
      // Delay init to ensure DOM is ready inside Dialog
      const timeout = setTimeout(() => {
        // Element with id="reader" must exist
        if (document.getElementById('reader') && !scannerRef.current) {
          const scanner = new Html5QrcodeScanner(
            "reader",
            { 
              fps: 10, 
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0,
              showTorchButtonIfSupported: true
            },
            /* verbose= */ false
          );
          
          scanner.render(
            (decodedText) => {
              onScan(decodedText)
              // We don't auto-close here to allow multiple scans if needed, 
              // or let parent handle it. But usually we want to close.
              // Let's defer closing to parent or do it here.
              // For a form input, one scan is enough.
              onOpenChange(false)
            },
            (errorMessage) => {
              // parse error, ignore
            }
          );
          scannerRef.current = scanner
        }
      }, 300) // 300ms delay for Dialog animation
      
      return () => clearTimeout(timeout)
    } else {
      // Cleanup when dialog closes
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => console.error("Failed to clear scanner", err));
        scannerRef.current = null
      }
    }
  }, [open, onScan, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Scan Barcode</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center p-4">
          <div id="reader" className="w-full overflow-hidden rounded-lg bg-muted" />
          <p className="mt-4 text-sm text-muted-foreground text-center">
            Point your camera at a barcode or QR code
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
