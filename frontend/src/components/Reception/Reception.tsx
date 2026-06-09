import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { DepthLevel, KnowledgeMap } from '../../types'
import { loadPalaces, deletePalace } from '../../services/palaceStorage'
import styles from './Reception.module.css'

interface ReceptionProps {
  onSearch: (topic: string, depth: DepthLevel) => void
  onPDFUpload: (file: File, depth: DepthLevel) => void
  onLoadPalace: (map: KnowledgeMap) => void
  isLoading: boolean
}

const DEPTH_INFO: Record<DepthLevel, { label: string; desc: string; icon: string; nodes: string }> = {
  quick:    { label: 'Resumo Rápido',  desc: 'Visão macro, 4–6 conceitos', icon: '⚡', nodes: '4–6 nós' },
  default: { label: 'Visão Geral',    desc: 'Equilibrado, ideal para estudar', icon: '🔭', nodes: '8–12 nós' },
  deep:     { label: 'Mergulho',       desc: 'Profundo, todos os detalhes', icon: '🌊', nodes: '14–20 nós' },
}

const SUGGESTIONS = ['Computação Quântica', 'Inteligência Artificial', 'Neurociência', 'Física Quântica', 'Criptografia', 'Evolução Biológica']

export function Reception({ onSearch, onPDFUpload, onLoadPalace, isLoading }: ReceptionProps) {
  const [input, setInput] = useState('')
  const [depth, setDepth] = useState<DepthLevel>('default')
  const [tab, setTab] = useState<'search' | 'pdf' | 'palaces'>('search')
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [palaces, setPalaces] = useState(() => loadPalaces())
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = () => {
    if (input.trim() && !isLoading) onSearch(input.trim(), depth)
  }

  const handlePDFSubmit = () => {
    if (selectedFile && !isLoading) onPDFUpload(selectedFile, depth)
  }

  const handleFile = useCallback((file: File) => {
    if (file.type === 'application/pdf') setSelectedFile(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleDeletePalace = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    deletePalace(id)
    setPalaces(loadPalaces())
  }

  const depthColor: Record<DepthLevel, string> = {
    quick: '#86efac', default: '#7dd3fc', deep: '#c4b5fd',
  }

  return (
    <div className={styles.reception}>

      <div className={styles.content}>
        {/* Logo */}
        <motion.div className={styles.logoArea}
          initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}>
          <div className={styles.logoIcon}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ display: 'block' }}>
              {/* 1. LINHAS NO FUNDO (Raio Expandido) */}
              {[
                ['44', '24'], ['38.1', '38.1'], ['24', '44'], ['9.9', '38.1'],
                ['4', '24'], ['9.9', '9.9'], ['24', '4'], ['38.1', '9.9']
              ].map(([cx, cy], i) => (
                <line key={`line-${i}`} x1="24" y1="24" x2={cx} y2={cy} stroke="#7dd3fc" strokeWidth="1.5" strokeOpacity="0.4" />
              ))}

              {/* 2. NÓS PERIFÉRICOS (Afastados do centro) */}
              {[
                ['44', '24', '#c4b5fd'],
                ['38.1', '38.1', '#86efac'],
                ['24', '44', '#fcd34d'],
                ['9.9', '38.1', '#f9a8d4'],
                ['4', '24', '#67e8f9'],
                ['9.9', '9.9', '#fdba74'],
                ['24', '4', '#93c5fd'],
                ['38.1', '9.9', '#d8b4fe']
              ].map(([cx, cy, fill], i) => (
                <circle key={`node-${i}`} cx={cx} cy={cy} r="2.5" fill={fill} />
              ))}

              {/* 3. NÚCLEO CENTRAL POR CIMA DE TUDO */}
              <circle cx="24" cy="24" r="5" fill="#7dd3fc" />
            </svg>
          </div>
          <h1 className={styles.title}>Mind<span className={styles.accent}>Verse</span></h1>
          <p className={styles.tagline}>Biblioteca Imersiva de Exploração do Conhecimento</p>
        </motion.div>

        {/* Depth selector */}
        <motion.div className={styles.depthSelector}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          {(Object.entries(DEPTH_INFO) as [DepthLevel, typeof DEPTH_INFO[DepthLevel]][]).map(([key, info]) => (
            <motion.button key={key}
              className={`${styles.depthBtn} ${depth === key ? styles.depthBtnActive : ''}`}
              style={{ '--depth-color': depthColor[key] } as React.CSSProperties}
              onClick={() => setDepth(key)}
              whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
              <span className={styles.depthIcon}>{info.icon}</span>
              <span className={styles.depthLabel}>{info.label}</span>
              <span className={styles.depthNodes}>{info.nodes}</span>
            </motion.button>
          ))}
        </motion.div>

        {/* Tabs */}
        <motion.div className={styles.terminal}
          initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}>
          <div className={styles.terminalHeader}>
            <span className={styles.terminalDot} style={{ background: '#ff5f57' }} />
            <span className={styles.terminalDot} style={{ background: '#febc2e' }} />
            <span className={styles.terminalDot} style={{ background: '#28c840' }} />
            <div className={styles.tabs}>
              {(['search','pdf','palaces'] as const).map(t => (
                <button key={t} className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`} onClick={() => setTab(t)}>
                  {/* TEXTO ATUALIZADO AQUI */}
                  {t === 'search' ? '🔍 Tema' : t === 'pdf' ? '📄 PDF' : `💾 Mapas Salvos${palaces.length ? ` (${palaces.length})` : ''}`}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.terminalBody}>
            <AnimatePresence mode="wait">

              {/* SEARCH TAB */}
              {tab === 'search' && (
                <motion.div key="search"
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                  <div className={styles.prompt}>
                    <span className={styles.promptSymbol}>{'>'}</span>
                    <span className={styles.promptLabel}>explorar tema:</span>
                  </div>
                  <div className={styles.inputRow}>
                    <input className={styles.input} type="text" value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                      placeholder="ex: Computação Quântica..." disabled={isLoading} autoFocus />
                    <motion.button className={styles.enterBtn} onClick={handleSubmit}
                      disabled={!input.trim() || isLoading}
                      whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      {isLoading ? <span className={styles.spinner} /> : <span>ENTRAR</span>}
                    </motion.button>
                  </div>
                  {isLoading && (
                    <motion.div className={styles.loadingText} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <span className={styles.cursor}>_</span> Materializando mapa conceitual...
                    </motion.div>
                  )}
                  <div className={styles.suggestions}>
                    <p className={styles.suggestionsLabel}>sugestões:</p>
                    <div className={styles.suggestionsList}>
                      {SUGGESTIONS.map(s => (
                        <motion.button key={s} className={styles.suggestionChip} onClick={() => setInput(s)}
                          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>{s}</motion.button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* PDF TAB */}
              {tab === 'pdf' && (
                <motion.div key="pdf"
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                  <div
                    className={`${styles.dropZone} ${isDragOver ? styles.dropZoneActive : ''} ${selectedFile ? styles.dropZoneHasFile : ''}`}
                    onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
                    onDragLeave={() => setIsDragOver(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}>
                    <input ref={fileInputRef} type="file" accept=".pdf" style={{ display: 'none' }}
                      onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
                    {selectedFile ? (
                      <>
                        <span className={styles.dropIcon}>📄</span>
                        <span className={styles.dropFileName}>{selectedFile.name}</span>
                        <span className={styles.dropHint}>Clique para trocar</span>
                      </>
                    ) : (
                      <>
                        <span className={styles.dropIcon}>{isDragOver ? '⬇' : '📁'}</span>
                        <span className={styles.dropText}>Arraste um PDF ou clique para selecionar</span>
                        <span className={styles.dropHint}>Máximo 20MB</span>
                      </>
                    )}
                  </div>
                  <motion.button className={styles.enterBtn} style={{ width: '100%', marginTop: '0.75rem' }}
                    onClick={handlePDFSubmit} disabled={!selectedFile || isLoading}
                    whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    {isLoading ? <><span className={styles.spinner} /> Processando PDF...</> : '✦ Gerar Mapa do PDF'}
                  </motion.button>
                </motion.div>
              )}

              {/* PALACES TAB (Agora MAPAS TAB) */}
              {tab === 'palaces' && (
                <motion.div key="palaces"
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}>
                  {palaces.length === 0 ? (
                    <div className={styles.emptyPalaces}>
                      <span>💾</span>
                      {/* TEXTO ATUALIZADO AQUI */}
                      <p>Nenhum mapa salvo ainda.</p>
                      <p>Explore um tema para criar o primeiro!</p>
                    </div>
                  ) : (
                    <div className={styles.palaceList}>
                      {palaces.map(p => (
                        <motion.div key={p.id} className={styles.palaceItem}
                          onClick={() => onLoadPalace(p)}
                          whileHover={{ scale: 1.01, borderColor: 'rgba(125,211,252,0.4)' }}>
                          <div className={styles.palaceInfo}>
                            <span className={styles.palaceTopic}>{p.topic}</span>
                            <div className={styles.palaceMeta}>
                              <span>{DEPTH_INFO[p.depth ?? 'default'].icon} {DEPTH_INFO[p.depth ?? 'default'].label}</span>
                              <span>·</span>
                              <span>{p.graphData.nodes.length} nós</span>
                              {p.sourceFile && <><span>·</span><span>📄 {p.sourceFile.slice(0,20)}</span></>}
                              <span>·</span>
                              <span>{new Date(p.createdAt).toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>
                          <button className={styles.palaceDelete}
                            onClick={e => handleDeletePalace(p.id, e)}>✕</button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Instructions */}
        <motion.div className={styles.instructions}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}>
          {/* TEXTO ATUALIZADO AQUI NA INSTRUÇÃO DE SALVAR */}
          {[['🧭','WASD ou mouse direito para navegar'],['🔍','Clique num nó para explorar'],['✨','Expanda conceitos com IA'],['💾','Salve seus Mapas']].map(([icon,text]) => (
            <div key={text} className={styles.instructionItem}>
              <span className={styles.instructionIcon}>{icon}</span>
              <span>{text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}