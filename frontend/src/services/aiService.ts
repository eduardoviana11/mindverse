import type { KnowledgeMap, KnowledgeNode, KnowledgeEdge, DepthLevel } from "../types";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

const USE_MOCK = true

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export async function generateKnowledgeMap(
  topic: string,
  depth: DepthLevel = 'default'
): Promise<KnowledgeMap> {
  if (USE_MOCK) {
    await delay(1000);
    return {
      id: crypto.randomUUID(),
      topic: topic,
      depth,
      createdAt: Date.now(),
      graphData: {
        nodes: [
          { id: 'root', title: topic, summary: `Conceito central de ${topic}.`, category: 'Core', applications: ['Desenvolvimento', 'Pesquisa'] },
          { id: 'sub1', title: 'Fundamentos', summary: 'Princípios básicos e teoria inicial.', category: 'Teoria' },
          { id: 'sub2', title: 'Aplicações Práticas', summary: 'Como isso é usado no mundo real.', category: 'Aplicações' },
          { id: 'sub3', title: 'Algoritmos', summary: 'Lógica por trás da tecnologia.', category: 'Algoritmos', curiosities: ['Baseado em matemática complexa'] }
        ],
        links: [
          { id: 'id1',source: 'root', target: 'sub1' },
          { id: 'id2', source: 'root', target: 'sub2' },
          { id: 'id3', source: 'root', target: 'sub3' }
        ]
      }
    };
  }
  
  const response = await fetch(`${API_URL}/generate-map`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topic, depth }),
  })
  
  if(!response.ok){
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.error || `Error: ${response.status}`);
  }

  const parsed = await response.json()

  return {
    id: crypto.randomUUID(),
    topic: parsed.topic,
    depth,
    createdAt: Date.now(),
    graphData: {
      nodes: parsed.nodes,
      links: parsed.links,
    }
  }
}

export async function generateKnowledgeMapFromPDF(
  file:File,
  depth: DepthLevel = 'default'
): Promise<KnowledgeMap> {
  const form = new FormData()
  form.append('file', file)
  form.append('depth', depth)

  const response = await fetch(`${API_URL}/generate-map-from-pdf`, {
    method: 'POST',
    body: form,
  })

  if(!response.ok){
    throw new Error(`Error: ${response.status}`)
  }

  const parsed = await response.json()

  return {
    id: crypto.randomUUID(),
    topic: parsed.topic,
    depth,
    sourceFile: parsed.sourceFile,
    createdAt: Date.now(),
    graphData: {
      nodes: parsed.nodes,
      links: parsed.links,
    }
  }
}

export async function expandNode(
  nodeId: string,
  nodeTitle: string,
  parentTopic: string,
  existingChildren: string[] = []
): Promise<{ nodes: KnowledgeNode[], links: KnowledgeEdge[] }> {
  if (USE_MOCK) {
    await delay(800);
    const rand = Math.floor(Math.random() * 1000)
    const id1 = `node_${Date.now()}_${rand}_1`;
    const id2 = `node_${Date.now()}_${rand}_2`;
    return {
      nodes: [
        { id: id1, title: `${nodeTitle} em Detalhes`, summary: `Exploração avançada de ${nodeTitle}.`, category: 'Teoria', applications: ['Estudo Avançado'] },
        { id: id2, title: `Ferramentas para ${nodeTitle}`, summary: `As principais ferramentas utilizadas.`, category: 'Tecnologia' }
      ],
      links: [
        { id: `edge_${id1}_${id2}`, source: id1, target: id2 }
      ]
    };
  }

  const response = await fetch(`${API_URL}/expand-node`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nodeId, nodeTitle, parentTopic, existingChildren })
  })

  if(!response.ok){
    throw new Error(`Error: ${response.status}`);
  }

  return await response.json()
}