# MindVerse

## Sobre o projeto

O MindVerse é um ecossistema de conhecimento imersivo, desenvolvido para transformar a exploração de dados complexos em uma experiência de navegação espacial intuitiva. O projeto rompe a barreira das interfaces 2D tradicionais, permitindo que usuários construam, explorem e salvem "Mapas de Memória" em um ambiente 3D interativo.

## Objetivo

Arquitetar uma plataforma de aprendizado onde a retenção de informação é potencializada pela memória espacial e pela interatividade, permitindo a exploração de grafos de conhecimento baseados em IA em um ambiente de biblioteca futurista.

## Funcionalidades principais

- **Navegação Imersiva:** Exploração 3D de grafos conceituais com sistema de "Lock-on" e câmeras cinematográficas.
- **Interface imersiva:** HUD integrado ao mundo 3D através de terminais interativos (Raycasting).
- **Análise Neural em Tempo Real:** Expansão orgânica de tópicos utilizando IA generativa para criar sinapses conceituais.
- **Persistência de Mapas:** Sistema de salvamento local para revisitar estruturas de conhecimento previamente mapeadas (localStorage).
- **Multi-Formato:** Suporte nativo à ingestão de temas abertos e documentos (PDF) para conversão em estruturas 3D.

## Tecnologias utilizadas

- **Core 3D:** Three.js / React Three Fiber / ForceGraph3D
- **Interface & UI:** React / Framer Motion
- **Física:** D3.js (Force-directed graphs)
- **Integração:** WebXR (ready), GLTF/GLB Assets.

## Estrutura do Projeto

```text
├── frontend/                     # Interface do Usuário e Ambiente 3D
│   ├── public/                   # Modelos 3D e assets
│   ├── .env.example/             # Modelo para configurar URL da API
│   └── src/
│       ├── components/
│       │   ├── KnowledgeGraph/   # Orquestrador 3D, Física e HUD
│       │   │   ├── hooks/        # Lógica modular de física e sincronização
│       │   │   └── utils/        # Renderizadores de UI (Canvas 2D)
│       │   ├── Library/          # Módulo de manipulação de dados e PDF
│       │   ├── NodePanel/        # Card de interação com os nós 3D
│       │   └── Reception/        # Tela de entrada e configuração de mapas
│       ├── services/             # Persistência de dados e chamadas de IA
│       ├── styles/               # Estilos globais e variáveis
│       └── types/                # Tipagens estritas do TypeScript
│
├── backend/                      # Servidor de API e Integração com Gemini
│   ├── src/                      # Rotas e lógica da API
│   ├── .env.example              # Modelo para configuração de chaves
│   └── package.json              # Dependências do servidor
│
└── README.md
```

## Configuração de IA

O projeto utiliza a API do Gemini para gerar os grafos de conhecimento.

### 1. Configuração de API Key

Para utilizar a geração real de grafos, você precisa de uma chave de API do Gemini:

- Obtenha sua chave no [Google AI Studio](https://aistudio.google.com/).
- Adicione a chave no arquivo `.env` dentro da pasta `/backend` (ex: `GEMINI_API_KEY=your-gemini-api-key`).

### 2. Modo Mock (Dados Fictícios)

Se você não possui uma chave ou deseja apenas testar a interface e a navegação 3D sem consumir a API, você pode ativar o modo **Mock**.

- Abra o arquivo `frontend/src/services/aiService.ts`.
- Na linha **5**, alterne a constante para `true`:
  ```typescript
  const USE_MOCK = true; // Alterne para false para usar a API real
  ```

## Como executar

O projeto possui uma estrutura dividida em `frontend` (interface) e `backend` (serviços de API). Ambos precisam ser iniciados para o pleno funcionamento.

### 1. Pré-requisitos

Certifique-se de ter o [Node.js](https://nodejs.org/) instalado.

### 2. Instalação

Na raiz do projeto, instale as dependências de ambos os módulos:

```bash
# Instalar dependências do frontend
cd frontend
npm install

# Instalar dependências do backend
cd ../backend
npm install
```

### 3. Rodar em ambiente de desenvolvimento

Frontend:

```bash
npm run dev
```

Backend:

```bash
npm run dev
```

## Demonstração navegável

Para uma experiência completa, siga este fluxo:

1. **Entrada (Recepção):** Na tela inicial, escolha o modo de profundidade (Resumo, Equilibrado ou Mergulho) e insira um tema no terminal (ex: "Inteligência Artificial").
2. **Exploração:** Após a geração, você será levado ao ambiente 3D.
   - Use **[W][A][S][D]** para mover a câmera.
   - Use o **Botão Direito do mouse** para rotacionar a visão.
   - Use o **Botão Esquerdo do mouse** para interagir com os nós (conceitos) e ativar o _Lock-on_.
3. **Interação com Terminal:** Ao "voar" para um nó, a câmera travará. Utilize os botões interativos no painel do terminal físico (HUD) para salvar o mapa ou retornar à biblioteca.

## Equipe

- **João Eduardo Viana da Silva** (Tech Lead)

---
