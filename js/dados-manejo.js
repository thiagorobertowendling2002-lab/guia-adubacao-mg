/*
 * Estratégias de manejo extraídas do manual, por cultura. Cada cartão cita a seção.
 * O texto é paráfrase curta do que o manual orienta; nada aqui é do autor do site.
 * A página é a do início da seção, como no Sumário do manual (CFSEMG, 1999).
 *
 * tema: solo | nutricao | planta | atencao
 * quando(plano): devolve um texto do laudo do usuário ou null; vira o selo "No seu laudo".
 */
(function (G) {
  'use strict';

  const F = {
    cafe: { sec: '18.4.6', pag: 289 },
    milho: { sec: '18.4.13', pag: 314 },
    feijao: { sec: '18.4.8', pag: 306 },
    frutas: { sec: '18.2.1', pag: 209 },
    banana: { sec: '18.2.4', pag: 217 },
    citros: { sec: '18.2.5', pag: 219 },
    mamao: { sec: '18.2.9', pag: 237 },
    manga: { sec: '18.2.10', pag: 239 },
    maracuja: { sec: '18.2.11', pag: 242 },
    pitaya: { obra: 'Cartilha Cultivo da Pitaya, Emater-MG (2023)', pag: 6 }
  };

  const fmt = (n) => (Math.round(n * 10) / 10).toString().replace('.', ',');

  const cafe = [
    {
      id: 'cafe-amostragem',
      tema: 'solo',
      titulo: 'Onde e quando colher a amostra',
      texto:
        'Antes de plantar, colha de 0 a 20 cm e de 20 a 40 cm na mesma perfuração: a de baixo mostra a acidez do subsolo. Em lavoura formada, colha sob a copa, de 0 a 20 cm, todo ano, pelo menos 60 dias depois da última adubação. A cada 4 anos, colha também no meio da rua e de 20 a 40 cm sob a copa.',
      fonte: F.cafe
    },
    {
      id: 'cafe-calagem-modo',
      tema: 'solo',
      titulo: 'Calcário em faixa ou na área toda',
      texto:
        'Em lavoura nova ou de espaçamento largo, aplique o calcário em faixa sob a copa, onde estão quase todas as raízes e a acidez é maior. Em lavoura adensada, espalhe na superfície toda. Ao plantar, incorpore o mais fundo possível. Em área acidentada, ponha o calcário na cova e numa faixa de plantio que alarga conforme o café cresce.',
      fonte: F.cafe
    },
    {
      id: 'cafe-gesso',
      tema: 'solo',
      titulo: 'Gesso quando o calcário não desce',
      texto:
        'Em lavoura já formada não dá para incorporar o calcário. O gesso indicado leva cálcio para baixo e melhora o ambiente das raízes. Vale quando a camada de 20 a 40 cm tem cálcio de 0,4 ou menos, alumínio acima de 0,5 ou m acima de 30%.',
      fonte: F.cafe,
      quando: (p) => (p.gesso && p.gesso.indicado ? 'O gesso está indicado para o seu subsolo.' : null)
    },
    {
      id: 'cafe-corretiva',
      tema: 'solo',
      titulo: 'Adubação corretiva antes de plantar',
      texto:
        'Em solo de baixa fertilidade ou plantio adensado, o manual propõe corrigir antes: calagem, gesso, fósforo, potássio e micronutrientes. Depois vem uma adubação verde com leguminosa, incorporada no florescimento, e só então o sulco e o plantio das mudas.',
      fonte: F.cafe
    },
    {
      id: 'cafe-parcelar',
      tema: 'nutricao',
      titulo: 'Parcelar de outubro a março',
      texto:
        'Divida N e K em 3 a 4 aplicações no período chuvoso, com 40 a 60 dias entre elas; em solo arenoso, divida em mais vezes. Todo o fósforo vai na primeira aplicação. Espalhe entre o caule e a ponta dos ramos, ou em sulco sob a copa.',
      fonte: F.cafe
    },
    {
      id: 'cafe-foliar-n',
      tema: 'nutricao',
      titulo: 'Acertar o nitrogênio pela folha',
      texto:
        'Em dezembro, no chumbinho, colha folhas e veja o teor de N. Ele ajusta as duas coberturas seguintes. Se, depois da segunda aplicação, o teor já estiver em 3,5 dag/kg ou mais, cancele a terceira ou a quarta.',
      fonte: F.cafe
    },
    {
      id: 'cafe-enxofre',
      tema: 'nutricao',
      titulo: 'Enxofre',
      texto:
        'Se as fontes de nitrogênio e de fósforo não trouxerem enxofre, aplique enxofre na proporção de um oitavo da dose de N. Ureia e superfosfato triplo não levam; sulfato de amônio e superfosfato simples levam.',
      fonte: F.cafe,
      quando: (p) => (p.adubacao && p.adubacao.producao ? `Para a sua dose de N, isso dá ${fmt(p.adubacao.producao.S)} kg/ha de S por ano.` : null)
    },
    {
      id: 'cafe-organico',
      tema: 'nutricao',
      titulo: 'Adubo orgânico na cova',
      texto:
        'Por cova: esterco de curral de 3 a 5 kg (7 a 15 L), esterco de galinha de 1 a 2 kg, torta de mamona de 0,5 a 1 kg ou palha de café de 1 a 2 kg. Para um metro de sulco, multiplique por 2,5. Fora o esterco de curral, espere 30 a 60 dias entre encher a cova e plantar. A palha de café não deve ser enterrada.',
      fonte: F.cafe
    },
    {
      id: 'cafe-micros',
      tema: 'nutricao',
      titulo: 'Boro, zinco, cobre e manganês',
      texto:
        'Boro: bórax ou ácido bórico no solo, sob a copa, no começo das chuvas. Zinco: em solo arenoso ou médio, no solo no começo das chuvas; em argiloso, nas folhas, de 2 a 4 vezes por ano. Cobre: os fungicidas cúpricos já fornecem. Manganês: nas folhas, de 2 a 4 vezes por ano.',
      fonte: F.cafe,
      quando: (p) => {
        const mi = p.adubacao && p.adubacao.producao && p.adubacao.producao.micros;
        if (!mi || !mi.length) return null;
        const falta = mi.filter((m) => m.dose_kg_ha > 0).map((m) => `${m.elemento} ${m.classe} (${m.dose_kg_ha} kg/ha)`);
        return falta.length ? `No seu laudo: ${falta.join(', ')}.` : 'No seu laudo, os micronutrientes informados estão em classe boa ou alta.';
      }
    },
    {
      id: 'cafe-bienalidade',
      tema: 'planta',
      titulo: 'Não adube pouco no ano fraco',
      texto:
        'Se a safra esperada num ano de baixa for menos da metade da do ano de alta anterior, adube pela média dos dois. Exemplo do manual: 65 sacas no ano forte e 22 no fraco dão 43, e a adubação vale para a faixa de 40 a 50 sacas. Adubar pouco no ano fraco acentua a bienalidade.',
      fonte: F.cafe
    },
    {
      id: 'cafe-poda',
      tema: 'planta',
      titulo: 'Depois da poda',
      texto:
        'Recepa e esqueletamento: no 1º ano depois da poda, siga a adubação do 2º ano, e dispense se a brotação for vigorosa. Do 2º ano em diante, siga a de lavoura em produção. Nas outras podas, siga a de produção. Brotações novas costumam faltar zinco: use adubo foliar.',
      fonte: F.cafe
    },
    {
      id: 'cafe-manganes',
      tema: 'atencao',
      titulo: 'Falta de manganês quase sempre é calagem demais',
      texto:
        'O manual avisa que deficiência de manganês, em nossas condições, quer dizer antes de tudo calagem mal feita, a supercalagem. Ferro faz o mesmo em solo adensado. Por isso não passe da dose de calcário.',
      fonte: F.cafe
    },
    {
      id: 'cafe-ctc',
      tema: 'atencao',
      titulo: 'CTC fora da faixa boa',
      texto:
        'Para o café, a CTC a pH 7 ideal fica entre 7 e 10 cmolc/dm³, com pH de 5,5 a 6,0. Fora disso, olhe a participação de cada base na CTC, não só o total de cada uma.',
      fonte: F.cafe,
      quando: (p) => {
        const T = p.solo.derivados.T;
        return T < 7 || T > 10 ? `A sua CTC a pH 7 é ${fmt(T)} cmolc/dm³, fora da faixa.` : null;
      }
    }
  ];

  const milho = [
    {
      id: 'milho-calagem',
      tema: 'solo',
      titulo: 'Calcário até saturação por bases de 60%',
      texto:
        'O manual manda corrigir pelo alumínio e pelo cálcio e magnésio, ou levar a saturação por bases a 60%, com pH perto de 6. Incorpore o calcário de 0 a 20 cm. Relação cálcio:magnésio abaixo de 3:1 prejudica o milho.',
      fonte: F.milho,
      quando: (p) => {
        const a = p.solo.a;
        if (!(a.Mg > 0)) return null;
        const r = a.Ca / a.Mg;
        return r < 3 ? `A sua relação cálcio:magnésio é ${fmt(r)}:1, abaixo de 3:1.` : null;
      }
    },
    {
      id: 'milho-n',
      tema: 'nutricao',
      titulo: 'Nitrogênio de cobertura com 6 a 8 folhas',
      texto:
        'Aplique no solo ou na água da irrigação quando a planta tiver de 6 a 8 folhas bem abertas. Ureia vai incorporada a uns 5 cm. Depois de soja, na sucessão ou na rotação, tire 20 kg/ha de N da cobertura. No plantio direto, suba o N de plantio para 30 kg/ha.',
      fonte: F.milho
    },
    {
      id: 'milho-arenoso',
      tema: 'nutricao',
      titulo: 'Solo arenoso: divida',
      texto:
        'Em solo arenoso, o nitrogênio vai em duas aplicações, com 6 e com 10 folhas. Se o solo for arenoso ou a dose de K2O passar de 80 kg/ha, ponha metade do potássio no plantio e metade junto da cobertura de N.',
      fonte: F.milho,
      quando: (p) => (p.adubacao && p.adubacao.arenoso ? 'O seu solo é arenoso: dividimos o N e o K.' : null)
    },
    {
      id: 'milho-zn-s',
      tema: 'nutricao',
      titulo: 'Zinco e enxofre',
      texto:
        'Em solo deficiente em zinco, aplique de 1 a 2 kg/ha de Zn. Se usar adubos concentrados, aplique 30 kg/ha de S no plantio ou na cobertura.',
      fonte: F.milho,
      quando: (p) => {
        const a = p.solo.a;
        if (a.Zn === null || a.Zn === undefined) return null;
        return a.Zn <= 0.9 ? `O seu zinco está em ${fmt(a.Zn)} mg/dm³, classe baixa ou menor: aplique.` : null;
      }
    },
    {
      id: 'milho-cerrado',
      tema: 'atencao',
      titulo: 'Solo de cerrado novo',
      texto: 'Em solo de cerrado, o manual não recomenda plantar milho nos primeiros anos, e sim depois de pelo menos dois cultivos de soja.',
      fonte: F.milho
    },
    {
      id: 'milho-silagem',
      tema: 'planta',
      titulo: 'Silagem: devolva o esterco',
      texto: 'No milho para silagem, acompanhe todo ano com análise de solo e retorne o esterco para a área sempre que der.',
      fonte: F.milho,
      so: 'silagem'
    },
    {
      id: 'milho-folha',
      tema: 'planta',
      titulo: 'Folha para análise',
      texto: 'Colha 30 folhas, 60 dias depois do plantio, o terço basal da folha + 4, sem a nervura central.',
      fonte: { sec: '17.2.1', pag: 145 }
    }
  ];

  const feijao = [
    {
      id: 'feijao-calagem',
      tema: 'solo',
      titulo: 'Calcário para o feijão',
      texto: 'O feijão tolera até 20% de saturação por alumínio e pede cálcio e magnésio somados de 2,0 cmolc/dm³, ou saturação por bases de 50%. Incorpore de 0 a 20 cm.',
      fonte: { sec: '8.2.1', pag: 46 }
    },
    {
      id: 'feijao-mo',
      tema: 'nutricao',
      titulo: 'Molibdênio nas folhas',
      texto: 'Pulverize 60 g/ha de molibdênio (154 g/ha de molibdato de sódio ou 111 g/ha de molibdato de amônio) de 15 a 25 dias depois da emergência.',
      fonte: F.feijao
    },
    {
      id: 'feijao-rizobio',
      tema: 'nutricao',
      titulo: 'Inocule com rizóbio',
      texto: 'A inoculação com rizóbio vale principalmente nos níveis de tecnologia mais baixos, o 1 e o 2.',
      fonte: F.feijao
    },
    {
      id: 'feijao-mg-s-b-zn',
      tema: 'nutricao',
      titulo: 'Magnésio, enxofre, boro e zinco',
      texto: 'Com pouco magnésio ou enxofre no solo, aplique 20 kg/ha de cada. Constatada falta de boro ou zinco, aplique 1 kg/ha de B e de 2 a 4 kg/ha de Zn.',
      fonte: F.feijao,
      quando: (p) => {
        const a = p.solo.a;
        const falta = [];
        if (a.Mg <= 0.45) falta.push(`magnésio baixo (${fmt(a.Mg)} cmolc/dm³)`);
        if (a.Zn !== null && a.Zn !== undefined && a.Zn <= 0.9) falta.push(`zinco baixo (${fmt(a.Zn)} mg/dm³)`);
        if (a.B !== null && a.B !== undefined && a.B <= 0.35) falta.push(`boro baixo (${fmt(a.B)} mg/dm³)`);
        return falta.length ? `No seu laudo: ${falta.join(', ')}.` : null;
      }
    },
    {
      id: 'feijao-pd',
      tema: 'atencao',
      titulo: 'Plantio direto pede preparo',
      texto:
        'No plantio direto valem as mesmas doses, mas o êxito depende de nivelar o terreno, corrigir a acidez, produzir material orgânico e desfazer o encrostamento e o adensamento do solo. O manual recomenda consultar um engenheiro agrônomo.',
      fonte: F.feijao
    }
  ];

  const fruta = [
    {
      id: 'fruta-preparo',
      tema: 'solo',
      titulo: 'Preparo do pomar novo e do pomar formado',
      texto:
        'Na instalação, faça subsolagem e aração profunda, e incorpore fundo o calcário e as adubações corretivas de fósforo e potássio. Em pomar já formado, calcule o calcário para 10 cm e incorpore com gradagem superficial.',
      fonte: F.frutas
    },
    {
      id: 'fruta-cova',
      tema: 'nutricao',
      titulo: 'Cova grande e preparada cedo',
      texto:
        'Em solo de baixa fertilidade, faça a cova a maior possível, com pelo menos dois meses de antecedência. Misture bem na terra de enchimento o fosfato pouco solúvel, o potássio, o esterco curtido e um pouco de corretivo. O fosfato solúvel em água vai mais localizado, sem enterrar fundo.',
      fonte: F.frutas
    },
    {
      id: 'fruta-n',
      tema: 'nutricao',
      titulo: 'Nitrogênio fora da cova',
      texto: 'O adubo nitrogenado não vai na terra de enchimento da cova. Ponha na projeção da copa, com água no solo.',
      fonte: F.frutas
    },
    {
      id: 'fruta-organico',
      tema: 'nutricao',
      titulo: 'Esterco e adubo verde',
      texto: 'Esterco curtido e adubo verde são recomendados em fruteiras, além da adubação mineral.',
      fonte: F.frutas
    },
    {
      id: 'fruta-b-zn',
      tema: 'atencao',
      titulo: 'Boro e zinco faltam com frequência',
      texto: 'Em solo de cerrado, boro e zinco são os micronutrientes que mais faltam. Se desconfiar de deficiência, procure um técnico para estudar o caso.',
      fonte: F.frutas
    },
    {
      id: 'fruta-historico',
      tema: 'planta',
      titulo: 'Guarde o histórico',
      texto: 'Para recomendar adubação é preciso saber o que já foi feito: quantidades, fórmulas e épocas, a produção e a qualidade dela, e as análises de solo e de folha.',
      fonte: F.frutas
    }
  ];

  const porFruta = {
    banana: [
      {
        id: 'banana-dolomitico',
        tema: 'solo',
        titulo: 'Só calcário dolomítico',
        texto: 'Na banana prata-anã aplique sempre calcário dolomítico, que leva magnésio junto. O manual usa saturação por alumínio de até 10% e cálcio + magnésio de 3,0 cmolc/dm³.',
        fonte: F.banana
      },
      {
        id: 'banana-esterco',
        tema: 'nutricao',
        titulo: 'Esterco por touceira',
        texto: 'Sempre que possível, aplique 10 L de esterco de curral por touceira por ano.',
        fonte: F.banana
      },
      {
        id: 'banana-fosforo',
        tema: 'nutricao',
        titulo: 'Fósforo da cova em duas fontes',
        texto: 'Na cova, use metade do P2O5 em adubo solúvel em água e metade em fosfato natural, contando o P2O5 disponível. Ponha também 20 L de esterco de curral, ou 5 L de esterco de galinha, ou 2 L de torta de mamona, 60 dias antes.',
        fonte: F.banana
      },
      {
        id: 'banana-ciclos',
        tema: 'planta',
        titulo: 'Planta-mãe e planta-filha',
        texto:
          'Planta-mãe: A no pegamento da muda, B dois meses depois e C quando aparece a inflorescência. Planta-filha: A na colheita da mãe e B dois meses depois. O manual não dá os meses; as datas do calendário são estimativas.',
        fonte: F.banana
      }
    ],
    citros: [
      {
        id: 'citros-calagem',
        tema: 'solo',
        titulo: 'Calcário a 25 cm ou a 10 cm',
        texto:
          'Na implantação do pomar, calcule o calcário para incorporar a 25 cm. Em pomar já formado, calcule para 10 cm. Depois do plantio, de 3 em 3 anos, tire uma amostra da área adubada e outra do centro da rua para ver se precisa calar de novo.',
        fonte: F.citros
      },
      {
        id: 'citros-fosfato',
        tema: 'nutricao',
        titulo: 'Fósforo: dois terços solúvel, um terço natural',
        texto: 'No plantio, ponha dois terços do fósforo em adubo solúvel em água e um terço em fosfato natural reativo. Aplique os adubos com o solo úmido.',
        fonte: F.citros
      },
      {
        id: 'citros-cleopatra',
        tema: 'nutricao',
        titulo: 'Porta-enxerto Cleópatra pede menos potássio',
        texto: 'Quando o porta-enxerto for Cleópatra, aplique só 30 g de K2O por planta por ano nos três primeiros anos, no lugar da dose da tabela.',
        fonte: F.citros
      },
      {
        id: 'citros-n-folha',
        tema: 'nutricao',
        titulo: 'Acerte o N pela análise foliar',
        texto:
          'Com 2,4 a 2,7 dag/kg de N na folha, aplique a dose inteira da tabela. Para cada décimo acima de 2,7, tire 60 g de N. Para cada décimo abaixo de 2,4, ponha mais 30 g. Colha 100 folhas com pecíolo, de 4 a 7 meses de idade, da parte média de ramos sem fruto do surto de primavera.',
        fonte: F.citros
      },
      {
        id: 'citros-suplementar',
        tema: 'nutricao',
        titulo: 'Acima de 3 caixas por planta',
        texto:
          'As doses do 6º ano contam com 3 caixas de 40,8 kg por planta. Para cada caixa a mais, some por planta, na laranja, no pomelo, na lima e no limão: N 80 g, P2O5 de 30, 20 ou 10 g e K2O de 90, 60 ou 30 g (baixa, média, boa). Na tangerina: N 60 g, P2O5 igual e K2O de 60, 40 ou 20 g.',
        fonte: F.citros
      },
      {
        id: 'citros-micros',
        tema: 'nutricao',
        titulo: 'Zinco, manganês e boro',
        texto:
          'Faltando zinco ou manganês, pulverize nas folhas uma calda de até 15 g/L de sais, em alto volume e com espalhante, quando as brotações tiverem um terço do tamanho final e o solo estiver úmido. Faltando boro, aplique 80 g/planta de bórax no solo.',
        fonte: F.citros
      },
      {
        id: 'citros-mg',
        tema: 'atencao',
        titulo: 'Falta de magnésio é comum',
        texto: 'A deficiência de magnésio é muito comum nos citros. Previna com corretivos que tragam magnésio. Se ela persistir e a correção for urgente, pulverize sulfato de magnésio a 4 g/L.',
        fonte: F.citros
      },
      {
        id: 'citros-estadios',
        tema: 'planta',
        titulo: 'Os estádios A, B, C e D',
        texto:
          'A: dias antes da floração, em agosto. B: logo depois de cair a pétala. C: frutos em crescimento. D: frutos de vez. O manual dá o estádio, não o mês; os meses do calendário são estimativas.',
        fonte: F.citros
      }
    ],
    manga: [
      {
        id: 'manga-dolomitico',
        tema: 'solo',
        titulo: 'Calcário dolomítico',
        texto: 'Na mangueira use calcário dolomítico. O manual usa saturação por alumínio de até 10% e cálcio + magnésio de 2,5 cmolc/dm³.',
        fonte: F.manga
      },
      {
        id: 'manga-cova',
        tema: 'nutricao',
        titulo: 'Cova com torta de mamona',
        texto: 'Misture 20 L de torta de mamona na terra da cova e nos adubos, 60 dias antes do plantio, e use metade do P2O5 em adubo solúvel e metade em fosfato natural.',
        fonte: F.manga
      },
      {
        id: 'manga-estadios',
        tema: 'planta',
        titulo: 'Os estádios A, B e C',
        texto: 'A: adubação antes da floração. B: depois do pegamento dos frutos. C: depois da colheita. Os meses do calendário são estimativas.',
        fonte: F.manga
      },
      {
        id: 'manga-sem-safra',
        tema: 'atencao',
        titulo: 'Ano sem produção',
        texto: 'No ano em que a mangueira não produzir, suprima as adubações do estádio B e do C.',
        fonte: F.manga
      }
    ],
    mamao: [
      {
        id: 'mamao-outubro',
        tema: 'planta',
        titulo: 'Outubro é o mês ótimo',
        texto: 'O manual considera outubro o mês ótimo para plantar o mamão. A primeira cobertura sai depois que a muda pegar.',
        fonte: F.mamao
      },
      {
        id: 'mamao-n',
        tema: 'nutricao',
        titulo: 'Ureia em cobertura, até 1 metro da copa',
        texto: 'Aplique o nitrogenado, de preferência ureia, em cobertura, todo ele até um metro da linha de projeção da copa.',
        fonte: F.mamao
      },
      {
        id: 'mamao-b-zn',
        tema: 'nutricao',
        titulo: 'Boro e zinco só com deficiência comprovada',
        texto: 'Em solo comprovadamente deficiente, ponha 5 g de bórax e, ou, 10 g de sulfato de zinco por cova.',
        fonte: F.mamao
      }
    ],
    maracuja: [
      {
        id: 'maracuja-cova',
        tema: 'nutricao',
        titulo: 'Cova com orgânico e calcário',
        texto: 'Misture na cova 20 L de esterco de curral, ou 5 L de esterco de galinha, ou 2 L de torta de mamona, 60 dias antes do plantio, mais 100 g de calcário dolomítico para cada tonelada aplicada na área total.',
        fonte: F.maracuja
      },
      {
        id: 'maracuja-poda',
        tema: 'planta',
        titulo: 'Depois da poda de restauração',
        texto: 'O manual traz uma adubação própria para depois da poda de restauração, no período de crescimento e formação: veja a tabela completa mais abaixo.',
        fonte: F.maracuja
      },
      {
        id: 'maracuja-folha',
        tema: 'planta',
        titulo: 'Folha para análise',
        texto: 'Colha 60 folhas, em todas as posições, de 250 a 280 dias depois do plantio.',
        fonte: { sec: '17.2.1', pag: 145 }
      }
    ],
    pitaya: [
      {
        id: 'pitaya-solo',
        tema: 'solo',
        titulo: 'Solo, calagem e gesso na pitaya',
        texto: 'A cartilha pede solo bem drenado, de textura média, com pH entre 5,5 e 6,5. Ela não traz método de calagem nem de gesso: sem análise, manda 300 g de calcário por cova. Por isso o guia não calcula calcário nem gesso para a pitaya. Com o laudo na mão, converse com um técnico da Emater.',
        fonte: { obra: 'Cartilha Cultivo da Pitaya, Emater-MG (2023)', pag: 6 },
        quando: (p) => (p.solo.a.pH < 5.5 ? `O seu pH em água é ${fmt(p.solo.a.pH)}, abaixo de 5,5.` : p.solo.a.pH > 6.5 ? `O seu pH em água é ${fmt(p.solo.a.pH)}, acima de 6,5.` : 'O seu pH está dentro da faixa de 5,5 a 6,5.')
      },
      {
        id: 'pitaya-espacamento',
        tema: 'planta',
        titulo: 'Espaçamento e tutor',
        texto: 'Espaçamento de 2 x 3 m ou 3 x 3 m. Cada planta pede um mourão de madeira ou concreto que dure 15 anos, com 1,6 a 1,8 m acima do solo e 50 cm enterrados. Não use eucalipto tratado, que inibe a planta. Em declive, plante em curva de nível; onde há vento forte, use quebra-vento.',
        fonte: { obra: 'Cartilha Cultivo da Pitaya, Emater-MG (2023)', pag: 6 }
      },
      {
        id: 'pitaya-mudas',
        tema: 'planta',
        titulo: 'Mudas de cladódio',
        texto: 'Tire os cladódios de uma planta-mãe sadia e produtiva, com pelo menos 25 cm, depois da frutificação e antes da nova floração. Deixe uma semana à sombra para cicatrizar. Plante direto ou enraíze em sacola (terra, esterco curtido e areia, 3:2:1): de 2 a 4 meses as mudas estão prontas.',
        fonte: { obra: 'Cartilha Cultivo da Pitaya, Emater-MG (2023)', pag: 6 }
      },
      {
        id: 'pitaya-cova',
        tema: 'nutricao',
        titulo: 'Cova e plantio',
        texto: 'Cova de 50 x 50 x 50 cm, perto do mourão. Sem análise do solo, misture na terra de cima 10 a 15 L de esterco bovino curtido (ou 5 a 7 L de esterco de aves), 300 g de calcário e 300 g de superfosfato simples. Plante de 40 a 60 dias depois, faça uma amontoa de 5 cm no pé e amarre a planta no mourão conforme cresce.',
        fonte: { obra: 'Cartilha Cultivo da Pitaya, Emater-MG (2023)', pag: 7 }
      },
      {
        id: 'pitaya-adubacao',
        tema: 'nutricao',
        titulo: 'Adubação de cobertura e boro',
        texto: 'A cartilha avisa que há pouca pesquisa e que a adubação vem de experiência de cultivo. No primeiro ano, 200 g de NPK 20-00-20 por planta em 4 vezes, de novembro a março. Na produção, 150 g em 3 vezes no período chuvoso. Aplique boro todo ano antes da florada, porque ele é fundamental para o pegamento das flores.',
        fonte: { obra: 'Cartilha Cultivo da Pitaya, Emater-MG (2023)', pag: 11 }
      },
      {
        id: 'pitaya-podas',
        tema: 'planta',
        titulo: 'Podas',
        texto: 'Formação: deixe só um ou dois cladódios subindo até o topo do mourão. Apical: corte a ponta quando a planta chegar ao suporte, para brotar os ramos produtivos. Produção: depois do primeiro ano, de maio a outubro, fora da floração (novembro a abril). Limpeza: tire o que está doente ou seco e queime. Desinfete a ferramenta com álcool a 70%.',
        fonte: { obra: 'Cartilha Cultivo da Pitaya, Emater-MG (2023)', pag: 10 }
      },
      {
        id: 'pitaya-irrigacao',
        tema: 'planta',
        titulo: 'Irrigação',
        texto: 'A pitaya é rústica e aceita de 650 a 1.500 mm de chuva por ano bem distribuídos. Quando irrigar, de 2 a 3 vezes por semana, por gotejamento a 20 a 40 cm do pé, sem encharcar. Alta umidade favorece doenças.',
        fonte: { obra: 'Cartilha Cultivo da Pitaya, Emater-MG (2023)', pag: 11 }
      },
      {
        id: 'pitaya-pragas',
        tema: 'atencao',
        titulo: 'Pragas e doenças: manejo cultural',
        texto: 'Não há produto químico registrado no MAPA para a pitaya, então o controle é cultural: adubação adequada, podas, e tirar e queimar ramos e frutos doentes. Combata formiga desde antes de plantar e a abelha irapuã se ela aparecer. Cuidado com antracnose, podridão negra e fusariose.',
        fonte: { obra: 'Cartilha Cultivo da Pitaya, Emater-MG (2023)', pag: 12 }
      },
      {
        id: 'pitaya-colheita',
        tema: 'planta',
        titulo: 'Polinização e colheita',
        texto: 'A polinização manual, com pincel, pode aumentar a produção. A colheita começa pequena um ano depois do plantio e chega ao pico em 2 anos, com até 3 safras por ano, de dezembro a maio. Colha o fruto maduro: ele não amadurece depois de solto. A cartilha estima em torno de 12 kg por planta por ano.',
        fonte: { obra: 'Cartilha Cultivo da Pitaya, Emater-MG (2023)', pag: 13 }
      },
      {
        id: 'pitaya-cultura-nova',
        tema: 'atencao',
        titulo: 'Cultura nova, com pouca pesquisa',
        texto: 'A cartilha lembra que a pitaya é uma cultura nova, com poucos resultados de pesquisa: faça análise de mercado, visite cultivos comerciais, analise o solo e procure um técnico da Emater para planejar.',
        fonte: { obra: 'Cartilha Cultivo da Pitaya, Emater-MG (2023)', pag: 13 }
      }
    ]
  };

  /** Cartões da cultura, já filtrados pela variante e com o selo "No seu laudo" quando couber. */
  function para(plano, variante) {
    const id = plano.cultura.id;
    let lista;
    if (id === 'cafe') lista = cafe;
    else if (id === 'milho') lista = milho;
    else if (id === 'feijao') lista = feijao;
    else if (id === 'pitaya') lista = porFruta.pitaya;
    else lista = fruta.concat(porFruta[id] || []);
    const tipo = variante && variante.tipo;
    return lista
      .filter((c) => !c.so || c.so === tipo)
      .map((c) => {
        let laudo = null;
        try {
          laudo = c.quando ? c.quando(plano) : null;
        } catch (e) {
          laudo = null;
        }
        return { id: c.id, tema: c.tema, titulo: c.titulo, texto: c.texto, fonte: c.fonte, laudo };
      });
  }

  G.manejo = { para, TEMAS: { solo: 'Solo e calagem', nutricao: 'Adubação', planta: 'Manejo da planta', atencao: 'Atenção' } };
})((globalThis.Guia = globalThis.Guia || {}));
