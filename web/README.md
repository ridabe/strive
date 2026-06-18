# Strive Personal - Dashboard Web

Dashboard administrativo para personal trainers gerenciarem seus alunos, prescreverem treinos e acompanharem evolução.

## Stack Tecnológico

- **Framework:** Next.js 14
- **Linguagem:** TypeScript
- **Estilização:** TailwindCSS
- **Backend:** Supabase (PostgreSQL + Auth)
- **Hospedagem:** Vercel

## Setup Inicial

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo `.env.local.example` para `.env.local` e preencha com suas credenciais do Supabase:

```bash
cp .env.local.example .env.local
```

### 3. Executar em Desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:3000` no navegador.

## Estrutura do Projeto

```
src/
├── app/              # App Router (Next.js 14)
├── components/       # Componentes React reutilizáveis
├── lib/              # Utilitários e helpers
├── services/         # Serviços (Supabase, APIs)
├── types/            # Tipos TypeScript
└── styles/           # Estilos globais
```

## Desenvolvimento

### Build para Produção

```bash
npm run build
npm start
```

### Verificar Tipos

```bash
npm run type-check
```

### Lint

```bash
npm run lint
```

## Fase 1: Fundação e Infraestrutura Técnica

Nesta fase, estamos construindo:

- ✅ Setup do repositório (Next.js, TailwindCSS, TypeScript)
- ⏳ Banco de dados (Supabase)
- ⏳ Autenticação
- ⏳ CRUD de alunos

## Documentação

Consulte a documentação do projeto em `/docs` para mais detalhes sobre arquitetura, API e fluxos.
