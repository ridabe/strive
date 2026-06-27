'use client'

import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Clock, Loader2, X, ChevronDown, ChevronUp, Search } from 'lucide-react'
import { createStudentPresencialRequest } from '@/app/actions/agenda'

function maskCep(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 8)
  if (digits.length > 5) return `${digits.slice(0, 5)}-${digits.slice(5)}`
  return digits
}

interface ViaCepResult {
  logradouro: string
  bairro: string
  localidade: string
  uf: string
  erro?: boolean
}

export function AgendaRequestForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Campos do formulário
  const [eventDate, setEventDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [cep, setCep]             = useState('')
  const [logradouro, setLogradouro] = useState('')
  const [numero, setNumero]         = useState('')
  const [complemento, setComplemento] = useState('')
  const [bairro, setBairro]         = useState('')
  const [cidade, setCidade]         = useState('')
  const [uf, setUf]                 = useState('')
  const [notes, setNotes]           = useState('')
  const [cepLoading, setCepLoading] = useState(false)
  const [cepError, setCepError]     = useState<string | null>(null)

  const handleCepChange = useCallback(async (raw: string) => {
    const masked = maskCep(raw)
    setCep(masked)
    setCepError(null)

    const digits = masked.replace(/\D/g, '')
    if (digits.length === 8) {
      setCepLoading(true)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
        const data: ViaCepResult = await res.json()
        if (data.erro) {
          setCepError('CEP não encontrado')
        } else {
          setLogradouro(data.logradouro ?? '')
          setBairro(data.bairro ?? '')
          setCidade(data.localidade ?? '')
          setUf(data.uf ?? '')
        }
      } catch {
        setCepError('Erro ao buscar CEP')
      } finally {
        setCepLoading(false)
      }
    }
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!eventDate || !startTime) {
      setError('Data e horário são obrigatórios.')
      return
    }
    if (!cep || cep.replace(/\D/g, '').length < 8) {
      setError('CEP inválido.')
      return
    }
    if (!logradouro || !numero) {
      setError('Endereço completo (logradouro e número) é obrigatório.')
      return
    }

    const location = [
      `${logradouro}, ${numero}`,
      complemento ? complemento : null,
      bairro,
      cidade && uf ? `${cidade}/${uf}` : cidade || uf,
    ].filter(Boolean).join(', ')

    startTransition(async () => {
      try {
        await createStudentPresencialRequest({
          event_date:  eventDate,
          start_time:  startTime,
          location,
          address_cep: cep,
          notes:       notes || null,
        })
        setSuccess(true)
        setOpen(false)
        // Resetar
        setEventDate(''); setStartTime(''); setCep(''); setLogradouro('')
        setNumero(''); setComplemento(''); setBairro(''); setCidade(''); setUf('')
        setNotes('')
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erro ao enviar solicitação')
      }
    })
  }

  return (
    <div className="space-y-3">
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3 flex items-start justify-between gap-3">
          <p className="text-sm text-emerald-400">
            Solicitação enviada! Aguarde a confirmação do seu personal.
          </p>
          <button onClick={() => setSuccess(false)}>
            <X size={14} className="text-text-secondary" />
          </button>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-sm text-blue-400 font-medium hover:bg-blue-500/15 transition-colors"
      >
        <span className="flex items-center gap-2">
          <MapPin size={16} /> Solicitar aula presencial
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <form
          onSubmit={handleSubmit}
          className="bg-surface border border-surface-border rounded-xl p-4 space-y-4"
        >
          <p className="text-xs text-text-secondary">
            Preencha os dados e envie a solicitação. Seu personal precisará confirmar antes de aparecer como agendado.
          </p>

          {/* Data e Hora */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1">Data *</label>
              <input
                type="date"
                value={eventDate}
                onChange={e => setEventDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
                className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-lime/50"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1 flex items-center gap-1">
                <Clock size={11} /> Horário *
              </label>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                required
                className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-lime/50"
              />
            </div>
          </div>

          {/* CEP */}
          <div>
            <label className="block text-xs text-text-secondary mb-1">CEP *</label>
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

          {/* Logradouro + Número */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs text-text-secondary mb-1">Logradouro *</label>
              <input
                type="text"
                value={logradouro}
                onChange={e => setLogradouro(e.target.value)}
                placeholder="Rua, Av., etc."
                required
                className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/50"
              />
            </div>
            <div>
              <label className="block text-xs text-text-secondary mb-1">Número *</label>
              <input
                type="text"
                value={numero}
                onChange={e => setNumero(e.target.value)}
                placeholder="123"
                required
                className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/50"
              />
            </div>
          </div>

          {/* Complemento */}
          <div>
            <label className="block text-xs text-text-secondary mb-1">Complemento</label>
            <input
              type="text"
              value={complemento}
              onChange={e => setComplemento(e.target.value)}
              placeholder="Apto, Bloco, etc. (opcional)"
              className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/50"
            />
          </div>

          {/* Bairro + Cidade/UF */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-text-secondary mb-1">Bairro</label>
              <input
                type="text"
                value={bairro}
                onChange={e => setBairro(e.target.value)}
                placeholder="Bairro"
                className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/50"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <label className="block text-xs text-text-secondary mb-1">Cidade</label>
                <input
                  type="text"
                  value={cidade}
                  onChange={e => setCidade(e.target.value)}
                  placeholder="Cidade"
                  className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/50"
                />
              </div>
              <div>
                <label className="block text-xs text-text-secondary mb-1">UF</label>
                <input
                  type="text"
                  value={uf}
                  onChange={e => setUf(e.target.value.toUpperCase().slice(0, 2))}
                  placeholder="SP"
                  maxLength={2}
                  className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/50"
                />
              </div>
            </div>
          </div>

          {/* Observações */}
          <div>
            <label className="block text-xs text-text-secondary mb-1">Observações</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Algum detalhe adicional para o personal..."
              className="w-full bg-background border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/50 resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="flex-1 px-4 py-2.5 text-sm text-text-secondary border border-surface-border rounded-lg hover:border-text-secondary/30 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-background bg-blue-500 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending ? <Loader2 size={14} className="animate-spin" /> : null}
              Enviar Solicitação
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
