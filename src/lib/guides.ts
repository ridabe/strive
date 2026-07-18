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
} as const satisfies Record<string, GuideContent>

export type GuideKey = keyof typeof GUIDES
