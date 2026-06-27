import { createStudent } from '@/actions/students'
import Link from 'next/link'
import { ArrowLeft, UserPlus, Mail, Phone, Calendar, Target, FileText, Info } from 'lucide-react'

type Props = { searchParams: Promise<{ error?: string }> }

const GOAL_OPTIONS = [
  'Hipertrofia',
  'Emagrecimento',
  'Resistência',
  'Força',
  'Condicionamento',
  'Reabilitação',
  'Outros',
]

export default async function NovoAlunoPage({ searchParams }: Props) {
  const { error } = await searchParams

  return (
    <div className="p-4 md:p-8 space-y-6 max-w-2xl">
      {/* Voltar */}
      <Link
        href="/dashboard/alunos"
        className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        Voltar para Alunos
      </Link>

      {/* Título */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0">
          <UserPlus size={18} className="text-brand-lime" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-text-primary uppercase tracking-widest">
            Novo Aluno
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Preencha os dados e envie o convite de acesso
          </p>
        </div>
      </div>

      {/* Erro */}
      {error && (
        <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
          <Info size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-400">{decodeURIComponent(error)}</p>
        </div>
      )}

      <form action={createStudent} className="space-y-4">

        {/* Dados pessoais */}
        <div className="bg-surface border border-surface-border rounded-2xl p-5 space-y-4">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">
            Dados pessoais
          </p>

          <div className="space-y-3">
            {/* Nome */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1">
                Nome completo <span className="text-red-400">*</span>
              </label>
              <input
                name="full_name"
                required
                placeholder="Ex: Maria Silva"
                className="bg-background border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/40 outline-none focus:border-brand-lime/50 transition-colors font-body"
              />
            </div>

            {/* E-mail */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Mail size={11} />
                E-mail de acesso
              </label>
              <input
                name="email"
                type="email"
                placeholder="Ex: maria@email.com"
                className="bg-background border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/40 outline-none focus:border-brand-lime/50 transition-colors font-body"
              />
              <p className="text-[11px] text-text-secondary/60">
                Necessário para o aluno acessar o sistema. Pode ser adicionado depois.
              </p>
            </div>

            {/* Telefone + Data nascimento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <Phone size={11} />
                  Telefone / WhatsApp
                </label>
                <input
                  name="phone"
                  type="tel"
                  placeholder="(11) 99999-9999"
                  className="bg-background border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/40 outline-none focus:border-brand-lime/50 transition-colors font-body"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={11} />
                  Data de nascimento
                </label>
                <input
                  name="birth_date"
                  type="date"
                  className="bg-background border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-brand-lime/50 transition-colors font-body"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Objetivos e observações */}
        <div className="bg-surface border border-surface-border rounded-2xl p-5 space-y-4">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">
            Objetivo e observações
          </p>

          <div className="space-y-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <Target size={11} />
                Objetivo principal
              </label>
              <select
                name="goal"
                className="bg-background border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary outline-none focus:border-brand-lime/50 transition-colors font-body"
              >
                <option value="">Selecionar objetivo...</option>
                {GOAL_OPTIONS.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={11} />
                Observações internas
              </label>
              <textarea
                name="notes"
                rows={3}
                placeholder="Restrições físicas, histórico relevante, preferências..."
                className="bg-background border border-surface-border rounded-xl px-4 py-3 text-sm text-text-primary placeholder:text-text-secondary/40 outline-none focus:border-brand-lime/50 transition-colors font-body resize-none"
              />
              <p className="text-[11px] text-text-secondary/60">
                Visível apenas para você. Não aparece para o aluno.
              </p>
            </div>
          </div>
        </div>

        {/* Convite por e-mail */}
        <div className="bg-surface border border-surface-border rounded-2xl p-5 space-y-3">
          <p className="text-xs font-bold text-text-secondary uppercase tracking-widest">
            Acesso ao sistema
          </p>

          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="mt-0.5 flex-shrink-0">
              <input
                type="checkbox"
                name="send_invite"
                defaultChecked
                className="w-4 h-4 rounded border border-surface-border accent-brand-lime"
              />
            </div>
            <div>
              <p className="text-sm font-medium text-text-primary group-hover:text-brand-lime transition-colors">
                Enviar e-mail de boas-vindas com acesso
              </p>
              <p className="text-xs text-text-secondary mt-0.5 leading-relaxed">
                O aluno receberá um e-mail com as instruções de acesso e a senha provisória.
                Ele será obrigado a trocar a senha no primeiro login.
              </p>
            </div>
          </label>

          <div className="flex items-start gap-2 bg-background border border-surface-border rounded-xl p-3 mt-1">
            <Info size={13} className="text-text-secondary flex-shrink-0 mt-0.5" />
            <p className="text-xs text-text-secondary leading-relaxed">
              Só é possível enviar o convite se um e-mail for informado acima.
              Caso o campo esteja em branco, o aluno ficará cadastrado sem acesso ao sistema
              — você poderá vincular um e-mail depois na ficha do aluno.
            </p>
          </div>
        </div>

        {/* Botão */}
        <div className="sticky bottom-20 md:bottom-6 z-10 rounded-2xl bg-background/90 backdrop-blur supports-[backdrop-filter]:bg-background/70 p-2 -mx-2">
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-brand-lime text-background font-display font-bold uppercase tracking-widest text-sm hover:bg-brand-lime/90 transition-colors"
          >
            Cadastrar Aluno →
          </button>
        </div>
      </form>
    </div>
  )
}
