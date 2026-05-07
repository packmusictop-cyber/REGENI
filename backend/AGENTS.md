---
description: Instruções para construção de aplicativos com MCP
globs: *
alwaysApply: true
---

# Documentação do InsForge SDK - Visão Geral

## O que é o InsForge?

Plataforma Backend-as-a-service (BaaS) que oferece:

- **Banco de Dados**: PostgreSQL com API PostgREST
- **Autenticação**: Email/senha + OAuth (Google, GitHub)
- **Armazenamento**: Upload/download de arquivos
- **IA**: Completações de chat e geração de imagens (compatível com OpenAI)
- **Funções**: Implantação de funções serverless
- **Tempo Real**: Pub/sub via WebSocket (banco de dados + eventos do cliente)

## Instalação

O seguinte é um guia passo a passo para instalar e usar o SDK TypeScript do InsForge para aplicações Web. Se você está construindo outros tipos de aplicações, consulte:
- [Documentação Swift SDK](/sdks/swift/overview) para aplicações iOS, macOS, tvOS e watchOS.
- [Documentação Kotlin SDK](/sdks/kotlin/overview) para aplicações Android.
- [Documentação REST API](/sdks/rest/overview) para acesso direto via HTTP.

### 🚨 CRÍTICO: Siga estes passos na ordem

### Passo 1: Baixar Template

Use a ferramenta MCP `download-template` para criar um novo projeto com sua URL backend e chave anon pré-configuradas.

### Passo 2: Instalar SDK

```bash
npm install @insforge/sdk@latest
```

### Passo 3: Criar Cliente SDK

Você deve criar uma instância do cliente usando `createClient()` com sua URL base e chave anon:

```javascript
import { createClient } from '@insforge/sdk';

const client = createClient({
  baseUrl: 'https://seu-app.regiao.insforge.app',  // Sua URL backend do InsForge
  anonKey: 'sua-chave-anon-aqui'       // Obtenha isso nos metadados do backend
});

```

**URL BASE DA API**: Sua URL base da API é `https://seu-app.regiao.insforge.app`.

## Obtendo Documentação Detalhada

### 🚨 CRÍTICO: Sempre Busque a Documentação Antes de Escrever Código

O InsForge fornece SDKs oficiais e APIs REST, use-os para interagir com os serviços do InsForge a partir do código da sua aplicação.

- [SDK TypeScript](/sdks/typescript/overview) - JavaScript/TypeScript
- [SDK Swift](/sdks/swift/overview) - iOS, macOS, tvOS e watchOS
- [SDK Kotlin](/sdks/kotlin/overview) - Android e Kotlin Multiplatform
- [REST API](/sdks/rest/overview) - Acesso direto via HTTP

Antes de escrever ou editar qualquer código de integração com o InsForge, você **DEVE** chamar a ferramenta MCP `fetch-docs` ou `fetch-sdk-docs` para obter a documentação mais recente do SDK. Isso garante que você tenha padrões de implementação precisos e atualizados.

### Use a ferramenta MCP `fetch-docs` do InsForge para obter documentação específica do SDK:

Tipos de documentação disponíveis:

- `"instructions"` - Configuração essencial do backend (COMECE AQUI)
- `"real-time"` - Pub/sub em tempo real (banco de dados + eventos) via WebSockets
- `"db-sdk-typescript"` - Operações de banco de dados com SDK TypeScript
- **Autenticação** - Escolha com base na implementação:
  - `"auth-sdk-typescript"` - Métodos SDK TypeScript para fluxos de auth customizados
  - `"auth-components-react"` - UI de auth pré-construída para React+Vite (Single Page App)
  - `"auth-components-react-router"` - UI de auth pré-construída para React (Vite+React Router) (Multi Page App)
  - `"auth-components-nextjs"` - UI de auth pré-construída para Nextjs (App SSR)
- `"storage-sdk"` - Operações de armazenamento de arquivos
- `"functions-sdk"` - Invocação de funções serverless
- `"ai-integration-sdk"` - Chat de IA e geração de imagens
- `"real-time"` - Pub/sub em tempo real (banco de dados + eventos) via WebSockets
- `"deployment"` - Implantar aplicações frontend via ferramenta MCP

Estas documentações são maioritariamente para SDK TypeScript. Para outras linguagens, você também pode usar a ferramenta MCP `fetch-sdk-docs` para obter documentação específica.

### Use a ferramenta MCP `fetch-sdk-docs` do InsForge para obter documentação específica do SDK

Você pode buscar documentação do SDK usando a ferramenta MCP `fetch-sdk-docs` com tipo de recurso e linguagem específicos.

Tipos de recursos disponíveis:
- db - Operações de banco de dados
- storage - Operações de armazenamento de arquivos
- functions - Invocação de funções serverless
- auth - Autenticação de usuários
- ai - Chat de IA e geração de imagens
- realtime - Pub/sub em tempo real (banco de dados + eventos) via WebSockets

Linguagens disponíveis:
- typescript - SDK JavaScript/TypeScript
- swift - SDK Swift (para iOS, macOS, tvOS e watchOS)
- kotlin - SDK Kotlin (para aplicações Android e JVM)
- rest-api - REST API

## Quando Usar SDK vs Ferramentas MCP

### Sempre SDK para Lógica de Aplicação:

- Autenticação (registro, login, logout, perfis)
- CRUD de banco de dados (select, insert, update, delete)
- Operações de armazenamento (upload, download de arquivos)
- Operações de IA (chat, geração de imagens)
- Invocação de funções serverless

### Use Ferramentas MCP para Infraestrutura:

- Estruturação de projeto (`download-template`) - Baixar templates iniciais com integração InsForge
- Configuração de backend e metadados (`get-backend-metadata`)
- Gerenciamento de esquema de banco de dados (`run-raw-sql`, `get-table-schema`)
- Criação de buckets de armazenamento (`create-bucket`, `list-buckets`, `delete-bucket`)
- Implantação de funções serverless (`create-function`, `update-function`, `delete-function`)
- Implantação de frontend (`create-deployment`) - Implantar aplicações frontend no hosting do InsForge

## Notas Importantes

- Para auth: use `auth-sdk` para UI customizada, ou componentes específicos de framework para UI pré-construída
- SDK retorna estrutura `{data, error}` para todas as operações
- Inserções no banco de dados requerem formato array: `[{...}]`
- Funções serverless têm um único endpoint (sem subpaths)
- Armazenamento: Faça upload de arquivos para buckets, armazene URLs no banco de dados
- Operações de IA são compatíveis com OpenAI
- **EXTRA IMPORTANTE**: Use Tailwind CSS 3.4 (não atualize para v4). Bloqueie estas dependências no `package.json`