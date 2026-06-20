import Link from 'next/link'
import { Globe } from 'lucide-react'
import { ExerciseForm } from '@/components/exercises/exercise-form'

export default function AdminNovoExercicioPage() {
  return (
    <div className="p-6 md:p-8 space-y-6 max-w-2xl">
      <div className="flex items-center gap-2 text-sm text-text-secondary">
        <Link href="/admin/banco-de-exercicios" className="hover:text-text-primary transition-colors">
          Banco de Exercícios
        </Link>
        <span>/</span>
        <span className="text-text-primary">Novo exercício global</span>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <Globe size={16} className="text-brand-lime" />
          <span className="text-xs text-brand-lime font-medium uppercase tracking-widest">Exercício Global</span>
        </div>
        <h1 className="font-display text-2xl font-bold text-text-primary uppercase tracking-widest">
          Novo Exercício
        </h1>
        <p className="text-text-secondary text-sm mt-1">
          Será disponibilizado para todos os personal trainers da plataforma
        </p>
      </div>

      <ExerciseForm
        isGlobal={true}
        redirectTo="/admin/banco-de-exercicios"
      />
    </div>
  )
}
