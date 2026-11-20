// Render paragraphs as React text, never execute HTML supplied through the API.
export function synopsisParagraphs(description: string): string[] {
  return description.split(/<\/?p\b[^>]*>|\n\s*\n/i)
    .map(text => text.replace(/<br\s*\/?\s*>/gi, '\n').replace(/<[^>]*>/g, '').trim())
    .filter(Boolean)
}
