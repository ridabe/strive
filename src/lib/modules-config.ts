// Mapeamento de slugs de módulos → rota no dashboard e label amigável
// Usado pelo sidebar e pelas páginas de módulos

export const MODULE_ROUTES: Record<string, { href: string; label: string }> = {
  'banco-de-exercicios': { href: '/dashboard/banco-de-exercicios', label: 'Banco de Exercícios' },
  'planos-de-treino':    { href: '/dashboard/treinos',             label: 'Planos de Treino'    },
  'treinos-extras':      { href: '/dashboard/treinos-extras',      label: 'Treinos Extras'      },
  'execucao-do-treino':  { href: '/dashboard/execucao',            label: 'Execução'            },
  'avaliacoes-fisicas':  { href: '/dashboard/avaliacoes',          label: 'Avaliações Físicas'  },
  'anamnese':            { href: '/dashboard/anamnese',            label: 'Anamnese'            },
  'meu-progresso':       { href: '/dashboard/progresso',           label: 'Meu Progresso'       },
  'frequencia':          { href: '/dashboard/frequencia',          label: 'Frequência'          },
  'feedbacks':           { href: '/dashboard/feedbacks',           label: 'Feedbacks'           },
  'faturas':             { href: '/dashboard/financeiro',          label: 'Financeiro'          },
  'estoque':             { href: '/dashboard/estoque',             label: 'Estoque'             },
  'arquivos':            { href: '/dashboard/arquivos',            label: 'Arquivos'            },
  'notificacoes':        { href: '/dashboard/notificacoes',        label: 'Notificações'        },
  'white-label':         { href: '/dashboard/ajustes',             label: 'Identidade Visual'   },
  'minha-agenda':        { href: '/dashboard/agenda',              label: 'Minha Agenda'        },
  'planos-alimentares':  { href: '/dashboard/planos-alimentares',  label: 'Planos Alimentares'  },
  'assistente-ia':       { href: '/dashboard/alunos',              label: 'Max Strive IA'       },
  'desafios':            { href: '/dashboard/desafios',            label: 'Desafios'            },
}

// ─── Visibilidade de módulos por papel dentro de uma academia ────────────────
// Numa academia, a instituição (owner/admin) não treina alunos — quem cria e
// executa treino, faz avaliação física/plano alimentar e acompanha a
// evolução individual é o personal, na relação 1:1 com o aluno dele. Por
// isso esses módulos somem do menu do owner/admin, mesmo estando habilitados
// para o tenant (habilitação é por tenant, visibilidade é por papel). Não
// afeta tenants autônomos (o próprio personal é o dono).
//
// Anamnese, Feedbacks e o grupo Comunicação (Arquivos, Notificações, Minha
// Agenda) ficam visíveis pro admin — não é ferramenta de criação de treino,
// e sim de acompanhamento institucional: admin quer saber se o aluno
// preencheu a ficha de anamnese, como anda a qualidade do feedback
// aluno/personal, e usar a comunicação (inclusive a agenda) para
// acompanhar marcações e falar com os personais da equipe.
export const ACADEMIA_HIDDEN_FROM_ADMIN_SLUGS = [
  'banco-de-exercicios',
  'planos-de-treino',
  'treinos-extras',
  'execucao-do-treino',
  'avaliacoes-fisicas',
  'planos-alimentares',
  'meu-progresso',
  'assistente-ia',
]

// Faturas/Cobranças é o inverso: numa academia o financeiro é da instituição
// (é ela quem cobra o aluno, não o personal individualmente) — some do menu
// do personal, fica só com owner/admin.
export const ACADEMIA_HIDDEN_FROM_PERSONAL_SLUGS = [
  'faturas',
  'estoque',
]

// Operador/Gerente (staff de operação): allowlist — só veem estes módulos.
// Operação cuida de cobrança, estoque, agenda (datas de pagamento) e checa a
// anamnese do aluno. Não veem nenhum módulo de estratégia/treino. Alunos e
// Equipe (para cadastrar personal) são itens fixos do menu, não módulos.
export const ACADEMIA_OPERATIONS_VISIBLE_SLUGS = [
  'faturas',
  'estoque',
  'minha-agenda',
  'anamnese',
]

// Módulos principais para a grid do dashboard home (ícone SVG path inline)
export const MODULE_CATEGORIES: Record<string, { label: string; color: string }> = {
  treinos:        { label: 'Treinos',        color: 'text-blue-400'   },
  acompanhamento: { label: 'Acompanhamento', color: 'text-purple-400' },
  financeiro:     { label: 'Financeiro',     color: 'text-green-400'  },
  comunicacao:    { label: 'Comunicação',    color: 'text-orange-400' },
  whitelabel:     { label: 'Identidade Visual', color: 'text-pink-400' },
}
