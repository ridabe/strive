'use client'

import { useState, useTransition } from 'react'
import { addCustomField, toggleCustomField } from '@/app/actions/anamnese'
import { Plus, Eye, EyeOff } from 'lucide-react'

type FieldType = 'text' | 'textarea' | 'boolean' | 'select' | 'number'

interface CustomField {
  id: string
  label: string
  field_key: string
  field_type: FieldType
  category: string
  required: boolean
  is_active: boolean
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text',     label: 'Texto curto'   },
  { value: 'textarea', label: 'Texto longo'   },
  { value: 'boolean',  label: 'Sim / Não'     },
  { value: 'select',   label: 'Lista de opções'},
  { value: 'number',   label: 'Número'        },
]

const CATEGORIES = [
  { value: 'saude',       label: 'Saúde Geral'           },
  { value: 'historico',   label: 'Histórico de Atividade' },
  { value: 'objetivos',   label: 'Objetivos'              },
  { value: 'habitos',     label: 'Hábitos de Vida'        },
  { value: 'alimentacao', label: 'Histórico Alimentar'    },
  { value: 'outros',      label: 'Outros'                 },
]

/**
 * Renderiza o CRUD de campos personalizados com foco em uso operacional no mobile.
 */
export function CustomFieldsClient({ fields }: { fields: CustomField[] }) {
  const [items, setItems] = useState(fields)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldType, setFieldType] = useState<FieldType>('text')
  const [isPending, startTransition] = useTransition()

  function handleToggle(fieldId: string, current: boolean) {
    startTransition(async () => {
      const res = await toggleCustomField(fieldId, !current)
      if (!res?.error) {
        setItems((prev) =>
          prev.map((f) => (f.id === fieldId ? { ...f, is_active: !current } : f)),
        )
      }
    })
  }

  function handleAdd(formData: FormData) {
    startTransition(async () => {
      setError(null)
      const res = await addCustomField(formData)
      if (res?.error) {
        setError(res.error)
      } else {
        setShowForm(false)
        // Revalidation handled by server action — page will refresh
        window.location.reload()
      }
    })
  }

  const input =
    'w-full rounded-xl border border-surface-border bg-background px-3 py-3 text-sm text-text-primary transition-colors focus:outline-none focus:border-brand-lime/50'

  return (
    <div className="space-y-4">
      {/* Lista de campos */}
      {items.length === 0 ? (
        <div className="bg-surface border border-surface-border rounded-xl p-6 text-center text-sm text-text-secondary">
          Nenhum campo personalizado ainda. Adicione abaixo.
        </div>
      ) : (
        <div className="bg-surface border border-surface-border rounded-xl divide-y divide-surface-border overflow-hidden">
          {items.map((field) => (
            <div key={field.id} className="flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-body font-medium text-text-primary">{field.label}</p>
                <p className="text-xs text-text-secondary mt-0.5">
                  {FIELD_TYPES.find((t) => t.value === field.field_type)?.label} •{' '}
                  {CATEGORIES.find((c) => c.value === field.category)?.label}
                  {field.required && ' • obrigatório'}
                </p>
              </div>
              <button
                onClick={() => handleToggle(field.id, field.is_active)}
                disabled={isPending}
                className={`inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition-all disabled:opacity-50 sm:w-auto ${
                  field.is_active
                    ? 'text-status-success bg-status-success/10 border-status-success/20 hover:bg-status-success/20'
                    : 'text-text-secondary bg-background border-surface-border hover:border-brand-lime/30'
                }`}
              >
                {field.is_active ? <Eye size={11} /> : <EyeOff size={11} />}
                {field.is_active ? 'Ativo' : 'Inativo'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Formulário de adicionar campo */}
      {showForm ? (
        <form
          action={handleAdd}
          className="rounded-2xl border border-surface-border bg-surface p-4 space-y-4 sm:p-5"
        >
          <h3 className="font-body font-semibold text-sm text-text-primary">Novo campo personalizado</h3>

          {error && (
            <p className="text-sm text-status-error bg-status-error/10 border border-status-error/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Label do campo *</label>
              <input name="label" required className={input} placeholder="Ex: Histórico familiar" />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Chave interna * (sem espaços)</label>
              <input name="field_key" required className={input} placeholder="historico_familiar" pattern="[a-z0-9_]+" />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Tipo</label>
              <select
                name="field_type"
                value={fieldType}
                onChange={(e) => setFieldType(e.target.value as FieldType)}
                className={input}
              >
                {FIELD_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">Categoria</label>
              <select name="category" className={input}>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {fieldType === 'select' && (
            <div className="space-y-1">
              <label className="text-xs text-text-secondary">
                Opções (separadas por vírgula ou JSON array)
              </label>
              <input
                name="options"
                className={input}
                placeholder='Opção 1, Opção 2, Opção 3  ou  ["Opção 1","Opção 2"]'
              />
            </div>
          )}

          <label className="flex min-h-11 items-center gap-3 rounded-xl border border-surface-border bg-background px-3 py-2.5">
            <input type="checkbox" id="required" name="required" value="true" className="accent-brand-lime" />
            <span className="text-sm text-text-primary">Campo obrigatório</span>
          </label>

          <p className="text-xs text-text-secondary">
            Use nomes curtos e claros para facilitar o preenchimento no celular.
          </p>

          <div className="flex flex-col gap-3 pt-1 sm:flex-row">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-brand-lime px-4 py-2.5 text-sm font-body font-semibold text-background transition-colors hover:bg-brand-lime/90 disabled:opacity-50"
            >
              {isPending ? 'Salvando…' : 'Adicionar campo'}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setError(null) }}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-surface-border px-3 py-2.5 text-sm text-text-secondary transition-colors hover:text-text-primary"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-brand-lime/30 bg-brand-lime/5 px-4 py-2.5 text-sm font-medium text-brand-lime transition-colors hover:bg-brand-lime/10"
        >
          <Plus size={14} />
          Adicionar campo personalizado
        </button>
      )}
    </div>
  )
}
