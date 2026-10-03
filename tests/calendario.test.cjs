/*
 * Cenários do calendário: plantio futuro e passado, perene com anos de idade, prazo de calagem vencido,
 * virada de ano. Rodar: node --test "tests/*.test.cjs"
 */
const test = require('node:test');
const assert = require('node:assert/strict');

require('../js/dados-base.js');
require('../js/dados-culturas.js');
require('../js/motor.js');
require('../js/calendario.js');

const G = globalThis.Guia;
const M = G.motor;
const K = G.calendario;

const HOJE = '2026-10-03';
const solo = { pH: 5.0, P: 4, K: 55, Ca: 0.8, Mg: 0.3, Al: 0.9, HAl: 6.5, argila: 40 };
const sub = { Ca: 0.2, Mg: 0.1, Al: 0.7 };

const montar = (cultura, variante, plantio, hoje = HOJE, extra = {}) => {
  const plano = M.plano(Object.assign({ cultura, variante, analise: solo, subsolo: sub, manejo: { PRNT: 85 } }, extra));
  assert.equal(plano.ok, true);
  return { plano, cal: K.montar(plano, { plantio, hoje }) };
};
const achar = (cal, id) => cal.marcos.find((m) => m.id === id);
const soma = (xs) => xs.reduce((s, x) => s + x, 0);

test('datas: somar dias, meses e virada de ano', () => {
  assert.equal(K.somarDias('2026-12-31', 1), '2027-01-01');
  assert.equal(K.somarMeses('2026-10-31', 4), '2027-02-28');
  assert.equal(K.diasEntre('2026-10-03', '2026-12-01'), 59);
  assert.equal(K.proximoAgosto('2027-01-18'), '2027-08-01');
  assert.equal(K.proximoAgosto('2026-08-01'), '2026-08-01');
});

test('estações das perenes: ano agrícola de agosto a julho, a partir de 3 meses depois do plantio', () => {
  const p = '2026-10-20';
  assert.equal(K.inicioDaEstacao(p, 1), '2027-08-01');
  assert.equal(K.inicioDaEstacao(p, 2), '2028-08-01');
  assert.equal(K.estacaoDe(p, '2027-03-15'), 0);
  assert.equal(K.estacaoDe(p, '2027-08-01'), 1);
  assert.equal(K.estacaoDe(p, '2028-07-31'), 1);
  assert.equal(K.estacaoDe(p, '2028-08-01'), 2);
});

// ---------------------------------------------------------------- anuais
test('milho: calagem 90 a 60 dias antes, gesso 60 antes, cobertura 30 a 38 dias depois do plantio', () => {
  const { cal } = montar('milho', { tipo: 'grao', produtividade: 7 }, '2026-12-01');
  assert.equal(achar(cal, 'amostragem').data, '2026-08-03');
  assert.equal(achar(cal, 'calagem').data, '2026-09-02');
  assert.equal(achar(cal, 'calagem').fim, '2026-10-02');
  assert.equal(achar(cal, 'gesso').data, '2026-10-02');
  assert.equal(achar(cal, 'plantio').data, '2026-12-01');
  assert.equal(achar(cal, 'cobertura-1').data, '2026-12-31');
  assert.equal(achar(cal, 'cobertura-1').fim, '2027-01-08');
  assert.equal(achar(cal, 'cobertura-1').estimado, true, 'folhas são gatilho, não dias');
});

test('milho: prazo de calagem vencido (59 dias para o plantio) gera alerta', () => {
  const { cal } = montar('milho', { tipo: 'grao', produtividade: 7 }, '2026-12-01');
  const a = cal.avisos.find((x) => x.tipo === 'calagem-atrasada');
  assert.ok(a, 'avisa do prazo');
  assert.match(a.texto, /59 dias/);
  assert.equal(achar(cal, 'calagem').estado, 'atrasado', 'preparo vencido antes de um plantio futuro está atrasado, não concluído');
});

