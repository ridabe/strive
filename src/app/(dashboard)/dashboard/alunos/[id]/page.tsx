import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  ArrowLeft, User, Phone, Mail, CalendarDays,
  ClipboardList, FileHeart, Receipt, TrendingUp,
} from 'lucide-react'

interface Props {
  params: Promise<{ id: string }>
}

export default async function StudentDetailPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', id)
    .single()

  if (!student) notFound()

  // Contagens rápidas
  const [{ count: planCount }, { count: assessCount }, { count: invoiceCount }, { data: anamnese }] =
    await Promise.all([
      supabase.from('workout_plans').select('*', { count: 'exact', head: true }).eq('student_id', id),
      supabase.from('physical_assessments').select('*', { count: 'exact', head: true }).eq('student_id', id),
      supabase.from('financial_plans').select('*', { count: 'exact', head: true }).eq('student_id', id),
      supabase.from('anamnese_responses').select('completed_at, updated_at').eq('student_id', id).maybeSingle(),
    ])

  const age = student.birth_date
    ? Math.floor(
        (Date.now() - new Date(student.birth_date).getTime()) / (1000 * 60 * 60 * 24 * 365.25),
      )
    : null

  const quickLinks = [
    {
      href:  `/dashboard/alunos/${id}/anamnese`,
      label: 'Anamnese',
      icon:  FileHeart,
      color: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
      badge: anamnese?.completed_at ? 'Preenchida' : anamnese ? 'Em andamento' : 'Não iniciada',
      badgeColor: anamnese?.completed_at
        ? 'text-status-success bg-status-success/10 border-status-success/20'
        : 'text-status-warning bg-status-warning/10 border-status-warning/20',
    },
    {
      href:  `/dashboard/treinos?aluno=${id}`,
      label: 'Planos de Treino',
      icon:  ClipboardList,
      color: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
      badge: `${planCount ?? 0} plano${planCount !== 1 ? 's' : ''}`,
      badgeColor: 'text-text-secondary bg-background border-surface-border',
    },
    {
      href:  `/dashboard/avaliacoes?aluno=${id}`,
      label: 'Avaliações',
      icon:  TrendingUp,
      color: 'text-purple-400 bg-purple-400/10 border-purple-400/20',
      badge: `${assessCount ?? 0} avaliação${assessCount !== 1 ? 'ões' : ''}`,
      badgeColor: 'text-text-secondary bg-background border-surface-border',
    },
    {
      href:  `/dashboard/financeiro?aluno=${id}`,
      label: 'Financeiro',
      icon:  Receipt,
      color: 'text-green-400 bg-green-400/10 border-green-400/20',
      badge: `${invoiceCount ?? 0} fatura${invoiceCount !== 1 ? 's' : ''}`,
      badgeColor: 'text-text-secondary bg-background border-surface-border',
    },
  ]

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-3xl">

      {/* Voltar */}
      <Link
        href="/dashboard/alunos"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        Alunos
      </Link>

      {/* Header do aluno */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0">
          <User size={24} className="text-brand-lime" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary tracking-widest uppercase">
            {student.full_name}
          </h1>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
            student.status === 'active'
              ? 'text-status-success bg-status-success/10 border-status-success/20'
              : 'text-text-secondary bg-background border-surface-border'
          }`}>
            {student.status === 'active' ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </div>

      {/* Informações pessoais */}
      <div className="bg-surface border border-surface-border rounded-xl divide-y divide-surface-border">
        {[
          { icon: Mail,         label: 'E-mail',      value: student.email },
          { icon: Phone,        label: 'Telefone',    value: student.phone },
          { icon: CalendarDays, label: 'Nascimento',  value: student.birth_date
              ? `${new Date(student.birth_date).toLocaleDateString('pt-BR')}${age ? ` (${age} anos)` : ''}`
              : null },
          { icon: ClipboardList, label: 'Objetivo',   value: student.goal },
        ].filter((r) => r.value).map((row) => {
          const Icon = row.icon
          return (
            <div key={row.label} className="flex items-center gap-3 px-5 py-3.5">
              <Icon size={15} className="text-text-secondary flex-shrink-0" />
              <span className="text-xs text-text-secondary w-20 flex-shrink-0">{row.label}</span>
              <span className="text-sm text-text-primary">{row.value}</span>
            </div>
          )
        })}
      </div>

      {/* Links rápidos */}
      <div>
        <h2 className="text-xs font-body font-semibold text-text-secondary uppercase tracking-widest mb-3">
          Módulos do aluno
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {quickLinks.map((link) => {
            const Icon = link.icon
            return (
              <Link
                key={link.href}
                href={link.href}
                className="group bg-surface border border-surface-border rounded-xl p-4 flex items-center gap-4 hover:border-brand-lime/30 transition-all"
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center border flex-shrink-0 ${link.color}`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-body font-medium text-text-primary group-hover:text-brand-lime transition-colors">
                    {link.label}
                  </p>
                  <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full border ${link.badgeColor}`}>
                    {link.badge}
                  </span>
                </div>
                <ArrowLeft size={14} className="text-text-secondary rotate-180 flex-shrink-0" />
              </Link>
            )
          })}
        </div>
      </div>

      {/* Notas */}
      {student.notes && (
        <div className="bg-surface border border-surface-border rounded-xl p-5 space-y-2">
          <p className="text-xs font-body font-semibold text-text-secondary uppercase tracking-widest">Observações</p>
          <p className="text-sm text-text-primary whitespace-pre-wrap">{student.notes}</p>
        </div>
      )}
    </div>
  )
}
