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
  'arquivos':            { href: '/dashboard/arquivos',            label: 'Arquivos'            },
  'notificacoes':        { href: '/dashboard/notificacoes',        label: 'Notificações'        },
  'white-label':         { href: '/dashboard/ajustes',             label: 'Identidade Visual'   },
  'minha-agenda':        { href: '/dashboard/agenda',              label: 'Minha Agenda'        },
  'planos-alimentares':  { href: '/dashboard/planos-alimentares',  label: 'Planos Alimentares'  },
  'assistente-ia':       { href: '/dashboard/alunos',              label: 'Max Strive IA'       },
  'desafios':            { href: '/dashboard/desafios',            label: 'Desafios'            },
}

// Módulos principais para a grid do dashboard home (ícone SVG path inline)
export const MODULE_CATEGORIES: Record<string, { label: string; color: string }> = {
  treinos:        { label: 'Treinos',        color: 'text-blue-400'   },
  acompanhamento: { label: 'Acompanhamento', color: 'text-purple-400' },
  financeiro:     { label: 'Financeiro',     color: 'text-green-400'  },
  comunicacao:    { label: 'Comunicação',    color: 'text-orange-400' },
  whitelabel:     { label: 'Identidade Visual', color: 'text-pink-400' },
}
