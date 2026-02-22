import { useEffect, useRef } from 'react'

export function useBarcodeScanner(onScan: (code: string) => void) {
  const buffer = useRef('')
  const lastKeyTime = useRef(0)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        // Ignore if input focused (except if we want to allow scanning into inputs? Usually barcode scanners act as keyboard, so they type into focused input. 
        // But for global listener, we want to catch it when NOT focused on search.)
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

        const now = Date.now()
        
        // standard barcode scanners type fast (< 50-100ms per char)
        if (now - lastKeyTime.current > 100) {
            buffer.current = ''
        }
        lastKeyTime.current = now

        if (e.key === 'Enter') {
            if (buffer.current.length > 1) { // Min length
                onScan(buffer.current)
                buffer.current = ''
            }
        } else if (e.key.length === 1) {
            buffer.current += e.key
        }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onScan])
}
