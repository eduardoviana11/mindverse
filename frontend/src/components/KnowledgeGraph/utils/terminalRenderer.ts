import type { GraphData } from '../../../types'

export interface TerminalRenderData {
  topic?: string
  graphData: GraphData
  selectedNodeId: string | null
  isSaved: boolean
  isExpanding: boolean
  isLockedOn: boolean
}

export function drawTerminalDashboard(
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  data: TerminalRenderData
) {
  const { topic, graphData, selectedNodeId, isSaved, isExpanding, isLockedOn } = data

  // Fundo
  ctx.fillStyle = 'rgba(11, 15, 23, 1)'
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // ── TOP BAR INTERATIVA ──
  ctx.fillStyle = '#f0f9ff'; ctx.textAlign = 'center'; ctx.font = 'bold 32px "Space Mono", monospace'
  
  const rawTopic = (topic || "SISTEMA").toUpperCase()
  const safeTopic = rawTopic.length > 24 ? rawTopic.substring(0, 21) + '...' : rawTopic
  
  ctx.fillText(safeTopic, 512, 65)
  ctx.fillStyle = 'rgba(125, 211, 252, 0.6)'; ctx.font = '18px "Space Mono", monospace'
  ctx.fillText(`${graphData.nodes.length} CONCEITOS MAPEADOS`, 512, 95)
  ctx.textAlign = 'left'

  // Botão VOLTAR (Esquerda)
  ctx.fillStyle = 'rgba(125, 211, 252, 0.1)'; ctx.fillRect(40, 40, 220, 60)
  ctx.strokeStyle = '#7dd3fc'; ctx.lineWidth = 2; ctx.strokeRect(40, 40, 220, 60)
  ctx.fillStyle = '#7dd3fc'; ctx.font = 'bold 20px "Space Mono", monospace'
  ctx.fillText('← BIBLIOTECA', 70, 78)

  // Botão SALVAR (Direita)
  const saveColor = isSaved ? '#86efac' : '#7dd3fc'
  ctx.fillStyle = isSaved ? 'rgba(134, 239, 172, 0.1)' : 'rgba(125, 211, 252, 0.1)'
  ctx.fillRect(764, 40, 220, 60)
  ctx.strokeStyle = saveColor; ctx.strokeRect(764, 40, 220, 60)
  ctx.fillStyle = saveColor
  ctx.fillText(isSaved ? '✓ MAPA SALVO' : '💾 SALVAR MAPA', 788, 78)

  // Linha separadora
  ctx.strokeStyle = 'rgba(125, 211, 252, 0.2)'; ctx.beginPath(); ctx.moveTo(40, 130); ctx.lineTo(984, 130); ctx.stroke()

  // ── MEIO DA TELA: DASHBOARD ÚTIL ──
  const totalNodes = graphData.nodes.length
  const totalLinks = graphData.links.length
  
  let maxLinks = 0
  let hubNode: any = null
  
  if (totalNodes > 0) {
    const linkCounts: Record<string, number> = {}
    graphData.links.forEach((l: any) => {
      const sourceId = typeof l.source === 'object' ? l.source.id : l.source
      const targetId = typeof l.target === 'object' ? l.target.id : l.target
      linkCounts[sourceId] = (linkCounts[sourceId] || 0) + 1
      linkCounts[targetId] = (linkCounts[targetId] || 0) + 1
    })
    
    const hubId = Object.keys(linkCounts).reduce((a, b) => linkCounts[a] > linkCounts[b] ? a : b, graphData.nodes[0]?.id)
    hubNode = graphData.nodes.find((n: any) => n.id === hubId)
    maxLinks = linkCounts[hubId] || 0
  }

  // Coluna Esquerda: Estado Global da Rede
  ctx.fillStyle = '#7dd3fc'; ctx.font = 'bold 22px "Space Mono", monospace'
  ctx.fillText('ESTADO DA REDE', 60, 200)

  ctx.fillStyle = 'rgba(240, 249, 255, 0.8)'; ctx.font = '18px "Space Mono", monospace'
  ctx.fillText(`MÓDULOS ATIVOS:   ${totalNodes}`, 60, 250)
  ctx.fillText(`CONEXÕES (LINKS): ${totalLinks}`, 60, 290)
  
  const MAX_NODES = 40
  const capacityPct = Math.min((totalNodes / MAX_NODES) * 100, 100)
  
  ctx.fillText(`USO DE MEMÓRIA:   ${Math.floor(capacityPct)}% (${totalNodes}/${MAX_NODES})`, 60, 330)

  ctx.fillStyle = 'rgba(125, 211, 252, 0.1)'; ctx.fillRect(60, 350, 300, 10)
  ctx.fillStyle = capacityPct >= 80 ? '#ff5f57' : '#86efac' 
  ctx.fillRect(60, 350, 300 * (capacityPct / 100), 10)

  // Coluna Direita: Topologia
  ctx.fillStyle = '#7dd3fc'; ctx.font = 'bold 22px "Space Mono", monospace'
  ctx.fillText('ANÁLISE TOPOLÓGICA', 450, 200)

  if (hubNode) {
    const hubTitle = hubNode.title || hubNode.id
    
    ctx.fillStyle = 'rgba(240, 249, 255, 0.8)'; ctx.font = '16px "Space Mono", monospace'
    ctx.fillText('NÓ MAIS INFLUENTE:', 450, 245)
    
    ctx.fillStyle = '#86efac'; ctx.font = 'bold 20px "Space Mono", monospace'
    ctx.fillText(`> ${hubTitle.length > 25 ? hubTitle.substring(0, 22) + '...' : hubTitle}`, 450, 275)
    
    ctx.fillStyle = 'rgba(240, 249, 255, 0.8)'; ctx.font = '16px "Space Mono", monospace'
    ctx.fillText(`CONEXÕES DO NÓ: ${maxLinks}`, 450, 315)
    
    ctx.fillStyle = 'rgba(134, 239, 172, 0.6)'; ctx.font = 'italic 14px "Space Mono", monospace'
    ctx.fillText(isExpanding ? '>>> Processando nova expansão neural...' : '>>> Grafo estabilizado.', 450, 355)
    
  } else {
    ctx.fillStyle = 'rgba(125, 211, 252, 0.4)'; ctx.font = 'italic 18px "Space Mono", monospace'
    ctx.fillText('Grafo vazio. Aguardando processamento.', 450, 250)
  }

  // ── RODAPÉ ÚTIL ──
  ctx.fillStyle = isLockedOn ? 'rgba(134, 239, 172, 0.05)' : 'rgba(125, 211, 252, 0.05)'
  ctx.fillRect(60, 480, 904, 80)
  ctx.strokeStyle = isLockedOn ? 'rgba(134, 239, 172, 0.3)' : 'rgba(125, 211, 252, 0.3)'
  ctx.strokeRect(60, 480, 904, 80)

  ctx.fillStyle = isLockedOn ? '#86efac' : '#7dd3fc'; ctx.font = 'bold 18px "Space Mono", monospace'
  ctx.textAlign = 'center'
  
  const controlHint = isLockedOn 
    ? 'ALVO TRAVADO | [ESC] LIBERAR CÂMERA | [PAINEL DIREITO] LER CONTEÚDO' 
    : '[W][A][S][D] MOVER | [MOUSE 2] ROTACIONAR | [MOUSE 1] INTERAGIR'
    
  ctx.fillText(controlHint, 512, 528)
  ctx.textAlign = 'left'
}