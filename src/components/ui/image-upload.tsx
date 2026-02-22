import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { ImagePlus, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ImageUploadProps {
  value?: string | null
  onChange: (url: string) => void
  onRemove: () => void
  disabled?: boolean
  className?: string
}

export function ImageUpload({
  value,
  onChange,
  onRemove,
  disabled,
  className,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    // Validate type
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed')
      return
    }

    try {
      setIsUploading(true)
      const formData = new FormData()
      formData.append('file', file)

      const token = localStorage.getItem('auth_token')
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      
      const response = await fetch(`${apiUrl}/api/upload`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Upload failed')
      }

      const data = await response.json()
      onChange(data.url)
      toast.success('Image uploaded successfully')
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload image')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const getImageUrl = (url: string) => {
    if (url.startsWith('http')) return url
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    return `${apiUrl}${url}`
  }

  return (
    <div className={cn('flex items-center gap-4', className)}>
      <div className="relative h-40 w-40 overflow-hidden rounded-md border border-dashed hover:opacity-75 transition">
        {isUploading ? (
          <div className="flex h-full w-full items-center justify-center bg-secondary/50">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : value ? (
          <>
            <img
              src={getImageUrl(value)}
              alt="Upload"
              className="h-full w-full object-cover"
            />
            <Button
              type="button"
              onClick={onRemove}
              variant="destructive"
              size="icon"
              className="absolute right-1 top-1 h-6 w-6"
              disabled={disabled}
            >
              <X className="h-3 w-3" />
            </Button>
          </>
        ) : (
          <div
            className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-2 bg-secondary/20"
            onClick={() => fileInputRef.current?.click()}
          >
            <ImagePlus className="h-8 w-8 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Upload Image</span>
          </div>
        )}
      </div>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        ref={fileInputRef}
        onChange={handleFileChange}
        disabled={disabled || isUploading}
      />
    </div>
  )
}
