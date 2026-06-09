import { useEffect, useRef } from 'react'

export function useTerminalSync() {
  const isSavedRef = useRef(false)
  const isExpandingRef = useRef(false)

  useEffect(() => {
    const handleSaveStatus = (e: any) => { isSavedRef.current = e.detail }
    const handleExpandStatus = (e: any) => { isExpandingRef.current = e.detail }

    window.addEventListener('map-saved-status', handleSaveStatus)
    window.addEventListener('map-expand-status', handleExpandStatus)
    
    return () => {
      window.removeEventListener('map-saved-status', handleSaveStatus)
      window.removeEventListener('map-expand-status', handleExpandStatus)
    }
  }, [])

  return { isSavedRef, isExpandingRef }
}