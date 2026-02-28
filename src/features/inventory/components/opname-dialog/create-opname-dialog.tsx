import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { OpnameForm } from './opname-form'

export function CreateOpnameDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Sesi Opname Baru
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Buat Sesi Opname Baru</DialogTitle>
          <DialogDescription>
            Pilih gudang untuk melakukan perhitungan stok fisik. Sistem akan
            menyalin seluruh stok gudang saat ini sebagai patokan awal
            perhitungan.
          </DialogDescription>
        </DialogHeader>
        <OpnameForm onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
