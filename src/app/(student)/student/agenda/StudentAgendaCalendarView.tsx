'use client'

import { useState, type ReactNode } from 'react'
import {
  ChevronLeft, ChevronRight, MapPin, Video, Clock,
  TrendingDown, TrendingUp, CalendarDays,
  AlertCircle, CheckCircle2, XCircle, MessageCircle,
} from 'lucide-react'
import { MapsPopup } from '@/components/maps-popup'
import { AgendaRequestForm } from './AgendaRequestForm'

// ─── Tipos ────────────────────────────────────────────────────
type EventType   = 'presencial' | 'virtual' | 'pagamento_a_fazer' | 'pagamento_a_receber'
type EventStatus = 'scheduled' | 'completed' | 'cancelled' | 'pending_confirmation' | 'rejected'

interface AgendaEvent {
  id: string
  type: string
  title: string
  event_date: string
  start_time: string | null
  location: string | null
  meeting_url: string | null
  amount: number | null
  notes: string | null
  status: string
  origin: string
  rejection_reason: string | null
  address_cep: string | null
}

// ─── Configurações visuais ────────────────────────────────────
const TYPE_CONFIG: Record<EventType, { label: string; color: string; dotBg: string; border: string; cardBg: string; icon: ReactNode }> = {
  presencial: {
    label: 'Presencial', color: 'text-blue-400', dotBg: 'bg-blue-500',
    border: 'border-blue-500/30', cardBg: 'bg-blue-500/10',
    icon: <MapPin size={13} />,
  },
  virtual: {
    label: 'Virtual', color: 'text-emerald-400', dotBg: 'bg-emerald-500',
    border: 'border-emerald-500/30', cardBg: 'bg-emerald-500/10',
    icon: <Video size={13} />,
  },
  pagamento_a_fazer: {
    label: 'Pagamento a Fazer', color: 'text-red-400', dotBg: 'bg-red-500',
    border: 'border-red-500/30', cardBg: 'bg-red-500/10',
    icon: <TrendingDown size={13} />,
  },
  pagamento_a_receber: {
    label: 'Pagamento a Receber', color: 'text-amber-400', dotBg: 'bg-amber-500',
    border: 'border-amber-500/30', cardBg: 'bg-amber-500/10',
    icon: <TrendingUp size={13} />,
  },
}

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const MONTHS   = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

function formatDate(date: string) {
  return new Date(date + 'T12:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long',
  })
}

function formatTime(time: string | null) {
  return time ? time.slice(0, 5) : null
}

// ─── Props ────────────────────────────────────────────────────
interface Props {
  initialEvents:  AgendaEvent[]
  initialYear:    number
  initialMonth:   number
  personalPhone:  string | null
}

