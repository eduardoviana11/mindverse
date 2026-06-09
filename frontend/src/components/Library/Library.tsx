import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { KnowledgeNode, KnowledgeMap, GraphData } from '../../types'
import { NodePanel } from '../NodePanel/NodePanel'
import { expandNode } from '../../services/aiService'
import { savePalace, loadPalaces } from '../../services/palaceStorage'
import styles from './Library.module.css'

interface LibraryProps {
  knowledgeMap: KnowledgeMap
  onReset: () => void
  onUpdateMap: (newGraphData: GraphData) => void
  selectedNode: KnowledgeNode | null
  setSelectedNode: (node: KnowledgeNode | null) => void
}

export function Library({ knowledgeMap, onReset, onUpdateMap, selectedNode, setSelectedNode }: LibraryProps) {
  const [isExpanding, setIsExpanding] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [isSaved, setIsSaved] = useState(false)
  
  // ── CONTROLE DE SALVAMENTO E SAÍDA ──
  const [isMapSaved, setIsMapSaved] = useState(() => {
    const savedMaps = loadPalaces()
    return savedMaps.some(map => map.id === knowledgeMap.id)
  }) 
  const [showExitWarning, setShowExitWarning] = useState(false)

  const handleBackClick = useCallback(() => {
    if (!isMapSaved) {
      setShowExitWarning(true)
    } else {
      onReset()
    }
  }, [isMapSaved, onReset])

  // Lógica de salvar extraída para podermos chamá-la de qualquer lugar
  const handleSaveClick = useCallback(() => {
    if (isSaved) return; // Evita spam de cliques
    const cleanLinks = knowledgeMap.graphData.links.map((link: any) => ({
      ...link, source: typeof link.source === 'object' ? link.source.id : link.source, target: typeof link.target === 'object' ? link.target.id : link.target
    }));
    const cleanNodes = knowledgeMap.graphData.nodes.map((node: any) => {
      const { vx, vy, vz, index, ...safeNode } = node; return safeNode as KnowledgeNode;
    });
    
    savePalace({ ...knowledgeMap, graphData: { nodes: cleanNodes, links: cleanLinks } });
    
    setIsMapSaved(true);
    setIsSaved(true); 
    
    // Dispara um evento para o Monitor 3D saber que o mapa foi salvo e ficar verde!
    window.dispatchEvent(new CustomEvent('map-saved-status', { detail: true }));
    
    setTimeout(() => {
      setIsSaved(false);
      window.dispatchEvent(new CustomEvent('map-saved-status', { detail: false }));
    }, 2000);
  }, [knowledgeMap, isSaved]);

  // ── A MÁGICA DA COMUNICAÇÃO 3D -> 2D ──
  // O Library.tsx fica escutando os lasers disparados no Canvas 3D
  useEffect(() => {
    const onVrBack = () => handleBackClick();
    const onVrSave = () => handleSaveClick();

    window.addEventListener('vr-click-back', onVrBack);
    window.addEventListener('vr-click-save', onVrSave);

    return () => {
      window.removeEventListener('vr-click-back', onVrBack);
      window.removeEventListener('vr-click-save', onVrSave);
    }
  }, [handleBackClick, handleSaveClick]);
  // ──────────────────────────────────────

  const handleExpand = useCallback(async (node: KnowledgeNode) => {
    if (isExpanding) return
    setIsExpanding(true)
    
    window.dispatchEvent(new CustomEvent('map-expand-status', { detail: true }))

    try {
      const existingChildrenTitles = knowledgeMap.graphData.links
        .filter(link => {
          const sourceId = typeof link.source === 'object' ? (link.source as any).id : link.source;
          return sourceId === node.id;
        })
        .map(link => {
          const targetId = typeof link.target === 'object' ? (link.target as any).id : link.target;
          return knowledgeMap.graphData.nodes.find(n => n.id === targetId)?.title;
        })
        .filter(Boolean) as string[];

      const expansion = await expandNode(node.id, node.title, knowledgeMap.topic, existingChildrenTitles)
      
      const parentX = node.x ?? 0
      const parentY = node.y ?? 0
      const parentZ = node.z ?? 0

      const expandedNodesAtParentLocation = expansion.nodes.map(newNode => ({
        ...newNode,
        x: parentX + (Math.random() - 0.5) * 2,
        y: parentY + (Math.random() - 0.5) * 2,
        z: parentZ + (Math.random() - 0.5) * 2,
        vx: 0,
        vy: 0,
        vz: 0
      })) as KnowledgeNode[];

      const newNodes = [...knowledgeMap.graphData.nodes, ...expandedNodesAtParentLocation] as KnowledgeNode[]

      const newLinks = [
        ...knowledgeMap.graphData.links,
        ...expansion.links,
        ...expansion.nodes.map((n) => ({ id: `edge_${node.id}_${n.id}_${Date.now()}`, source: node.id, target: n.id })),
      ] as GraphData['links']

      onUpdateMap({ nodes: newNodes, links: newLinks })
      setExpandedIds((prev) => new Set([...prev, node.id]))
      
      setIsMapSaved(false)

    } catch (err) {
      console.error('Expansion failed', err)
    } finally {
      setIsExpanding(false)
      window.dispatchEvent(new CustomEvent('map-expand-status', { detail: false }))
    }
  }, [isExpanding, knowledgeMap, onUpdateMap])

  return (
    <div className={styles.library} style={{ pointerEvents: 'none', width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
      
      {/* A TOP BAR FOI DELETADA! ELA AGORA VIVE NO MONITOR 3D */}

      {/* Node info panel */}
      <div style={{ pointerEvents: 'auto' }}>
        <NodePanel
          node={selectedNode}
          onClose={() => setSelectedNode(null)}
          onExpand={handleExpand}
          isExpanding={isExpanding}
          alreadyExpanded={expandedIds.has(selectedNode?.id || '')}
        />
      </div>

      {!selectedNode && (
        <motion.div className={styles.hint} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.5 }}>
          Clique em um nó para explorar
        </motion.div>
      )}

      {/* ── MODAL DE AVISO (SAIR SEM SALVAR) ── */}
      <AnimatePresence>
        {showExitWarning && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ 
              position: 'fixed', inset: 0, zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', 
              background: 'rgba(2,8,23,0.85)', backdropFilter: 'blur(4px)', pointerEvents: 'auto' 
            }}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              style={{ 
                background: '#0f172a', border: '1px solid #7dd3fc', padding: '2rem', borderRadius: '8px', 
                textAlign: 'center', fontFamily: 'Space Mono, monospace', maxWidth: '400px',
                boxShadow: '0 0 40px rgba(125,211,252,0.1)'
              }}
            >
              <h3 style={{ color: '#7dd3fc', marginTop: 0, fontSize: '1.2rem', letterSpacing: '0.1em' }}>ATENÇÃO</h3>
              <p style={{ color: '#f0f9ff', marginBottom: '2rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
                Seu mapa atual possui alterações não salvas. Se você retornar agora, perderá o progresso gerado.
              </p>
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button 
                  onClick={() => setShowExitWarning(false)} 
                  style={{ padding: '0.6rem 1.2rem', background: 'transparent', border: '1px solid rgba(125,211,252,0.5)', color: '#7dd3fc', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit', textTransform: 'uppercase', fontSize: '0.75rem' }}
                >
                  Cancelar
                </button>
                <button 
                  onClick={onReset} 
                  style={{ padding: '0.6rem 1.2rem', background: '#7dd3fc', border: 'none', color: '#0f172a', borderRadius: '4px', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.75rem' }}
                >
                  Sair sem salvar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}