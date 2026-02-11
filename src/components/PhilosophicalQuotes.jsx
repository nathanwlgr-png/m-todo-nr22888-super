// Frases Filosóficas - Platão, Sócrates, Estoicos e Grandes Pensadores
export const PHILOSOPHICAL_QUOTES = [
  // Platão
  "A necessidade é a mãe da invenção. - Platão",
  "O preço que os bons pagam pela indiferença aos assuntos públicos é serem governados pelos maus. - Platão",
  "Sábio é aquele que conhece os limites da própria ignorância. - Platão",
  "A direção em que a educação de um homem o inicia determinará seu futuro. - Platão",
  "A medida do homem é o que ele faz com o poder. - Platão",
  "O que é honrado é também o que é útil. - Platão",
  "Não espere por oportunidades extraordinárias. Aproveite as ocasiões comuns e torne-as grandes. - Platão",
  
  // Sócrates
  "Só sei que nada sei. - Sócrates",
  "Uma vida sem desafios não vale a pena ser vivida. - Sócrates",
  "O segredo da mudança é focar toda a sua energia não em lutar contra o velho, mas em construir o novo. - Sócrates",
  "A verdadeira sabedoria vem a cada um de nós quando percebemos quão pouco entendemos sobre a vida. - Sócrates",
  "Conhece-te a ti mesmo. - Sócrates",
  "A única verdadeira sabedoria é saber que você nada sabe. - Sócrates",
  "Aquele que não está satisfeito com o que tem não estará satisfeito com o que quer ter. - Sócrates",
  
  // Marco Aurélio (Estoicismo)
  "Você tem poder sobre sua mente, não sobre eventos externos. Perceba isso e encontrará força. - Marco Aurélio",
  "A felicidade da sua vida depende da qualidade dos seus pensamentos. - Marco Aurélio",
  "O melhor modo de se vingar de um inimigo é não imitá-lo. - Marco Aurélio",
  "Não desperdice mais tempo discutindo o que um homem bom deveria ser. Seja um. - Marco Aurélio",
  "O impedimento à ação avança a ação. O que fica no caminho se torna o caminho. - Marco Aurélio",
  "Cada dia provê sua própria dádiva. - Marco Aurélio",
  "Faça cada ato de sua vida como se fosse o último. - Marco Aurélio",
  
  // Sêneca (Estoicismo)
  "A sorte é o que acontece quando a preparação encontra a oportunidade. - Sêneca",
  "Não porque as coisas são difíceis que nós não ousamos; é porque não ousamos que elas são difíceis. - Sêneca",
  "O importante não é o que suportamos, mas como suportamos. - Sêneca",
  "Não temos controle sobre o que acontece conosco, mas temos controle sobre como reagimos. - Sêneca",
  "A vida é longa se você souber como usá-la. - Sêneca",
  "Enquanto você vive, continue aprendendo a viver. - Sêneca",
  "Nenhum vento favorece quem não sabe aonde ir. - Sêneca",
  
  // Epicteto (Estoicismo)
  "Não são as coisas que perturbam os homens, mas as opiniões sobre as coisas. - Epicteto",
  "A riqueza consiste não em ter grandes posses, mas em ter poucas necessidades. - Epicteto",
  "É impossível para um homem aprender aquilo que ele acha que já sabe. - Epicteto",
  "Primeiro, diga a si mesmo o que você gostaria de ser; depois faça o que tem que fazer. - Epicteto",
  "Nenhum grande feito foi alcançado sem entusiasmo. - Epicteto",
  
  // Aristóteles
  "Nós somos o que repetidamente fazemos. A excelência, portanto, não é um ato, mas um hábito. - Aristóteles",
  "A qualidade não é um ato, é um hábito. - Aristóteles",
  "O homem é por natureza um animal social. - Aristóteles",
  "A educação tem raízes amargas, mas seus frutos são doces. - Aristóteles",
  "O todo é maior que a soma de suas partes. - Aristóteles",
  
  // Confúcio
  "Não importa o quão devagar você vá, desde que não pare. - Confúcio",
  "O homem que move uma montanha começa carregando pequenas pedras. - Confúcio",
  "Nossa maior glória não está em nunca cair, mas em levantar toda vez que caímos. - Confúcio",
  "Quando é óbvio que os objetivos não podem ser alcançados, não ajuste os objetivos, ajuste os passos de ação. - Confúcio",
  
  // Sun Tzu
  "Oportunidades se multiplicam à medida que são agarradas. - Sun Tzu",
  "No meio do caos, também reside a oportunidade. - Sun Tzu",
  "Vitórias são planejadas na estratégia, não no campo de batalha. - Sun Tzu",
  "Conheça seu inimigo e conheça a si mesmo e você nunca será derrotado. - Sun Tzu",
  
  // Benjamin Franklin
  "O investimento em conhecimento é o que paga os melhores juros. - Benjamin Franklin",
  "Diga-me e eu esqueço, ensina-me e eu lembro, envolve-me e eu aprendo. - Benjamin Franklin",
  "Bem feito é melhor que bem dito. - Benjamin Franklin",
  
  // Ralph Waldo Emerson
  "O que está à nossa frente e o que está atrás de nós é insignificante comparado ao que está dentro de nós. - Emerson",
  "Escreva na sua alma que cada dia é o melhor dia do ano. - Emerson",
  
  // Lao Tzu
  "A jornada de mil milhas começa com um único passo. - Lao Tzu",
  "Conhecer os outros é inteligência; conhecer a si mesmo é verdadeira sabedoria. - Lao Tzu",
  "Aquele que conhece os outros é sábio; aquele que conhece a si mesmo é iluminado. - Lao Tzu",
  
  // Outros Filósofos
  "A persistência é o caminho do êxito. - Charles Chaplin",
  "O sucesso não é final, o fracasso não é fatal: é a coragem de continuar que conta. - Winston Churchill",
  "A melhor maneira de prever o futuro é criá-lo. - Peter Drucker",
  "Você perde 100% das chances que não aproveita. - Wayne Gretzky",
  "A única maneira de fazer um ótimo trabalho é amar o que você faz. - Steve Jobs",
  "Acredite que você pode e você já está no meio do caminho. - Theodore Roosevelt",
  "O sucesso é a soma de pequenos esforços repetidos dia após dia. - Robert Collier",
  "Não conte os dias, faça os dias contarem. - Muhammad Ali",
  "A ação é a chave fundamental para todo sucesso. - Pablo Picasso",
  "O pessimista vê dificuldade em cada oportunidade; o otimista vê oportunidade em cada dificuldade. - Winston Churchill"
];

export const getRandomQuote = () => {
  const randomIndex = Math.floor(Math.random() * PHILOSOPHICAL_QUOTES.length);
  return PHILOSOPHICAL_QUOTES[randomIndex];
};

export const getQuoteForNathan = () => {
  return `\n\n${getRandomQuote()}\n🎯 Continue conquistando, Nathan!`;
};

// Função para adicionar frase em qualquer resposta
export const addPhilosophicalEnding = (message) => {
  return `${message}\n\n${getRandomQuote()}\n🎯 Continue conquistando, Nathan!`;
};