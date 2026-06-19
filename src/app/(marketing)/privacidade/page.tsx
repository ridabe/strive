import Link from 'next/link'
import { LogoHorizontal } from '@/components/logo'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Política de Privacidade — Strive Personal',
}

export default function PrivacidadePage() {
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
            Política de Privacidade
          </h1>
          <p className="font-body text-text-secondary text-sm">
            Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </header>

        <div className="space-y-8 font-body text-text-secondary leading-relaxed">

          <Section title="1. Introdução">
            <p>
              A <strong className="text-text-primary">Strive Personal</strong> ("nós", "nosso" ou "Plataforma")
              está comprometida com a proteção da privacidade dos seus dados pessoais. Esta Política de
              Privacidade explica como coletamos, usamos, compartilhamos e protegemos suas informações,
              em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).
            </p>
          </Section>

          <Section title="2. Dados que Coletamos">
            <p className="mb-3">Coletamos os seguintes tipos de dados:</p>
            <div className="space-y-4">
              <div>
                <h3 className="text-text-primary font-semibold text-sm mb-1">2.1 Dados de Cadastro</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Nome completo e e-mail</li>
                  <li>Número de telefone (opcional)</li>
                  <li>CREF (para personal trainers)</li>
                  <li>Dados de pagamento (processados por terceiros)</li>
                </ul>
              </div>
              <div>
                <h3 className="text-text-primary font-semibold text-sm mb-1">2.2 Dados de Uso</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Logs de acesso e atividade na Plataforma</li>
                  <li>Endereço IP e informações do dispositivo</li>
                  <li>Cookies e tecnologias similares</li>
                </ul>
              </div>
              <div>
                <h3 className="text-text-primary font-semibold text-sm mb-1">2.3 Dados dos Alunos (inseridos pelo Personal)</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Nome, e-mail e telefone dos alunos</li>
                  <li>Dados de saúde (anamnese, medidas corporais)</li>
                  <li>Histórico de treinos e evolução</li>
                </ul>
              </div>
            </div>
          </Section>

          <Section title="3. Como Usamos seus Dados">
            <ul className="list-disc list-inside space-y-2">
              <li>Fornecer e melhorar os serviços da Plataforma</li>
              <li>Autenticar e gerenciar sua conta</li>
              <li>Processar pagamentos e emitir faturas</li>
              <li>Enviar comunicações sobre a Plataforma (com seu consentimento)</li>
              <li>Cumprir obrigações legais e regulatórias</li>
              <li>Prevenir fraudes e garantir a segurança</li>
            </ul>
          </Section>

          <Section title="4. Base Legal para o Tratamento">
            <p className="mb-3">Tratamos seus dados com base nas seguintes hipóteses legais (art. 7º da LGPD):</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong className="text-text-primary">Execução de contrato:</strong> para fornecer os serviços contratados</li>
              <li><strong className="text-text-primary">Consentimento:</strong> para comunicações de marketing</li>
              <li><strong className="text-text-primary">Interesse legítimo:</strong> para segurança e prevenção a fraudes</li>
              <li><strong className="text-text-primary">Obrigação legal:</strong> para cumprimento de normas aplicáveis</li>
            </ul>
          </Section>

          <Section title="5. Compartilhamento de Dados">
            <p className="mb-3">Podemos compartilhar seus dados com:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong className="text-text-primary">Supabase:</strong> infraestrutura de banco de dados e autenticação</li>
              <li><strong className="text-text-primary">Processadores de pagamento:</strong> para cobrança dos planos</li>
              <li><strong className="text-text-primary">Autoridades competentes:</strong> quando exigido por lei</li>
            </ul>
            <p className="mt-3">Não vendemos seus dados pessoais a terceiros.</p>
          </Section>

          <Section title="6. Seus Direitos (LGPD)">
            <p className="mb-3">Você tem os seguintes direitos em relação aos seus dados:</p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong className="text-text-primary">Confirmação e acesso:</strong> saber se tratamos seus dados e acessá-los</li>
              <li><strong className="text-text-primary">Correção:</strong> corrigir dados incompletos, inexatos ou desatualizados</li>
              <li><strong className="text-text-primary">Anonimização ou exclusão:</strong> quando os dados forem desnecessários</li>
              <li><strong className="text-text-primary">Portabilidade:</strong> receber seus dados em formato estruturado</li>
              <li><strong className="text-text-primary">Revogação do consentimento:</strong> retirar consentimento a qualquer momento</li>
              <li><strong className="text-text-primary">Oposição:</strong> se opor ao tratamento em casos específicos</li>
            </ul>
            <p className="mt-3">
              Para exercer seus direitos, entre em contato:{' '}
              <a href="mailto:privacidade@strivepersonal.com.br" className="text-brand-lime hover:underline">
                privacidade@strivepersonal.com.br
              </a>
            </p>
          </Section>

          <Section title="7. Retenção de Dados">
            <p>
              Mantemos seus dados pelo tempo necessário para cumprir as finalidades descritas nesta
              Política, para cumprir obrigações legais ou pelo prazo de prescrição das obrigações
              relacionadas ao seu uso da Plataforma (mínimo 5 anos, conforme Código Civil Brasileiro).
            </p>
          </Section>

          <Section title="8. Segurança">
            <p>
              Adotamos medidas técnicas e organizacionais adequadas para proteger seus dados contra
              acesso não autorizado, perda, destruição ou alteração. A Plataforma utiliza criptografia
              TLS/SSL para transmissão de dados e armazenamento seguro via Supabase (AWS São Paulo - sa-east-1).
            </p>
          </Section>

          <Section title="9. Cookies">
            <p>
              Utilizamos cookies essenciais para o funcionamento da Plataforma (autenticação de sessão)
              e cookies analíticos (com seu consentimento) para melhorar a experiência. Você pode
              configurar seu navegador para recusar cookies, mas isso pode afetar o funcionamento da Plataforma.
            </p>
          </Section>

          <Section title="10. Dados de Menores">
            <p>
              A Plataforma não é destinada a menores de 18 anos. Não coletamos intencionalmente
              dados de menores. Se tomarmos conhecimento de que coletamos dados de um menor,
              excluiremos essas informações imediatamente.
            </p>
          </Section>

          <Section title="11. Encarregado de Dados (DPO)">
            <p>
              Nosso Encarregado de Proteção de Dados (Data Protection Officer) pode ser contactado em:{' '}
              <a href="mailto:dpo@strivepersonal.com.br" className="text-brand-lime hover:underline">
                dpo@strivepersonal.com.br
              </a>
            </p>
          </Section>

          <Section title="12. Alterações nesta Política">
            <p>
              Podemos atualizar esta Política periodicamente. Notificaremos sobre mudanças
              significativas por e-mail ou por aviso destacado na Plataforma. O uso continuado
              após as alterações constitui aceitação da nova Política.
            </p>
          </Section>
        </div>
      </main>

      <footer className="border-t border-surface-border py-8 px-6 mt-12">
        <div className="max-w-3xl mx-auto flex items-center justify-between text-sm font-body text-text-secondary/50">
          <Link href="/termos" className="hover:text-text-secondary transition-colors">
            Termos de Uso
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
