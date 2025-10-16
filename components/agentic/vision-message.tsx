interface VisionMessageProps {
  content: string
}

export function VisionMessage({ content }: VisionMessageProps) {
  // Parse the content into sections
  const sections = parseVisionContent(content)

  return (
    <div className="space-y-6">
      {sections.map((section, index) => (
        <Section key={index} section={section} />
      ))}
    </div>
  )
}

interface ParsedSection {
  title?: string
  content: string[]
  type: 'paragraph' | 'list' | 'colors' | 'keyvalue'
}

function parseVisionContent(content: string): ParsedSection[] {
  const sections: ParsedSection[] = []
  const lines = content.split('\n').filter(line => line.trim())

  let currentSection: ParsedSection | null = null

  for (const line of lines) {
    let trimmedLine = line.trim()

    // Strip markdown heading syntax (###, ##, #)
    const markdownHeading = trimmedLine.match(/^#{1,3}\s+(.+)$/)
    if (markdownHeading) {
      trimmedLine = markdownHeading[1]
    }

    // Strip markdown bold/emphasis (**text**, *text*)
    trimmedLine = trimmedLine.replace(/\*\*/g, '')

    // Check if this line is a section header (ends with ':' or is a known header)
    const isHeader =
      trimmedLine.endsWith(':') ||
      /^(Image Analysis|Logo Details|Color Scheme|Overall|The logo features|The logo contains|The dominant colors|The tagline)/i.test(trimmedLine)

    if (isHeader) {
      // Save previous section
      if (currentSection) {
        sections.push(currentSection)
      }

      // Start new section
      currentSection = {
        title: trimmedLine.replace(/:$/, ''),
        content: [],
        type: 'paragraph'
      }
    } else if (currentSection) {
      currentSection.content.push(trimmedLine)
    } else {
      // Content before any header
      sections.push({
        content: [trimmedLine],
        type: 'paragraph'
      })
    }
  }

  // Add last section
  if (currentSection) {
    sections.push(currentSection)
  }

  // Detect section types
  sections.forEach(section => {
    if (section.title?.toLowerCase().includes('color')) {
      section.type = 'colors'
    } else if (section.content.every(line => line.startsWith('A ') || line.startsWith('An ') || line.startsWith('The '))) {
      section.type = 'list'
    } else if (section.content.length > 1 && section.content.length < 10) {
      section.type = 'list'
    }
  })

  return sections
}

function Section({ section }: { section: ParsedSection }) {
  return (
    <div className="space-y-2">
      {section.title && (
        <h3 className="text-base font-semibold text-foreground">
          {section.title}
        </h3>
      )}

      {section.type === 'colors' ? (
        <ColorList items={section.content} />
      ) : section.type === 'list' ? (
        <ul className="space-y-1.5 ml-4">
          {section.content.map((item, i) => (
            <li key={i} className="text-sm text-foreground/90 list-disc">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <div className="space-y-2">
          {section.content.map((paragraph, i) => (
            <p key={i} className="text-sm text-foreground/90 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

function ColorList({ items }: { items: string[] }) {
  const colors = items.map(item => {
    const match = item.match(/^([A-Za-z\s]+)/)
    return match ? match[1].trim() : item
  })

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-3">
        {colors.map((color, i) => (
          <ColorSwatch key={i} color={color} />
        ))}
      </div>
      <ul className="space-y-1 ml-4 mt-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-foreground/80 list-disc">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function ColorSwatch({ color }: { color: string }) {
  // Map common color names to hex codes
  const colorMap: Record<string, string> = {
    'black': '#000000',
    'white': '#ffffff',
    'red': '#ff0000',
    'blue': '#0000ff',
    'green': '#00ff00',
    'yellow': '#ffff00',
    'purple': '#800080',
    'orange': '#ffa500',
    'pink': '#ffc0cb',
    'brown': '#a52a2a',
    'gray': '#808080',
    'grey': '#808080',
    'dark gray': '#404040',
    'dark grey': '#404040',
    'light gray': '#d3d3d3',
    'light grey': '#d3d3d3',
    'navy': '#000080',
    'teal': '#008080',
    'gold': '#ffd700',
    'silver': '#c0c0c0',
  }

  const colorLower = color.toLowerCase()
  const hexColor = colorMap[colorLower] || '#808080'

  return (
    <div className="flex items-center gap-2">
      <div
        className="w-6 h-6 rounded border border-border shadow-sm"
        style={{ backgroundColor: hexColor }}
      />
      <span className="text-sm font-medium text-foreground/90 capitalize">
        {color}
      </span>
    </div>
  )
}
