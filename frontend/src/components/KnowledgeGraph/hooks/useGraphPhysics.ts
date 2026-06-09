// src/components/KnowledgeGraph/hooks/useGraphPhysics.ts
import { useEffect } from 'react'
import type { MutableRefObject } from 'react'
import type { GraphData } from '../../../types'

export function useGraphPhysics(fgRef: MutableRefObject<any>, graphData: GraphData) {
  useEffect(() => {
    const t = setTimeout(() => {
      if (!fgRef.current) return
      
      // Elásticos um pouco mais frouxos para compensar o tamanho menor dos nós
      fgRef.current.d3Force('link').distance(20) 
      fgRef.current.d3Force('link').strength(0.08)
      fgRef.current.d3Force('charge').strength(-25).distanceMax(50) 
      fgRef.current.d3Force('center').strength(0.15)
      
      const forceBoundary = () => {
        let nodes: any[] = []
        const force = (alpha: number) => {
          nodes.forEach(node => {
            // 1. BARREIRA DO CHÃO E DO TETO (Eixo Y)
            // O piso principal está em Y = -30. Travamos os nós em -12 para ficarem bem acima do HUD
            if (node.y < -12) node.vy += (-12 - node.y) * alpha * 0.8;
            // Teto máximo para não furarem o vidro do Domo
            if (node.y > 25)  node.vy += (25 - node.y) * alpha * 0.8;

            // 2. BARREIRA LATERAL (Raio no plano XZ)
            const distXZ = Math.hypot(node.x, node.z);
            const MAX_RADIUS = 35; // Distância máxima do centro
            if (distXZ > MAX_RADIUS) {
              const ratio = MAX_RADIUS / distXZ;
              node.vx += (node.x * ratio - node.x) * alpha * 0.8;
              node.vz += (node.z * ratio - node.z) * alpha * 0.8;
            }
          })
        }
        force.initialize = (_nodes: any[]) => { nodes = _nodes }
        return force
      }
      fgRef.current.d3Force('boundary', forceBoundary())
      fgRef.current.d3ReheatSimulation()
    }, 200)
    return () => clearTimeout(t)
  }, [graphData])
}