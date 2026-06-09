import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import multer from 'multer'
import { PDFParse } from 'pdf-parse'
import { GoogleGenerativeAI } from '@google/generative-ai'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json())

const upload = multer(
  { storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }
  })

// Inicializa o SDK do Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const model = genAI.getGenerativeModel({ 
  model: "gemini-3.5-flash",
  generationConfig: { responseMimeType: "application/json" } // Garante retorno em JSON puro
});

const DEPTH_CONFIG = {
  quick: { nodeCount: '4 a 6', detail: 'resumo rápido de alto nível, apenas conceitos essenciais' },
  default: { nodeCount: '8 a 12', detail: 'visão geral equilibrada com fundamentos, aplicações e contexto histórico' },
  deep: { nodeCount: '14 a 20', detail: 'mergulho profundo com sub-tópicos avançados, desafios técnicos, estado da arte e conexões entre áreas' }
}

function buildMapPrompt(topic: string, depth: keyof typeof DEPTH_CONFIG, context?: string): string {
  const cfg = DEPTH_CONFIG[depth]
  const contextBlock = context
  ?
  `\nContexto extraído do documento do usuário:\n"""\n${context.slice(0, 3000)}\n"""
  \nUse esse contexto para personalizar os nós e torná-los relevantes ao documento.`
  : ''

  return `Você é um especialista em criação de mapas conceituais.
Gere um grafo estruturado para o tema: "${topic}".
Nível de profundidade: ${depth} - ${cfg.detail}.${contextBlock}

O JSON DEVE seguir exatamente este formato:
{
  "topic": "string",
  "nodes": [
    {
     "id": "string",
     "title": "string",
     "summary": "string (2-3 frases)",
     "category": "string",
     "applications": ["string"],
     "curiosities": ["string"]
    }
  ],
  "links": [
    {
     "source": "string (id)",
     "target": "string (id)",
     "label": "string"
    }
  ]
}
Regras:
- Gere entre ${cfg.nodeCount} nós.
- Inclua 1 nó raiz com id "root" representando o tema central.
- Categorias sugeridas: Fundamentos, Aplicações, Histórico, Desafios, Conceitos.
- Os ids devem ser strings simples sem espaços (ex: id_nome).
- Conecte todos os nós principais diretamente ao "root" com links.
- Responda em português brasileiro.

Regra Crítica de Validação:
 Se o tema fornecido ("${topic}") for um texto completamente sem sentido, uma sequência
 aleatória de letras (gibberish como 'asdf', 'awedcsjkhediouw') ou algo totalmente
 incompreensível que impossibilite a criação de um mapa conceitual real, ignore o formato
 de nós/links e retorne EXCLUSIVAMENTE este formato JSON:
  { "error": "Tema inválido ou incompreensível. Por favor, digite um assunto ou conceito real." }
`
}

app.post('/api/generate-map', async (req, res) => {
  try {
    const { topic, depth = 'default' } = req.body as { topic: string; depth?: string };

    if (!topic?.trim()){
        res.status(400).json({ error: 'Campo "topic" é obrigatório' })
        return
    }
    
    const validDepths = ['quick', 'default', 'deep']
    const safeDepth = validDepths.includes(depth) ? depth as keyof typeof DEPTH_CONFIG : 'default'
    
    const prompt = buildMapPrompt(topic, safeDepth)
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()
    
    // Como forçamos o mimeType para JSON, o parse é direto
    const graphData = JSON.parse(responseText)

    if (graphData.error) {
      res.status(400).json({ error: graphData.error })
      return
    }

    res.json({...graphData, depth: safeDepth})
    
  } catch (error) {
    console.error('[generate-map]', error);
    res.status(500).json({ error: 'Falha ao gerar mapa conceitual' });
  }
});

app.post('/api/generate-map-from-pdf', upload.single('file'), async (req, res) => {
  try {
    if(!req.file){
      res.status(400).json({ error: 'Nenhum arquivo enviado' })
      return
    }

    const { depth = 'default' } = req.body as { depth?: string }
    const validDepths = ['quick', 'default', 'deep']
    const safeDepth = validDepths.includes(depth) ? depth as keyof typeof DEPTH_CONFIG : 'default'
    
    const parser = new PDFParse({ data: req.file.buffer })

    const pdfData = await parser.getText({ partial: [1, 2] })
    const extractedText = pdfData.text?.trim() || ''

    await parser.destroy()

    if(!extractedText){
      res.status(422).json({ error: 'Não foi possível extrair texto do pdf (pode ser escaneado)' })
      return
    }

    const firstLine = extractedText.split(`\n`).find((l: string) => l.trim().length > 3) || 'Documento'
    const topic = firstLine.slice(0, 80).trim()

    const prompt = buildMapPrompt(topic, safeDepth, extractedText)
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    const graphData = JSON.parse(responseText)
    res.json({ ...graphData, depth: safeDepth, sourceFile: req.file.originalname })
  } catch (error) {
    console.error('[generate-map-from-pdf]', error)
    res.status(500).json({ error: 'Falha ao processar PDF' })
  }
})

app.post('/api/expand-node', async (req, res) => {
  try {
    const { nodeId, nodeTitle, parentTopic, existingChildren = [] } = req.body as {
        nodeId: string,
        nodeTitle: string,
        parentTopic: string,
        existingChildren: string[]
    };

    if (!nodeTitle?.trim() || !parentTopic?.trim()){
        res.status(400).json({ error: 'Campos "nodeTitle" e "parentTopic" são obrigatórios.' })
        return
    }

    const avoidPrompt = existingChildren.length > 0 
      ? `\nIMPORTANTE: Este conceito já foi expandido antes. NÃO crie nós sobre os seguintes subtópicos que já existem na tela: ${existingChildren.join(', ')}. Seja criativo e explore vertentes inéditas.` 
      : '';

    const prompt = `Você expande conceitos dentro de um mapa. Contexto geral: "${parentTopic}".
    Gere 4 a 5 novos nós detalhando o conceito: "${nodeTitle}".${avoidPrompt}
    Retorne APENAS um JSON no formato:
    {
      "nodes": [
            {
             "id": "string",
             "title": "string",
             "summary": "string (2-3 frases)",
             "category": "string",
             "applications": ["string"],
             "curiosities": ["string"]
            }
        ],
      "links": [
            {
             "source": "string (id)",
             "target": "string (id)",
             "label": "string"
            }
        ]
    }
    Regras:
    - Os IDs devem ser únicos com sufixo _exp (ex: qubit_exp, entrelecamento_exp).
    - Crie links conectando CADA novo nó ao id "${nodeId}" (o nó original).
    - Crie também links entre os novos nós onde houver relação semântica.
    - Responda em português brasileiro.`

    const result = await model.generateContent(prompt)
    const graphData = JSON.parse(result.response.text())
    
    res.json(graphData)
  } catch (error) {
    console.error('[expand-node]', error)
    res.status(500).json({ error: 'Falha ao expandir nó' })
  }
});

app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`)
});