test('milho com folga de 90 dias não gera alerta de calagem', () => {
  const { cal } = montar('milho', { tipo: 'grao', produtividade: 7 }, '2027-01-15');
  assert.equal(cal.avisos.some((x) => x.tipo === 'calagem-atrasada'), false);
});

test('milho em solo arenoso: duas coberturas com 6 e 10 folhas, soma igual à dose', () => {
  const { plano, cal } = montar('milho', { tipo: 'grao', produtividade: 7 }, '2027-01-15', HOJE, {
    analise: { pH: 5.2, P: 3, K: 20, Ca: 1, Mg: 0.4, Al: 0.2, HAl: 2.5, argila: 10 }
  });
  const c1 = achar(cal, 'cobertura-1');
  const c2 = achar(cal, 'cobertura-2');
  assert.ok(c1 && c2);
  assert.equal(c1.dose.N + c2.dose.N, plano.adubacao.cobertura.N);
  assert.equal(c2.data, '2027-03-01');
  assert.ok(c1.dose.K2O > 0 && c2.dose.K2O === 0, 'potássio vai com a primeira cobertura');
});

test('feijão nível 1: uma cobertura de 25 a 30 dias depois da emergência (emergência em 7 dias)', () => {
  const { plano, cal } = montar('feijao', { nivel: 1 }, '2027-02-10');
  const c = achar(cal, 'cobertura-1');
  assert.equal(c.data, '2027-03-14');
  assert.equal(c.fim, '2027-03-19');
  assert.equal(c.dose.N, plano.adubacao.cobertura.N);
  assert.equal(achar(cal, 'cobertura-2'), undefined);
});

test('feijão nível 3: duas coberturas, aos 20 e 30 dias depois da emergência, e molibdênio de 15 a 25', () => {
  const { plano, cal } = montar('feijao', { nivel: 3 }, '2027-02-10');
  const c1 = achar(cal, 'cobertura-1');
  const c2 = achar(cal, 'cobertura-2');
  assert.equal(c1.data, '2027-03-09');
  assert.equal(c2.data, '2027-03-19');
  assert.equal(soma([c1.dose.N, c2.dose.N]), plano.adubacao.cobertura.N);
  const mo = achar(cal, 'molibdenio');
  assert.equal(mo.data, '2027-03-04');
  assert.equal(mo.fim, '2027-03-14');
});

test('anual com plantio já passado avisa e marca as etapas vencidas', () => {
  const { cal } = montar('feijao', { nivel: 2 }, '2026-08-01');
  assert.ok(cal.avisos.some((a) => a.tipo === 'plantio-passado'));
  assert.equal(achar(cal, 'plantio').estado, 'passado');
});

test('sem calagem nem gesso necessários, o calendário não inventa essas etapas', () => {
  const plano = M.plano({
    cultura: 'feijao',
    variante: { nivel: 2 },
    analise: { pH: 6.2, P: 20, K: 130, Ca: 3.5, Mg: 1.2, Al: 0, HAl: 2.5, argila: 40 },
    subsolo: { Ca: 1.5, Mg: 0.6, Al: 0 }
  });
  const cal = K.montar(plano, { plantio: '2027-02-10', hoje: HOJE });
  assert.equal(achar(cal, 'calagem'), undefined);
  assert.equal(achar(cal, 'gesso'), undefined);
});

// ------------------------------------------------------------------ frutas
test('citros novo: cova 60 dias antes, primeira cobertura 30 dias depois do plantio, meses do manual em diante', () => {
  const { cal } = montar('citros', {}, '2026-10-20');
  assert.equal(achar(cal, 'cova').data, '2026-08-21');
  assert.equal(achar(cal, 'plantio').data, '2026-10-20');
  assert.equal(achar(cal, 'p-out').data, '2026-11-19');
  assert.equal(achar(cal, 'p-nov').data, '2026-12-19');
  assert.equal(achar(cal, 'p-jan').data, '2027-02-19');
  assert.equal(achar(cal, 'p-mar').data, '2027-04-19');
});

