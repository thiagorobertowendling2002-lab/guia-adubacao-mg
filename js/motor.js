/*
 * Motor de cálculo: interpretação da análise, calagem, gessagem e doses por cultura.
 * Base: CFSEMG. Recomendações para o uso de corretivos e fertilizantes em Minas Gerais,
 * 5ª Aproximação. Viçosa, 1999. A seção e a página citadas em cada resultado são as do manual.
 *
 * Unidades de entrada (as do laudo mineiro): P, K, Na, Zn, B, Cu, Mn, S em mg/dm3;
 * Ca, Mg, Al, H+Al em cmolc/dm3; MO em dag/kg; argila em %; P-rem em mg/L.
 */
(function (G) {
  'use strict';

  const B = G.base;
  const C = G.culturas;

  const arred = (x, c = 2) => {
    const f = Math.pow(10, c);
    return Math.round(x * f) / f;
  };
  const num = (v) => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };
  const soma = (xs) => xs.reduce((s, x) => s + x, 0);

  /** Classe = quantos limites o valor ultrapassa (limite superior pertence à classe de baixo). */
  const classeIndice = (valor, limites) => limites.filter((l) => valor > l).length;

  // ------------------------------------------------------------------ derivados
  function derivados(a) {
    const K = num(a.K) || 0;
    const Na = num(a.Na) || 0;
    const SB = a.Ca + a.Mg + K / B.K_MG_POR_CMOLC + Na / B.NA_MG_POR_CMOLC;
    const t = SB + a.Al;
    const T = SB + a.HAl;
    return {
      SB,
      t,
      T,
      V: T > 0 ? (100 * SB) / T : 0,
      m: t > 0 ? (100 * a.Al) / t : 0
    };
  }

  // ----------------------------------------------------- Y (poder tampão do solo)
  const yArgila = (arg) => {
    const x = Math.min(100, Math.max(0, arg));
    return Math.min(4, Math.max(0, 0.0302 + 0.06532 * x - 0.000257 * x * x));
  };
  const yPrem = (p) => {
    const x = Math.min(60, Math.max(0, p));
    return Math.min(4.002, Math.max(0, 4.002 - 0.125901 * x + 0.001205 * x * x - 0.00000362 * x * x * x));
  };

  /** O manual dá preferência ao P-rem (seção 8.2.1): se vier no laudo, ele manda. */
  function yDoSolo(a) {
    const prem = num(a.prem);
    const argila = num(a.argila);
    if (prem !== null) return { Y: yPrem(prem), criterio: 'P-rem' };
    if (argila !== null) return { Y: yArgila(argila), criterio: 'argila' };
    return { Y: null, criterio: null };
  }

  const ehArenoso = (a) => {
    const { Y } = yDoSolo(a);
    return Y !== null && Y <= 1.0;
  };

  // ------------------------------------------------------- classes de fertilidade
  const linhaPrem = (p) => {
    const i = B.FAIXAS_PREM.findIndex((teto) => p <= teto);
    return i === -1 ? B.FAIXAS_PREM.length - 1 : i;
  };
  const linhaArgila = (arg) => {
    const i = B.FAIXAS_ARGILA.findIndex((f) => arg > f.acima);
    return i === -1 ? B.FAIXAS_ARGILA.length - 1 : i;
  };

  /** Classe do fósforo disponível pela tabela escolhida (cap5, hort, cafePlantio, cafeManutencao). */
  function classeP(a, quadro) {
    const tab = B.P[quadro];
    const prem = num(a.prem);
    const argila = num(a.argila);
    let limites;
    let criterio;
    if (prem !== null) {
      limites = tab.prem[linhaPrem(prem)];
      criterio = 'P-rem';
    } else if (argila !== null) {
      limites = tab.argila[linhaArgila(argila)];
      criterio = 'argila';
    } else {
      return null;
    }
    const indice = classeIndice(a.P, limites);
    return { indice, rotulo: B.classes5[indice], criterio, limites };
  }

  /** Classe do potássio: cap5 e hort têm cinco classes, café tem quatro. */
  function classeK(K, quadro) {
    const limites = B.K[quadro];
    const indice = classeIndice(K, limites);
    const rotulos = quadro === 'cafe' ? B.classes4Cafe : B.classes5;
    return { indice, rotulo: rotulos[indice], limites };
  }

  /**
   * Dose em três classes [baixa, média, boa] a partir da classe de cinco.
   * Muito baixo: 1,25 vez a dose de "baixo" (princípio geral do Cap. 5, após o Quadro 5.5).
   * Muito bom: o manual dá 0,40 vez, mas isso passaria da coluna "bom" das tabelas; usamos a de "bom".
   */
  function doseTres(arr, indice5) {
    if (!arr) return { valor: 0, nota: null };
    if (indice5 === 0) return { valor: Math.round(arr[0] * 1.25), nota: 'muito-baixo' };
    if (indice5 === 4) return { valor: arr[2], nota: 'muito-bom' };
    return { valor: arr[indice5 === 1 ? 0 : indice5 === 2 ? 1 : 2], nota: null };
  }

  // ----------------------------------------------------------- interpretação
  const ROTULOS_MENOS = ['muito baixo', 'baixo', 'médio', 'alto', 'muito alto'];

  /** Lista de leituras do laudo com a palavra do manual para cada uma. */
  function interpretar(a, d) {
    const itens = [];
    const add = (chave, rotulo, termo, valor, unidade, indice, ideal, rotulos) => {
      const classe = (rotulos || B.classes5)[indice];
      let situacao;
      if (ideal === 'mais') situacao = indice >= 3 ? 'ok' : indice === 2 ? 'atencao' : 'critico';
      else situacao = indice <= 1 ? 'ok' : indice === 2 ? 'atencao' : 'critico';
      itens.push({ chave, rotulo, termo, valor, unidade, indice, classe, ideal, situacao });
    };

    const ph = B.pH.agronomica.find((f) => a.pH <= f.ate);
    itens.push({
      chave: 'pH',
      rotulo: 'Acidez do solo',
      termo: 'pH em água',
      valor: a.pH,
      unidade: '',
      indice: B.pH.agronomica.indexOf(ph),
      classe: ph.rotulo,
      quimica: B.pH.quimica.find((f) => a.pH <= f.ate).rotulo,
      ideal: 'faixa',
      situacao: ph.rotulo === 'bom' ? 'ok' : ph.rotulo === 'alto' ? 'atencao' : 'critico'
    });

    const cp = classeP(a, 'cap5');
    if (cp) add('P', 'Fósforo', 'P Mehlich-1', a.P, 'mg/dm³', cp.indice, 'mais');
    add('K', 'Potássio', 'K Mehlich-1', a.K, 'mg/dm³', classeK(a.K, 'cap5').indice, 'mais');
    add('Ca', 'Cálcio', 'Ca²⁺', a.Ca, 'cmolc/dm³', classeIndice(a.Ca, B.complexo.Ca), 'mais');
    add('Mg', 'Magnésio', 'Mg²⁺', a.Mg, 'cmolc/dm³', classeIndice(a.Mg, B.complexo.Mg), 'mais');
    add('Al', 'Alumínio', 'Al³⁺', a.Al, 'cmolc/dm³', classeIndice(a.Al, B.complexo.Al), 'menos', ROTULOS_MENOS);
    add('m', 'Alumínio que ocupa a CTC', 'saturação por Al (m)', d.m, '%', classeIndice(d.m, B.complexo.m), 'menos', ROTULOS_MENOS);
    add('V', 'Bases que ocupam a CTC', 'saturação por bases (V)', d.V, '%', classeIndice(d.V, B.complexo.V), 'mais');
    add('SB', 'Soma de bases', 'SB', d.SB, 'cmolc/dm³', classeIndice(d.SB, B.complexo.SB), 'mais');
    add('t', 'CTC efetiva', 't', d.t, 'cmolc/dm³', classeIndice(d.t, B.complexo.t), 'mais');
    add('T', 'CTC a pH 7', 'T', d.T, 'cmolc/dm³', classeIndice(d.T, B.complexo.T), 'mais');
    add('HAl', 'Acidez potencial', 'H + Al', a.HAl, 'cmolc/dm³', classeIndice(a.HAl, B.complexo.HAl), 'menos', ROTULOS_MENOS);
    if (num(a.MO) !== null) add('MO', 'Matéria orgânica', 'M.O.', a.MO, 'dag/kg', classeIndice(a.MO, B.complexo.MO), 'mais');

    const prem = num(a.prem);
    if (num(a.S) !== null && prem !== null) {
      add('S', 'Enxofre', 'S', a.S, 'mg/dm³', classeIndice(a.S, B.S.prem[linhaPrem(prem)]), 'mais');
    }
    for (const [chave, rotulo] of [['Zn', 'Zinco'], ['B', 'Boro'], ['Cu', 'Cobre'], ['Mn', 'Manganês'], ['Fe', 'Ferro']]) {
      if (num(a[chave]) !== null) {
        const rotulos = ['muito baixo', 'baixo', 'médio', 'bom', 'alto'];
        const idx = classeIndice(a[chave], B.micro[chave]);
        itens.push({
          chave,
          rotulo,
          termo: chave,
          valor: a[chave],
          unidade: 'mg/dm³',
          indice: idx,
          classe: rotulos[idx],
          ideal: 'mais',
          situacao: idx >= 3 ? 'ok' : idx === 2 ? 'atencao' : 'critico'
        });
      }
    }
    return itens;
  }

  // ----------------------------------------------------------------- validação
  const CAMPOS_OBRIGATORIOS = [
    ['pH', 'pH em água'],
    ['P', 'Fósforo (P)'],
    ['K', 'Potássio (K)'],
    ['Ca', 'Cálcio (Ca)'],
    ['Mg', 'Magnésio (Mg)'],
    ['Al', 'Alumínio (Al)'],
    ['HAl', 'Acidez potencial (H + Al)']
  ];

  /** Converte textos do formulário em números e aponta o que falta ou parece fora do normal. */
  function validar(entrada) {
    const erros = [];
    const avisos = [];
    const a = {};
    for (const k of ['pH', 'P', 'K', 'Ca', 'Mg', 'Al', 'HAl', 'Na', 'MO', 'S', 'Zn', 'B', 'Cu', 'Mn', 'Fe', 'argila', 'prem']) {
      a[k] = num(entrada[k]);
    }
    for (const [k, nome] of CAMPOS_OBRIGATORIOS) {
      if (a[k] === null) erros.push({ campo: k, texto: `Falta preencher: ${nome}.` });
      else if (a[k] < 0) erros.push({ campo: k, texto: `${nome} não pode ser negativo.` });
    }
    if (a.argila === null && a.prem === null) {
      erros.push({ campo: 'argila', texto: 'Informe a argila (%) ou o fósforo remanescente (P-rem). O laudo costuma trazer pelo menos um dos dois.' });
    }
    if (a.argila !== null && (a.argila < 0 || a.argila > 100)) erros.push({ campo: 'argila', texto: 'Argila deve estar entre 0 e 100%.' });
    if (a.prem !== null && (a.prem < 0 || a.prem > 80)) erros.push({ campo: 'prem', texto: 'O P-rem costuma ficar entre 0 e 60 mg/L.' });
    if (a.pH !== null && (a.pH < 3 || a.pH > 10)) erros.push({ campo: 'pH', texto: 'Esse pH não parece de solo. Confira o laudo.' });

    if (a.K !== null && a.K > 0 && a.K < 2) avisos.push({ campo: 'K', texto: 'O potássio está muito baixo para mg/dm³. Se o laudo traz K em cmolc/dm³, troque a unidade ao lado do campo.' });
    if (a.Ca !== null && a.Ca > 15) avisos.push({ campo: 'Ca', texto: 'Cálcio acima de 15 cmolc/dm³ é raro. Confira a unidade do laudo.' });
    if (a.Al !== null && a.Al > 8) avisos.push({ campo: 'Al', texto: 'Alumínio acima de 8 cmolc/dm³ é raro. Confira a unidade do laudo.' });
    if (a.HAl !== null && a.HAl > 30) avisos.push({ campo: 'HAl', texto: 'H + Al acima de 30 cmolc/dm³ é raro. Confira a unidade do laudo.' });
    if (a.prem !== null && a.prem > 60) avisos.push({ campo: 'prem', texto: 'O manual traz faixas de P-rem só até 60 mg/L; usamos a última faixa.' });
    return { a, erros, avisos };
  }

  // ------------------------------------------------------------------- calagem
  /** QC = NC x (SC/100) x (PF/20) x (100/PRNT), em t/ha (seção 8.3, p. 53). */
  const quantidadeCalcario = (NC, o) => NC * (o.SC / 100) * (o.PF / 20) * (100 / o.PRNT);

  /**
   * Calcário complementar na cova ou no sulco de plantio do café (seção 18.4.6, "Adubação de plantio").
   * Onde o calcário já foi incorporado na área (0 a 20 cm), a dose na cova cai à metade:
   * g/cova = NC (t/ha) x volume de solo da cova (dm3) / 2. Exemplo do manual: 3 t/ha, cova de 40 x 40 x 40 cm
   * (64 dm3) dá 192 / 2 = 96 g, "100 g/cova"; para um metro de sulco multiplica por 2,5.
   */
  const calcarioComplementarCova = (NC, volumeDm3) => {
    const v = volumeDm3 || 64;
    const gCova = (NC * v) / 2;
    return { gCova, gMetroSulco: gCova * 2.5, volumeDm3: v };
  };

  /** PRNT = PN x RE / 100 (seção 8.4, p. 54). */
  const prnt = (pn, re) => (pn * re) / 100;

  /**
   * Necessidade de calagem (NC) e quantidade de calcário (QC).
   * Método principal: neutralizar o alumínio e elevar Ca + Mg (seção 8.2.1, p. 46).
   * Conferência: saturação por bases (8.2.2, p. 52).
   */
  function calagem(a, par, opt) {
    const o = Object.assign({ SC: 100, PF: 20, PRNT: 80 }, opt || {});
    const d = derivados(a);
    const { Y, criterio } = yDoSolo(a);
    const CA = Math.max(0, Y * (a.Al - (par.mt * d.t) / 100));
    const CD = Math.max(0, par.X - (a.Ca + a.Mg));
    const NC = CA + CD;
    const QC = quantidadeCalcario(NC, o);

    const NCbases = Math.max(0, (d.T * (par.Ve - d.V)) / 100);
    const bases = par.veSomenteSeVMenorQue == null ? true : d.V < par.veSomenteSeVMenorQue;
    const QCbases = quantidadeCalcario(NCbases, o);

    const alertas = [];
    if (par.tetoPorAplicacao && QC > par.tetoPorAplicacao) {
      alertas.push({
        tipo: 'dose-alta',
        texto: `A dose passa de ${par.tetoPorAplicacao} t/ha, o máximo que o manual aceita por aplicação. Divida em duas aplicações, com a segunda depois de uns 6 meses, ou até um ano, e analise o solo de novo.`
      });
    }
    return {
      Y: arred(Y, 2),
      criterioY: criterio,
      CA: arred(CA, 2),
      CD: arred(CD, 2),
      NC: arred(NC, 2),
      QC: arred(QC, 2),
      precisa: NC > 0.005,
      porAl: CA > 0.005,
      porCaMg: CD > 0.005,
      bases: { NC: arred(NCbases, 2), QC: arred(QCbases, 2), Ve: par.Ve, aplicavel: bases },
      parametros: { mt: par.mt, X: par.X, Ve: par.Ve },
      usar: o,
      dolomitico: !!par.dolomitico || a.Mg <= B.complexo.Mg[1],
      dolomiticoObrigatorio: !!par.dolomitico,
      alertas
    };
  }

  // -------------------------------------------------------------------- gesso
  const ngArgila = (arg) => {
    const x = Math.min(100, Math.max(0, arg));
    return Math.max(0, 0.00034 - 0.002445 * Math.sqrt(x) + 0.0338886 * x - 0.00176366 * Math.pow(x, 1.5));
  };
  const caPrem = (p) => {
    const x = Math.min(60, Math.max(0, p));
    return Math.max(0, 315.8 - 25.5066 * Math.sqrt(x) - 5.70675 * x + 0.485335 * Math.pow(x, 1.5));
  };

  /**
   * Gessagem do subsolo (capítulo 10, seção 10.3, p. 69).
   * Indicado quando, na camada de 20 a 40 cm: Ca <= 0,4 e/ou Al > 0,5 e/ou m > 30%.
   */
  function gesso(sub, solo, par, opt) {
    const o = Object.assign({ SC: 100, EC: 20 }, opt || {});
    const Ca = num(sub && sub.Ca);
    const Al = num(sub && sub.Al);
    if (Ca === null || Al === null) return { avaliado: false };

    const Mg = num(sub.Mg);
    const K = num(sub.K) || 0;
    let m = null;
    if (Mg !== null) {
      const t = Ca + Mg + K / B.K_MG_POR_CMOLC + Al;
      m = (100 * Al) / t;
    }
    const motivos = [];
    if (Ca <= 0.4) motivos.push('pouco cálcio (0,4 cmolc/dm³ ou menos)');
    if (Al > 0.5) motivos.push('alumínio acima de 0,5 cmolc/dm³');
    if (m !== null && m > 30) motivos.push('mais de 30% da CTC ocupada por alumínio');
    const indicado = motivos.length > 0;
    if (!indicado) return { avaliado: true, indicado: false, motivos, Ca, Al, m: m === null ? null : arred(m, 1) };

    const premSub = num(sub.prem);
    const argSub = num(sub.argila);
    const premSolo = num(solo.prem);
    const argSolo = num(solo.argila);
    let NG;
    let metodo;
    let nota = null;
    if (premSub !== null || (argSub === null && premSolo !== null)) {
      const p = premSub !== null ? premSub : premSolo;
      NG = caPrem(p) / (10 * 18.75);
      metodo = 'P-rem';
      if (premSub === null) nota = 'Usamos o P-rem da camada de cima; se tiver o do subsolo, informe para afinar.';
    } else {
      const arg = argSub !== null ? argSub : argSolo;
      NG = ngArgila(arg);
      metodo = 'argila';
      if (argSub === null) nota = 'Usamos a argila da camada de cima; se tiver a do subsolo, informe para afinar.';
    }
    const QG = NG * (o.EC / 20) * (o.SC / 100);

    // Conferência: 25% da necessidade de calagem da camada de baixo (seção 10.3.3).
    let alternativa = null;
    if (Mg !== null && par) {
      const t = Ca + Mg + K / B.K_MG_POR_CMOLC + Al;
      const fakeA = { argila: argSub !== null ? argSub : argSolo, prem: premSub !== null ? premSub : premSolo };
      const { Y } = yDoSolo(fakeA);
      if (Y !== null) {
        const ncSub = Math.max(0, Y * (Al - (par.mt * t) / 100)) + Math.max(0, par.X - (Ca + Mg));
        alternativa = { NG: arred(0.25 * ncSub, 2), QG: arred(0.25 * ncSub * (o.EC / 20) * (o.SC / 100), 2) };
      }
    }
    return {
      avaliado: true,
      indicado: true,
      motivos,
      Ca,
      Al,
      m: m === null ? null : arred(m, 1),
      NG: arred(NG, 3),
      QG: arred(QG, 2),
      metodo,
      nota,
      alternativa,
      usar: o
    };
  }

  // -------------------------------------------------------------- adubação
  const densidade = (esp) => (esp && esp.entreLinhas && esp.entrePlantas ? 10000 / (esp.entreLinhas * esp.entrePlantas) : null);

  /** Frutíferas: converte as tabelas de cada fase na dose do solo analisado. */
  function adubacaoFases(cult, a) {
    const cls = {};
    for (const crit of ['hort', 'cap5']) cls[crit] = { P: classeP(a, crit), K: classeK(a.K, crit) };
    const fase = (f) => {
      const c = cls[f.criterio];
      const notas = new Set();
      // semClasse: a fonte dá dose fixa (pitaya), sem coluna por classe de fertilidade.
      const dose = f.semClasse ? (arr) => ({ valor: arr[0], nota: null }) : (arr, i5) => doseTres(arr, i5);
      const eventos = f.eventos.map((e) => {
        const p = e.P ? dose(e.P, c.P.indice) : { valor: 0, nota: null };
        const k = e.K ? dose(e.K, c.K.indice) : { valor: 0, nota: null };
        if (p.nota && e.P) notas.add('P-' + p.nota);
        if (k.nota && e.K) notas.add('K-' + k.nota);
        return Object.assign({}, e, { N: e.N, P: p.valor, K: k.valor });
      });
      return Object.assign({}, f, {
        eventos,
        total: { N: soma(eventos.map((e) => e.N)), P: soma(eventos.map((e) => e.P)), K: soma(eventos.map((e) => e.K)) },
        classeP: c.P,
        classeK: c.K,
        notas: Array.from(notas)
      });
    };
    const fases = cult.fases.map(fase);
    return { fases, aposPoda: cult.aposPoda ? fase(Object.assign({ id: 'poda' }, cult.aposPoda)) : null };
  }

  /**
   * Café em três fases (seção 18.4.6, p. 289):
   *  - plantio: cova, pós-plantio, 1º e 2º ano;
   *  - producao: lavoura formada em safra (Quadros 18.4.6.4 e 18.4.6.5);
   *  - poda: "Adubação de cafeeiros podados". Recepa e esqueletamento: no 1º ano depois da poda vale a adubação do 2º ano
   *    (dispensada se as brotações forem vigorosas) e do 2º ano em diante a de produção. Demais podas: a de produção.
   */
  function adubacaoCafe(a, ent) {
    const cafe = C.cafe;
    const fase = ['plantio', 'producao', 'poda'].includes(ent.fase) ? ent.fase : 'plantio';
    const poda = { tipo: ent.poda === 'outra' ? 'outra' : 'recepa', vigorosa: !!ent.vigorosa };
    const cP = classeP(a, 'cafePlantio');
    const cK = classeK(a.K, 'cafe');
    const cPm = classeP(a, 'cafeManutencao');
    const sc = num(ent.sc) || 30;
    const faixa = classeIndice(sc, cafe.producao.faixasSc);

    const nFol = num(ent.Nfoliar);
    let colN = 3;
    let notaN = 'dose preestabelecida (sem análise foliar)';
    if (nFol !== null) {
      colN = nFol <= cafe.producao.Nfoliar.baixoAte ? 0 : nFol <= cafe.producao.Nfoliar.adequadoAte ? 1 : 2;
      notaN = ['teor foliar baixo', 'teor foliar adequado', 'teor foliar alto'][colN];
    }
    const Nano = cafe.producao.N[faixa][colN];
    const Kano = cafe.producao.K[faixa][cK.indice];
    const Pano = cafe.producao.P[faixa][cPm.indice];
    const faixasRotulo = ['até 20', '20 a 30', '30 a 40', '40 a 50', '50 a 60', 'mais de 60'][faixa];

    // Micronutrientes (Quadro 18.4.6.7): só entram os que vieram no laudo.
    const micros = [];
    for (const [elemento, info] of Object.entries(cafe.micros)) {
      const v = num(a[elemento]);
      if (v === null) continue;
      const idx = classeIndice(v, info.limites);
      micros.push({ elemento, valor: v, classe: ['baixo', 'médio', 'bom', 'alto'][idx], dose_kg_ha: info.dose[idx], extrator: info.extrator });
    }

    return {
      fase,
      poda,
      cova: { P2O5_g_cova: cafe.plantio.P_g_cova[cP.indice], classeP: cP },
      posPlantio: { N_g_cova_aplicacao: cafe.posPlantio.N_g_cova_aplicacao, K2O_g_cova_ano: cafe.posPlantio.K_g_cova_ano[cK.indice], classeK: cK },
      ano1: { N_g_cova_aplicacao: cafe.formacao[1].N_g_cova_aplicacao, K2O_g_cova_ano: cafe.formacao[1].K_g_cova_ano[cK.indice] },
      ano2: { N_g_cova_aplicacao: cafe.formacao[2].N_g_cova_aplicacao, K2O_g_cova_ano: cafe.formacao[2].K_g_cova_ano[cK.indice] },
      // 1º ano depois da recepa ou do esqueletamento = adubação do 2º ano; dispensada com brotação vigorosa.
      posPoda:
        fase === 'poda' && poda.tipo === 'recepa'
          ? { N_g_cova_aplicacao: cafe.formacao[2].N_g_cova_aplicacao, K2O_g_cova_ano: cafe.formacao[2].K_g_cova_ano[cK.indice], dispensada: poda.vigorosa, classeK: cK }
          : null,
      producao: {
        sc,
        faixaSc: faixasRotulo,
        N: Nano,
        P2O5: Pano,
        K2O: Kano,
        S: arred(Nano * cafe.producao.enxofreFracaoDoN, 0),
        notaN,
        classeP: cPm,
        classeK: cK,
        micros
      }
    };
  }

  /** Milho em grão ou silagem (seção 18.4.13, p. 314). */
  function adubacaoMilho(a, ent) {
    const mi = C.milho;
    const v = mi.variantes[ent.tipo === 'silagem' ? 'silagem' : 'grao'];
    const prod = num(ent.produtividade);
    let i = v.faixas.findIndex((f) => (prod === null ? false : prod <= f.ate));
    if (prod === null) i = 0;
    if (i === -1) i = v.faixas.length - 1;
    const f = v.faixas[i];
    const cP = classeP(a, 'cap5');
    const cK = classeK(a.K, 'cap5');
    const p = doseTres(f.P, cP.indice);
    const k = doseTres(f.K, cK.indice);
    const arenoso = ehArenoso(a);

    let Nplantio = (f.N_plantio[0] + f.N_plantio[1]) / 2;
    const notas = [];
    if (ent.plantioDireto) {
      Nplantio = 30;
      notas.push('Plantio direto: o manual manda subir o N de plantio para 30 kg/ha.');
    }
    let Ncob = f.N_cobertura;
    if (ent.sojaAntes) {
      Ncob = Math.max(0, Ncob - 20);
      notas.push('Depois de soja (sucessão ou rotação): tiramos 20 kg/ha de N da cobertura.');
    }
    const dividirK = arenoso || k.valor > 80;
    return {
      variante: v.nome,
      faixa: f.rotulo,
      arenoso,
      plantio: {
        N: Nplantio,
        NFaixa: f.N_plantio,
        P2O5: p.valor,
        K2O: dividirK ? Math.round(k.valor / 2) : k.valor
      },
      cobertura: {
        N: Ncob,
        parcelas: arenoso ? 2 : 1,
        K2O: dividirK ? k.valor - Math.round(k.valor / 2) : 0
      },
      dividirK,
      classeP: cP,
      classeK: cK,
      notasDose: [p.nota && 'P-' + p.nota, k.nota && 'K-' + k.nota].filter(Boolean),
      notas
    };
  }

  /** Feijão por nível de tecnologia (seção 18.4.8, p. 306). */
  function adubacaoFeijao(a, ent) {
    const fe = C.feijao;
    const nivel = fe.niveis[num(ent.nivel) || 2];
    const cP = classeP(a, 'cap5');
    const cK = classeK(a.K, 'cap5');
    const p = doseTres(nivel.P, cP.indice);
    const k = doseTres(nivel.K, cK.indice);
    return {
      nivel: nivel.nome,
      descricao: nivel.descricao,
      produtividade: nivel.produtividade,
      plantio: { N: nivel.N_plantio, P2O5: p.valor, K2O: k.valor },
      cobertura: { N: nivel.N_cobertura, parcelas: nivel.parcelas },
      classeP: cP,
      classeK: cK,
      notasDose: [p.nota && 'P-' + p.nota, k.nota && 'K-' + k.nota].filter(Boolean)
    };
  }

  // ------------------------------------------------------------- orquestração
  const FONTES_BASE = {
    interpretacao: { rotulo: 'Interpretação da análise', sec: 'Cap. 5', pag: 25 },
    calagem: { rotulo: 'Calagem', sec: '8.2.1', pag: 46 },
    calcarioQuantidade: { rotulo: 'Quantidade de calcário', sec: '8.3', pag: 53 },
    calagemEpoca: { rotulo: 'Época da calagem', sec: '8.5', pag: 59 },
    gesso: { rotulo: 'Gessagem', sec: '10.3', pag: 69 }
  };

  /**
   * Plano completo: entrada do formulário -> interpretação, calagem, gesso e doses.
   * Retorna { ok:false, erros } se faltar dado.
   */
  function plano(entrada) {
    const cultId = entrada.cultura;
    const cult = C[cultId];
    if (!cult) return { ok: false, erros: [{ texto: 'Escolha a lavoura.' }] };
    const val = validar(entrada.analise || {});
    if (val.erros.length) return { ok: false, erros: val.erros, avisos: val.avisos };
    const a = val.a;

    const d = derivados(a);
    const manejo = entrada.manejo || {};
    const par = cult.calagem;
    const sub = entrada.subsolo || {};
    // Cultura sem método de calagem na fonte (pitaya): o guia não calcula nem inventa parâmetros.
    const cal = par
      ? calagem(a, par, { SC: num(manejo.SC) || 100, PF: num(manejo.PF) || 20, PRNT: num(manejo.PRNT) || 80 })
      : { indisponivel: true, precisa: false, QC: 0, NC: 0, porAl: false, porCaMg: false, dolomitico: false, dolomiticoObrigatorio: false, alertas: [], parametros: null, bases: { QC: 0, aplicavel: false }, usar: { PRNT: num(manejo.PRNT) || 80, SC: num(manejo.SC) || 100, PF: num(manejo.PF) || 20 } };
    const ges = par ? gesso(sub, a, par, { SC: num(manejo.SC) || 100, EC: num(manejo.EC) || 20 }) : { avaliado: false, indisponivel: true };

    const esp = {
      entreLinhas: num(entrada.espacamento && entrada.espacamento.entreLinhas) || cult.entreLinhas,
      entrePlantas: num(entrada.espacamento && entrada.espacamento.entrePlantas) || cult.entrePlantas
    };
    const variante = entrada.variante || {};
    let adubacao;
    if (cult.grupo === 'cafe') {
      const sis = cult.sistemas[variante.sistema] || cult.sistemas.tradicional;
      esp.entreLinhas = num(entrada.espacamento && entrada.espacamento.entreLinhas) || sis.entreLinhas;
      esp.entrePlantas = num(entrada.espacamento && entrada.espacamento.entrePlantas) || sis.entrePlantas;
      adubacao = Object.assign({ tipo: 'cafe' }, adubacaoCafe(a, variante));
    } else if (cult.grupo === 'milho') {
      adubacao = Object.assign({ tipo: 'milho' }, adubacaoMilho(a, variante));
    } else if (cult.grupo === 'feijao') {
      adubacao = Object.assign({ tipo: 'feijao' }, adubacaoFeijao(a, variante));
    } else {
      adubacao = Object.assign({ tipo: 'fruta' }, adubacaoFases(cult, a));
    }

    if (adubacao.tipo === 'cafe' && adubacao.fase === 'plantio' && cal.precisa) {
      cal.complementarCova = calcarioComplementarCova(cal.NC, 64);
    }

    const avisos = val.avisos.slice();

    return {
      ok: true,
      cultura: { id: cult.id, nome: cult.nome, nomeLongo: cult.nomeLongo, tipo: cult.tipo, grupo: cult.grupo, sec: cult.sec, pag: cult.pag, obra: cult.obra || null },
      solo: { a, derivados: d, interpretacao: interpretar(a, d), arenoso: ehArenoso(a), densidade: densidade(esp), espacamento: esp },
      calagem: cal,
      gesso: ges,
      adubacao,
      avisos,
      fontes: FONTES_BASE
    };
  }

  G.motor = {
    arred,
    num,
    derivados,
    yArgila,
    yPrem,
    yDoSolo,
    ehArenoso,
    classeP,
    classeK,
    classeIndice,
    doseTres,
    interpretar,
    validar,
    calagem,
    quantidadeCalcario,
    calcarioComplementarCova,
    prnt,
    gesso,
    ngArgila,
    caPrem,
    densidade,
    adubacaoFases,
    adubacaoCafe,
    adubacaoMilho,
    adubacaoFeijao,
    plano,
    FONTES_BASE
  };
})((globalThis.Guia = globalThis.Guia || {}));
