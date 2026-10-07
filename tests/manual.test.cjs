/*
 * Reproduz os exemplos resolvidos do próprio manual (CFSEMG, 1999) e confere a transcrição das tabelas.
 * Rodar: node --test tests/
 */
const test = require('node:test');
const assert = require('node:assert/strict');

require('../js/dados-base.js');
require('../js/dados-culturas.js');
require('../js/motor.js');
require('../js/produtos.js');

const G = globalThis.Guia;
const M = G.motor;
const P = G.produtos;

const perto = (real, esperado, tol, msg) =>
  assert.ok(Math.abs(real - esperado) <= tol, `${msg || ''} esperado ${esperado} ±${tol}, veio ${real}`);

// Solo do exemplo do cafeeiro (seção 8.2, p. 52): argila 60%, P-rem 9,4, Al 0,8, Ca 0,1, Mg 0,1, H+Al 7,8, SB 0,21.
// SB 0,21 = 0,1 + 0,1 + K/391, logo K = 0,01 x 391 = 3,91 mg/dm3.
const cafeExemplo = { pH: 4.8, P: 3, K: 3.91, Ca: 0.1, Mg: 0.1, Al: 0.8, HAl: 7.8 };

test('derivados do exemplo do café: SB 0,21, t 1,01, T 8,01, V 2,6%', () => {
  const d = M.derivados(cafeExemplo);
  perto(d.SB, 0.21, 0.001);
  perto(d.t, 1.01, 0.001);
  perto(d.T, 8.01, 0.001);
  perto(d.V, 2.6, 0.05);
});

test('calagem do café pela argila 60%: manual dá 4,94 t/ha (usa Y = 3 arredondado)', () => {
  const r = M.calagem(Object.assign({ argila: 60 }, cafeExemplo), G.culturas.cafe.calagem, {});
  perto(r.NC, 4.94, 0.03, 'NC argila');
});

test('calagem do café pelo P-rem 9,4: manual dá 4,92 t/ha (usa Y = 2,96)', () => {
  const r = M.calagem(Object.assign({ prem: 9.4 }, cafeExemplo), G.culturas.cafe.calagem, {});
  perto(r.NC, 4.92, 0.03, 'NC P-rem');
});

test('calagem do café pela saturação por bases: manual dá 4,6 t/ha', () => {
  const r = M.calagem(Object.assign({ argila: 60 }, cafeExemplo), G.culturas.cafe.calagem, {});
  perto(r.bases.NC, 4.6, 0.01);
  assert.equal(r.bases.aplicavel, true, 'V < 50%, então o critério vale para o café');
});

test('café: saturação por bases só vale com V abaixo de 50%', () => {
  const rico = Object.assign({ argila: 40 }, cafeExemplo, { Ca: 3, Mg: 1.2, Al: 0, HAl: 2 });
  const r = M.calagem(rico, G.culturas.cafe.calagem, {});
  assert.equal(r.bases.aplicavel, false);
});

test('quantidade de calcário: NC 6, SC 75%, PF 5 cm, PRNT 90 dá 1,25 t/ha', () => {
  perto(M.quantidadeCalcario(6, { SC: 75, PF: 5, PRNT: 90 }), 1.25, 0.005);
});

test('PRNT: PN 96% e RE 77,5% dão 74,4%', () => {
  perto(M.prnt(96, 77.5), 74.4, 0.05);
});

test('gesso por argila 45%: NG 0,977; QG 1,465 (camada 30 cm) e 1,10 (com SC 75%)', () => {
  perto(M.ngArgila(45), 0.977, 0.002);
  perto(M.ngArgila(45) * (30 / 20), 1.465, 0.005);
  perto(M.ngArgila(45) * (30 / 20) * 0.75, 1.1, 0.005);
});

