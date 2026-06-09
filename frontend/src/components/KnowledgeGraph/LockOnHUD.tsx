import type { KnowledgeNode } from '../../types'
import { getCategoryColor } from '../../styles/colors'

export function LockOnHUD({ lockedNode, onUnlock }: { lockedNode: KnowledgeNode | null; onUnlock: () => void }) {
  if (!lockedNode) return null
  const color = lockedNode.visited ? '#86efac' : getCategoryColor(lockedNode.category ?? 'default')
  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)',
      zIndex: 60,
      background: 'rgba(2,8,23,0.92)',
      border: `1px solid ${color}44`,
      borderRadius: 999,
      padding: '6px 16px',
      display: 'flex', alignItems: 'center', gap: 10,
      fontFamily: 'Space Mono, monospace',
      boxShadow: `0 0 20px ${color}22`,
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} />
      <span style={{ fontSize: 10, color: '#f0f9ff', letterSpacing: '0.08em' }}>LOCK-ON: {lockedNode.title}</span>
      <button
        onClick={onUnlock}
        style={{
          background: 'rgba(125,211,252,0.1)', border: '1px solid rgba(125,211,252,0.3)',
          borderRadius: 4, color: '#7dd3fc', fontFamily: 'inherit',
          fontSize: 9, letterSpacing: '0.1em', padding: '2px 8px', cursor: 'pointer',
        }}
      >
        SOLTAR [ESC]
      </button>
    </div>
  )
}