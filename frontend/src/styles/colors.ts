export const CATEGORY_COLORS: Record<string, string> = {
  fundamentos: '#7dd3fc',      // sky blue
  aplicações: '#86efac',       // green
  histórico: '#fcd34d',        // amber
  algoritmos: '#c4b5fd',       // violet
  conceitos: '#f9a8d4',        // pink
  tecnologia: '#67e8f9',       // cyan
  matemática: '#fdba74',       // orange
  default: '#a5b4fc',          // indigo
}

export function getCategoryColor(category: string): string {
  const key = category.toLowerCase()
  for (const [cat, color] of Object.entries(CATEGORY_COLORS)) {
    if (key.includes(cat)) return color
  }
  return CATEGORY_COLORS.default
}

export function getCategoryColorHex(category: string): number {
  return parseInt(getCategoryColor(category).replace('#', ''), 16)
}