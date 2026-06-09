import { useState, useMemo } from 'react'
import type { KnowledgeNode, KnowledgeEdge } from '../../types'
import { getCategoryColor } from '../../styles/colors'


export function NodeTree({ nodes, links, selectedNodeId, onSelect }: { 
  nodes: KnowledgeNode[], 
  links: KnowledgeEdge[], 
  selectedNodeId: string | null, 
  onSelect: (node: KnowledgeNode) => void 
}) {
  const [open, setOpen] = useState(false)

  // Memoizamos a conversão do Grafo (teia) para uma Árvore (hierarquia estrita)
  const treeHierarchy = useMemo(() => {
    const rootNode = nodes.find(n => n.id === 'root');
    if (!rootNode) return { root: null, childrenMap: new Map<string, KnowledgeNode[]>() };

    const childrenMap = new Map<string, KnowledgeNode[]>();
    const visited = new Set<string>();
    const queue: KnowledgeNode[] = [];

    // Começamos pelo Root
    visited.add(rootNode.id);
    queue.push(rootNode);

    while (queue.length > 0) {
      const curr = queue.shift()!;
      childrenMap.set(curr.id, []);

      // Procura todos os links conectados a este nó (não importa a direção)
      links.forEach(l => {
        const srcId = typeof l.source === 'object' ? (l.source as any).id : l.source;
        const tgtId = typeof l.target === 'object' ? (l.target as any).id : l.target;

        let neighborId: string | null = null;
        if (srcId === curr.id) neighborId = tgtId;
        else if (tgtId === curr.id) neighborId = srcId;

        // Se encontrou um vizinho E ele ainda não está na árvore, adicionamos!
        // Isso mata as redundâncias e os cross-links indesejados.
        if (neighborId && !visited.has(neighborId)) {
          visited.add(neighborId);
          const neighborNode = nodes.find(n => n.id === neighborId);
          if (neighborNode) {
            childrenMap.get(curr.id)!.push(neighborNode);
            queue.push(neighborNode);
          }
        }
      });
    }

    return { root: rootNode, childrenMap };
  }, [nodes, links]); // Só recalcula quando a IA jogar nós novos no mapa

  if (nodes.length === 0 || !treeHierarchy.root) return null;

  // Função interna recursiva super limpa que lê o mapa pre-computado
  const renderNode = (node: KnowledgeNode, depth: number) => {
    const children = treeHierarchy.childrenMap.get(node.id) || [];
    return (
      <div key={`tree-${node.id}`}>
        <TreeRow node={node} selectedNodeId={selectedNodeId} onSelect={onSelect} depth={depth} />
        {children.map(child => renderNode(child, depth + 1))}
      </div>
    );
  };

return (
    // 1. Removemos o maxHeight daqui de cima
    <div style={{ position: 'fixed', top: '5rem', left: '1.5rem', zIndex: 60, width: 220, display: 'flex', flexDirection: 'column', fontFamily: 'Space Mono, monospace', pointerEvents: 'auto' }}>
      
      {/* Botão de Toggle */}
      <button onClick={() => setOpen(o => !o)} style={{ background: 'rgba(2,8,23,0.92)', border: '1px solid rgba(125,211,252,0.2)', borderRadius: open ? '6px 6px 0 0' : 6, color: 'rgba(125,211,252,0.7)', fontSize: 9, letterSpacing: '0.12em', padding: '6px 10px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', textTransform: 'uppercase' }}>
        <span>Árvore de Conceitos</span>
        <span style={{ opacity: 0.5 }}>{open ? '▲' : '▼'}</span>
      </button>

      {/* Container da Árvore */}
      {open && (
        <div style={{ 
          background: 'rgba(2,8,23,0.92)', 
          border: '1px solid rgba(125,211,252,0.2)', 
          borderTop: 'none', 
          borderRadius: '0 0 6px 6px', 
          overflowY: 'auto', 
          scrollbarWidth: 'thin', 
          scrollbarColor: 'rgba(125,211,252,0.15) transparent', 
          padding: '6px 0',
          // 2. Colocamos o limite máximo aqui dentro! 
          // Subtraímos 340px da altura total da tela para deixar um espaço gigantesco de respiro para o Minimapa lá embaixo.
          maxHeight: 'calc(100vh - 340px)' 
        }}>
          {renderNode(treeHierarchy.root, 0)}
        </div>
      )}
    </div>
  )
}

export function TreeRow({ node, selectedNodeId, onSelect, depth }: {
  node: KnowledgeNode
  selectedNodeId: string | null
  onSelect: (n: KnowledgeNode) => void
  depth: number
}) {
  const color  = node.visited ? '#86efac' : getCategoryColor(node.category ?? 'default')
  const isSelected = node.id === selectedNodeId
  const label = node.title?.length > 22 ? node.title.slice(0, 20) + '…' : node.title

  return (
    <div
      onClick={() => onSelect(node)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: `4px 10px 4px ${12 + depth * 14}px`,
        cursor: 'pointer',
        background: isSelected ? 'rgba(125,211,252,0.1)' : 'transparent',
        borderLeft: isSelected ? `2px solid ${color}` : '2px solid transparent',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'rgba(125,211,252,0.05)' }}
      onMouseLeave={e => { if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
      <span style={{ fontSize: 10, color: isSelected ? '#f0f9ff' : 'rgba(240,249,255,0.55)', letterSpacing: '0.04em' }}>
        {label}
      </span>
      {node.visited && <span style={{ marginLeft: 'auto', fontSize: 8, color: '#86efac' }}>✓</span>}
    </div>
  )
}