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

  /*
   * Adubos formulados (N-P2O5-K2O em %). O método é o do Cap. 6 (p. 33 a 35): achar a fórmula com a mesma relação
   * entre os nutrientes e dividir a dose pelo teor. As fórmulas "manual" são as que o capítulo cita; as "embrapa" vêm de
   * Veloso, Botelho e Rodrigues (Embrapa Amazônia Oriental, 2020, cap. 9); a 20-00-20 é a da cartilha da pitaya (Emater-MG, 2023).
   * Item 7.2.4 do manual: teores em números inteiros, com soma de 24% ou mais.
   */
  const NUTR = ['N', 'P2O5', 'K2O'];
  const formula = (N, P2O5, K2O, origem) => {
    const rot = [N, P2O5, K2O].map((x) => String(x).padStart(2, '0')).join('-');
    return { id: 'npk-' + rot, nome: 'NPK ' + rot, N, P2O5, K2O, S: 0, origem };
  };
  const FORMULAS = [
    formula(4, 16, 8, 'manual'),
    formula(10, 10, 20, 'manual'),
    formula(10, 30, 20, 'manual'),
    formula(17, 17, 17, 'manual'),
    formula(24, 8, 12, 'manual'),
    formula(27, 3, 21, 'manual'),
    formula(10, 10, 10, 'embrapa'),
    formula(20, 5, 20, 'embrapa'),
    formula(4, 20, 20, 'embrapa'),
    formula(18, 18, 18, 'embrapa'),
    formula(10, 28, 20, 'embrapa'),
    formula(10, 20, 5, 'embrapa'),
    formula(20, 0, 20, 'emater')
  ];

  /** Relação entre os nutrientes: cada dose dividida pela menor que não é zero (20-80-40 dá 1:4:2). */
  function relacao(dose) {
    const v = NUTR.map((n) => dose[n] || 0);
    const menor = Math.min(...v.filter((x) => x > 0));
    return v.map((x) => (x > 0 ? arred(x / menor, 1) : 0));
  }

  /** Quanto um nutriente pode passar da dose para a fórmula fechar sozinha (escolha nossa, não do manual). */
  const TOLERANCIA = 0.1;

  /**
   * Adubo formulado para uma dose de N, P2O5 e K2O.
   * Cada fórmula entra na quantidade que fecha o maior número de nutrientes sem que nenhum passe da dose em mais de
   * TOLERANCIA; fórmula com nutriente que a dose não pede fica de fora. Ganha a que deixa menos nutriente por
   * completar; no empate, a de menor excesso e depois a mais concentrada.
   * O que falta vai em adubo simples (conta nossa, como a tolerância: o manual só trata da relação exata).
   * Dose com um nutriente só não tem fórmula: devolve `formula: null` e a mistura simples.
   */
  function formulado(dose, escolha) {
    const d = { N: dose.N || 0, P2O5: dose.P2O5 || 0, K2O: dose.K2O || 0 };
    const pedidos = NUTR.filter((n) => d[n] > 0);
    let melhor = null;
    if (pedidos.length > 1) {
      FORMULAS.forEach((f) => {
        if (NUTR.some((n) => f[n] > 0 && !(d[n] > 0))) return;
        // pontos em que a fórmula fecha cada nutriente; vale o maior que ainda cabe na tolerância
        const pontos = NUTR.filter((n) => f[n] > 0).map((n) => quilosDeProduto(d[n], f[n]));
        const teto = Math.min(...pontos) * (1 + TOLERANCIA);
        const kg = Math.max(...pontos.filter((x) => x <= teto + 1e-9));
        const resto = {};
        const excesso = {};
        let falta = 0;
        let sobra = 0;
        NUTR.forEach((n) => {
          const r = d[n] - (kg * f[n]) / 100;
          resto[n] = r > 1e-6 ? r : 0;
          excesso[n] = r < -1e-6 ? -r : 0;
          falta += resto[n];
          sobra += excesso[n];
        });
        const empata = (a, b) => Math.abs(a - b) <= 1e-6;
        if (
          !melhor ||
          falta < melhor.falta - 1e-6 ||
          (empata(falta, melhor.falta) && (sobra < melhor.sobra - 1e-6 || (empata(sobra, melhor.sobra) && kg < melhor.kg)))
        ) {
          melhor = { formula: f, kg, resto, excesso, falta, sobra };
        }
      });
    }
    const complemento = mistura(melhor ? melhor.resto : d, escolha);
    return {
      formula: melhor ? melhor.formula : null,
      kg: melhor ? melhor.kg : 0,
      relacao: pedidos.length ? relacao(d) : [0, 0, 0],
      nutrientes: pedidos,
      excesso: melhor ? melhor.excesso : { N: 0, P2O5: 0, K2O: 0 },
      complemento,
      totalKg: (melhor ? melhor.kg : 0) + complemento.totalKg,
      enxofreKg: complemento.enxofreKg
    };
  }

  G.produtos = {
    FONTES,
    FORMULAS,
    TOLERANCIA,
    achar,
    arred,
    quilosDeProduto,
    metrosDeSulcoPorHa,
    gramasPorMetro,
    gramasPorPlanta,
    mistura,
    relacao,
    formulado
  };
})((globalThis.Guia = globalThis.Guia || {}));