test('gesso por P-rem 15: Ca 159,6 kg/ha, NG 0,851; QG 1,12 (SC 75%, camada 35 cm)', () => {
  perto(M.caPrem(15), 159.6, 0.3);
  const ng = M.caPrem(15) / (10 * 18.75);
  perto(ng, 0.851, 0.002);
  perto(ng * (35 / 20) * 0.75, 1.12, 0.005);
});

test('gesso: função gesso() indica pelos três critérios e calcula a dose', () => {
  const solo = { argila: 45 };
  const par = G.culturas.cafe.calagem;
  const r = M.gesso({ Ca: 0.3, Al: 0.2 }, solo, par, { SC: 75, EC: 30 });
  assert.equal(r.indicado, true);
  assert.equal(r.metodo, 'argila');
  perto(r.NG, 0.977, 0.002);
  perto(r.QG, 1.1, 0.005);

  assert.equal(M.gesso({ Ca: 1.5, Al: 0.2 }, solo, par).indicado, false);
  assert.equal(M.gesso({ Ca: 1.5, Al: 0.6 }, solo, par).indicado, true, 'Al > 0,5');
  assert.equal(M.gesso({ Ca: 0.4, Al: 0.1 }, solo, par).indicado, true, 'Ca <= 0,4');
  assert.equal(M.gesso({ Ca: 0.5, Mg: 0.2, Al: 0.5 }, solo, par).indicado, true, 'm > 30%');
  assert.equal(M.gesso({}, solo, par).avaliado, false, 'sem análise de subsolo não inventa dose');
});

test('gesso 25% da NC: exemplo 1 do manual (NC 4,8, camada de 35 cm) dá QG 2,1 t/ha', () => {
  perto(0.25 * 4.8 * (35 / 20), 2.1, 0.005);
});

test('conversão de K: 90 mg/dm3 = 0,2302 cmolc/dm3 e 373,8 kg/ha de KCl (Cap. 6)', () => {
  perto(90 / G.base.K_MG_POR_CMOLC, 0.2302, 0.0002);
  const kgKHa = 90 * 2; // 1 mg/dm3 = 2 kg/ha na camada de 0-20 cm
  const k2o = kgKHa * 1.205;
  perto(k2o / 0.58, 373.8, 0.6);
});

test('Cap. 6: 20-80-40 com ureia 44%, superfosfato simples 18% e KCl 58% dá 558,9 kg/ha', () => {
  const r = P.mistura({ N: 20, P2O5: 80, K2O: 40 }, { N: 'ureia', P: 'sup-simples', K: 'kcl' });
  perto(r.totalKg, 558.9, 0.1);
  const kg = Object.fromEntries(r.itens.map((i) => [i.produto.id, i.kg]));
  perto(kg.ureia, 45.5, 0.1);
  perto(kg['sup-simples'], 444.4, 0.1);
  perto(kg.kcl, 69, 0.1);
});

test('Cap. 6: 558,9 kg/ha em milho 0,8 m dá 44,7 g por metro de sulco', () => {
  perto(P.gramasPorMetro(558.9, 0.8), 44.7, 0.05);
  perto(P.metrosDeSulcoPorHa(0.8), 12500, 0.1);
});

test('MAP entrega 9% de N e esse N sai da ureia', () => {
  const r = P.mistura({ N: 20, P2O5: 80, K2O: 0 }, { N: 'ureia', P: 'map', K: 'kcl' });
  const kg = Object.fromEntries(r.itens.map((i) => [i.produto.id, i.kg]));
  perto(kg.map, 80 / 0.48, 0.01);
  perto(r.nDoFosfato, (80 / 0.48) * 0.09, 0.01);
  assert.ok(kg.ureia < 20 / 0.44, 'ureia menor que sem MAP');
});

