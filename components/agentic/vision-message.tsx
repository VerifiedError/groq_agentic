'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X, ZoomIn } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface VisionMessageProps {
  role: 'user' | 'assistant' | 'system'
  content: string
  images?: string[]
  reasoning?: string
}

export function VisionMessage({ role, content, images, reasoning }: VisionMessageProps) {
  const [lightboxImage, setLightboxImage] = useState<string | null>(null)

  return (
    <div className="space-y-2">
      {/* Images Gallery */}
      {images && images.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative group w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden border-2 border-black cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setLightboxImage(image)}
            >
              <Image
                src={image}
                alt={`Image ${index + 1}`}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity flex items-center justify-center">
                <ZoomIn className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Message Content */}
      <div className="prose prose-sm max-w-none dark:prose-invert">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>

      {/* Lightbox */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <button
            onClick={() => setLightboxImage(null)}
            className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
            title="Close"
          >
            <X className="h-6 w-6 text-black" />
          </button>
          <div className="relative max-w-7xl max-h-full">
            <Image
              src={lightboxImage}
              alt="Full size image"
              width={1200}
              height={1200}
              className="object-contain max-h-[90vh] w-auto h-auto"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  )
}
