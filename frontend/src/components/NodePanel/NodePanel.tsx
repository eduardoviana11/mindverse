import { motion, AnimatePresence } from 'framer-motion'
import type { KnowledgeNode } from '../../types'
import { getCategoryColor } from '../../styles/colors'
import styles from './NodePanel.module.css'

interface NodePanelProps {
  node: KnowledgeNode | null
  onClose: () => void
  onExpand: (node: KnowledgeNode) => void
  isExpanding: boolean
  alreadyExpanded: boolean
}

export function NodePanel({ node, onClose, onExpand, isExpanding, alreadyExpanded }: NodePanelProps) {
  return (
    <AnimatePresence>
      {node && (
        <motion.div className={styles.panel}
          initial={{ opacity: 0, x: 60 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 60 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}>

          <div className={styles.header}>
            <div className={styles.categoryDot} style={{ background: getCategoryColor(node.category) }} />
            <span className={styles.category}>{node.category}</span>
            {node.visited && <span className={styles.visitedBadge}>✓ Explorado</span>}
            <button className={styles.closeBtn} onClick={onClose}>✕</button>
          </div>

          <div className={styles.scrollArea}>
            <h2 className={styles.nodeTitle}>{node.title}</h2>
            <div className={styles.section}>
              <p className={styles.summary}>{node.summary}</p>
            </div>
            {node.applications && node.applications.length > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}><span>⚡</span> Aplicações</h3>
                <ul className={styles.list}>{node.applications.map((a,i) => <li key={i}>{a}</li>)}</ul>
              </div>
            )}
            {node.curiosities && node.curiosities.length > 0 && (
              <div className={styles.section}>
                <h3 className={styles.sectionTitle}><span>💡</span> Curiosidades</h3>
                <ul className={styles.list}>{node.curiosities.map((c,i) => <li key={i}>{c}</li>)}</ul>
              </div>
            )}
          </div>

          <div className={styles.footer}>
            <motion.button className={`${styles.expandBtn} ${alreadyExpanded ? styles.expandedDone : ''}`}
              onClick={() => onExpand(node)}
              disabled={isExpanding}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}>

              {isExpanding ? (
                <><span className={styles.spinner} /> Expandindo...</>
              ) : alreadyExpanded ? (
                <>✦ Expandir Conceito (Aprofundar)</>
              ) : (
                <>✦ Expandir Conceito</>
              )}
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}