// ------------------------------------------------------------- classes de fertilidade
test('classe do P pela argila (Quadro 5.3): limite superior fica na classe de baixo', () => {
  const a = { argila: 70, P: 8.0 };
  assert.equal(M.classeP(a, 'cap5').rotulo, 'médio');
  assert.equal(M.classeP({ argila: 70, P: 8.1 }, 'cap5').rotulo, 'bom');
  assert.equal(M.classeP({ argila: 70, P: 2.7 }, 'cap5').rotulo, 'muito baixo');
  assert.equal(M.classeP({ argila: 70, P: 12.1 }, 'cap5').rotulo, 'muito bom');
});

test('classe do P pelo P-rem 15 (faixa 10-19): médio até 11,4', () => {
  assert.equal(M.classeP({ prem: 15, P: 11.4 }, 'cap5').rotulo, 'médio');
  assert.equal(M.classeP({ prem: 15, P: 11.5 }, 'cap5').rotulo, 'bom');
});

test('P-rem manda sobre a argila quando os dois vêm no laudo', () => {
  const r = M.classeP({ argila: 70, prem: 15, P: 11.4 }, 'cap5');
  assert.equal(r.criterio, 'P-rem');
});

test('classe do K (Quadro 5.3): 15 / 40 / 70 / 120', () => {
  assert.equal(M.classeK(15, 'cap5').rotulo, 'muito baixo');
  assert.equal(M.classeK(16, 'cap5').rotulo, 'baixo');
  assert.equal(M.classeK(70, 'cap5').rotulo, 'médio');
  assert.equal(M.classeK(120, 'cap5').rotulo, 'bom');
  assert.equal(M.classeK(121, 'cap5').rotulo, 'muito bom');
});

test('classes de hortaliças corrigem o erro de impressão da faixa 0-15% de argila', () => {
  // 18.1.1 imprime "48,1 - 80,0" na classe baixo; o certo é 40,1 - 80,0 (4 x Quadro 5.3)
  assert.equal(M.classeP({ argila: 10, P: 41 }, 'hort').rotulo, 'baixo');
  assert.equal(M.classeP({ argila: 10, P: 39 }, 'hort').rotulo, 'muito baixo');
  assert.equal(M.classeP({ argila: 10, P: 81 }, 'hort').rotulo, 'médio');
});

// O manual arredonda os múltiplos (ex.: 3 x 2,7 = 8,1 sai impresso como 8,0). A tolerância pega só
// erro grosseiro de digitação, como o "48,1" que vem impresso no lugar de "40,1".
const tolMultiplo = (esperado) => 0.1 * esperado + 0.1;

test('o café usa 3x (plantio) e 0,75x (manutenção) o Quadro 5.3', () => {
  const b = G.base.P;
  // Inconsistência do próprio manual (Quadro 18.4.6.1, P-rem 0-4, limite de "bom"): vem impresso 24,0
  // onde 3 x 9,0 daria 27,0. Mantemos o impresso; a exceção fica registrada aqui.
  const excecoesDoManual = new Set(['plantio prem 0/3']);
  for (const tipo of ['argila', 'prem']) {
    b.cap5[tipo].forEach((linha, i) => {
      linha.forEach((v, j) => {
        if (!excecoesDoManual.has(`plantio ${tipo} ${i}/${j}`)) {
          perto(b.cafePlantio[tipo][i][j], v * 3, tolMultiplo(v * 3), `plantio ${tipo} ${i}/${j}`);
        }
        perto(b.cafeManutencao[tipo][i][j], v * 0.75, tolMultiplo(v * 0.75), `manutenção ${tipo} ${i}/${j}`);
      });
    });
  }
});

test('as tabelas de hortaliças valem 4x o Quadro 5.3', () => {
  const b = G.base.P;
  for (const tipo of ['argila', 'prem']) {
    b.cap5[tipo].forEach((linha, i) => linha.forEach((v, j) => perto(b.hort[tipo][i][j], v * 4, tolMultiplo(v * 4), `${tipo} ${i}/${j}`)));
  }
});

