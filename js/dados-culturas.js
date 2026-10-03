/*
 * Doses e parâmetros por cultura, transcritos da 5ª Aproximação (CFSEMG, 1999).
 *
 * Convenções:
 *  - Dose em três classes de disponibilidade = [baixa, média, boa] (P2O5 e K2O).
 *  - "pag" é a página impressa no manual.
 *  - Em frutíferas e café os eventos trazem a dose por planta/cova (g); em milho e feijão, kg/ha.
 *  - Cada fase de frutífera traz o "total" impresso no manual; os testes somam os eventos e comparam.
 */
(function (G) {
  'use strict';

  const frutaComum = (extra) =>
    Object.assign(
      {
        tipo: 'perene',
        grupo: 'fruta',
        janelaPlantio: { meses: [9, 10, 11, 12], texto: 'no começo da estação chuvosa (outubro é o mês ótimo)' },
        organicoCova: '20 L de esterco de curral, ou 5 L de esterco de galinha, ou 2 L de torta de mamona, misturados à terra da cova e aos adubos 60 dias antes do plantio',
        calcarioCova: '100 g de calcário dolomítico para cada tonelada aplicada em área total, misturados à terra da cova',
        fosfatoNatural: 'Metade do P2O5 na forma solúvel em água e metade como fosfato natural reativo, contando o P2O5 disponível.',
        fracaoNatural: 0.5
      },
      extra
    );

  const culturas = {
    /* ------------------------------------------------------------------ CAFÉ */
    cafe: {
      id: 'cafe',
      nome: 'Café',
      nomeLongo: 'Cafeeiro',
      tipo: 'perene',
      grupo: 'cafe',
      pag: 289,
      sec: '18.4.6',
      calagem: { mt: 25, X: 3.5, Ve: 60, veSomenteSeVMenorQue: 50, dolomitico: false },
      janelaPlantio: { meses: [10, 11, 12], texto: 'no começo das chuvas (outubro e novembro)' },
      sistemas: {
        tradicional: { nome: 'Tradicional', plantasHa: 'até 2.500', entreLinhas: 4.0, entrePlantas: 1.0 },
        semiadensado: { nome: 'Semi-adensado', plantasHa: '2.500 a 5.000', entreLinhas: 3.0, entrePlantas: 0.8 },
        adensado: { nome: 'Adensado', plantasHa: '5.000 a 10.000', entreLinhas: 2.0, entrePlantas: 0.7 }
      },
      // Quadro 18.4.6.1: dose de P2O5 na cova por classe do critério de implantação [muito baixo ... muito bom]
      plantio: { P_g_cova: [80, 65, 50, 35, 20] },
      // Quadro 18.4.6.2: K2O em cobertura após o pegamento (g/cova/ano) por classe de K [baixo, médio, bom, muito bom]; N 3 a 5 g/cova/aplicação
      posPlantio: { K_g_cova_ano: [30, 20, 10, 0], N_g_cova_aplicacao: '3 a 5' },
      // Quadro 18.4.6.3: 1º e 2º ano
      formacao: {
        1: { N_g_cova_aplicacao: 10, K_g_cova_ano: [40, 20, 10, 0] },
        2: { N_g_cova_aplicacao: 20, K_g_cova_ano: [60, 40, 20, 0] }
      },
      // Quadros 18.4.6.4 e 18.4.6.5: produção, kg/ha/ano. Faixas de sacas/ha.
      producao: {
        faixasSc: [20, 30, 40, 50, 60], // limites superiores; acima do último = "mais de 60"
        // N: [teor foliar baixo, adequado, alto, dose pré-estabelecida sem análise foliar]
        N: [
          [200, 140, 80, 200],
          [250, 175, 110, 250],
          [300, 220, 140, 300],
          [350, 260, 170, 350],
          [400, 300, 200, 400],
          [450, 340, 230, 450]
        ],
        // K2O por classe [baixo, médio, bom, muito bom]
        K: [
          [200, 150, 100, 0],
          [250, 190, 125, 0],
          [300, 225, 150, 0],
          [350, 260, 175, 50],
          [400, 300, 200, 75],
          [450, 340, 225, 100]
        ],
        // P2O5 por classe de manutenção [muito baixo, baixo, médio, bom, muito bom]
        P: [
          [30, 20, 10, 0, 0],
          [40, 30, 20, 0, 0],
          [50, 40, 25, 0, 0],
          [60, 50, 30, 15, 0],
          [70, 55, 35, 18, 0],
          [80, 60, 40, 20, 0]
        ],
        // teor de N foliar (dag/kg): baixo até 2,5; adequado até 3,0; acima disso alto (quadro 18.4.6.4)
        Nfoliar: { baixoAte: 2.5, adequadoAte: 3.0 },
        enxofreFracaoDoN: 1 / 8
      },
      // Quadro 18.4.6.7: micronutrientes, dose em kg/ha por classe [baixo, médio, bom, alto]
      micros: {
        B: { limites: [0.2, 0.4, 0.6], extrator: 'água quente', dose: [3, 2, 1, 0] },
        Cu: { limites: [0.5, 1.0, 1.5], extrator: 'Mehlich-1', dose: [3, 2, 1, 0] },
        Mn: { limites: [5.0, 10.0, 15.0], extrator: 'Mehlich-1', dose: [15, 10, 5, 0] },
        Zn: { limites: [2.0, 4.0, 6.0], extrator: 'Mehlich-1', dose: [6, 4, 2, 0] }
      },
      foliar: { mes: 12, estadio: 'chumbinho (antes de encher o grão)' }
    },

    /* ----------------------------------------------------------------- MILHO */
    milho: {
      id: 'milho',
      nome: 'Milho',
      nomeLongo: 'Milho',
      tipo: 'anual',
      grupo: 'milho',
      pag: 314,
      sec: '18.4.13',
      entreLinhas: 0.8,
      // O texto da seção 18.4.13 manda elevar a saturação por bases a 60%; o Quadro 8.1 traz 50%. Vale a seção da cultura.
      calagem: { mt: 15, X: 2.0, Ve: 60, tetoPorAplicacao: 6, dolomitico: false, notaVe: 'A seção do milho (18.4.13) pede V = 60%; o Quadro 8.1 mostra 50%. Usamos 60%.' },
      variantes: {
        grao: {
          nome: 'Milho para grão',
          unidade: 't/ha',
          faixas: [
            { ate: 6, rotulo: '4 a 6 t/ha', N_plantio: [10, 20], P: [80, 60, 30], K: [50, 40, 20], N_cobertura: 60 },
            { ate: 8, rotulo: '6 a 8 t/ha', N_plantio: [10, 20], P: [100, 80, 50], K: [70, 60, 40], N_cobertura: 100 },
            { ate: Infinity, rotulo: 'acima de 8 t/ha', N_plantio: [10, 20], P: [120, 100, 70], K: [90, 80, 60], N_cobertura: 140 }
          ]
        },
        silagem: {
          nome: 'Milho para silagem',
          unidade: 't/ha de matéria verde',
          faixas: [
            { ate: 40, rotulo: '30 a 40 t/ha', N_plantio: [10, 20], P: [80, 60, 30], K: [100, 80, 40], N_cobertura: 80 },
            { ate: 50, rotulo: '40 a 50 t/ha', N_plantio: [10, 20], P: [100, 80, 50], K: [140, 120, 80], N_cobertura: 130 },
            { ate: Infinity, rotulo: 'acima de 50 t/ha', N_plantio: [10, 20], P: [120, 100, 70], K: [180, 160, 120], N_cobertura: 180 }
          ]
        }
      },
      // Tudo em dias contados do plantio. Emergência assumida em 7 dias (estimativa).
      emergenciaDias: 7,
      coberturaFolhas: { primeira: '6 a 8 folhas bem abertas', primeiraDias: [30, 38], arenosoSegundaDias: [45, 52] },
      foliar: { diasAposPlantio: 60, texto: 'terço basal da folha +4, sem a nervura (Quadro 17.1, Cap. 17)' }
    },

    /* ---------------------------------------------------------------- FEIJÃO */
    feijao: {
      id: 'feijao',
      nome: 'Feijão',
      nomeLongo: 'Feijão',
      tipo: 'anual',
      grupo: 'feijao',
      pag: 306,
      sec: '18.4.8',
      entreLinhas: 0.5,
      calagem: { mt: 20, X: 2.0, Ve: 50, dolomitico: false },
      niveis: {
        1: { nome: 'Nível 1', descricao: 'calagem, adubação, semente catada, capina até 30 dias; produz até 1.200 kg/ha', produtividade: 'até 1.200 kg/ha', N_plantio: 20, P: [70, 50, 30], K: [30, 20, 20], N_cobertura: 20, parcelas: 1 },
        2: { nome: 'Nível 2', descricao: 'nível 1 mais semente fiscalizada, controle fitossanitário e tratamento de semente; 1.200 a 1.800 kg/ha', produtividade: '1.200 a 1.800 kg/ha', N_plantio: 20, P: [80, 60, 40], K: [30, 20, 20], N_cobertura: 30, parcelas: 1 },
        3: { nome: 'Nível 3', descricao: 'nível 2 mais herbicida e irrigação; 1.800 a 2.500 kg/ha', produtividade: '1.800 a 2.500 kg/ha', N_plantio: 30, P: [90, 70, 50], K: [40, 30, 20], N_cobertura: 40, parcelas: 2 },
        4: { nome: 'Nível 4', descricao: 'nível 3 com as maiores doses de adubo; acima de 2.500 kg/ha', produtividade: 'acima de 2.500 kg/ha', N_plantio: 40, P: [110, 90, 70], K: [50, 40, 20], N_cobertura: 60, parcelas: 2 }
      },
      emergenciaDias: 7,
      coberturaDAE: { umaParcela: [25, 30], duasParcelas: [20, 30] },
      molibdenio: { dae: [15, 25], dose: '60 g/ha de Mo (154 g de molibdato de sódio ou 111 g de molibdato de amônio por hectare)' }
    },

    /* ---------------------------------------------------------------- BANANA */
    banana: frutaComum({
      id: 'banana',
      nome: 'Banana',
      nomeLongo: 'Banana prata-anã',
      pag: 217,
      sec: '18.2.4',
      entreLinhas: 4.5,
      entrePlantas: 2.0,
      calagem: { mt: 10, X: 3.0, Ve: 70, dolomitico: true },
      esterco: 'Sempre que puder, 10 L de esterco de curral por touceira por ano.',
      fases: [
        {
          id: 'cova', titulo: 'Cova de plantio', ano: 0, unidade: 'g/cova', criterio: 'hort',
          eventos: [{ id: 'cova', rotulo: 'Adubo na cova', quando: { tipo: 'plantio' }, N: 0, P: [120, 80, 40], K: [90, 60, 30] }],
          total: { N: 0, P: [120, 80, 40], K: [90, 60, 30] }
        },
        {
          id: 'mae', titulo: 'Planta-mãe', ano: 1, ciclo: 'mae', unidade: 'g/planta', criterio: 'cap5',
          eventos: [
            { id: 'mae-A', rotulo: 'Pegamento da muda', quando: { tipo: 'rel', dias: 30, gatilho: 'depois que a muda pegar' }, N: 20, P: null, K: [0, 0, 0] },
            { id: 'mae-B', rotulo: 'Dois meses depois', quando: { tipo: 'rel', dias: 90, gatilho: 'dois meses depois da primeira' }, N: 80, P: null, K: [180, 120, 60] },
            { id: 'mae-C', rotulo: 'Inflorescência', quando: { tipo: 'rel', dias: 240, gatilho: 'quando aparecer o cacho (cerca de 8 meses, estimativa)', estimado: true }, N: 140, P: null, K: [240, 160, 80] }
          ],
          total: { N: 240, P: [0, 0, 0], K: [420, 280, 140] }
        },
        {
          id: 'filha', titulo: 'Planta-filha', ano: 2, ciclo: 'filha', emDiante: true, extrapolado: 'O manual traz planta-mãe e planta-filha; nos ciclos seguintes repetimos a dose da filha.', unidade: 'g/planta', criterio: 'cap5',
          eventos: [
            { id: 'filha-A', rotulo: 'Colheita da planta-mãe', quando: { tipo: 'rel', dias: 360, gatilho: 'quando colher a planta-mãe (cerca de 12 meses, estimativa)', estimado: true }, N: 60, P: [60, 40, 20], K: [0, 0, 0] },
            { id: 'filha-B', rotulo: 'Dois meses depois', quando: { tipo: 'rel', dias: 420, gatilho: 'dois meses depois da colheita da mãe', estimado: true }, N: 40, P: null, K: [120, 80, 40] }
          ],
          total: { N: 100, P: [60, 40, 20], K: [120, 80, 40] }
        }
      ]
    }),

    /* ---------------------------------------------------------------- CITROS */
    citros: frutaComum({
      id: 'citros',
      nome: 'Citros',
      nomeLongo: 'Citros (laranja, limão, tangerina)',
      pag: 219,
      sec: '18.2.5',
      entreLinhas: 8.0,
      entrePlantas: 5.0,
      calagem: { mt: 5, X: 3.0, Ve: 70, dolomitico: false },
      notaCalagemPomar: 'Na implantação do pomar, calcular a calagem para 25 cm; em pomar já formado, para 10 cm.',
      organicoCova: '20 L de esterco de curral curtido, ou 8 L de esterco de galinha curtido, por cova, 60 dias antes do plantio',
      calcarioCova: null,
      fosfatoNatural: 'No plantio, dois terços do fósforo na forma solúvel em água e um terço como fosfato natural reativo, contando o P2O5 disponível.',
      fracaoNatural: 1 / 3,
      fases: [
        {
          id: 'plantio', titulo: 'Plantio e pós-plantio', ano: 0, unidade: 'g/cova', criterio: 'hort',
          eventos: [
            { id: 'p-plantio', rotulo: 'Adubo na cova', quando: { tipo: 'plantio' }, N: 0, P: [120, 80, 40], K: null },
            { id: 'p-out', rotulo: 'Primeira cobertura (primeiros brotos)', quando: { tipo: 'mes', mes: 10 }, N: 5, P: null, K: null },
            { id: 'p-nov', rotulo: 'Cobertura de novembro', quando: { tipo: 'mes', mes: 11 }, N: 5, P: null, K: null },
            { id: 'p-jan', rotulo: 'Cobertura de janeiro', quando: { tipo: 'mes', mes: 1 }, N: 10, P: null, K: null },
            { id: 'p-mar', rotulo: 'Cobertura de março', quando: { tipo: 'mes', mes: 3 }, N: 5, P: [15, 10, 5], K: null }
          ],
          total: { N: 25, P: [135, 90, 45], K: [0, 0, 0] }
        },
        {
          id: 'a1', titulo: '1º ano depois do plantio', ano: 1, unidade: 'g/planta', criterio: 'cap5',
          eventos: [
            { id: 'a1-set', rotulo: 'Cobertura de setembro', quando: { tipo: 'mes', mes: 9 }, N: 20, P: null, K: null },
            { id: 'a1-nov', rotulo: 'Cobertura de novembro', quando: { tipo: 'mes', mes: 11 }, N: 20, P: [30, 20, 10], K: null },
            { id: 'a1-jan', rotulo: 'Cobertura de janeiro', quando: { tipo: 'mes', mes: 1 }, N: 30, P: null, K: [15, 10, 5] },
            { id: 'a1-abr', rotulo: 'Cobertura de abril', quando: { tipo: 'mes', mes: 4 }, N: 0, P: null, K: [15, 10, 5] }
          ],
          total: { N: 70, P: [30, 20, 10], K: [30, 20, 10] }
        },
        {
          id: 'a2', titulo: '2º ano depois do plantio', ano: 2, unidade: 'g/planta', criterio: 'cap5',
          eventos: [
            { id: 'a2-set', rotulo: 'Cobertura de setembro', quando: { tipo: 'mes', mes: 9 }, N: 40, P: null, K: null },
            { id: 'a2-nov', rotulo: 'Cobertura de novembro', quando: { tipo: 'mes', mes: 11 }, N: 40, P: [90, 60, 30], K: null },
            { id: 'a2-jan', rotulo: 'Cobertura de janeiro', quando: { tipo: 'mes', mes: 1 }, N: 50, P: null, K: [30, 20, 10] },
            { id: 'a2-abr', rotulo: 'Cobertura de abril', quando: { tipo: 'mes', mes: 4 }, N: 0, P: null, K: [30, 20, 10] }
          ],
          total: { N: 130, P: [90, 60, 30], K: [60, 40, 20] }
        },
        {
          id: 'a3', titulo: '3º ano depois do plantio', ano: 3, unidade: 'g/planta', criterio: 'cap5',
          eventos: [
            { id: 'a3-set', rotulo: 'Cobertura de setembro', quando: { tipo: 'mes', mes: 9 }, N: 40, P: null, K: null },
            { id: 'a3-nov', rotulo: 'Cobertura de novembro', quando: { tipo: 'mes', mes: 11 }, N: 60, P: [90, 60, 30], K: null },
            { id: 'a3-jan', rotulo: 'Cobertura de janeiro', quando: { tipo: 'mes', mes: 1 }, N: 60, P: null, K: [30, 20, 10] },
            { id: 'a3-abr', rotulo: 'Cobertura de abril', quando: { tipo: 'mes', mes: 4 }, N: 0, P: null, K: [60, 40, 20] }
          ],
          total: { N: 160, P: [90, 60, 30], K: [90, 60, 30] }
        },
        {
          id: 'a4', titulo: '4º ano depois do plantio', ano: 4, unidade: 'g/planta', criterio: 'cap5',
          eventos: [
            { id: 'a4-A', rotulo: 'Antes da floração', quando: { tipo: 'estadio', estadio: 'A', mes: 8, gatilho: 'dias antes de florescer (agosto)', estimado: false }, N: 60, P: null, K: null },
            { id: 'a4-B', rotulo: 'Depois de cair a pétala', quando: { tipo: 'estadio', estadio: 'B', mes: 10, gatilho: 'logo depois de cair a pétala', estimado: true }, N: 80, P: [150, 100, 50], K: null },
            { id: 'a4-C', rotulo: 'Frutos crescendo', quando: { tipo: 'estadio', estadio: 'C', mes: 12, gatilho: 'com os frutos em crescimento', estimado: true }, N: 100, P: null, K: [90, 60, 30] },
            { id: 'a4-D', rotulo: 'Frutos de vez', quando: { tipo: 'estadio', estadio: 'D', mes: 3, gatilho: 'com os frutos de vez', estimado: true }, N: 0, P: null, K: [90, 60, 30] }
          ],
          total: { N: 240, P: [150, 100, 50], K: [180, 120, 60] }
        },
        {
          id: 'a5', titulo: '5º ano depois do plantio', ano: 5, unidade: 'g/planta', criterio: 'cap5',
          eventos: [
            { id: 'a5-A', rotulo: 'Antes da floração', quando: { tipo: 'estadio', estadio: 'A', mes: 8, gatilho: 'dias antes de florescer (agosto)' }, N: 80, P: null, K: null },
            { id: 'a5-B', rotulo: 'Depois de cair a pétala', quando: { tipo: 'estadio', estadio: 'B', mes: 10, gatilho: 'logo depois de cair a pétala', estimado: true }, N: 140, P: [210, 140, 70], K: null },
            { id: 'a5-C', rotulo: 'Frutos crescendo', quando: { tipo: 'estadio', estadio: 'C', mes: 12, gatilho: 'com os frutos em crescimento', estimado: true }, N: 120, P: null, K: [120, 80, 40] },
            { id: 'a5-D', rotulo: 'Frutos de vez', quando: { tipo: 'estadio', estadio: 'D', mes: 3, gatilho: 'com os frutos de vez', estimado: true }, N: 0, P: null, K: [120, 80, 40] }
          ],
          total: { N: 340, P: [210, 140, 70], K: [240, 160, 80] }
        },
        {
          id: 'a6', titulo: '6º ano em diante', ano: 6, emDiante: true, unidade: 'g/planta', criterio: 'cap5',
          eventos: [
            { id: 'a6-A', rotulo: 'Antes da floração', quando: { tipo: 'estadio', estadio: 'A', mes: 8, gatilho: 'dias antes de florescer (agosto)' }, N: 80, P: null, K: null },
            { id: 'a6-B', rotulo: 'Depois de cair a pétala', quando: { tipo: 'estadio', estadio: 'B', mes: 10, gatilho: 'logo depois de cair a pétala', estimado: true }, N: 160, P: [150, 100, 50], K: null },
            { id: 'a6-C', rotulo: 'Frutos crescendo', quando: { tipo: 'estadio', estadio: 'C', mes: 12, gatilho: 'com os frutos em crescimento', estimado: true }, N: 140, P: null, K: [150, 100, 50] },
            { id: 'a6-D', rotulo: 'Frutos de vez', quando: { tipo: 'estadio', estadio: 'D', mes: 3, gatilho: 'com os frutos de vez', estimado: true }, N: 0, P: null, K: [150, 100, 50] }
          ],
          total: { N: 380, P: [150, 100, 50], K: [300, 200, 100] }
        }
      ],
      suplementar: 'Para cada caixa de 40,8 kg por planta acima de 3 caixas, some por planta: laranja, pomelo, lima e limão, N 80 g, P2O5 30/20/10 g, K2O 90/60/30 g; tangerina, N 60 g, P2O5 30/20/10 g, K2O 60/40/20 g (baixa/média/boa).'
    }),

    /* ----------------------------------------------------------------- MANGA */
    manga: frutaComum({
      id: 'manga',
      nome: 'Manga',
      nomeLongo: 'Mangueira',
      pag: 239,
      sec: '18.2.10',
      entreLinhas: 10.0,
      entrePlantas: 7.0,
      calagem: { mt: 10, X: 2.5, Ve: 60, dolomitico: true },
      organicoCova: '20 L de torta de mamona misturados à terra da cova e aos adubos 60 dias antes do plantio',
      fosfatoNatural: 'Metade do P2O5 na forma solúvel em água e metade como fosfato natural, contando o P2O5 disponível.',
      fases: [
        {
          id: 'plantio', titulo: 'Plantio e pós-plantio', ano: 0, unidade: 'g/cova', criterio: 'hort',
          eventos: [
            { id: 'p-plantio', rotulo: 'Adubo na cova', quando: { tipo: 'plantio' }, N: 0, P: [60, 40, 20], K: [30, 20, 10] },
            { id: 'p-out', rotulo: 'Primeira cobertura', quando: { tipo: 'mes', mes: 10 }, N: 10, P: null, K: null },
            { id: 'p-jan', rotulo: 'Cobertura de janeiro', quando: { tipo: 'mes', mes: 1 }, N: 20, P: null, K: null },
            { id: 'p-mar', rotulo: 'Cobertura de março', quando: { tipo: 'mes', mes: 3 }, N: 20, P: null, K: [30, 20, 10] }
          ],
          total: { N: 50, P: [60, 40, 20], K: [60, 40, 20] }
        },
        {
          id: 'a1', titulo: '1º ano depois do plantio', ano: 1, unidade: 'g/planta', criterio: 'cap5',
          eventos: [
            { id: 'a1-out', rotulo: 'Cobertura de outubro', quando: { tipo: 'mes', mes: 10 }, N: 40, P: [90, 60, 30], K: null },
            { id: 'a1-jan', rotulo: 'Cobertura de janeiro', quando: { tipo: 'mes', mes: 1 }, N: 40, P: null, K: [60, 40, 20] },
            { id: 'a1-mar', rotulo: 'Cobertura de março', quando: { tipo: 'mes', mes: 3 }, N: 20, P: null, K: [60, 40, 20] }
          ],
          total: { N: 100, P: [90, 60, 30], K: [120, 80, 40] }
        },
        {
          id: 'a2', titulo: '2º ano depois do plantio', ano: 2, unidade: 'g/planta', criterio: 'cap5',
          eventos: [
            { id: 'a2-out', rotulo: 'Cobertura de outubro', quando: { tipo: 'mes', mes: 10 }, N: 50, P: [120, 80, 40], K: null },
            { id: 'a2-jan', rotulo: 'Cobertura de janeiro', quando: { tipo: 'mes', mes: 1 }, N: 50, P: null, K: [60, 40, 20] },
            { id: 'a2-mar', rotulo: 'Cobertura de março', quando: { tipo: 'mes', mes: 3 }, N: 50, P: null, K: [90, 60, 30] }
          ],
          total: { N: 150, P: [120, 80, 40], K: [150, 100, 50] }
        },
        {
          id: 'a3', titulo: '3º ano depois do plantio', ano: 3, unidade: 'g/planta', criterio: 'cap5',
          eventos: [
            { id: 'a3-out', rotulo: 'Cobertura de outubro', quando: { tipo: 'mes', mes: 10 }, N: 70, P: [150, 100, 50], K: [90, 60, 30] },
            { id: 'a3-jan', rotulo: 'Cobertura de janeiro', quando: { tipo: 'mes', mes: 1 }, N: 70, P: null, K: [90, 60, 30] },
            { id: 'a3-mar', rotulo: 'Cobertura de março', quando: { tipo: 'mes', mes: 3 }, N: 60, P: null, K: [90, 60, 30] }
          ],
          total: { N: 200, P: [150, 100, 50], K: [270, 180, 90] }
        },
        {
          id: 'a4', titulo: '4º ano depois do plantio', ano: 4, unidade: 'g/planta', criterio: 'cap5',
          eventos: [
            { id: 'a4-A', rotulo: 'Antes da floração', quando: { tipo: 'estadio', estadio: 'A', mes: 8, gatilho: 'antes de a mangueira florescer', estimado: true }, N: 20, P: null, K: [30, 20, 10] },
            { id: 'a4-B', rotulo: 'Depois do pegamento dos frutos', quando: { tipo: 'estadio', estadio: 'B', mes: 10, gatilho: 'depois de os frutinhos pegarem', estimado: true }, N: 80, P: [150, 100, 50], K: [90, 60, 30] },
            { id: 'a4-C', rotulo: 'Depois da colheita', quando: { tipo: 'estadio', estadio: 'C', mes: 3, gatilho: 'logo depois de colher', estimado: true }, N: 100, P: null, K: [90, 60, 30] }
          ],
          total: { N: 200, P: [150, 100, 50], K: [210, 140, 70] }
        },
        {
          id: 'a5', titulo: '5º ano depois do plantio', ano: 5, unidade: 'g/planta', criterio: 'cap5',
          eventos: [
            { id: 'a5-A', rotulo: 'Antes da floração', quando: { tipo: 'estadio', estadio: 'A', mes: 8, gatilho: 'antes de a mangueira florescer', estimado: true }, N: 30, P: null, K: [30, 20, 10] },
            { id: 'a5-B', rotulo: 'Depois do pegamento dos frutos', quando: { tipo: 'estadio', estadio: 'B', mes: 10, gatilho: 'depois de os frutinhos pegarem', estimado: true }, N: 100, P: [150, 100, 50], K: [120, 80, 40] },
            { id: 'a5-C', rotulo: 'Depois da colheita', quando: { tipo: 'estadio', estadio: 'C', mes: 3, gatilho: 'logo depois de colher', estimado: true }, N: 100, P: null, K: [90, 60, 30] }
          ],
          total: { N: 230, P: [150, 100, 50], K: [240, 160, 80] }
        },
        {
          id: 'a6', titulo: '6º ano em diante', ano: 6, emDiante: true, unidade: 'g/planta', criterio: 'cap5',
          eventos: [
            { id: 'a6-A', rotulo: 'Antes da floração', quando: { tipo: 'estadio', estadio: 'A', mes: 8, gatilho: 'antes de a mangueira florescer', estimado: true }, N: 50, P: null, K: [60, 40, 20] },
            { id: 'a6-B', rotulo: 'Depois do pegamento dos frutos', quando: { tipo: 'estadio', estadio: 'B', mes: 10, gatilho: 'depois de os frutinhos pegarem', estimado: true }, N: 150, P: [150, 100, 50], K: [150, 100, 50] },
            { id: 'a6-C', rotulo: 'Depois da colheita', quando: { tipo: 'estadio', estadio: 'C', mes: 3, gatilho: 'logo depois de colher', estimado: true }, N: 150, P: null, K: [150, 100, 50] }
          ],
          total: { N: 350, P: [150, 100, 50], K: [360, 240, 120] }
        }
      ],
      semProducao: 'No ano em que a mangueira não produzir, suprima as adubações de depois do pegamento (B) e de depois da colheita (C).'
    }),

    /* ----------------------------------------------------------------- MAMÃO */
    mamao: frutaComum({
      id: 'mamao',
      nome: 'Mamão',
      nomeLongo: 'Mamoeiro',
      pag: 237,
      sec: '18.2.9',
      entreLinhas: 3.0,
      entrePlantas: 2.0,
      calagem: { mt: 5, X: 3.5, Ve: 80, dolomitico: false },
      fases: [
        {
          id: 'plantio', titulo: 'Plantio e pós-plantio', ano: 0, unidade: 'g/cova', criterio: 'hort',
          eventos: [
            { id: 'p-plantio', rotulo: 'Adubo na cova', quando: { tipo: 'plantio' }, N: 0, P: [60, 40, 20], K: [30, 20, 10] },
            { id: 'p-out', rotulo: 'Primeira cobertura', quando: { tipo: 'mes', mes: 10 }, N: 20, P: null, K: null },
            { id: 'p-jan', rotulo: 'Cobertura de janeiro', quando: { tipo: 'mes', mes: 1 }, N: 20, P: null, K: [60, 40, 20] },
            { id: 'p-fev', rotulo: 'Cobertura de fevereiro', quando: { tipo: 'mes', mes: 2 }, N: 20, P: null, K: null },
            { id: 'p-abr', rotulo: 'Cobertura de abril', quando: { tipo: 'mes', mes: 4 }, N: 40, P: null, K: null }
          ],
          total: { N: 100, P: [60, 40, 20], K: [90, 60, 30] }
        },
        {
          id: 'a1', titulo: 'Frutificação', ano: 1, emDiante: true, unidade: 'g/planta', criterio: 'cap5',
          eventos: [
            { id: 'f-out', rotulo: 'Cobertura de outubro', quando: { tipo: 'mes', mes: 10 }, N: 20, P: [30, 20, 10], K: [30, 20, 10] },
            { id: 'f-dez', rotulo: 'Cobertura de dezembro', quando: { tipo: 'mes', mes: 12 }, N: 30, P: null, K: [30, 20, 10] },
            { id: 'f-fev', rotulo: 'Cobertura de fevereiro', quando: { tipo: 'mes', mes: 2 }, N: 30, P: null, K: [30, 20, 10] }
          ],
          total: { N: 80, P: [30, 20, 10], K: [90, 60, 30] }
        }
      ],
      extras: 'Em solo comprovadamente com falta de boro e zinco, ponha 5 g de bórax e 10 g de sulfato de zinco por cova.'
    }),

    /* -------------------------------------------------------------- MARACUJÁ */
    maracuja: frutaComum({
      id: 'maracuja',
      nome: 'Maracujá',
      nomeLongo: 'Maracujazeiro',
      pag: 242,
      sec: '18.2.11',
      entreLinhas: 3.0,
      entrePlantas: 5.0,
      calagem: { mt: 5, X: 3.0, Ve: 70, dolomitico: false },
      fases: [
        {
          id: 'plantio', titulo: 'Plantio e pós-plantio', ano: 0, unidade: 'g/planta', criterio: 'hort',
          eventos: [
            { id: 'p-plantio', rotulo: 'Adubo no plantio', quando: { tipo: 'plantio' }, N: 0, P: [60, 40, 20], K: null },
            { id: 'p-nov', rotulo: 'Primeira cobertura', quando: { tipo: 'mes', mes: 11 }, N: 30, P: null, K: null },
            { id: 'p-jan', rotulo: 'Cobertura de janeiro', quando: { tipo: 'mes', mes: 1 }, N: 40, P: null, K: [30, 20, 10] },
            { id: 'p-mar', rotulo: 'Cobertura de março', quando: { tipo: 'mes', mes: 3 }, N: 0, P: null, K: [60, 40, 20] }
          ],
          total: { N: 70, P: [60, 40, 20], K: [90, 60, 30] }
        },
        {
          id: 'a1', titulo: '1º ano de frutificação', ano: 1, unidade: 'g/planta', criterio: 'cap5',
          eventos: [
            { id: 'a1-nov', rotulo: 'Cobertura de novembro', quando: { tipo: 'mes', mes: 11 }, N: 20, P: null, K: null },
            { id: 'a1-jan', rotulo: 'Cobertura de janeiro', quando: { tipo: 'mes', mes: 1 }, N: 60, P: null, K: [90, 60, 30] },
            { id: 'a1-mar', rotulo: 'Cobertura de março', quando: { tipo: 'mes', mes: 3 }, N: 40, P: [60, 40, 20], K: [150, 100, 50] }
          ],
          total: { N: 120, P: [60, 40, 20], K: [240, 160, 80] }
        },
        {
          id: 'a2', titulo: '2º ano de frutificação', ano: 2, ultimaDoManual: true, unidade: 'g/planta', criterio: 'cap5',
          eventos: [
            { id: 'a2-nov', rotulo: 'Cobertura de novembro', quando: { tipo: 'mes', mes: 11 }, N: 40, P: null, K: [90, 60, 30] },
            { id: 'a2-jan', rotulo: 'Cobertura de janeiro', quando: { tipo: 'mes', mes: 1 }, N: 40, P: [90, 60, 30], K: [90, 60, 30] },
            { id: 'a2-mar', rotulo: 'Cobertura de março', quando: { tipo: 'mes', mes: 3 }, N: 60, P: null, K: [90, 60, 30] }
          ],
          total: { N: 140, P: [90, 60, 30], K: [270, 180, 90] }
        }
      ],
      aposPoda: {
        titulo: 'Depois da poda de restauração',
        unidade: 'g/planta',
        criterio: 'cap5',
        eventos: [
          { id: 'poda-set', rotulo: 'Na poda', quando: { tipo: 'mes', mes: 9 }, N: 20, P: [60, 40, 20], K: null },
          { id: 'poda-jan', rotulo: 'Janeiro', quando: { tipo: 'mes', mes: 1 }, N: 20, P: null, K: [60, 40, 20] },
          { id: 'poda-mar', rotulo: 'Março', quando: { tipo: 'mes', mes: 3 }, N: 20, P: null, K: null }
        ],
        total: { N: 60, P: [60, 40, 20], K: [60, 40, 20] }
      }
    }),

    /* ---------------------------------------------------------------- PITAYA
       Fonte diferente do resto: cartilha da Emater-MG (2023). Ela não traz método de calagem nem de gesso,
       e dá a adubação em g de NPK 20-00-20 (20% de N e 20% de K2O), sem classes de fertilidade. */
    pitaya: frutaComum({
      id: 'pitaya',
      nome: 'Pitaya',
      nomeLongo: 'Pitaya',
      obra: 'Cartilha Cultivo da Pitaya, Emater-MG (2023)',
      fonteCurta: 'A cartilha',
      sec: null,
      pag: 11,
      entreLinhas: 3.0,
      entrePlantas: 3.0,
      calagem: null,
      janelaPlantio: { meses: [11], texto: 'na primeira quinzena de novembro, como propõe o cronograma da cartilha' },
      organicoCova: '10 a 15 L de esterco bovino curtido (ou 5 a 7 L de esterco de aves)',
      calcarioCova: '300 g de calcário por cova (dose da cartilha para quando não há análise do solo)',
      fosforoNaCova: true,
      covaAntes: 50,
      amostraDias: -65,
      fracaoNatural: 0,
      notaAdubo: 'A cartilha indica o adubo formulado NPK 20-00-20: os gramas do formulado são 5 vezes os gramas de N.',
      fases: [
        {
          id: 'plantio', titulo: 'Primeiro ano (cova e coberturas)', ano: 0, unidade: 'g/planta', criterio: 'hort', semClasse: true,
          eventos: [
            { id: 'p-cova', rotulo: 'Adubo na cova (300 g de superfosfato simples)', quando: { tipo: 'plantio' }, N: 0, P: [54, 54, 54], K: null },
            { id: 'p-1', rotulo: '1 de 4', quando: { tipo: 'rel', dias: 15, gatilho: 'a cartilha parcela em 4 vezes de novembro a março', estimado: true }, N: 10, P: null, K: [10, 10, 10] },
            { id: 'p-2', rotulo: '2 de 4', quando: { tipo: 'rel', dias: 55, gatilho: 'a cartilha parcela em 4 vezes de novembro a março', estimado: true }, N: 10, P: null, K: [10, 10, 10] },
            { id: 'p-3', rotulo: '3 de 4', quando: { tipo: 'rel', dias: 95, gatilho: 'a cartilha parcela em 4 vezes de novembro a março', estimado: true }, N: 10, P: null, K: [10, 10, 10] },
            { id: 'p-4', rotulo: '4 de 4', quando: { tipo: 'rel', dias: 135, gatilho: 'a cartilha parcela em 4 vezes de novembro a março', estimado: true }, N: 10, P: null, K: [10, 10, 10] }
          ],
          total: { N: 40, P: [54, 54, 54], K: [40, 40, 40] }
        },
        {
          id: 'producao', titulo: 'Produção (a partir do 2º ano)', ano: 1, emDiante: true, unidade: 'g/planta', criterio: 'cap5', semClasse: true,
          eventos: [
            { id: 'pr-nov', rotulo: 'Cobertura de novembro', quando: { tipo: 'mes', mes: 11, estimado: true }, N: 10, P: null, K: [10, 10, 10] },
            { id: 'pr-jan', rotulo: 'Cobertura de janeiro', quando: { tipo: 'mes', mes: 1, estimado: true }, N: 10, P: null, K: [10, 10, 10] },
            { id: 'pr-mar', rotulo: 'Cobertura de março', quando: { tipo: 'mes', mes: 3, estimado: true }, N: 10, P: null, K: [10, 10, 10] }
          ],
          total: { N: 30, P: [0, 0, 0], K: [30, 30, 30] }
        }
      ]
    })
  };

  G.culturas = culturas;
  G.ordemCulturas = ['cafe', 'milho', 'feijao', 'frutas'];
  G.frutas = ['banana', 'citros', 'manga', 'mamao', 'maracuja', 'pitaya'];
})((globalThis.Guia = globalThis.Guia || {}));
