export interface Location {
  file: string
  startLine: number
  endLine: number
}

export interface Finding {
  vulnerability: string
  vulnerabilityType: string
  severity: string
  dataType?: string
  sourceLocation?: Location
  sinkLocation?: Location
  lineContent?: string
  description: string
  recommendation: string
  codeSuggestion?: string
}

const patternCache = new Map<string, RegExp>()

function buildPattern(label: string): RegExp {
  if (!patternCache.has(label)) {
    const regex = new RegExp(`^(?:[-*]\\s*)?\\*\\*${label}:\\*\\*\\s*(.+)$`, "i")
    patternCache.set(label, regex)
  }
  return patternCache.get(label)!
}

function extractFromSection(section: string, label: string): string | undefined {
  const pattern = buildPattern(label)
  const match = section.match(pattern)
  return match ? match[1].trim() : undefined
}

export function parseLocation(locationStr: string | undefined): Location | undefined {
  if (!locationStr) return undefined

  const cleaned = locationStr.replace(/`/g, "").trim()
  const match = cleaned.match(/^(.+?)(?::(\d+)(?:-(\d+))?)?$/)

  if (!match) return undefined

  const file = match[1]
  const startLine = match[2] ? parseInt(match[2], 10) : 1
  const endLine = match[3] ? parseInt(match[3], 10) : startLine

  return { file, startLine, endLine }
}

export function parseMarkdownToDict(content: string): Finding[] {
  const cleaned = content
    .replace(/^- \*\*/gm, "- ")
    .replace(/\*\*:/gm, ":")

  const sections = cleaned.split(/\n## Vulnerability:/i).slice(1)

  return sections.map(section => {
    const vulnerability = section.split("\n")[0].replace(/^[-*\s]+/g, "").trim()
    const vulnerabilityType = extractFromSection(section, "Type") || ""
    const severity = extractFromSection(section, "Severity") || ""
    const dataType = extractFromSection(section, "Data Type")
    const lineContent = extractFromSection(section, "Line Content")
    const description = extractFromSection(section, "Description") || ""
    const recommendation = extractFromSection(section, "Recommendation") || ""

    const sourceLocation = parseLocation(extractFromSection(section, "Source"))
    const sinkLocation = parseLocation(extractFromSection(section, "Sink"))

    const codeSuggestionMatch = recommendation.match(/```[\w]*\n([\s\S]*?)```/)
    const codeSuggestion = codeSuggestionMatch ? codeSuggestionMatch[1].trim() : undefined

    const finding: Finding = {
      vulnerability,
      vulnerabilityType,
      severity,
      sourceLocation,
      sinkLocation,
      lineContent,
      description,
      recommendation,
    }

    if (dataType) finding.dataType = dataType
    if (codeSuggestion) finding.codeSuggestion = codeSuggestion

    return finding
  })
}
