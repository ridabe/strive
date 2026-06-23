'use client'

import { useState, useTransition, useCallback, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, ChevronRight, Plus, X, MapPin, Video,
  TrendingDown, TrendingUp, Clock, User, CalendarDays,
  CheckCircle2, XCircle, Loader2, Search,
} from 'lucide-react'
import { MapsPopup } from '@/components/maps-popup'
import {
  createAgendaEvent, updateAgendaEvent, deleteAgendaEvent,
  confirmAgendaEvent, rejectAgendaEvent,
  type AgendaEvent, type AgendaEventType, type AgendaEventStatus,
  type CreateAgendaEventInput,
} from '@/app/actions/agenda'

// ─── Cores por tipo ───────────────────────────────────────────
const TYPE_CONFIG: Record<AgendaEventType, {
  label: string
  color: string
  bg: string
  border: string
  icon: ReactNode
}> = {
  presencial: {
    label: 'Presencial',
    color: 'text-blue-400',
    bg: 'bg-blue-500',
    border: 'border-blue-500/30',
    icon: <MapPin size={14} />,
  },
  virtual: {
    label: 'Virtual',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500',
    border: 'border-emerald-500/30',
    icon: <Video size={14} />,
  },
  pagamento_a_fazer: {
    label: 'Pagamento a Fazer',
    color: 'text-red-400',
    bg: 'bg-red-500',
    border: 'border-red-500/30',
    icon: <TrendingDown size={14} />,
  },
  pagamento_a_receber: {
    label: 'Pagamento a Receber',
    color: 'text-amber-400',
    bg: 'bg-amber-500',
    border: 'border-amber-500/30',
    icon: <TrendingUp size={14} />,
  },
}