test('doseTres: muito baixo = 1,25 x baixo; muito bom = dose de bom', () => {
  assert.deepEqual(M.doseTres([80, 60, 30], 0), { valor: 100, nota: 'muito-baixo' });
  assert.deepEqual(M.doseTres([80, 60, 30], 1), { valor: 80, nota: null });
  assert.deepEqual(M.doseTres([80, 60, 30], 2), { valor: 60, nota: null });
  assert.deepEqual(M.doseTres([80, 60, 30], 3), { valor: 30, nota: null });
  assert.deepEqual(M.doseTres([80, 60, 30], 4), { valor: 30, nota: 'muito-bom' });
});

// -------------------------------------------- transcrição das tabelas: linhas x "Total" impresso
const soma = (xs) => xs.reduce((s, x) => s + x, 0);

for (const id of G.frutas) {
  const cult = G.culturas[id];
  const fases = cult.fases.concat(cult.aposPoda ? [Object.assign({ id: 'poda' }, cult.aposPoda)] : []);
  for (const f of fases) {
    test(`${cult.nome}, ${f.titulo || 'após a poda'}: linhas somam o Total impresso`, () => {
      assert.equal(soma(f.eventos.map((e) => e.N)), f.total.N, 'N');
      for (let i = 0; i < 3; i++) {
        assert.equal(soma(f.eventos.map((e) => (e.P ? e.P[i] : 0))), f.total.P[i], `P2O5 classe ${i}`);
        assert.equal(soma(f.eventos.map((e) => (e.K ? e.K[i] : 0))), f.total.K[i], `K2O classe ${i}`);
      }
    });
  }
}

test('café: N e K crescem com a faixa de produtividade; P não diminui', () => {
  const p = G.culturas.cafe.producao;
  for (let i = 1; i < p.N.length; i++) {
    for (let j = 0; j < 4; j++) assert.ok(p.N[i][j] >= p.N[i - 1][j], `N faixa ${i} col ${j}`);
    for (let j = 0; j < 3; j++) assert.ok(p.K[i][j] >= p.K[i - 1][j], `K faixa ${i} col ${j}`);
    for (let j = 0; j < 5; j++) assert.ok(p.P[i][j] >= p.P[i - 1][j], `P faixa ${i} col ${j}`);
  }
});

test('café: dose preestabelecida de N é igual à coluna de teor foliar baixo', () => {
  for (const linha of G.culturas.cafe.producao.N) assert.equal(linha[3], linha[0]);
});

test('milho e feijão: doses de P e K caem de baixa para boa', () => {
  for (const v of Object.values(G.culturas.milho.variantes)) {
    for (const f of v.faixas) {
      assert.ok(f.P[0] > f.P[1] && f.P[1] > f.P[2]);
      assert.ok(f.K[0] > f.K[1] && f.K[1] > f.K[2]);
    }
  }
  for (const n of Object.values(G.culturas.feijao.niveis)) {
    assert.ok(n.P[0] > n.P[1] && n.P[1] > n.P[2]);
    assert.ok(n.K[0] >= n.K[1] && n.K[1] >= n.K[2]);
  }
});

test('parâmetros de calagem conferem com o Quadro 8.1', () => {
  const esperado = {
    cafe: [25, 3.5, 60],
    milho: [15, 2.0, 60], // a seção 18.4.13 pede 60; o Quadro 8.1 traz 50
    feijao: [20, 2.0, 50],
    banana: [10, 3.0, 70],
    citros: [5, 3.0, 70],
    mamao: [5, 3.5, 80],
    manga: [10, 2.5, 60],
    maracuja: [5, 3.0, 70]
  };
  for (const [id, [mt, X, Ve]] of Object.entries(esperado)) {
    const c = G.culturas[id].calagem;
    assert.deepEqual([c.mt, c.X, c.Ve], [mt, X, Ve], id);
  }
});

