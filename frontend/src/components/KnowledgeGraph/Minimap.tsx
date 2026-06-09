import { useRef, useEffect } from 'react'
import type { KnowledgeNode, KnowledgeEdge } from '../../types'
import { getCategoryColor } from '../../styles/colors'

export function Minimap({ nodes, links, selectedNodeId, onNodeClick }: {
  nodes: KnowledgeNode[]
  links: KnowledgeEdge[]
  selectedNodeId: string | null
  onNodeClick: (node: KnowledgeNode) => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const SIZE = 180

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const dpr = window.devicePixelRatio || 1
    canvas.width  = SIZE * dpr
    canvas.height = SIZE * dpr
    canvas.style.width  = `${SIZE}px`
    canvas.style.height = `${SIZE}px`
    ctx.scale(dpr, dpr)

    let raf: number;
    
    // O Loop infinito que desenha o radar a 60FPS
    const renderMap = () => {
      if (nodes.length === 0) return;

      ctx.clearRect(0, 0, SIZE, SIZE)
      ctx.fillStyle = 'rgba(2,8,23,0.92)'
      ctx.fillRect(0, 0, SIZE, SIZE)
      ctx.strokeStyle = 'rgba(125,211,252,0.2)'
      ctx.lineWidth = 1
      ctx.strokeRect(0.5, 0.5, SIZE - 1, SIZE - 1)

      const pad = 18
      // Pega apenas nós que já nasceram no mundo físico do 3D
      const validNodes = nodes.filter(n => n.x !== undefined && n.z !== undefined)
      if (validNodes.length === 0) {
        raf = requestAnimationFrame(renderMap);
        return;
      }

      const xs = validNodes.map(n => n.x!)
      const zs = validNodes.map(n => n.z!)
      const minX = Math.min(...xs), maxX = Math.max(...xs)
      const minZ = Math.min(...zs), maxZ = Math.max(...zs)
      const rangeX = Math.max(maxX - minX, 1)
      const rangeZ = Math.max(maxZ - minZ, 1)
      const mapW = SIZE - pad * 2
      const mapH = SIZE - pad * 2

      const toScreen = (n: KnowledgeNode) => ({
        x: pad + ((n.x ?? 0) - minX) / rangeX * mapW,
        y: pad + ((n.z ?? 0) - minZ) / rangeZ * mapH,
      })

      ctx.lineWidth = 0.5
      links.forEach(link => {
        const srcId = typeof link.source === 'object' ? (link.source as KnowledgeNode).id : link.source
        const tgtId = typeof link.target === 'object' ? (link.target as KnowledgeNode).id : link.target
        const src = validNodes.find(n => n.id === srcId)
        const tgt = validNodes.find(n => n.id === tgtId)
        if (!src || !tgt) return
        const a = toScreen(src), b = toScreen(tgt)
        ctx.strokeStyle = srcId === 'root' ? 'rgba(125,211,252,0.35)' : 'rgba(165,180,252,0.18)'
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke()
      })

      validNodes.forEach(n => {
        const { x, y } = toScreen(n)
        const isRoot     = n.id === 'root'
        const isSelected = n.id === selectedNodeId
        const isVisited  = n.visited === true
        const color = isVisited ? '#86efac' : getCategoryColor(n.category ?? 'default')
        const r = isRoot ? 5 : isSelected ? 4 : 3

        if (isSelected) {
          ctx.beginPath()
          ctx.arc(x, y, r + 3, 0, Math.PI * 2)
          ctx.fillStyle = color + '33'
          ctx.fill()
        }
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()

        if (isRoot) {
          ctx.fillStyle = 'rgba(240,249,255,0.7)'
          ctx.font = '8px monospace'
          ctx.textAlign = 'center'
          ctx.fillText('root', x, y - r - 2)
        }
      })

      ctx.fillStyle = 'rgba(125,211,252,0.4)'
      ctx.font = '7px monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`${nodes.length} NÓS`, 6, SIZE - 6)

      raf = requestAnimationFrame(renderMap) // Pede o próximo quadro
    }
    
    renderMap(); // Inicia o loop

    return () => cancelAnimationFrame(raf);
  }, [nodes, links, selectedNodeId])

  return (
    <div style={{ position: 'fixed', bottom: '1.5rem', left: '1.5rem', zIndex: 60, borderRadius: 6, overflow: 'hidden', boxShadow: '0 4px 32px rgba(0,0,0,0.6)' }}>
      <div style={{ padding: '4px 8px', background: 'rgba(2,8,23,0.95)', borderBottom: '1px solid rgba(125,211,252,0.15)', fontFamily: 'Space Mono, monospace', fontSize: 9, letterSpacing: '0.12em', color: 'rgba(125,211,252,0.5)' }}>
        MINIMAP 2D
      </div>
      <canvas ref={canvasRef} style={{ display: 'block', cursor: 'default' }} />
    </div>
  )
}