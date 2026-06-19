import Link from 'next/link'
import { LogoHorizontal } from '@/components/logo'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Uso — Strive Personal',
}

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Nav */}
      <nav className="border-b border-surface-border px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <Link href="/">
            <LogoHorizontal size="sm" />
          </Link>
          <Link href="/" className="text-sm font-body text-text-secondary hover:text-text-primary transition-colors">
            ← Voltar ao início
          </Link>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-6 py-12">
        <header className="mb-10">
          <p className="font-body text-brand-lime text-xs font-semibold uppercase tracking-[0.25em] mb-3">Legal</p>
          <h1 className="font-display font-bold text-3xl sm:text-4xl text-text-primary uppercase tracking-tight mb-4">
            Termos de Uso
          </h1>
          <p className="font-body text-text-secondary text-sm">
            Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </header>

        <div className="prose-custom space-y-8 font-body text-text-secondary leading-relaxed">

          <Section title="1. Aceitação dos Termos">
            <p>
              Ao acessar e utilizar a plataforma <strong className="text-text-primary">Strive Personal</strong> ("Plataforma"),
              você concorda com estes Termos de Uso. Caso não concorde com qualquer parte destes termos,
              não utilize a Plataforma.
            </p>
          </Section>

          <Section title="2. Descrição do Serviço">
            <p>
              A Strive Personal é uma plataforma SaaS destinada a personal trainers e profissionais de educação física
              para gestão de alunos, prescrição de treinos, acompanhamento de evolução e controle financeiro.
            </p>
            <p className="mt-3">
              O serviço inclui acesso ao painel web para o profissional e ao aplicativo mobile para os alunos cadastrados.
            </p>
          </Section>

          <Section title="3. Cadastro e Conta">
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Você deve fornecer informações verdadeiras, precisas e completas no cadastro.</li>
              <li>É sua responsabilidade manter a confidencialidade da sua senha e conta.</li>
              <li>Você é responsável por todas as atividades realizadas com sua conta.</li>
              <li>Notifique-nos imediatamente em caso de uso não autorizado da sua conta.</li>
            </ul>
          </Section>

          <Section title="4. Uso Permitido">
            <p>Você concorda em usar a Plataforma somente para fins lícitos e de acordo com estes Termos. É expressamente proibido:</p>
            <ul className="list-disc list-inside space-y-2 mt-2">
              <li>Usar a Plataforma para qualquer finalidade ilegal ou não autorizada;</li>
              <li>Transmitir vírus, malware ou qualquer código malicioso;</li>
              <li>Tentar obter acesso não autorizado a sistemas ou redes;</li>
              <li>Reproduzir, duplicar ou revender qualquer parte da Plataforma sem autorização expressa;</li>
              <li>Coletar informações pessoais de outros usuários sem consentimento.</li>
            </ul>
          </Section>

          <Section title="5. Dados dos Alunos e LGPD">
            <p>
              Como personal trainer, ao cadastrar dados de seus alunos na Plataforma, você atua como
              <strong className="text-text-primary"> Controlador de Dados</strong> nos termos da Lei Geral de Proteção de
              Dados (Lei nº 13.709/2018). A Strive Personal atua como <strong className="text-text-primary">Operadora de Dados</strong>.
            </p>
            <p className="mt-3">
              Você é responsável por obter o consentimento dos seus alunos para o processamento de seus dados pessoais
              e por informá-los sobre o uso da plataforma.
            </p>
          </Section>

          <Section title="6. Propriedade Intelectual">
            <p>
              Todo o conteúdo da Plataforma, incluindo mas não se limitando a textos, gráficos, logotipos,
              ícones, imagens e software, é de propriedade da Strive Personal ou de seus licenciadores
              e está protegido pelas leis de propriedade intelectual aplicáveis.
            </p>
          </Section>

          <Section title="7. Limitação de Responsabilidade">
            <p>
              A Strive Personal não será responsável por quaisquer danos indiretos, incidentais, especiais,
              consequenciais ou punitivos, incluindo perda de lucros, dados ou goodwill, resultantes do
              uso ou incapacidade de uso da Plataforma.
            </p>
          </Section>

          <Section title="8. Disponibilidade do Serviço">
            <p>
              Nos esforçamos para manter a Plataforma disponível 24 horas por dia, 7 dias por semana.
              No entanto, não garantimos disponibilidade ininterrupta e podemos suspender o serviço
              para manutenção sem aviso prévio quando necessário.
            </p>
          </Section>

          <Section title="9. Cancelamento e Encerramento">
            <p>
              Você pode cancelar sua conta a qualquer momento. Ao cancelar, você perderá acesso à
              Plataforma. Podemos suspender ou encerrar sua conta em caso de violação destes Termos.
            </p>
          </Section>

          <Section title="10. Modificações dos Termos">
            <p>
              Reservamo-nos o direito de modificar estes Termos a qualquer momento. As alterações
              entrarão em vigor após publicação na Plataforma. O uso continuado após as alterações
              constitui aceitação dos novos termos.
            </p>
          </Section>

          <Section title="11. Lei Aplicável e Foro">
            <p>
              Estes Termos são regidos pelas leis da República Federativa do Brasil. Qualquer
              disputa será resolvida no foro da Comarca de São Paulo, Estado de São Paulo,
              com exclusão de qualquer outro.
            </p>
          </Section>

          <Section title="12. Contato">
            <p>
              Para dúvidas sobre estes Termos, entre em contato conosco pelo e-mail:{' '}
              <a href="mailto:juridico@strivepersonal.com.br" className="text-brand-lime hover:underline">
                juridico@strivepersonal.com.br
              </a>
            </p>
          </Section>
        </div>
      </main>

      <footer className="border-t border-surface-border py-8 px-6 mt-12">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-sm font-body text-text-secondary/50">
          <Link href="/privacidade" className="hover:text-text-secondary transition-colors">
            Política de Privacidade
          </Link>
          <span>© {new Date().getFullYear()} Strive Personal</span>
        </div>
      </footer>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display font-bold text-lg text-text-primary uppercase tracking-wide mb-3">
        {title}
      </h2>
      {children}
    </section>
  )
}