// -------------------------------------------------------------------- plano ponta a ponta
const solo = { pH: 5.0, P: 4, K: 55, Ca: 0.8, Mg: 0.3, Al: 0.9, HAl: 6.5, argila: 40 };
const sub = { Ca: 0.2, Mg: 0.1, Al: 0.7 };

const cenarios = [
  ['cafe', { sistema: 'semiadensado', sc: 40 }],
  ['milho', { tipo: 'grao', produtividade: 7, sojaAntes: true }],
  ['milho', { tipo: 'silagem', produtividade: 45, plantioDireto: true }],
  ['feijao', { nivel: 3 }],
  ['banana', {}],
  ['citros', {}],
  ['manga', {}],
  ['mamao', {}],
  ['maracuja', {}]
];

for (const [cultura, variante] of cenarios) {
  test(`plano ponta a ponta: ${cultura} ${JSON.stringify(variante)} não gera NaN`, () => {
    const p = M.plano({ cultura, variante, analise: solo, subsolo: sub, manejo: { PRNT: 85 } });
    assert.equal(p.ok, true);
    const texto = JSON.stringify(p);
    assert.ok(!/NaN|null,"NaN"|Infinity/.test(texto.replace(/"ate":null/g, '')), 'sem NaN');
    assert.ok(p.calagem.NC > 0, 'esse solo precisa de calagem');
    assert.equal(p.gesso.indicado, true);
  });
}

test('plano: milho passa o teto de 6 t/ha por aplicação com solo muito ácido e argiloso', () => {
  const p = M.plano({
    cultura: 'milho',
    variante: { tipo: 'grao', produtividade: 7 },
    analise: { pH: 4.3, P: 3, K: 40, Ca: 0.1, Mg: 0.1, Al: 2.5, HAl: 14, argila: 70 },
    manejo: { PRNT: 70 }
  });
  assert.ok(p.calagem.QC > 6);
  assert.ok(p.calagem.alertas.some((a) => a.tipo === 'dose-alta'));
});

test('plano: milho depois de soja tira 20 kg/ha de N da cobertura e plantio direto vai a 30', () => {
  const base = { cultura: 'milho', analise: solo };
  const a = M.plano(Object.assign({ variante: { tipo: 'grao', produtividade: 7 } }, base)).adubacao;
  const b = M.plano(Object.assign({ variante: { tipo: 'grao', produtividade: 7, sojaAntes: true, plantioDireto: true } }, base)).adubacao;
  assert.equal(a.cobertura.N - b.cobertura.N, 20);
  assert.equal(b.plantio.N, 30);
});

test('plano: milho em solo arenoso divide N em duas coberturas e o K entre plantio e cobertura', () => {
  const p = M.plano({
    cultura: 'milho',
    variante: { tipo: 'grao', produtividade: 7 },
    analise: { pH: 5.2, P: 3, K: 20, Ca: 1, Mg: 0.4, Al: 0.2, HAl: 2.5, argila: 10 }
  });
  assert.equal(p.adubacao.arenoso, true);
  assert.equal(p.adubacao.cobertura.parcelas, 2);
  assert.ok(p.adubacao.cobertura.K2O > 0);
  assert.equal(p.adubacao.plantio.K2O + p.adubacao.cobertura.K2O, M.doseTres(G.culturas.milho.variantes.grao.faixas[1].K, 1).valor);
});

test('plano sem argila nem P-rem avisa o que falta em vez de calcular', () => {
  const p = M.plano({ cultura: 'cafe', variante: {}, analise: { pH: 5, P: 4, K: 55, Ca: 1, Mg: 0.3, Al: 0.5, HAl: 5 } });
  assert.equal(p.ok, false);
  assert.ok(p.erros.some((e) => /argila/i.test(e.texto)));
});

test('plano: solo bom não pede calcário', () => {
  const p = M.plano({
    cultura: 'feijao',
    variante: { nivel: 2 },
    analise: { pH: 6.2, P: 20, K: 130, Ca: 3.5, Mg: 1.2, Al: 0, HAl: 2.5, argila: 40 }
  });
  assert.equal(p.calagem.precisa, false);
  assert.equal(p.calagem.QC, 0);
});

