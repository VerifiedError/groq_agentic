'use client'

import { useState, useRef } from 'react'
import { X, Image as ImageIcon, Camera, Upload } from 'lucide-react'
import Image from 'next/image'

interface ImageUploadProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  maxImages?: number
  maxSizeMB?: number
}

export function ImageUpload({
  images,
  onImagesChange,
  maxImages = 5,
  maxSizeMB = 4,
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const validFiles: string[] = []
    const maxSizeBytes = maxSizeMB * 1024 * 1024

    for (let i = 0; i < files.length; i++) {
      const file = files[i]

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`)
        continue
      }

      // Check file size
      if (file.size > maxSizeBytes) {
        alert(`${file.name} is too large (max ${maxSizeMB}MB)`)
        continue
      }

      // Check if we've reached max images
      if (images.length + validFiles.length >= maxImages) {
        alert(`Maximum ${maxImages} images allowed`)
        break
      }

      // Convert to base64
      const base64 = await fileToBase64(file)
      validFiles.push(base64)
    }

    if (validFiles.length > 0) {
      onImagesChange([...images, ...validFiles])
    }
  }

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(file)
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  return (
    <div className="space-y-2">
      {/* Image Thumbnails */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative group w-16 h-16 rounded-lg overflow-hidden border-2 border-black"
            >
              <Image
                src={image}
                alt={`Upload ${index + 1}`}
                fill
                className="object-cover"
              />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity"
                title="Remove image"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Buttons */}
      {images.length < maxImages && (
        <div className="flex gap-2">
          {/* File Picker Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 border-2 border-black rounded-lg hover:bg-gray-50 transition-colors"
            title="Upload from files"
          >
            <Upload className="h-4 w-4" />
            <span className="text-sm hidden sm:inline">Upload</span>
          </button>

          {/* Camera Button (Mobile) */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 border-2 border-black rounded-lg hover:bg-gray-50 transition-colors sm:hidden"
            title="Take photo"
          >
            <Camera className="h-4 w-4" />
          </button>

          {/* Drag & Drop Area (Desktop) */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`hidden sm:flex flex-1 items-center justify-center gap-2 px-4 py-2 border-2 border-dashed rounded-lg transition-colors ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <ImageIcon className="h-4 w-4 text-gray-500" />
            <span className="text-sm text-gray-500">
              {isDragging ? 'Drop images here' : 'Or drag & drop images'}
            </span>
          </div>

          {/* Hidden File Inputs */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
          />
        </div>
      )}

      {/* Image Count */}
      {images.length > 0 && (
        <p className="text-xs text-gray-500">
          {images.length} / {maxImages} images ({maxSizeMB}MB max each)
        </p>
      )}
    </div>
  )
}
