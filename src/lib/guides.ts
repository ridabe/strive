// Registro central de conteúdo dos guias contextuais ("Guia do Max") por tela.
// Para uma nova tela, basta adicionar uma chave nova aqui e chamar useGuide(chave) na tela.

export type GuideSection = {
  heading: string
  body: string
}

export type GuideContent = {
  title: string
  intro: string
  sections: GuideSection[]
}

export const GUIDES = {
  routine_builder: {
    title: 'Como montar uma rotina',
    intro: 'Monte o treino do seu aluno exercício por exercício, e combine séries quando fizer sentido.',
    sections: [
      {
        heading: 'Adicionar exercícios',
        body: 'Toque em "+ Exercício" para abrir a busca. Filtre por grupo muscular e marque quantos quiser antes de confirmar — todos entram de uma vez, sem fechar a tela a cada exercício.',
      },
      {
        heading: 'Bi-Série / Tri-Série',
        body: 'Marque o checkbox de 2 ou mais exercícios e toque em "Combinar". Eles passam a ser executados em sequência pelo aluno, sem descanso entre si — o descanso só acontece depois do último exercício da rodada.',
      },
      {
        heading: 'Recombinar ou desfazer',
        body: 'No cabeçalho de um grupo combinado, use "Recombinar" para trocar quais exercícios fazem parte dele. Use o ícone de desfazer em cada item para tirá-lo do grupo individualmente.',
      },
      {
        heading: 'Dias da semana',
        body: 'Marque os dias em que a rotina deve aparecer para o aluno, ou deixe como "Dia livre" para que ele escolha quando treinar.',
      },
    ],
  },
  faturas_cobranca: {
    title: 'Como cobrar seus alunos',
    intro: 'Sem gateway de pagamento — o aluno paga da forma que voces combinarem (PIX, dinheiro, cartão) e você dá baixa manualmente. Existem dois jeitos de cobrar, escolha o que fizer mais sentido pra cada aluno.',
    sections: [
      {
        heading: 'Mensalidade recorrente',
        body: 'Ideal pra aluno que paga todo mês, sem prazo definido. Defina o valor e o dia do vencimento uma vez, e a cobrança do mês é gerada sozinha, sempre que você abre o Financeiro.',
      },
      {
        heading: 'Pacote de meses',
        body: 'Ideal pra aluno que já fechou um período fixo (ex: 6 meses de plano). Todas as parcelas são geradas de uma vez, na hora. Você dá baixa mês a mês normalmente, e só é avisado para renovar quando o pacote inteiro for quitado.',
      },
      {
        heading: 'Dando baixa',
        body: 'Na lista de cobranças, toque em "Dar baixa" e escolha a forma de pagamento. Se marcar por engano, use "Desfazer" a qualquer momento.',
      },
      {
        heading: 'Adicionar na agenda',
        body: 'Ao criar a cobrança, marque "Adicionar vencimentos na agenda" para que cada mês apareça também na sua agenda e na do aluno — é opcional, fica desmarcado por padrão.',
      },
    ],
  },
} as const satisfies Record<string, GuideContent>

export type GuideKey = keyof typeof GUIDES
