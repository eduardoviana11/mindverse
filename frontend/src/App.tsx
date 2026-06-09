import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Reception } from './components/Reception/Reception'
import { Library } from './components/Library/Library'
import { KnowledgeGraph } from './components/KnowledgeGraph/KnowledgeGraph'
import { generateKnowledgeMap, generateKnowledgeMapFromPDF } from './services/aiService'
import type { AppScene, DepthLevel, KnowledgeMap, KnowledgeNode } from './types'
import './styles/index.css'

export function App() {
  const [scene, setScene] = useState<AppScene>('reception')
  const [knowledgeMap, setKnowledgeMap] = useState<KnowledgeMap | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null)

  const enter = (map: KnowledgeMap) => { setKnowledgeMap(map); setScene('library'); setSelectedNode(null); }

  const handleSearch = async (topic: string, depth: DepthLevel) => {
    setIsLoading(true)
    setError(null)
    try {
      enter(await generateKnowledgeMap(topic, depth))
    } catch (err: any) {
      setError(err.message || 'Não foi possível gerar o mapa.')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePDFUpload = async (file: File, depth: DepthLevel) => {
    setIsLoading(true); setError(null)
    try { enter(await generateKnowledgeMapFromPDF(file, depth)) }
    catch { setError('Não foi possível processar o PDF.') }
    finally { setIsLoading(false) }
  }

  const handleLoadPalace = (map: KnowledgeMap) => enter(map)
  const handleReset = () => { setScene('reception'); setKnowledgeMap(null); setError(null) }

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      
      {/* O CENÁRIO 3D (Z-INDEX 0) */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <KnowledgeGraph
          zone={scene}
          topic={knowledgeMap?.topic || "EXPLORANDO CONHECIMENTO"}
          graphData={knowledgeMap?.graphData || { nodes: [], links: [] }} 
          onNodeClick={(node) => setSelectedNode(node)} 
          selectedNodeId={selectedNode?.id || null} 
        />
      </div>

      {/* AS INTERFACES HTML */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>
        <AnimatePresence mode="wait">
          {scene === 'reception' && (
            <motion.div key="reception" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} style={{ pointerEvents: 'auto', height: '100%' }}>
              <Reception onSearch={handleSearch} onPDFUpload={handlePDFUpload} onLoadPalace={handleLoadPalace} isLoading={isLoading} />
              {error && <motion.div className="error-toast" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>⚠ {error}</motion.div>}
            </motion.div>
          )}
          {scene === 'library' && knowledgeMap && (
            // FIX: pointerEvents: 'none' AQUI PARA O CLIQUE VAZAR PARA O 3D!
            <motion.div key="library" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }} style={{ pointerEvents: 'none', height: '100%' }}>
              <Library 
                knowledgeMap={knowledgeMap} 
                onReset={handleReset} 
                onUpdateMap={(newGraph) => setKnowledgeMap(prev => prev ? { ...prev, graphData: newGraph } : null)}
                selectedNode={selectedNode}
                setSelectedNode={setSelectedNode}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}