test('citros 1º ano: setembro a abril atravessa a virada de ano e fica em ordem', () => {
  const { cal } = montar('citros', {}, '2026-10-20');
  const ids = ['a1-set-k1', 'a1-nov-k1', 'a1-jan-k1', 'a1-abr-k1'];
  const datas = ids.map((i) => achar(cal, i).data);
  assert.deepEqual(datas, ['2027-09-15', '2027-11-15', '2028-01-15', '2028-04-15']);
  assert.deepEqual([...datas].sort(), datas);
  assert.equal(achar(cal, 'a1-set-k1').precisao, 'mes');
});

test('citros novo: todos os marcos saem em ordem cronológica', () => {
  const { cal } = montar('citros', {}, '2026-10-20');
  const datas = cal.marcos.map((m) => m.data);
  assert.deepEqual([...datas].sort(), datas);
});

test('citros com 4 anos: fase atual 4º ano, próxima parada é depois da queda das pétalas', () => {
  const { plano, cal } = montar('citros', {}, '2022-10-15');
  assert.equal(cal.fase.rotulo, '4º ano depois do plantio');
  const prox = cal.marcos.find((m) => m.estado === 'proximo');
  assert.equal(prox.id, 'a4-B-k4');
  assert.equal(prox.data, '2026-10-15');
  assert.equal(prox.estimado, true);
  assert.match(prox.gatilho, /pétala/);
  const faseA4 = plano.adubacao.fases.find((f) => f.id === 'a4');
  assert.equal(prox.dose.N, 80);
  assert.equal(prox.dose.P2O5, faseA4.eventos[1].P);
  assert.equal(achar(cal, 'a4-A-k4').estado, 'passado');
});

test('citros: dose do ano soma o total impresso na classe do solo', () => {
  const { plano, cal } = montar('citros', {}, '2022-10-15');
  const fase = plano.adubacao.fases.find((f) => f.id === 'a4');
  const doAno = cal.marcos.filter((m) => /^a4-.-k4$/.test(m.id));
  assert.equal(soma(doAno.map((m) => m.dose.N)), fase.total.N);
  assert.equal(soma(doAno.map((m) => m.dose.P2O5)), fase.total.P);
  assert.equal(soma(doAno.map((m) => m.dose.K2O)), fase.total.K);
});

test('citros velho, além do 6º ano, repete a fase "6º ano em diante"', () => {
  const { cal } = montar('citros', {}, '2015-10-15');
  assert.ok(cal.marcos.some((m) => /^a6-B-k\d+$/.test(m.id)));
  assert.ok(cal.avisos.some((a) => a.tipo === 'lavoura-formada'));
});

test('maracujá com 4 anos passa do que o manual cobre e avisa', () => {
  const { cal } = montar('maracuja', {}, '2022-10-15');
  assert.ok(cal.avisos.some((a) => a.tipo === 'alem-do-manual'));
});

test('mamão: frutificação repete a cada estação depois do pós-plantio', () => {
  const { cal } = montar('mamao', {}, '2026-10-20');
  assert.ok(cal.marcos.some((m) => m.id === 'f-out-k1'));
  assert.ok(cal.marcos.some((m) => m.id === 'f-out-k2'));
  const fev = achar(cal, 'f-fev-k1');
  assert.equal(fev.data, '2028-02-15', 'fevereiro cai no ano seguinte ao início da estação');
});

test('banana: ciclo da mãe e da filha em dias desde o plantio', () => {
  const { cal } = montar('banana', {}, '2026-10-20');
  assert.equal(achar(cal, 'mae-A').data, '2026-11-19');
  assert.equal(achar(cal, 'mae-B').data, '2027-01-18');
  assert.equal(achar(cal, 'mae-C').estimado, true);
  assert.equal(achar(cal, 'filha-A').data, '2027-10-15');
});

test('manga: estádio A antes da floração em agosto, estimado', () => {
  const { cal } = montar('manga', {}, '2022-10-15');
  const a = achar(cal, 'a4-A-k4');
  assert.equal(a.data, '2026-08-15');
  assert.equal(a.estimado, true);
});

