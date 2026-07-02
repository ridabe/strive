// Configuração dos popups de onboarding por módulo (loop no login).
// Regras da feature: docs/modulos/onboarding-popup-modulos.md
//
// Duas listas independentes, uma por perfil:
//  - PERSONAL_ONBOARDING_MODULES: painel do personal trainer (inclui módulos administrativos)
//  - STUDENT_ONBOARDING_MODULES:  painel do aluno (apenas módulos com que ele interage)
//
// A ordem dos arrays É a ordem do loop. Não reordenar sem intenção.

import type { LucideIcon } from 'lucide-react'
import {
  Dumbbell, ClipboardList, Zap, Timer, Ruler, HeartPulse, TrendingUp,
  CalendarCheck, MessageSquare, Receipt, FileText, Bell, CalendarDays,
  Utensils, Palette, Sparkles,
} from 'lucide-react'

export type OnboardingRole = 'personal' | 'student'

export interface ModuleOnboardingItem {
  slug: string
  name: string
  category: keyof typeof CATEGORY_LABELS
  icon: LucideIcon
  description: string
  howToUse: string
}

export const CATEGORY_LABELS = {
  treinos:        'Treinos',
  acompanhamento: 'Acompanhamento',
  financeiro:     'Financeiro',
  comunicacao:    'Comunicação',
  whitelabel:     'Identidade Visual',
  ia:             'Inteligência Artificial',
} as const

