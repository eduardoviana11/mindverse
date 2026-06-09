export interface KnowledgeNode {
  id: string
  title: string
  summary: string
  category: string
  applications?: string[]
  curiosities?: string[]
  visited?: boolean
  x?: number
  y?: number
  z?: number
  // react-force-graph internal
  fx?: number | null
  fy?: number | null
  fz?: number | null
}

export interface KnowledgeEdge {
  id?: string
  source: string | KnowledgeNode
  target: string | KnowledgeNode
  label?: string
}

export interface GraphData {
  nodes: KnowledgeNode[]
  links: KnowledgeEdge[]
}

export interface KnowledgeMap {
  id: string
  topic: string
  graphData: GraphData
  createdAt: number
  depth?: 'quick' | 'default' | 'deep'
  sourceFile?: string
}

export type AppScene = 'reception' | 'library'

export type DepthLevel = 'quick' | 'default' | 'deep'