// ------------------------------------------------------------------- pitaya (cartilha da Emater-MG, 2023)
test('pitaya: não inventa calagem nem gesso, e a dose não depende da classe de fertilidade', () => {
  const baixo = M.plano({ cultura: 'pitaya', variante: {}, analise: { pH: 5, P: 1, K: 10, Ca: 0.3, Mg: 0.1, Al: 1.5, HAl: 9, argila: 40 }, subsolo: { Ca: 0.1, Al: 1 } });
  const bom = M.plano({ cultura: 'pitaya', variante: {}, analise: { pH: 6, P: 40, K: 200, Ca: 4, Mg: 1.5, Al: 0, HAl: 2, argila: 40 } });
  for (const p of [baixo, bom]) {
    assert.equal(p.ok, true);
    assert.equal(p.calagem.indisponivel, true);
    assert.equal(p.calagem.QC, 0);
    assert.equal(p.gesso.indisponivel, true);
  }
  assert.deepEqual(baixo.adubacao.fases.map((f) => f.total), bom.adubacao.fases.map((f) => f.total));
  assert.deepEqual(baixo.adubacao.fases.map((f) => f.notas), [[], []]);
});

test('pitaya: NPK 20-00-20 da cartilha vira nutriente (200 g = 40 g de N e 40 g de K2O; 150 g = 30 g e 30 g)', () => {
  const p = M.plano({ cultura: 'pitaya', variante: {}, analise: solo });
  const [primeiro, producao] = p.adubacao.fases;
  assert.equal(primeiro.total.N, 200 * 0.2);
  assert.equal(primeiro.total.K, 200 * 0.2);
  assert.equal(primeiro.total.P, 300 * 0.18, '300 g de superfosfato simples a 18% de P2O5');
  assert.equal(producao.total.N, 150 * 0.2);
  assert.equal(producao.total.K, 150 * 0.2);
});

// ------------------------------------------------------------- adubo formulado (Cap. 6, p. 33 a 35)
const ESCOLHA = { N: 'ureia', P: 'sup-simples', K: 'kcl' };

test('Cap. 6: 20-80-40 tem relação 1:4:2 e pede 500 kg/ha de 4-16-8, sem completar', () => {
  assert.deepEqual(P.relacao({ N: 20, P2O5: 80, K2O: 40 }), [1, 4, 2]);
  const r = P.formulado({ N: 20, P2O5: 80, K2O: 40 }, ESCOLHA);
  assert.equal(r.formula.id, 'npk-04-16-08');
  perto(r.kg, 500, 0.001);
  assert.equal(r.complemento.itens.length, 0);
  perto(r.totalKg, 500, 0.001);
});

test('Cap. 6: 500 kg/ha em sulcos a 0,8 m dá 40 g por metro e, com 5 covas por metro, 8 g por cova', () => {
  perto(P.gramasPorMetro(500, 0.8), 40, 0.001);
  perto(P.gramasPorPlanta(500, P.metrosDeSulcoPorHa(0.8) * 5), 8, 0.001);
});

test('Embrapa (2020, cap. 9): 80-160-40 tem relação 2:4:1 e pede 800 kg/ha de 10-20-5', () => {
  assert.deepEqual(P.relacao({ N: 80, P2O5: 160, K2O: 40 }), [2, 4, 1]);
  const r = P.formulado({ N: 80, P2O5: 160, K2O: 40 }, ESCOLHA);
  assert.equal(r.formula.id, 'npk-10-20-05');
  perto(r.kg, 800, 0.001);
  assert.equal(r.complemento.itens.length, 0);
});

