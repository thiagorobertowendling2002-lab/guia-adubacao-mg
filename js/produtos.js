/*
 * Do nutriente ao saco: converte N, P2O5 e K2O em quilos de adubo comercial.
 * Teores = garantias mínimas da legislação, como o manual traz nos Quadros 1A a 3A
 * (Apêndice, p. 344 a 348) e na seção 10.2 (enxofre). A conta de exemplo é a do Cap. 6 (p. 33).
 */
(function (G) {
  'use strict';

  const FONTES = {
    N: [
      { id: 'ureia', nome: 'Ureia', N: 44, S: 0, nota: 'Incorporar a uns 5 cm, ou aplicar com o solo úmido, para não perder nitrogênio no ar.' },
      { id: 'sulfato-amonio', nome: 'Sulfato de amônio', N: 20, S: 24, nota: 'Leva enxofre junto (22 a 24%).' },
      { id: 'nitrato-amonio', nome: 'Nitrato de amônio', N: 32, S: 0, nota: 'Metade do nitrogênio já está na forma que a planta absorve na hora.' }
    ],
    P: [
      { id: 'sup-simples', nome: 'Superfosfato simples', P2O5: 18, N: 0, S: 12, nota: 'Leva cálcio e enxofre junto.' },
      { id: 'sup-triplo', nome: 'Superfosfato triplo', P2O5: 41, N: 0, S: 0, nota: 'Mais concentrado: menos peso para carregar.' },
      { id: 'map', nome: 'MAP (fosfato monoamônico)', P2O5: 48, N: 9, S: 0, nota: 'Traz 9% de nitrogênio, que descontamos da ureia.' }
    ],
    K: [{ id: 'kcl', nome: 'Cloreto de potássio', K2O: 58, nota: 'Em plantio, não encoste na semente: o sal queima.' }]
  };

  const achar = (grupo, id) => FONTES[grupo].find((f) => f.id === id) || FONTES[grupo][0];
  const arred = (x, c = 1) => {
    const f = Math.pow(10, c);
    return Math.round(x * f) / f;
  };

  /** kg de produto para entregar `kgNutriente` de um produto com `teor` % do nutriente. */
  const quilosDeProduto = (kgNutriente, teor) => (teor > 0 ? kgNutriente / (teor / 100) : 0);

  /** Metros de sulco em um hectare: 10.000 m2 / espaçamento entre linhas (Cap. 6, p. 33). */
  const metrosDeSulcoPorHa = (entreLinhas) => 10000 / entreLinhas;

  /** g por metro de sulco a partir de kg/ha. */
  const gramasPorMetro = (kgHa, entreLinhas) => (kgHa * 1000) / metrosDeSulcoPorHa(entreLinhas);

  /** g por planta a partir de kg/ha e plantas por hectare. */
  const gramasPorPlanta = (kgHa, plantasHa) => (kgHa * 1000) / plantasHa;

  /**
   * Mistura simples para uma dose em kg/ha de N, P2O5 e K2O.
   * O N que vem junto do MAP é descontado da fonte de nitrogênio.
   */
  function mistura(dose, escolha) {
    const fN = achar('N', escolha && escolha.N);
    const fP = achar('P', escolha && escolha.P);
    const fK = achar('K', escolha && escolha.K);
    const itens = [];

    const kgP = dose.P2O5 > 0 ? quilosDeProduto(dose.P2O5, fP.P2O5) : 0;
    const nDoP = (kgP * fP.N) / 100;
    const nFalta = Math.max(0, dose.N - nDoP);
    const kgN = nFalta > 0 ? quilosDeProduto(nFalta, fN.N) : 0;
    const kgK = dose.K2O > 0 ? quilosDeProduto(dose.K2O, fK.K2O) : 0;

    if (kgN > 0) itens.push({ grupo: 'N', produto: fN, kg: kgN });
    if (kgP > 0) itens.push({ grupo: 'P', produto: fP, kg: kgP });
    if (kgK > 0) itens.push({ grupo: 'K', produto: fK, kg: kgK });

    const enxofre = ((kgN * (fN.S || 0)) + (kgP * (fP.S || 0))) / 100;
    return {
      itens,
      totalKg: kgN + kgP + kgK,
      enxofreKg: enxofre,
      nDoFosfato: nDoP
    };
  }

  G.produtos = {
    FONTES,
    achar,
    arred,
    quilosDeProduto,
    metrosDeSulcoPorHa,
    gramasPorMetro,
    gramasPorPlanta,
    mistura
  };
})((globalThis.Guia = globalThis.Guia || {}));