const STATUS_CONFIG: Record<AgendaEventStatus, { label: string; color: string }> = {
  scheduled:             { label: 'Agendado',              color: 'text-brand-lime'    },
  completed:             { label: 'Concluído',             color: 'text-emerald-400'   },
  cancelled:             { label: 'Cancelado',             color: 'text-text-secondary' },
  pending_confirmation:  { label: 'Aguardando confirmação', color: 'text-amber-400'    },
  rejected:              { label: 'Não confirmado',         color: 'text-red-400'      },
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS   = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

interface Student { id: string; full_name: string }

interface Props {
  initialEvents: AgendaEvent[]
  initialYear:   number
  initialMonth:  number
  students:      Student[]
}

// ─── Modal de criar/editar evento ────────────────────────────
interface EventModalProps {
  date:       string
  event?:     AgendaEvent | null
  students:   Student[]
  onClose:    () => void
  onSaved:    () => void
}

function maskCep(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits
}

function EventModal({ date, event, students, onClose, onSaved }: EventModalProps) {
  const [isPending, startTransition] = useTransition()
  const [type, setType] = useState<AgendaEventType>(event?.type as AgendaEventType ?? 'presencial')
  const [title, setTitle]           = useState(event?.title ?? '')
  const [eventDate, setEventDate]   = useState(event?.event_date ?? date)
  const [startTime, setStartTime]   = useState(event?.start_time ?? '')
  const [studentId, setStudentId]   = useState(event?.student_id ?? '')
  const [studentName, setStudentName] = useState(event?.student_name ?? '')
  const [location, setLocation]     = useState(event?.location ?? '')
  const [meetingUrl, setMeetingUrl] = useState(event?.meeting_url ?? '')
  // CEP (endereço para tipo presencial)
  const [cep, setCep]               = useState(event?.address_cep ?? '')
  const [cepLoading, setCepLoading] = useState(false)
  const [cepError, setCepError]     = useState<string | null>(null)
  // Máscara de moeda — armazena em centavos, exibe formatado
  const [amountCents, setAmountCents] = useState<number>(
    event?.amount ? Math.round(Number(event.amount) * 100) : 0
  )
  const amountDisplay = amountCents > 0
    ? (amountCents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : ''

  const handleAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '')
    setAmountCents(digits ? parseInt(digits, 10) : 0)
  }, [])

  const handleCepChange = useCallback(async (raw: string) => {
    const masked = maskCep(raw)
    setCep(masked)
    setCepError(null)
    const digits = masked.replace(/\D/g, '')
    if (digits.length === 8) {
      setCepLoading(true)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
        const data = await res.json() as { logradouro?: string; bairro?: string; localidade?: string; uf?: string; erro?: boolean }
        if (data.erro) {
          setCepError('CEP não encontrado')
        } else {
          const parts = [data.logradouro, data.bairro, data.localidade && data.uf ? `${data.localidade}/${data.uf}` : (data.localidade ?? data.uf)].filter(Boolean)
          if (parts.length > 0 && !location) setLocation(parts.join(', '))
        }
      } catch {
        setCepError('Erro ao buscar CEP')
      } finally {
        setCepLoading(false)
      }
    }
  }, [location])

  const [description, setDescription] = useState(event?.description ?? '')
  const [notes, setNotes]           = useState(event?.notes ?? '')
  const [error, setError]           = useState('')

  // Aluno aparece para presencial, virtual e pagamento_a_receber (opcional)
  const needsStudent = type === 'presencial' || type === 'virtual' || type === 'pagamento_a_receber'
  const studentOptional = type === 'pagamento_a_receber'
  const needsPayment = type === 'pagamento_a_fazer' || type === 'pagamento_a_receber'

  // Sincroniza nome do aluno ao selecionar
  function handleStudentChange(id: string) {
    setStudentId(id)
    const found = students.find(s => s.id === id)
    setStudentName(found?.full_name ?? '')
  }

  // Auto-título quando presencial/virtual e aluno selecionado
  function handleTypeChange(t: AgendaEventType) {
    setType(t)
    if ((t === 'presencial' || t === 'virtual') && !title) {
      if (studentName) setTitle(t === 'presencial' ? `Atendimento — ${studentName}` : `Consultoria — ${studentName}`)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!title.trim()) { setError('Título é obrigatório'); return }

    startTransition(async () => {
      try {
        const payload: CreateAgendaEventInput = {
          type,
          title:        title.trim(),
          event_date:   eventDate,
          start_time:   startTime || null,
          student_id:   needsStudent && studentId ? studentId : null,
          student_name: needsStudent && studentName ? studentName.trim() : null,
          location:     type === 'presencial' && location ? location.trim() : null,
          address_cep:  type === 'presencial' && cep ? cep : null,
          meeting_url:  type === 'virtual' && meetingUrl ? meetingUrl.trim() : null,
          amount:       needsPayment && amountCents > 0 ? amountCents / 100 : null,
          description:  description.trim() || null,
          notes:        notes.trim() || null,
        }

        if (event) {
          await updateAgendaEvent({ id: event.id, ...payload })
        } else {
          await createAgendaEvent(payload)
        }
        onSaved()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao salvar')
      }
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-surface border border-surface-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-surface-border">
          <h2 className="font-display text-base font-bold text-text-primary uppercase tracking-widest">
            {event ? 'Editar Evento' : 'Novo Evento'}
          </h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">

          {/* Tipo */}
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(TYPE_CONFIG) as [AgendaEventType, typeof TYPE_CONFIG[AgendaEventType]][]).map(([t, cfg]) => (
              <button
                key={t}
                type="button"
                onClick={() => handleTypeChange(t)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                  type === t
                    ? `${cfg.color} ${cfg.border} bg-surface-border/30`
                    : 'text-text-secondary border-surface-border hover:border-text-secondary/30'
                }`}
              >
                {cfg.icon}
                {cfg.label}
              </button>
            ))}
          </div>

          {/* Título */}
          <div>
            <label className="block text-xs text-text-secondary mb-1">Título *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={
                type === 'presencial' ? 'Ex: Atendimento — João Silva' :
                type === 'virtual'    ? 'Ex: Consultoria — Maria' :
                'Ex: Mensalidade de julho'
              }
              className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/50"
            />
          </div>

          {/* Data e Hora */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1">Data *</label>
              <input
                type="date"
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-lime/50"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Horário</label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-lime/50"
              />
            </div>
          </div>

          {/* Aluno (presencial/virtual) */}
          {needsStudent && (
            <div>
              <label className="block text-xs text-text-secondary mb-1">Aluno</label>
              {students.length > 0 ? (
                <select
                  value={studentId}
                  onChange={e => handleStudentChange(e.target.value)}
                  className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-lime/50"
                >
                  <option value="">Selecionar aluno...</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  placeholder="Nome do aluno"
                  className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/50"
                />
              )}
            </div>
          )}

          {/* Local (presencial) — CEP + endereço + link Maps */}
          {type === 'presencial' && (
            <div className="space-y-3">
              {/* CEP com busca automática */}
              <div>
                <label className="block text-xs text-text-secondary mb-1">CEP</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cep}
                    onChange={e => handleCepChange(e.target.value)}
                    placeholder="00000-000"
                    inputMode="numeric"
                    maxLength={9}
                    className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 pr-8 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/50"
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                    {cepLoading
                      ? <Loader2 size={13} className="animate-spin text-text-secondary" />
                      : <Search size={13} className="text-text-secondary/40" />
                    }
                  </div>
                </div>
                {cepError && <p className="text-xs text-red-400 mt-1">{cepError}</p>}
              </div>
              {/* Endereço completo (auto-preenchido pelo CEP, editável) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-text-secondary">Endereço completo</label>
                  {location && (
                    <MapsPopup
                      address={location}
                      label="Ver no Maps"
                      iconSize={10}
                      className="text-[10px]"
                    />
                  )}
                </div>
                <input
                  value={location}
                  onChange={e => setLocation(e.target.value)}
                  placeholder="Rua, número, bairro, cidade/UF"
                  className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/50"
                />
              </div>
            </div>
          )}

          {/* Link da reunião (virtual) */}
          {type === 'virtual' && (
            <div>
              <label className="block text-xs text-text-secondary mb-1">Link do Meeting</label>
              <input
                value={meetingUrl}
                onChange={e => setMeetingUrl(e.target.value)}
                placeholder="https://meet.google.com/..."
                className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/50"
              />
            </div>
          )}

          {/* Aluno opcional (pagamento_a_receber) */}
          {needsStudent && studentOptional && (
            <div>
              <label className="block text-xs text-text-secondary mb-1">
                Aluno <span className="text-text-secondary/50">(opcional — vincula ao painel do aluno)</span>
              </label>
              {students.length > 0 ? (
                <select
                  value={studentId}
                  onChange={e => handleStudentChange(e.target.value)}
                  className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-lime/50"
                >
                  <option value="">Sem aluno vinculado</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  placeholder="Nome do aluno (opcional)"
                  className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/50"
                />
              )}
            </div>
          )}

          {/* Valor (pagamentos) */}
          {needsPayment && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">Valor (R$)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-text-secondary pointer-events-none">R$</span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={amountDisplay}
                    onChange={handleAmountChange}
                    placeholder="0,00"
                    className="w-full bg-background border border-surface-border rounded-lg pl-8 pr-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/50"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">Descrição</label>
                <input
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Ex: Mensalidade"
                  className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/50"
                />
              </div>
            </div>
          )}

          {/* Observações */}
          <div>
            <label className="block text-xs text-text-secondary mb-1">Observações</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Notas adicionais..."
              className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/50 resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-sm text-text-secondary border border-surface-border rounded-lg hover:border-text-secondary/30 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2 text-sm font-medium text-background bg-brand-lime rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : null}
              {event ? 'Salvar' : 'Criar Evento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Card de evento na lista do dia ──────────────────────────
interface EventCardProps {
  event:    AgendaEvent
  onEdit:   (e: AgendaEvent) => void
  onDelete: (id: string) => void
  onStatus: (id: string, status: AgendaEventStatus) => void
}

function EventCard({ event, onEdit, onDelete, onStatus }: EventCardProps) {
  const [delPending, startDel]    = useTransition()
  const [statPending, startStat]  = useTransition()
  const [showRejectInput, setShowRejectInput] = useState(false)
  const [rejectReason, setRejectReason]       = useState('')
  const cfg = TYPE_CONFIG[event.type as AgendaEventType]
  const isPending = event.status === 'pending_confirmation'

  return (
    <div className={`rounded-xl border bg-surface p-3.5 space-y-2 ${
      isPending ? 'border-amber-500/40' : cfg.border
    }`}>
      {/* Badge de origem aluno */}
      {isPending && (
        <span className="inline-flex items-center gap-1 text-[10px] font-display font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">
          ⏳ Solicitação do aluno — aguardando confirmação
        </span>
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className={`${cfg.color} flex-shrink-0`}>{cfg.icon}</span>
          <span className="text-text-primary text-sm font-medium truncate">{event.title}</span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {!isPending && (
            <button
              onClick={() => onEdit(event)}
              className="text-text-secondary hover:text-text-primary transition-colors p-1"
              title="Editar"
            >
              <CalendarDays size={13} />
            </button>
          )}
          <button
            onClick={() => { startDel(async () => { await deleteAgendaEvent(event.id); onDelete(event.id) }) }}
            disabled={delPending}
            className="text-text-secondary hover:text-red-400 transition-colors p-1 disabled:opacity-40"
            title="Excluir"
          >
            {delPending ? <Loader2 size={13} className="animate-spin" /> : <X size={13} />}
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary">
        {event.start_time && (
          <span className="flex items-center gap-1">
            <Clock size={11} /> {event.start_time.slice(0, 5)}
          </span>
        )}
        {event.student_name && (
          <span className="flex items-center gap-1">
            <User size={11} /> {event.student_name}
          </span>
        )}
        {event.location && (
          <span className="flex items-center gap-1">
            <MapPin size={11} /> {event.location}
            {event.type === 'presencial' && (
              <MapsPopup address={event.location} iconSize={10} className="ml-0.5" />
            )}
          </span>
        )}
        {event.meeting_url && (
          <a
            href={event.meeting_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-emerald-400 hover:underline"
          >
            <Video size={11} /> Entrar
          </a>
        )}
        {event.amount != null && (
          <span className={cfg.color}>
            R$ {Number(event.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        )}
      </div>

      {/* Ações: solicitação do aluno → confirmar ou recusar */}
      {isPending && (
        <div className="space-y-2 pt-0.5 border-t border-amber-500/20">
          {!showRejectInput ? (
            <div className="flex gap-2">
              <button
                onClick={() => startStat(async () => {
                  await confirmAgendaEvent(event.id)
                  onStatus(event.id, 'scheduled')
                })}
                disabled={statPending}
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-40 font-medium"
              >
                {statPending ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                Confirmar
              </button>
              <button
                onClick={() => setShowRejectInput(true)}
                disabled={statPending}
                className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-40 font-medium"
              >
                <XCircle size={12} /> Recusar
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="Motivo da recusa (obrigatório)..."
                className="w-full bg-background border border-red-500/30 rounded-lg px-3 py-1.5 text-xs text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-red-500/60"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    if (!rejectReason.trim()) return
                    startStat(async () => {
                      await rejectAgendaEvent(event.id, rejectReason.trim())
                      onStatus(event.id, 'rejected')
                    })
                  }}
                  disabled={statPending || !rejectReason.trim()}
                  className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-40 font-medium"
                >
                  {statPending ? <Loader2 size={12} className="animate-spin" /> : <XCircle size={12} />}
                  Confirmar recusa
                </button>
                <button
                  onClick={() => { setShowRejectInput(false); setRejectReason('') }}
                  className="text-xs text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Ações de status para eventos normais */}
      {event.status === 'scheduled' && !isPending && (
        <div className="flex gap-2 pt-0.5">
          <button
            onClick={() => startStat(async () => { await updateAgendaEvent({ id: event.id, status: 'completed' }); onStatus(event.id, 'completed') })}
            disabled={statPending}
            className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors disabled:opacity-40"
          >
            <CheckCircle2 size={12} /> Concluir
          </button>
          <button
            onClick={() => startStat(async () => { await updateAgendaEvent({ id: event.id, status: 'cancelled' }); onStatus(event.id, 'cancelled') })}
            disabled={statPending}
            className="flex items-center gap-1 text-xs text-text-secondary hover:text-red-400 transition-colors disabled:opacity-40"
          >
            <XCircle size={12} /> Cancelar
          </button>
        </div>
      )}
      {!isPending && event.status !== 'scheduled' && (
        <span className={`text-xs ${STATUS_CONFIG[event.status as AgendaEventStatus]?.color ?? 'text-text-secondary'}`}>
          {STATUS_CONFIG[event.status as AgendaEventStatus]?.label ?? event.status}
        </span>
      )}
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────
export function AgendaCalendarView({ initialEvents, initialYear, initialMonth, students }: Props) {
  const router = useRouter()
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const [year, setYear]     = useState(initialYear)
  const [month, setMonth]   = useState(initialMonth)
  const [events, setEvents] = useState<AgendaEvent[]>(initialEvents)
  const [loading, setLoading] = useState(false)

  // Dia selecionado no calendário
  const [selectedDate, setSelectedDate] = useState<string | null>(
    todayStr.startsWith(`${initialYear}-${String(initialMonth).padStart(2, '0')}`) ? todayStr : null
  )

  // Modal de criação/edição
  const [showModal, setShowModal]   = useState(false)
  const [editingEvent, setEditingEvent] = useState<AgendaEvent | null>(null)

  // Navegar meses
  async function navigate(dir: -1 | 1) {
    let newMonth = month + dir
    let newYear  = year
    if (newMonth < 1)  { newMonth = 12; newYear-- }
    if (newMonth > 12) { newMonth = 1;  newYear++ }

    setLoading(true)
    setYear(newYear)
    setMonth(newMonth)

    try {
      const res = await fetch(`/api/agenda?year=${newYear}&month=${newMonth}`)
      if (res.ok) {
        const data: AgendaEvent[] = await res.json()
        setEvents(data)
      }
    } catch {
      // mantém eventos anteriores
    } finally {
      setLoading(false)
    }

    setSelectedDate(null)
  }

  // Dias do calendário
  const firstDay = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const calDays: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  // Eventos por data
  const eventsByDate = events.reduce<Record<string, AgendaEvent[]>>((acc, ev) => {
    if (!acc[ev.event_date]) acc[ev.event_date] = []
    acc[ev.event_date].push(ev)
    return acc
  }, {})

  const dateStr = (day: number) =>
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] ?? []) : []

  function handleSaved() {
    setShowModal(false)
    setEditingEvent(null)
    // Recarrega eventos do mês com cache-bust
    fetch(`/api/agenda?year=${year}&month=${month}&_t=${Date.now()}`)
      .then(r => r.ok ? r.json() : null)
      .then((data: AgendaEvent[] | null) => {
        if (data) setEvents(data)
      })
      .catch(() => {})
    // Invalida o cache do servidor para o banner do dashboard
    router.refresh()
  }

  function handleDelete(id: string) {
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  function handleStatus(id: string, status: AgendaEventStatus) {
    setEvents(prev => prev.map(e => e.id === id ? { ...e, status } : e))
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
            Minha Agenda
          </h1>
          <p className="text-text-secondary text-sm mt-0.5">
            Atendimentos, consultorias e pagamentos
          </p>
        </div>
        <button
          onClick={() => { setEditingEvent(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-lime text-background text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={16} /> Novo Evento
        </button>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-3">
        {(Object.entries(TYPE_CONFIG) as [AgendaEventType, typeof TYPE_CONFIG[AgendaEventType]][]).map(([t, cfg]) => (
          <div key={t} className="flex items-center gap-1.5 text-xs text-text-secondary">
            <span className={`w-2.5 h-2.5 rounded-full ${cfg.bg}`} />
            {cfg.label}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Calendário */}
        <div className="lg:col-span-2">
          <div className="bg-surface border border-surface-border rounded-2xl overflow-hidden">

            {/* Navegação do mês */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
              <button
                onClick={() => navigate(-1)}
                className="p-1.5 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface-border/30"
              >
                <ChevronLeft size={18} />
              </button>
              <h2 className="font-display text-base font-bold text-text-primary uppercase tracking-widest">
                {MONTHS[month - 1]} {year}
              </h2>
              <button
                onClick={() => navigate(1)}
                className="p-1.5 text-text-secondary hover:text-text-primary transition-colors rounded-lg hover:bg-surface-border/30"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Grid de dias da semana */}
            <div className="grid grid-cols-7 border-b border-surface-border">
              {WEEKDAYS.map(d => (
                <div key={d} className="py-2 text-center text-xs font-body font-semibold text-text-secondary/60 uppercase tracking-wider">
                  {d}
                </div>
              ))}
            </div>

            {/* Grid de dias */}
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 size={24} className="animate-spin text-text-secondary" />
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {calDays.map((day, idx) => {
                  if (!day) {
                    return <div key={`empty-${idx}`} className="min-h-[72px] border-b border-r border-surface-border/30" />
                  }

                  const ds = dateStr(day)
                  const dayEvents = eventsByDate[ds] ?? []
                  const isToday     = ds === todayStr
                  const isSelected  = ds === selectedDate
                  const isPast      = ds < todayStr

                  return (
                    <button
                      key={ds}
                      onClick={() => setSelectedDate(isSelected ? null : ds)}
                      className={`min-h-[72px] p-1.5 border-b border-r border-surface-border/30 text-left transition-all hover:bg-surface-border/20 ${
                        isSelected ? 'bg-brand-lime/10 border-brand-lime/20' : ''
                      }`}
                    >
                      <span className={`flex items-center justify-center w-6 h-6 rounded-full text-xs font-body mb-1 ${
                        isToday
                          ? 'bg-brand-lime text-background font-bold'
                          : isSelected
                          ? 'text-brand-lime font-semibold'
                          : isPast
                          ? 'text-text-secondary/40'
                          : 'text-text-secondary'
                      }`}>
                        {day}
                      </span>

                      {/* Dots de eventos */}
                      <div className="flex flex-wrap gap-0.5">
                        {dayEvents.slice(0, 4).map((ev) => (
                          <span
                            key={ev.id}
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              ev.status === 'cancelled'            ? 'opacity-30' :
                              ev.status === 'pending_confirmation' ? 'ring-1 ring-amber-400' : ''
                            } ${
                              ev.status === 'pending_confirmation'
                                ? 'bg-amber-500/60'
                                : TYPE_CONFIG[ev.type as AgendaEventType]?.bg ?? 'bg-text-secondary'
                            }`}
                            title={ev.status === 'pending_confirmation' ? `⏳ ${ev.title}` : ev.title}
                          />
                        ))}
                        {dayEvents.length > 4 && (
                          <span className="text-[9px] text-text-secondary/60 leading-none">+{dayEvents.length - 4}</span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Painel do dia selecionado */}
        <div className="space-y-3">
          {selectedDate ? (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-body font-semibold text-text-secondary uppercase tracking-widest">
                  {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                    weekday: 'long', day: 'numeric', month: 'long',
                  })}
                </h3>
                <button
                  onClick={() => { setEditingEvent(null); setShowModal(true) }}
                  className="flex items-center gap-1 text-xs text-brand-lime hover:opacity-80 transition-opacity"
                >
                  <Plus size={12} /> Adicionar
                </button>
              </div>

              {selectedEvents.length === 0 ? (
                <div className="bg-surface border border-surface-border rounded-xl p-6 text-center">
                  <CalendarDays size={24} className="text-text-secondary/40 mx-auto mb-2" />
                  <p className="text-sm text-text-secondary">Nenhum evento neste dia.</p>
                  <button
                    onClick={() => { setEditingEvent(null); setShowModal(true) }}
                    className="mt-3 text-xs text-brand-lime hover:opacity-80 transition-opacity"
                  >
                    + Criar primeiro evento
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedEvents
                    .sort((a, b) => (a.start_time ?? '').localeCompare(b.start_time ?? ''))
                    .map(ev => (
                      <EventCard
                        key={ev.id}
                        event={ev}
                        onEdit={e => { setEditingEvent(e); setShowModal(true) }}
                        onDelete={handleDelete}
                        onStatus={handleStatus}
                      />
                    ))
                  }
                </div>
              )}
            </>
          ) : (
            <div className="bg-surface border border-surface-border rounded-xl p-6 text-center">
              <CalendarDays size={28} className="text-text-secondary/30 mx-auto mb-2" />
              <p className="text-sm text-text-secondary">
                Clique em um dia para ver ou criar eventos.
              </p>
            </div>
          )}

          {/* Resumo do mês */}
          {!selectedDate && (
            <div className="bg-surface border border-surface-border rounded-xl p-4 space-y-3 mt-4">
              <h3 className="text-xs font-body font-semibold text-text-secondary uppercase tracking-widest">
                Resumo do Mês
              </h3>

              {/* Solicitações pendentes de alunos */}
              {(() => {
                const pendingCount = events.filter(e => e.status === 'pending_confirmation').length
                if (pendingCount === 0) return null
                return (
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-amber-400">
                      <span className="w-2 h-2 rounded-full bg-amber-500/60 ring-1 ring-amber-400" />
                      Solicitações pendentes
                    </div>
                    <span className="font-medium text-amber-400">{pendingCount}</span>
                  </div>
                )
              })()}

              {(Object.entries(TYPE_CONFIG) as [AgendaEventType, typeof TYPE_CONFIG[AgendaEventType]][]).map(([t, cfg]) => {
                const count = events.filter(e => e.type === t && e.status === 'scheduled').length
                if (count === 0) return null
                return (
                  <div key={t} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-text-secondary">
                      <span className={`${cfg.bg} w-2 h-2 rounded-full`} />
                      {cfg.label}
                    </div>
                    <span className={`font-medium ${cfg.color}`}>{count}</span>
                  </div>
                )
              })}
              {events.filter(e => e.status === 'scheduled' || e.status === 'pending_confirmation').length === 0 && (
                <p className="text-xs text-text-secondary/50">Sem eventos agendados.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <EventModal
          date={selectedDate ?? todayStr}
          event={editingEvent}
          students={students}
          onClose={() => { setShowModal(false); setEditingEvent(null) }}
          onSaved={handleSaved}
        />
      )}
    </div>
  )
}