// ── Personal trainer (dashboard) ───────────────────────────────────────────
// Ordem: Treinos → Acompanhamento → Financeiro → Comunicação → Identidade Visual → IA
export const PERSONAL_ONBOARDING_MODULES: ModuleOnboardingItem[] = [
  {
    slug: 'banco-de-exercicios',
    name: 'Banco de Exercícios',
    category: 'treinos',
    icon: Dumbbell,
    description: 'Seu catálogo de exercícios, com vídeo, grupo muscular e instruções de execução.',
    howToUse: 'Cadastre exercícios com vídeo demonstrativo e grupo muscular. Eles ficam disponíveis para montar planos de treino e treinos extras para qualquer aluno.',
  },
  {
    slug: 'planos-de-treino',
    name: 'Planos de Treino',
    category: 'treinos',
    icon: ClipboardList,
    description: 'Onde você monta e atribui os planos semanais de treino para seus alunos.',
    howToUse: 'Crie um plano, organize por dia da semana e atribua a um ou mais alunos. O aluno vê o plano no app dele e registra a execução.',
  },
  {
    slug: 'treinos-extras',
    name: 'Treinos Extras',
    category: 'treinos',
    icon: Zap,
    description: 'Treinos avulsos fora do plano semanal — aquecimentos, HIIT especial, treinos de reposição.',
    howToUse: 'Use quando quiser enviar algo pontual sem alterar o plano semanal do aluno. Ideal para substituições ou desafios extras.',
  },
  {
    slug: 'execucao-do-treino',
    name: 'Execução do Treino',
    category: 'treinos',
    icon: Timer,
    description: 'O modo ativo do aluno durante o treino: timer entre séries e registro de carga.',
    howToUse: 'Acompanhe aqui o histórico de execuções dos alunos — cargas usadas, séries completas e tempo de treino.',
  },
  {
    slug: 'avaliacoes-fisicas',
    name: 'Avaliações Físicas',
    category: 'acompanhamento',
    icon: Ruler,
    description: 'Peso, medidas corporais, % de gordura, dobras cutâneas e fotos de avaliação.',
    howToUse: 'Registre uma nova avaliação por aluno periodicamente para acompanhar a evolução física, com comparativo visual.',
  },
  {
    slug: 'anamnese',
    name: 'Anamnese',
    category: 'acompanhamento',
    icon: HeartPulse,
    description: 'Histórico de saúde, restrições médicas e objetivos do aluno.',
    howToUse: 'Preencha na entrada do aluno ou atualize quando houver mudança de condição de saúde. Serve de base para montar planos seguros.',
  },
  {
    slug: 'meu-progresso',
    name: 'Meu Progresso',
    category: 'acompanhamento',
    icon: TrendingUp,
    description: 'Auto-registro do aluno: peso, fotos de progresso e notas pessoais.',
    howToUse: 'O aluno alimenta esses dados pelo app dele. Você acompanha a evolução direto pelo perfil do aluno, sem precisar pedir manualmente.',
  },
  {
    slug: 'frequencia',
    name: 'Frequência',
    category: 'acompanhamento',
    icon: CalendarCheck,
    description: 'Calendário de treinos, sequência de dias ativos e relatório de assiduidade por aluno.',
    howToUse: 'Veja quem está treinando consistentemente e quem está sumindo — útil para identificar risco de cancelamento.',
  },
  {
    slug: 'feedbacks',
    name: 'Feedbacks',
    category: 'acompanhamento',
    icon: MessageSquare,
    description: 'O aluno avalia o treino com nota e comentário; você visualiza e filtra.',
    howToUse: 'Revise os feedbacks recentes para ajustar carga, volume ou trocar exercícios que não estão funcionando para o aluno.',
  },
  {
    slug: 'faturas',
    name: 'Faturas e Cobranças',
    category: 'financeiro',
    icon: Receipt,
    description: 'Geração de faturas, controle de pagamentos e relatório financeiro mensal.',
    howToUse: 'Gere a fatura do aluno, acompanhe o status de pagamento e veja o fechamento do mês em um único painel.',
  },
  {
    slug: 'arquivos',
    name: 'Arquivos',
    category: 'comunicacao',
    icon: FileText,
    description: 'Upload de PDFs e imagens — dietas, protocolos — compartilhados com alunos.',
    howToUse: 'Envie um arquivo direto para o perfil do aluno. Ele acessa pelo app dele, sem precisar de e-mail ou WhatsApp.',
  },
  {
    slug: 'notificacoes',
    name: 'Notificações',
    category: 'comunicacao',
    icon: Bell,
    description: 'Push notifications automáticas para treino, fatura vencendo, feedbacks e novidades.',
    howToUse: 'As notificações saem automaticamente conforme eventos do sistema. Configure aqui o que deve ou não ser enviado ao aluno.',
  },
  {
    slug: 'minha-agenda',
    name: 'Minha Agenda',
    category: 'comunicacao',
    icon: CalendarDays,
    description: 'Compromissos, atendimentos presenciais e virtuais, e pagamentos em um calendário completo.',
    howToUse: 'Cadastre atendimentos e pagamentos a fazer/receber. Eventos com aluno vinculado aparecem também no painel dele.',
  },
  {
    slug: 'planos-alimentares',
    name: 'Planos Alimentares',
    category: 'comunicacao',
    icon: Utensils,
    description: 'Montagem e envio de dietas e planos de nutrição para os alunos.',
    howToUse: 'Monte um plano alimentar por refeição e envie para o aluno. Ele acompanha pelo app, junto com o treino.',
  },
  {
    slug: 'white-label',
    name: 'Identidade Visual',
    category: 'whitelabel',
    icon: Palette,
    description: 'Nome do app, cor primária, logo e links de Instagram/WhatsApp exibidos para o aluno.',
    howToUse: 'Personalize a marca que o aluno vê no app dele — isso não afeta seu painel de personal, só a experiência do aluno.',
  },
  {
    slug: 'assistente-ia',
    name: 'Max Strive IA',
    category: 'ia',
    icon: Sparkles,
    description: 'Assistente de IA que gera treinos, analisa evolução e sugere ajustes de carga.',
    howToUse: 'Abra o perfil de um aluno e acesse "Consultar Max Strive IA" para gerar planos ou tirar dúvidas sobre o progresso dele.',
  },
]

