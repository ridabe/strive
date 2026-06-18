# Setup do Supabase para Strive Personal

## Pré-requisitos

- Conta Supabase criada em https://supabase.com
- Projeto Supabase criado

## Passos de Configuração

### 1. Criar o Banco de Dados

1. Acesse o painel do Supabase
2. Vá para **SQL Editor**
3. Crie uma nova query
4. Copie e cole o conteúdo do arquivo `supabase_schema.sql`
5. Execute a query

Isso criará todas as tabelas, políticas RLS e índices necessários.

### 2. Configurar Autenticação

1. Vá para **Authentication** > **Providers**
2. Habilite o provedor **Email** (já vem habilitado por padrão)
3. Configure as opções:
   - **Confirm email:** Ativado (para validar emails)
   - **Auto confirm user:** Desativado (para controle manual)

### 3. Configurar Variáveis de Ambiente

No arquivo `.env.local` do projeto web, adicione:

```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
```

Você encontra essas chaves em **Project Settings** > **API**.

### 4. Configurar Storage (para vídeos e fotos)

1. Vá para **Storage**
2. Crie dois buckets públicos:
   - `exercicio-videos` - Para vídeos de exercícios
   - `avaliacoes-fotos` - Para fotos de avaliações

3. Configure as políticas de acesso:
   - Tenants podem fazer upload em seus próprios buckets
   - Tenants podem ler arquivos de seus alunos

### 5. Testar a Conexão

Execute no terminal:

```bash
npm run dev
```

Acesse `http://localhost:3000` e verifique se a aplicação carrega sem erros de conexão.

## Estrutura de Dados

O schema foi modelado com as seguintes considerações:

- **Multi-tenant:** Cada personal é um tenant isolado
- **RLS:** Row Level Security garante isolamento de dados
- **Escalabilidade:** Índices otimizam queries em grandes volumes
- **Flexibilidade:** Schema permite expansão para fases futuras

## Próximas Etapas

Após o setup do Supabase:

1. Implementar autenticação no frontend (login/cadastro)
2. Criar CRUD de alunos
3. Testar isolamento de dados entre tenants

## Troubleshooting

### Erro: "Permission denied"
- Verifique se as políticas RLS foram criadas corretamente
- Confirme se o usuário está autenticado

### Erro: "Relation does not exist"
- Verifique se o schema SQL foi executado completamente
- Procure por erros na execução da query

### Erro: "Invalid API key"
- Verifique as chaves no `.env.local`
- Confirme que estão corretas no painel do Supabase
