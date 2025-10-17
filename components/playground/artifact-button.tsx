'use client'

import { useState } from 'react'
import { Plus, X, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ARTIFACT_TEMPLATES, ArtifactTemplate } from '@/lib/artifact-templates'

interface ArtifactButtonProps {
  onCreateArtifact: (template: ArtifactTemplate, customTitle?: string) => void
}

export function ArtifactButton({ onCreateArtifact }: ArtifactButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState<ArtifactTemplate | null>(null)
  const [customTitle, setCustomTitle] = useState('')

  const filteredTemplates = ARTIFACT_TEMPLATES.filter((template) => {
    const query = searchQuery.toLowerCase()
    return (
      template.title.toLowerCase().includes(query) ||
      template.description.toLowerCase().includes(query) ||
      template.tags.some((tag) => tag.toLowerCase().includes(query))
    )
  })

  const handleCreate = () => {
    if (!selectedTemplate) return
    onCreateArtifact(selectedTemplate, customTitle || undefined)
    setShowModal(false)
    setSelectedTemplate(null)
    setCustomTitle('')
    setSearchQuery('')
  }

  return (
    <>
      {/* Button */}
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        title="Create new artifact"
      >
        <Plus className="h-4 w-4" />
        <span>New Artifact</span>
      </button>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-4xl max-h-[85vh] bg-card border rounded-lg shadow-lg flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-semibold">Create New Artifact</h2>
                <p className="text-sm text-muted-foreground">
                  Choose a template to get started
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 hover:bg-accent rounded-md transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Search */}
            <div className="p-4 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search templates..."
                  className="w-full pl-10 pr-3 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* Template Grid */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => setSelectedTemplate(template)}
                    className={cn(
                      'flex flex-col items-start gap-2 p-4 border-2 rounded-lg text-left transition-all hover:border-primary/50',
                      selectedTemplate?.id === template.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border'
                    )}
                  >
                    {/* Icon & Title */}
                    <div className="flex items-center gap-2 w-full">
                      <span className="text-2xl">{template.icon}</span>
                      <h3 className="font-semibold text-sm flex-1 line-clamp-1">
                        {template.title}
                      </h3>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {template.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mt-auto">
                      {template.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-0.5 text-xs bg-muted rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>

              {filteredTemplates.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No templates found matching &quot;{searchQuery}&quot;</p>
                </div>
              )}
            </div>

            {/* Footer with Custom Title Input */}
            {selectedTemplate && (
              <div className="p-4 border-t space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">
                    Artifact Title (Optional)
                  </label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder={selectedTemplate.title}
                    className="w-full px-3 py-2 text-sm bg-background border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setSelectedTemplate(null)
                      setCustomTitle('')
                    }}
                    className="px-4 py-2 text-sm border rounded-md hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 px-5 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Create Artifact
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
