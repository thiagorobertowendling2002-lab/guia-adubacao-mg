/*
 * Tabelas de referência comuns a todas as culturas.
 * Fonte: CFSEMG. Recomendações para o uso de corretivos e fertilizantes em
 * Minas Gerais, 5ª Aproximação. Viçosa, 1999. Número entre parênteses = página
 * impressa no manual.
 */
(function (G) {
  'use strict';

  /** Cada lista de limites é [muito baixo, baixo, médio, bom]: valor <= limite[i] cai na classe i; acima do último = muito bom. */

  // Faixas de argila (%) em ordem decrescente: usa a primeira cujo piso é menor que a argila informada.
  const FAIXAS_ARGILA = [
    { acima: 60, rotulo: '60-100' },
    { acima: 35, rotulo: '35-60' },
    { acima: 15, rotulo: '15-35' },
    { acima: -1, rotulo: '0-15' }
  ];

  // Faixas de P-rem (mg/L): usa a primeira cujo teto é >= ao valor informado.
  const FAIXAS_PREM = [4, 10, 19, 30, 44, 60];

  const base = {
    classes5: ['muito baixo', 'baixo', 'médio', 'bom', 'muito bom'],
    classes4Cafe: ['baixo', 'médio', 'bom', 'muito bom'],

    FAIXAS_ARGILA,
    FAIXAS_PREM,

    /** Fósforo por argila e por P-rem, em três critérios do manual. */
    P: {
      // Quadro 5.3 (Cap. 5): milho, feijão e fases de crescimento/produção das frutíferas
      cap5: {
        argila: [
          [2.7, 5.4, 8.0, 12.0],
          [4.0, 8.0, 12.0, 18.0],
          [6.6, 12.0, 20.0, 30.0],
          [10.0, 20.0, 30.0, 45.0]
        ],
        prem: [
          [3.0, 4.3, 6.0, 9.0],
          [4.0, 6.0, 8.3, 12.5],
          [6.0, 8.3, 11.4, 17.5],
          [8.0, 11.4, 15.8, 24.0],
          [11.0, 15.8, 21.8, 33.0],
          [15.0, 21.8, 30.0, 45.0]
        ]
      },
      // Item 18.1.1 (p. 171): critério das hortaliças, que o manual manda usar no plantio das frutíferas.
      // A célula "baixo" da faixa 0-15% vem impressa como "48,1-80"; é erro de impressão, o correto é 40,1-80.
      hort: {
        argila: [
          [10.0, 21.0, 32.0, 48.0],
          [16.0, 32.0, 48.0, 72.0],
          [26.0, 48.0, 80.0, 120.0],
          [40.0, 80.0, 120.0, 180.0]
        ],
        prem: [
          [12.0, 17.2, 24.0, 36.0],
          [16.0, 24.0, 33.2, 50.0],
          [24.0, 33.2, 45.6, 70.0],
          [32.0, 45.6, 63.2, 96.0],
          [44.0, 63.2, 87.2, 132.0],
          [60.0, 87.2, 120.0, 180.0]
        ]
      },
      // Quadro 18.4.6.1: plantio do café (3 vezes o Quadro 5.3, arredondado pelo manual).
      // Na faixa de P-rem 0-4 o limite de "bom" vem impresso 24,0 (3 x 9,0 daria 27,0). Mantido como impresso.
      cafePlantio: {
        argila: [
          [8.0, 16.0, 24.0, 36.0],
          [12.0, 24.0, 36.0, 54.0],
          [20.0, 36.0, 60.0, 90.0],
          [30.0, 60.0, 90.0, 135.0]
        ],
        prem: [
          [9.0, 13.0, 18.0, 24.0],
          [12.0, 18.0, 25.0, 37.5],
          [18.0, 25.0, 34.2, 52.5],
          [24.0, 34.2, 47.4, 72.0],
          [33.0, 47.4, 65.4, 99.0],
          [45.0, 65.4, 90.0, 135.0]
        ]
      },
      // Quadro 18.4.6.5: manutenção do café (0,75 vez o Quadro 5.3)
      cafeManutencao: {
        argila: [
          [1.9, 4.0, 6.0, 9.0],
          [3.0, 6.0, 9.0, 13.5],
          [5.0, 9.0, 15.0, 22.5],
          [7.5, 15.0, 22.5, 33.8]
        ],
        prem: [
          [2.3, 3.2, 4.5, 6.8],
          [3.0, 4.5, 6.2, 9.4],
          [4.5, 6.2, 8.5, 13.1],
          [6.0, 8.5, 11.9, 18.0],
          [8.3, 11.9, 16.4, 24.8],
          [11.3, 16.4, 22.5, 33.8]
        ]
      }
    },

    /** Potássio (mg/dm3, Mehlich-1). Para o café são quatro classes. */
    K: {
      cap5: [15, 40, 70, 120], // Quadro 5.3
      hort: [20, 50, 90, 140], // item 18.1.1 (p. 171)
      cafe: [60, 120, 200] // Quadros 18.4.6.2 a 18.4.6.4: baixo, médio, bom, muito bom
    },

    /** Quadro 5.2: complexo de troca e matéria orgânica. */
    complexo: {
      Ca: [0.4, 1.2, 2.4, 4.0],
      Mg: [0.15, 0.45, 0.9, 1.5],
      Al: [0.2, 0.5, 1.0, 2.0],
      SB: [0.6, 1.8, 3.6, 6.0],
      HAl: [1.0, 2.5, 5.0, 9.0],
      t: [0.8, 2.3, 4.6, 8.0],
      T: [1.6, 4.3, 8.6, 15.0],
      m: [15.0, 30.0, 50.0, 75.0],
      V: [20.0, 40.0, 60.0, 80.0],
      MO: [0.7, 2.0, 4.0, 7.0]
    },

    /** Quadro 5.5: micronutrientes. */
    micro: {
      Zn: [0.4, 0.9, 1.5, 2.2],
      Mn: [2, 5, 8, 12],
      Fe: [8, 18, 30, 45],
      Cu: [0.3, 0.7, 1.2, 1.8],
      B: [0.15, 0.35, 0.6, 0.9]
    },

    /** Quadro 5.4: enxofre por P-rem. */
    S: {
      prem: [
        [1.7, 2.5, 3.6, 5.4],
        [2.4, 3.6, 5.0, 7.5],
        [3.3, 5.0, 6.9, 10.3],
        [4.6, 6.9, 9.4, 14.2],
        [6.4, 9.4, 13.0, 19.6],
        [8.9, 13.0, 18.0, 27.0]
      ]
    },

    /** Quadro 5.1: acidez ativa. Cada item vale até o limite informado. */
    pH: {
      quimica: [
        { ate: 4.49, rotulo: 'acidez muito elevada' },
        { ate: 5.0, rotulo: 'acidez elevada' },
        { ate: 6.0, rotulo: 'acidez média' },
        { ate: 6.9, rotulo: 'acidez fraca' },
        { ate: 7.0, rotulo: 'neutro' },
        { ate: 7.8, rotulo: 'alcalinidade fraca' },
        { ate: 99, rotulo: 'alcalinidade elevada' }
      ],
      agronomica: [
        { ate: 4.49, rotulo: 'muito baixo', nivel: 0 },
        { ate: 5.4, rotulo: 'baixo', nivel: 1 },
        { ate: 6.0, rotulo: 'bom', nivel: 3 },
        { ate: 7.0, rotulo: 'alto', nivel: 2 },
        { ate: 99, rotulo: 'muito alto', nivel: 1 }
      ]
    },

    /** Conversões de laudo (Cap. 4). */
    K_MG_POR_CMOLC: 391,
    NA_MG_POR_CMOLC: 230
  };

  G.base = base;
})((globalThis.Guia = globalThis.Guia || {}));
