'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps {
  id: string
  name: string
  autoComplete?: string
  required?: boolean
  placeholder?: string
  minLength?: number
}

export function PasswordInput({ id, name, autoComplete, required, placeholder, minLength }: PasswordInputProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? 'text' : 'password'}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        placeholder={placeholder}
        className="w-full bg-background border border-surface-border rounded-lg pl-4 pr-11 py-3 text-sm text-text-primary placeholder:text-text-secondary/50 focus:outline-none focus:border-brand-lime/60 focus:ring-1 focus:ring-brand-lime/30 transition-colors"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary/60 hover:text-text-primary transition-colors"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}