test('plantio fora do começo das chuvas gera alerta de janela', () => {
  const { cal } = montar('citros', {}, '2027-06-10');
  assert.ok(cal.avisos.some((a) => a.tipo === 'janela'));
  const certo = montar('citros', {}, '2026-10-20').cal;
  assert.equal(certo.avisos.some((a) => a.tipo === 'janela'), false);
});

// -------------------------------------------------------------------- café
test('café novo: cova 45 dias antes e coberturas do pegamento de 40 em 40 dias até o fim das chuvas', () => {
  const { cal } = montar('cafe', { sistema: 'tradicional', sc: 30 }, '2026-11-10');
  assert.equal(achar(cal, 'cova').data, '2026-09-26');
  const pos = cal.marcos.filter((m) => /^pos-/.test(m.id));
  assert.deepEqual(pos.map((m) => m.data), ['2026-12-10', '2027-01-19', '2027-02-28']);
  assert.ok(pos.every((m) => m.data <= '2027-03-31'));
  assert.equal(pos[0].dose.K2O, 0);
  assert.ok(pos[1].dose.K2O > 0 && pos[2].dose.K2O > 0, 'potássio dividido entre a 2ª e a 3ª');
});

test('café 1º e 2º ano: 4 aplicações de outubro a março, N por aplicação do manual', () => {
  const { cal } = montar('cafe', { sistema: 'tradicional', sc: 30 }, '2026-11-10');
  const a1 = cal.marcos.filter((m) => /^ano1-/.test(m.id));
  assert.deepEqual(a1.map((m) => m.data), ['2027-10-15', '2027-11-29', '2028-01-13', '2028-02-27']);
  assert.ok(a1.every((m) => m.dose.N === 10));
  const a2 = cal.marcos.filter((m) => /^ano2-/.test(m.id));
  assert.ok(a2.every((m) => m.dose.N === 20));
});

test('café em produção: fósforo só na primeira aplicação e as doses somam o total do ano', () => {
  const { plano, cal } = montar('cafe', { sistema: 'adensado', sc: 45 }, '2021-11-01');
  const pr = plano.adubacao.producao;
  const safra = cal.marcos.filter((m) => /^prod5-/.test(m.id));
  assert.equal(safra.length, 4);
  assert.ok(safra[0].dose.P2O5 === pr.P2O5 && safra.slice(1).every((m) => m.dose.P2O5 === 0));
  assert.ok(Math.abs(soma(safra.map((m) => m.dose.N)) - pr.N) < 1e-9);
  assert.ok(Math.abs(soma(safra.map((m) => m.dose.K2O)) - pr.K2O) < 1e-9);
  assert.ok(cal.marcos.some((m) => m.id === 'foliar5'), 'análise foliar em dezembro');
});

test('café em produção em solo arenoso aumenta o parcelamento para 5', () => {
  const { cal } = montar('cafe', { sistema: 'tradicional', sc: 35 }, '2021-11-01', HOJE, {
    analise: { pH: 5.2, P: 3, K: 20, Ca: 1, Mg: 0.4, Al: 0.2, HAl: 2.5, argila: 10 }
  });
  assert.equal(cal.marcos.filter((m) => /^prod5-/.test(m.id)).length, 5);
});

test('café formado: calagem na janela de agosto a setembro que ainda vem', () => {
  const { cal } = montar('cafe', { sistema: 'tradicional', sc: 35 }, '2021-11-01');
  const c = achar(cal, 'calagem');
  assert.equal(c.data, '2027-08-15', 'em outubro a janela deste ano já passou: a próxima é a de 2027');
  assert.equal(c.fim, '2027-09-15');
});

test('estado dos marcos: passado, agora, próximo e futuro', () => {
  const { cal } = montar('feijao', { nivel: 3 }, '2027-02-10', '2027-03-10');
  const estados = new Set(cal.marcos.map((m) => m.estado));
  assert.ok(estados.has('passado'));
  assert.ok(estados.has('proximo'));
  assert.equal(cal.marcos.filter((m) => m.estado === 'proximo').length, 1);
  assert.equal(achar(cal, 'molibdenio').estado, 'agora', '10 de março está na janela de 4 a 14 de março');
});