test('formulado: dose de um nutriente só não tem fórmula e cai no adubo simples', () => {
  const r = P.formulado({ N: 60, P2O5: 0, K2O: 0 }, ESCOLHA);
  assert.equal(r.formula, null);
  assert.deepEqual(r.nutrientes, ['N']);
  perto(r.complemento.itens[0].kg, 60 / 0.44, 0.001);
});

test('formulado: nunca escolhe fórmula com nutriente que a dose não pede', () => {
  const semK = P.formulado({ N: 20, P2O5: 80, K2O: 0 }, ESCOLHA);
  assert.ok(!semK.formula || semK.formula.K2O === 0);
  const semP = P.formulado({ N: 70, P2O5: 0, K2O: 40 }, ESCOLHA);
  assert.equal(semP.formula.id, 'npk-20-00-20');
  perto(semP.kg, 200, 0.001);
  perto(semP.complemento.itens[0].kg, 30 / 0.44, 0.001);
});

test('formulado: aceita até 10% a mais de um nutriente para a fórmula fechar sozinha', () => {
  // 4-16-8 fecha N em 475 kg e P e K em 500 kg: vai a 500 e o N passa 1 kg (5,3%)
  const r = P.formulado({ N: 19, P2O5: 80, K2O: 40 }, ESCOLHA);
  assert.equal(r.formula.id, 'npk-04-16-08');
  perto(r.kg, 500, 0.001);
  perto(r.excesso.N, 1, 0.001);
  assert.equal(r.complemento.itens.length, 0);
  // acima da tolerância não estica: 15-80-40 pediria 33% a mais de N
  const s = P.formulado({ N: 15, P2O5: 80, K2O: 40 }, ESCOLHA);
  for (const n of ['N', 'P2O5', 'K2O']) assert.ok(s.excesso[n] <= { N: 15, P2O5: 80, K2O: 40 }[n] * P.TOLERANCIA + 1e-6, n);
});

test('formulado: fórmula mais complemento entregam a dose, com excesso de no máximo 10% por nutriente', () => {
  const doses = [
    [20, 80, 40], [30, 90, 60], [10, 120, 30], [140, 0, 80], [4, 0, 15], [40, 20, 40], [25, 70, 0], [100, 30, 100], [7, 33, 12]
  ];
  for (const [N, P2O5, K2O] of doses) {
    for (const fP of ['sup-simples', 'map']) {
      const r = P.formulado({ N, P2O5, K2O }, { N: 'ureia', P: fP, K: 'kcl' });
      const dado = { N: 0, P2O5: 0, K2O: 0 };
      if (r.formula) for (const n of Object.keys(dado)) dado[n] += (r.kg * r.formula[n]) / 100;
      for (const it of r.complemento.itens) for (const n of Object.keys(dado)) dado[n] += (it.kg * (it.produto[n] || 0)) / 100;
      const dentro = (n, pedido) => {
        assert.ok(dado[n] >= pedido - 1e-6, `${N}-${P2O5}-${K2O} falta ${n}`);
        assert.ok(dado[n] <= pedido * (1 + P.TOLERANCIA) + 1e-6, `${N}-${P2O5}-${K2O} sobra ${n}`);
        perto(dado[n] - pedido, r.excesso[n], 1e-6, `${N}-${P2O5}-${K2O} excesso ${n}`);
      };
      dentro('P2O5', P2O5);
      dentro('K2O', K2O);
      // com MAP, o N que vem no fosfato pode passar do que falta; fora isso a dose de N fecha na tolerância
      if (fP === 'map') assert.ok(dado.N >= N - 1e-6, `${N}-${P2O5}-${K2O} N`);
      else dentro('N', N);
    }
  }
});

test('item 7.2.4: toda fórmula tem teores inteiros e soma de 24% ou mais', () => {
  for (const f of P.FORMULAS) {
    assert.ok([f.N, f.P2O5, f.K2O].every(Number.isInteger), f.nome);
    assert.ok(f.N + f.P2O5 + f.K2O >= 24, f.nome);
  }
});
