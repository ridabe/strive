import { redirect } from 'next/navigation'
import { Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { getActiveStudentRow } from '@/lib/supabase/student-context'
import { StudentMessagesClient } from './student-messages-client'

/**
 * Carrega a inbox do aluno no web com base na mesma tabela usada pelo app mobile.
 */
export default async function StudentMessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const student = await getActiveStudentRow(supabase, user.id)

  if (!student) redirect('/student')

  const { data: messages } = await supabase
    .from('student_messages')
    .select('id, title, message, created_at, read_at, message_type')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-3xl space-y-6 p-5 md:p-8">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-400/10 text-violet-300">
          <Bell size={18} />
        </div>
        <div>
          <h1 className="font-display text-xl font-bold uppercase tracking-widest text-text-primary">
            Mensagens do Personal
          </h1>
          <p className="mt-0.5 text-sm text-text-secondary">
            Veja recados enviados pelo seu personal, marque como lido ao abrir e limpe sua tela quando quiser.
          </p>
        </div>
      </div>

      <StudentMessagesClient
        studentId={student.id}
        initialMessages={(messages ?? []) as Parameters<typeof StudentMessagesClient>[0]['initialMessages']}
      />
    </div>
  )
}
