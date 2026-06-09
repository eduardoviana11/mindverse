import type { KnowledgeMap } from "../types"

const STORAGE_KEY = 'mindverse_palaces'
const MAX_PALACES = 10

export function savePalace(map: KnowledgeMap): void {
    const existing = loadPalaces()
    const filtered = existing.filter(p => p.id !== map.id)
    const updated = [map, ...filtered].slice(0, MAX_PALACES)

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
    } catch (error) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated.slice(0, MAX_PALACES - 1)))        
    }
}

export function loadPalaces(): KnowledgeMap[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? JSON.parse(raw) : []
    } catch {
        return []
    }
}

export function deletePalace(id: string): void {
    const updated = loadPalaces().filter(p => p.id !== id)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
}

export function getPalace(id: string): KnowledgeMap | undefined {
    return loadPalaces().find(p => p.id === id)
}