// ── Aluno (student) ─────────────────────────────────────────────────────────
// Ordem: Treinos → Acompanhamento → Financeiro → Comunicação
// Somente módulos com que o aluno interage — sem módulos administrativos.
export const STUDENT_ONBOARDING_MODULES: ModuleOnboardingItem[] = [
  {
    slug: 'planos-de-treino',
    name: 'Planos de Treino',
    category: 'treinos',
    icon: ClipboardList,
    description: 'Aqui você vê os planos de treino que seu personal montou para você, organizados por dia da semana.',
    howToUse: 'Escolha o dia da semana e inicie o treino. Cada exercício mostra vídeo, séries e repetições indicadas pelo seu personal.',
  },
  {
    slug: 'treinos-extras',
    name: 'Treinos Extras',
    category: 'treinos',
    icon: Zap,
    description: 'Treinos avulsos que seu personal enviou fora do plano semanal — aquecimentos, desafios, reposições.',
    howToUse: 'Acesse quando seu personal indicar um treino extra. Ele fica disponível aqui até você completar.',
  },
  {
    slug: 'execucao-do-treino',
    name: 'Execução do Treino',
    category: 'treinos',
    icon: Timer,
    description: 'O modo ativo do seu treino: timer entre séries e registro de carga usada.',
    howToUse: 'Durante o treino, registre a carga de cada série. O timer avisa quando o descanso termina, para manter o ritmo certo.',
  },
  {
    slug: 'avaliacoes-fisicas',
    name: 'Avaliações Físicas',
    category: 'acompanhamento',
    icon: Ruler,
    description: 'Seu histórico de peso, medidas corporais e fotos de avaliação registrados pelo personal.',
    howToUse: 'Acompanhe aqui sua evolução física ao longo do tempo, com comparativo entre avaliações.',
  },
  {
    slug: 'anamnese',
    name: 'Anamnese',
    category: 'acompanhamento',
    icon: HeartPulse,
    description: 'Seu histórico de saúde e objetivos, preenchido com seu personal.',
    howToUse: 'Revise as informações registradas. Se algo mudar na sua condição de saúde, avise seu personal para atualizar.',
  },
  {
    slug: 'meu-progresso',
    name: 'Meu Progresso',
    category: 'acompanhamento',
    icon: TrendingUp,
    description: 'Espaço para você registrar seu próprio peso, fotos de progresso e notas pessoais.',
    howToUse: 'Atualize periodicamente seu peso e fotos. Isso ajuda seu personal a acompanhar sua evolução sem você precisar avisar.',
  },
  {
    slug: 'frequencia',
    name: 'Frequência',
    category: 'acompanhamento',
    icon: CalendarCheck,
    description: 'Seu calendário de treinos e sequência de dias ativos.',
    howToUse: 'Veja quantos dias seguidos você está treinando e seu histórico de assiduidade no mês.',
  },
  {
    slug: 'feedbacks',
    name: 'Feedbacks',
    category: 'acompanhamento',
    icon: MessageSquare,
    description: 'Onde você avalia cada treino com nota e comentário.',
    howToUse: 'Depois de treinar, dê uma nota e deixe um comentário. Seu personal usa isso para ajustar seus próximos treinos.',
  },
  {
    slug: 'faturas',
    name: 'Financeiro',
    category: 'financeiro',
    icon: Receipt,
    description: 'Suas faturas e status de pagamento junto ao seu personal.',
    howToUse: 'Consulte faturas em aberto e o histórico de pagamentos.',
  },
  {
    slug: 'arquivos',
    name: 'Arquivos',
    category: 'comunicacao',
    icon: FileText,
    description: 'PDFs e imagens que seu personal compartilhou com você — dietas, protocolos.',
    howToUse: 'Acesse os arquivos enviados pelo seu personal a qualquer momento, direto pelo app.',
  },
  {
    slug: 'minha-agenda',
    name: 'Minha Agenda',
    category: 'comunicacao',
    icon: CalendarDays,
    description: 'Seus compromissos com o personal — atendimentos presenciais e virtuais.',
    howToUse: 'Veja seus horários agendados ou solicite um atendimento presencial diretamente por aqui.',
  },
  {
    slug: 'planos-alimentares',
    name: 'Planos Alimentares',
    category: 'comunicacao',
    icon: Utensils,
    description: 'Sua dieta e plano de nutrição montado pelo personal.',
    howToUse: 'Consulte as refeições indicadas para cada dia, junto com o seu treino.',
  },
]

export function getOnboardingModules(role: OnboardingRole): ModuleOnboardingItem[] {
  return role === 'personal' ? PERSONAL_ONBOARDING_MODULES : STUDENT_ONBOARDING_MODULES
}