// ─── Componente principal ─────────────────────────────────────
export function StudentAgendaCalendarView({ initialEvents, initialYear, initialMonth, personalPhone }: Props) {
  const today    = new Date()
  const todayStr = today.toISOString().split('T')[0]

  const [year, setYear]       = useState(initialYear)
  const [month, setMonth]     = useState(initialMonth)
  const [events, setEvents]   = useState<AgendaEvent[]>(initialEvents)
  const [loading, setLoading] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | null>(
    todayStr.startsWith(`${initialYear}-${String(initialMonth).padStart(2, '0')}`) ? todayStr : null
  )

  // Navegar meses
  async function navigate(dir: -1 | 1) {
    let newMonth = month + dir
    let newYear  = year
    if (newMonth < 1)  { newMonth = 12; newYear-- }
    if (newMonth > 12) { newMonth = 1;  newYear++ }

    setLoading(true)
    setYear(newYear)
    setMonth(newMonth)
    setSelectedDate(null)

    try {
      const res = await fetch(`/api/student/agenda?year=${newYear}&month=${newMonth}&_t=${Date.now()}`)
      if (res.ok) setEvents(await res.json() as AgendaEvent[])
    } catch { /* mantém eventos anteriores */ } finally {
      setLoading(false)
    }
  }

  // Estrutura do calendário
  const firstDay    = new Date(year, month - 1, 1).getDay()
  const daysInMonth = new Date(year, month, 0).getDate()
  const calDays: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const dateStr = (day: number) =>
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  const eventsByDate = events.reduce<Record<string, AgendaEvent[]>>((acc, ev) => {
    if (!acc[ev.event_date]) acc[ev.event_date] = []
    acc[ev.event_date].push(ev)
    return acc
  }, {})

  const selectedEvents = selectedDate ? (eventsByDate[selectedDate] ?? []) : []

  // Pending requests (all months)
  const pendingRequests = events.filter(ev => ev.origin === 'student' && ev.status === 'pending_confirmation')
  const rejectedRequests = events.filter(ev => ev.origin === 'student' && ev.status === 'rejected')

  return (
    <div className="p-5 md:p-8 space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-brand-lime/10 border border-brand-lime/20 flex items-center justify-center flex-shrink-0">
          <CalendarDays size={18} className="text-brand-lime" />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold text-text-primary uppercase tracking-widest">
            Minha Agenda
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">
            Seus compromissos e atendimentos agendados.
          </p>
        </div>
      </div>

      {/* Botão de solicitação */}
      <AgendaRequestForm />

      {/* Alertas de solicitações pendentes/recusadas */}
      {pendingRequests.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3 flex items-center gap-3">
          <AlertCircle size={16} className="text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-300">
            {pendingRequests.length === 1
              ? '1 solicitação de aula aguardando confirmação do seu personal.'
              : `${pendingRequests.length} solicitações aguardando confirmação do seu personal.`}
          </p>
        </div>
      )}
      {rejectedRequests.length > 0 && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl px-4 py-3 flex items-start gap-3">
          <XCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1.5 flex-1">
            {rejectedRequests.map(ev => (
              <div key={ev.id} className="text-sm">
                <span className="text-red-300">Solicitação de {formatDate(ev.event_date)} não confirmada.</span>
                {ev.rejection_reason && (
                  <span className="text-red-300/70"> Motivo: {ev.rejection_reason}</span>
                )}
                {personalPhone && (
                  <a
                    href={`https://wa.me/55${personalPhone}?text=${encodeURIComponent(`Olá! Minha solicitação de aula presencial para ${formatDate(ev.event_date)} às ${formatTime(ev.start_time) ?? ''} não foi confirmada. Podemos conversar?`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium ml-2 transition-colors"
                  >
                    <MessageCircle size={11} /> WhatsApp
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legenda */}
      <div className="flex flex-wrap gap-3 text-xs text-text-secondary">
        {(Object.entries(TYPE_CONFIG) as [EventType, typeof TYPE_CONFIG[EventType]][]).map(([t, cfg]) => (
          <div key={t} className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${cfg.dotBg}`} />
            {cfg.label}
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500/60 ring-1 ring-amber-400" />
          Aguardando confirmação
        </div>
      </div>

      {/* Grid principal */}
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

            {/* Dias da semana */}
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
                <CalendarDays size={24} className="animate-pulse text-text-secondary" />
              </div>
            ) : (
              <div className="grid grid-cols-7">
                {calDays.map((day, idx) => {
                  if (!day) {
                    return <div key={`empty-${idx}`} className="min-h-[64px] border-b border-r border-surface-border/30" />
                  }

                  const ds         = dateStr(day)
                  const dayEvents  = eventsByDate[ds] ?? []
                  const isToday    = ds === todayStr
                  const isSelected = ds === selectedDate
                  const isPast     = ds < todayStr

                  return (
                    <button
                      key={ds}
                      onClick={() => setSelectedDate(isSelected ? null : ds)}
                      className={`min-h-[64px] p-1.5 border-b border-r border-surface-border/30 text-left transition-all hover:bg-surface-border/20 ${
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
                      {/* Dots */}
                      <div className="flex flex-wrap gap-0.5">
                        {dayEvents.slice(0, 4).map(ev => (
                          <span
                            key={ev.id}
                            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                              ev.status === 'pending_confirmation'
                                ? 'bg-amber-500/60 ring-1 ring-amber-400'
                                : ev.status === 'cancelled' || ev.status === 'rejected'
                                ? 'opacity-30'
                                : ''
                            } ${
                              ev.status === 'pending_confirmation'
                                ? ''
                                : TYPE_CONFIG[ev.type as EventType]?.dotBg ?? 'bg-text-secondary'
                            }`}
                            title={ev.title}
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

        {/* Painel do dia */}
        <div className="space-y-3">
          {selectedDate ? (
            <>
              <h3 className="text-xs font-body font-semibold text-text-secondary uppercase tracking-widest">
                {new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', {
                  weekday: 'long', day: 'numeric', month: 'long',
                })}
              </h3>

              {selectedEvents.length === 0 ? (
                <div className="bg-surface border border-surface-border rounded-xl p-6 text-center">
                  <CalendarDays size={24} className="text-text-secondary/40 mx-auto mb-2" />
                  <p className="text-sm text-text-secondary">Sem eventos neste dia.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedEvents.map(ev => {
                    const cfg       = TYPE_CONFIG[ev.type as EventType]
                    const isPending = ev.status === 'pending_confirmation'
                    const isRejected = ev.status === 'rejected'
                    const isConfirmed = ev.status === 'scheduled' && ev.origin === 'student'

                    return (
                      <div
                        key={ev.id}
                        className={`rounded-xl border p-3.5 space-y-2 ${
                          isPending  ? 'bg-amber-500/5  border-amber-500/30' :
                          isRejected ? 'bg-red-500/5    border-red-500/20'   :
                          cfg        ? `${cfg.cardBg} ${cfg.border}`         :
                          'bg-surface border-surface-border'
                        }`}
                      >
                        {/* Badge status para solicitações */}
                        {isPending && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-display font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-full px-2 py-0.5">
                            <AlertCircle size={9} /> Aguardando confirmação
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-display font-bold uppercase tracking-widest text-red-400 bg-red-500/10 border border-red-500/20 rounded-full px-2 py-0.5">
                            <XCircle size={9} /> Não confirmado
                          </span>
                        )}
                        {isConfirmed && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-display font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-2 py-0.5">
                            <CheckCircle2 size={9} /> Confirmado
                          </span>
                        )}

                        {/* Título */}
                        <div className="flex items-center gap-2">
                          {cfg && <span className={`${cfg.color} flex-shrink-0`}>{cfg.icon}</span>}
                          <span className="text-text-primary text-sm font-medium">{ev.title}</span>
                        </div>

                        {/* Metadados */}
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-text-secondary">
                          {ev.start_time && (
                            <span className="flex items-center gap-1">
                              <Clock size={11} /> {formatTime(ev.start_time)}
                            </span>
                          )}
                          {ev.location && (
                            <span className="flex items-center gap-1">
                              <MapPin size={11} /> {ev.location}
                              {ev.type === 'presencial' && (
                                <MapsPopup address={ev.location} iconSize={10} className="ml-0.5" />
                              )}
                            </span>
                          )}
                          {ev.amount != null && (
                            <span className={cfg?.color ?? 'text-text-secondary'}>
                              R$ {Number(ev.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          )}
                        </div>

                        {/* Meeting link */}
                        {ev.meeting_url && (
                          <a
                            href={ev.meeting_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors font-medium"
                          >
                            <Video size={11} /> Entrar na reunião
                          </a>
                        )}

                        {/* Motivo da recusa */}
                        {isRejected && ev.rejection_reason && (
                          <p className="text-xs text-red-300/80 bg-red-500/10 rounded-lg px-2.5 py-1.5">
                            <span className="font-medium">Motivo: </span>{ev.rejection_reason}
                          </p>
                        )}
                        {isRejected && personalPhone && (
                          <a
                            href={`https://wa.me/55${personalPhone}?text=${encodeURIComponent(`Olá! Minha solicitação de aula presencial para ${formatDate(ev.event_date)} às ${formatTime(ev.start_time) ?? ''} não foi confirmada. Podemos conversar?`)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
                          >
                            <MessageCircle size={11} /> Entrar em contato via WhatsApp
                          </a>
                        )}

                        {/* Notas */}
                        {ev.notes && (
                          <p className="text-xs text-text-secondary/70 border-t border-surface-border/30 pt-2">
                            {ev.notes}
                          </p>
                        )}

                        {/* Status badge para eventos normais */}
                        {ev.status === 'completed' && (
                          <span className="text-xs text-emerald-400 flex items-center gap-1">
                            <CheckCircle2 size={11} /> Concluído
                          </span>
                        )}
                        {ev.status === 'cancelled' && (
                          <span className="text-xs text-text-secondary/50">Cancelado</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          ) : (
            <div className="bg-surface border border-surface-border rounded-xl p-6 text-center">
              <CalendarDays size={28} className="text-text-secondary/30 mx-auto mb-2" />
              <p className="text-sm text-text-secondary">
                Clique em um dia para ver seus eventos.
              </p>
            </div>
          )}

          {/* Resumo do mês */}
          {!selectedDate && events.length > 0 && (
            <div className="bg-surface border border-surface-border rounded-xl p-4 space-y-2 mt-2">
              <h3 className="text-xs font-body font-semibold text-text-secondary uppercase tracking-widest mb-3">
                Este mês
              </h3>
              {(() => {
                const scheduled = events.filter(e => e.status === 'scheduled').length
                const pending   = events.filter(e => e.status === 'pending_confirmation').length
                const total     = events.length
                return (
                  <>
                    {pending > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-amber-400 flex items-center gap-1.5">
                          <AlertCircle size={12} /> Aguardando confirmação
                        </span>
                        <span className="font-medium text-amber-400">{pending}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-secondary">Confirmados</span>
                      <span className="font-medium text-brand-lime">{scheduled}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm border-t border-surface-border pt-2">
                      <span className="text-text-secondary">Total de eventos</span>
                      <span className="font-medium text-text-primary">{total}</span>
                    </div>
                  </>
                )
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
