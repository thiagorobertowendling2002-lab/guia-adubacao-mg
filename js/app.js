/*
 * Interface do Guia de Adubação MG: três passos (lavoura, laudo, plantio) e o resultado.
 * Todo texto que vem do usuário é número ou data; ainda assim tudo passa por esc().
 */
(function () {
  'use strict';

  const G = globalThis.Guia;
  const raiz = document.getElementById('assistente');
  if (!G || !G.motor || !G.calendario || !G.produtos || !G.manejo) {
    if (raiz) raiz.textContent = 'Não foi possível carregar o guia. Recarregue a página.';
    return;
  }
  const M = G.motor;
  const K = G.calendario;
  const P = G.produtos;
  const MJ = G.manejo;
  const C = G.culturas;
  const B = G.base;

  // ------------------------------------------------------------------ utilidades
  const $ = (sel, ctx) => (ctx || document).querySelector(sel);
  const $$ = (sel, ctx) => Array.from((ctx || document).querySelectorAll(sel));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const quim = (s) =>
    esc(s)
      .replace(/P2O5/g, 'P<sub>2</sub>O<sub>5</sub>')
      .replace(/K2O/g, 'K<sub>2</sub>O')
      .replace(/Al3\+/g, 'Al<sup>3+</sup>')
      .replace(/Ca2\+/g, 'Ca<sup>2+</sup>')
      .replace(/Mg2\+/g, 'Mg<sup>2+</sup>');
  const fmt = (n, casas) => {
    if (n === null || n === undefined || Number.isNaN(n)) return '';
    return Number(n).toLocaleString('pt-BR', { maximumFractionDigits: casas === undefined ? 1 : casas, minimumFractionDigits: 0 });
  };
  const lerNumero = (txt) => {
    if (txt === null || txt === undefined) return null;
    const t = String(txt).trim().replace(/\s/g, '').replace(',', '.');
    if (t === '') return null;
    const n = Number(t);
    return Number.isFinite(n) ? n : null;
  };
  const hojeISO = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const MES3 = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
  const partes = (iso) => ({ a: Number(iso.slice(0, 4)), m: Number(iso.slice(5, 7)), d: Number(iso.slice(8, 10)) });
  const dataLonga = (iso) => {
    const p = partes(iso);
    return `${p.d} de ${K.mesNome(p.m)} de ${p.a}`;
  };

  // ------------------------------------------------------------------- ícones
  const SETA = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const SETA_VOLTA = '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M20 12H6M11 6l-6 6 6 6" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  const EMBLEMAS = {
    cafe: `
      <path d="M9 53 C22 42 33 35 52 12" class="tr" fill="none"/>
      <path d="M27 41 C17 33 20 21 34 22 C36 31 33 38 27 41Z" class="tr f-verde"/>
      <path d="M40 27 C44 17 56 18 56 29 C48 32 43 31 40 27Z" class="tr f-verde"/>
      <circle cx="19" cy="51" r="6.5" class="tr f-sinal"/>
      <circle cx="31" cy="54" r="6.5" class="tr f-sinal"/>
      <circle cx="41" cy="46" r="6" class="tr f-sinal"/>
      <path d="M17 49 C18 47 20 47 21 48" class="fino-claro" fill="none"/>`,
    milho: `
      <path d="M24 55 C10 51 7 34 11 21 C20 29 26 40 29 55Z" class="tr f-verde"/>
      <path d="M40 55 C54 51 57 34 53 21 C44 29 38 40 35 55Z" class="tr f-verde"/>
      <path d="M32 6 C43 14 45 34 39 52 L25 52 C19 34 21 14 32 6Z" class="tr f-amarelo"/>
      <path d="M32 12 V50 M26 22 H38 M25 32 H39 M26 42 H38" class="fino" fill="none"/>`,
    feijao: `
      <path d="M6 47 C8 26 28 8 58 10 C59 37 41 57 14 55 C9 55 6 52 6 47Z" class="tr f-verde"/>
      <path d="M12 50 C24 41 38 29 52 15" class="fino" fill="none"/>
      <ellipse cx="21" cy="41" rx="6.5" ry="4.8" transform="rotate(-40 21 41)" class="tr f-sinal"/>
      <ellipse cx="32" cy="31" rx="6.5" ry="4.8" transform="rotate(-40 32 31)" class="tr f-sinal"/>
      <ellipse cx="43" cy="22" rx="6.5" ry="4.8" transform="rotate(-40 43 22)" class="tr f-sinal"/>
      <path d="M18 39 C19 37 21 36 23 37" class="fino-claro" fill="none"/>`,
    frutas: `
      <circle cx="30" cy="36" r="22" class="tr f-amarelo"/>
      <circle cx="30" cy="36" r="16" class="fino f-osso"/>
      <path d="M30 36 V20 M30 36 L44 28 M30 36 L44 44 M30 36 V52 M30 36 L16 44 M30 36 L16 28" class="fino" fill="none"/>
      <path d="M43 15 C47 6 57 6 60 8 C58 18 50 21 43 15Z" class="tr f-verde"/>`
  };
  const CORES_SACO = { cafe: 'f-amarelo', milho: 'f-verde', feijao: 'f-osso', frutas: 'f-amarelo' };

  const sacoSVG = (id) => `
    <svg class="saco-svg" viewBox="0 0 160 190" aria-hidden="true" focusable="false">
      <path class="tr ${CORES_SACO[id]}" d="M16 30 L26 22 L36 30 L46 22 L56 30 L66 22 L76 30 L86 22 L96 30 L106 22 L116 30 L126 22 L136 30 L146 24 C153 82 153 134 147 178 C146 184 142 186 137 186 L23 186 C18 186 14 184 13 178 C7 134 7 82 14 24 Z"/>
      <path class="costura-svg" d="M20 46 H140" fill="none"/>
      <rect class="tr f-osso" x="32" y="58" width="96" height="108" rx="9"/>
      <g transform="translate(38 70) scale(1.3)">${EMBLEMAS[id]}</g>
    </svg>`;

  // ------------------------------------------------------------------- estado
  const CHAVE = 'guia-adubacao-mg:v1';
  const PADRAO = () => ({
    passo: 1,
    grupo: null,
    fruta: 'citros',
    variante: { sistema: 'tradicional', sc: '25', Nfoliar: '', tipo: 'grao', produtividade: '7', sojaAntes: false, plantioDireto: false, nivel: '2' },
    scTocado: false,
    prodTocada: false,
    analise: {},
    Kunidade: 'mg',
    subsolo: {},
    manejo: { PRNT: '80', SC: '100', PF: '20' },
    espacamento: { entreLinhas: '', entrePlantas: '' },
    plantio: '',
    fontes: { N: 'ureia', P: 'sup-simples', K: 'kcl' },
    filtro: null
  });
  let estado = PADRAO();
  let ultimo = null; // { plano, cal }

  const guardar = () => {
    try {
      localStorage.setItem(CHAVE, JSON.stringify(estado));
    } catch (e) {
      /* sem armazenamento: segue sem lembrar */
    }
  };
  const carregar = () => {
    try {
      const bruto = localStorage.getItem(CHAVE);
      if (!bruto) return;
      const salvo = JSON.parse(bruto);
      const base = PADRAO();
      estado = Object.assign(base, salvo, {
        variante: Object.assign(base.variante, salvo.variante),
        manejo: Object.assign(base.manejo, salvo.manejo),
        fontes: Object.assign(base.fontes, salvo.fontes),
        espacamento: Object.assign(base.espacamento, salvo.espacamento)
      });
      estado.passo = 1;
    } catch (e) {
      estado = PADRAO();
    }
  };

  const idCultura = () => (estado.grupo === 'frutas' ? estado.fruta : estado.grupo);

  // -------------------------------------------------------------- passo 1: lavoura
  const GRUPOS = [
    { id: 'cafe', nome: 'Café', sub: 'Cafeeiro' },
    { id: 'milho', nome: 'Milho', sub: 'Grão ou silagem' },
    { id: 'feijao', nome: 'Feijão', sub: 'Por nível de tecnologia' },
    { id: 'frutas', nome: 'Frutas', sub: 'Seis frutas, da banana à pitaya' }
  ];

  function passo1HTML() {
    const sacos = GRUPOS.map(
      (g) => `
      <label class="saco">
        <input class="saco-radio" type="radio" name="grupo" value="${g.id}" ${estado.grupo === g.id ? 'checked' : ''}>
        <span class="saco-corpo">
          ${sacoSVG(g.id)}
          <span class="carimbo carimbo-escolhido" aria-hidden="true">Escolhido</span>
        </span>
        <span class="saco-nome">${g.nome}</span>
        <span class="saco-sub">${g.sub}</span>
        <span class="saco-base" aria-hidden="true"></span>
      </label>`
    ).join('');
    return `
      <h2 class="passo-titulo" id="t-passo1">Qual saco você vai abrir?</h2>
      <p class="passo-dica texto">Escolha a lavoura. O guia usa as tabelas do manual para ela e para o seu solo.</p>
      <fieldset class="prateleira">
        <legend class="so-leitor">Lavoura</legend>
        ${sacos}
      </fieldset>
      <div id="variante" class="variante"></div>
      <div class="acoes">
        <p class="acoes-dica" id="dica-continuar" ${estado.grupo ? 'hidden' : ''}>Escolha uma lavoura para continuar.</p>
        <button type="button" class="botao" id="continuar-1" data-acao="ir" data-passo="2" aria-describedby="dica-continuar" ${estado.grupo ? '' : 'disabled'}>Continuar ${SETA}</button>
      </div>`;
  }

  const chip = (nome, valor, marcado, texto, extra) => `
    <label class="chip">
      <input type="radio" name="${nome}" value="${esc(valor)}" ${marcado ? 'checked' : ''}>
      <span class="chip-corpo"><span class="chip-nome">${texto}</span>${extra ? `<span class="chip-extra">${extra}</span>` : ''}</span>
    </label>`;

  function campoSimples(id, rot, termo, valor, un, dica, extraAttr) {
    return `
      <div class="campo">
        <label for="${id}"><span class="campo-nome">${rot}</span>${termo ? ` <span class="campo-termo">${termo}</span>` : ''}</label>
        <div class="entrada"><input id="${id}" type="text" inputmode="decimal" autocomplete="off" value="${esc(valor)}" ${extraAttr || ''}>${un ? `<span class="un">${un}</span>` : ''}</div>
        ${dica ? `<p class="campo-dica">${dica}</p>` : ''}
      </div>`;
  }

  function varianteHTML() {
    const v = estado.variante;
    const g = estado.grupo;
    if (!g) return '';
    if (g === 'cafe') {
      const sis = C.cafe.sistemas;
      return `
        <fieldset class="grupo-var">
          <legend>Como é a lavoura?</legend>
          <div class="chips">
            ${chip('sistema', 'tradicional', v.sistema === 'tradicional', 'Tradicional', 'até 2.500 plantas/ha')}
            ${chip('sistema', 'semiadensado', v.sistema === 'semiadensado', 'Semi-adensado', '2.500 a 5.000 plantas/ha')}
            ${chip('sistema', 'adensado', v.sistema === 'adensado', 'Adensado', '5.000 a 10.000 plantas/ha')}
          </div>
        </fieldset>
        <div class="grade-campos">
          ${campoSimples('v-sc', 'Produtividade esperada', 'sacas por hectare', v.sc, 'sc/ha', 'O manual usa de 20 a 30 sacas no tradicional, de 30 a 40 no semi-adensado e de 40 a 60 no adensado.')}
          ${campoSimples('v-Nfoliar', 'Teor de N na folha', 'se tiver análise foliar', v.Nfoliar, 'dag/kg', 'Opcional. Com ele o N da safra é ajustado; sem ele usamos a dose preestabelecida.')}
        </div>`;
    }
    if (g === 'milho') {
      return `
        <fieldset class="grupo-var">
          <legend>Para quê?</legend>
          <div class="chips">
            ${chip('tipo', 'grao', v.tipo === 'grao', 'Milho para grão', 'produtividade em t/ha')}
            ${chip('tipo', 'silagem', v.tipo === 'silagem', 'Milho para silagem', 'matéria verde em t/ha')}
          </div>
        </fieldset>
        <div class="grade-campos">
          ${campoSimples('v-produtividade', v.tipo === 'silagem' ? 'Matéria verde esperada' : 'Produtividade esperada', '', v.produtividade, 't/ha', v.tipo === 'silagem' ? 'O manual traz faixas de 30 a 40, de 40 a 50 e acima de 50 t/ha.' : 'O manual traz faixas de 4 a 6, de 6 a 8 e acima de 8 t/ha.')}
        </div>
        <div class="marcas">
          <label class="marca-caixa"><input type="checkbox" id="v-sojaAntes" ${v.sojaAntes ? 'checked' : ''}><span>A área vem de soja (sucessão ou rotação)</span></label>
          <label class="marca-caixa"><input type="checkbox" id="v-plantioDireto" ${v.plantioDireto ? 'checked' : ''}><span>Vou plantar no sistema de plantio direto</span></label>
        </div>`;
    }
    if (g === 'feijao') {
      const n = C.feijao.niveis;
      return `
        <fieldset class="grupo-var">
          <legend>Nível de tecnologia</legend>
          <div class="chips chips-largos">
            ${[1, 2, 3, 4].map((i) => chip('nivel', String(i), v.nivel === String(i), `Nível ${i}`, esc(n[i].descricao))).join('')}
          </div>
        </fieldset>`;
    }
    return `
      <fieldset class="grupo-var">
        <legend>Qual fruta?</legend>
        <div class="chips">
          ${G.frutas.map((id) => chip('fruta', id, estado.fruta === id, C[id].nomeLongo.replace(/ \(.*\)/, ''), id === 'citros' ? 'laranja, limão, tangerina' : id === 'pitaya' ? 'não é tropical; dados da Emater-MG' : '')).join('')}
        </div>
      </fieldset>`;
  }

  // ---------------------------------------------------------- passo 2: o laudo
  const CAMPOS = [
    {
      id: 'textura',
      titulo: 'Textura do solo',
      ajuda: 'Procure no laudo a coluna de argila, em %. O fósforo remanescente (P-rem) vem num ensaio à parte; com ele a leitura fica mais certa.',
      campos: [
        { k: 'argila', rot: 'Argila', termo: 'argila', un: '%' },
        { k: 'prem', rot: 'Fósforo remanescente', termo: 'P-rem', un: 'mg/L' }
      ]
    },
    {
      id: 'acidez',
      titulo: 'Acidez',
      ajuda: 'O pH vem em água. O alumínio e a acidez potencial vêm em cmolc/dm³, a unidade do complexo de troca.',
      campos: [
        { k: 'pH', rot: 'Acidez do solo', termo: 'pH em água', un: '' },
        { k: 'Al', rot: 'Alumínio', termo: 'Al<sup>3+</sup>', un: 'cmolc/dm³' },
        { k: 'HAl', rot: 'Acidez potencial', termo: 'H + Al', un: 'cmolc/dm³' }
      ]
    },
    {
      id: 'bases',
      titulo: 'Cálcio, magnésio e potássio',
      ajuda: 'Cálcio e magnésio vêm em cmolc/dm³. O potássio costuma vir em mg/dm³; se o seu laudo trouxer em cmolc/dm³, troque a unidade.',
      campos: [
        { k: 'Ca', rot: 'Cálcio', termo: 'Ca<sup>2+</sup>', un: 'cmolc/dm³' },
        { k: 'Mg', rot: 'Magnésio', termo: 'Mg<sup>2+</sup>', un: 'cmolc/dm³' },
        { k: 'K', rot: 'Potássio', termo: 'K', un: 'mg/dm³', unidadeK: true }
      ]
    },
    {
      id: 'fosforo',
      titulo: 'Fósforo',
      ajuda: 'O fósforo disponível (P), extraído com Mehlich-1, em mg/dm³.',
      campos: [{ k: 'P', rot: 'Fósforo', termo: 'P Mehlich-1', un: 'mg/dm³' }]
    }
  ];
  const OPCIONAIS = [
    { k: 'MO', rot: 'Matéria orgânica', termo: 'M.O.', un: 'dag/kg' },
    { k: 'S', rot: 'Enxofre', termo: 'S', un: 'mg/dm³' },
    { k: 'Zn', rot: 'Zinco', termo: 'Zn', un: 'mg/dm³' },
    { k: 'B', rot: 'Boro', termo: 'B', un: 'mg/dm³' },
    { k: 'Cu', rot: 'Cobre', termo: 'Cu', un: 'mg/dm³' },
    { k: 'Mn', rot: 'Manganês', termo: 'Mn', un: 'mg/dm³' },
    { k: 'Na', rot: 'Sódio', termo: 'Na', un: 'mg/dm³' }
  ];
  const SUBSOLO = [
    { k: 'Ca', rot: 'Cálcio de 20 a 40 cm', termo: 'Ca<sup>2+</sup>', un: 'cmolc/dm³' },
    { k: 'Mg', rot: 'Magnésio de 20 a 40 cm', termo: 'Mg<sup>2+</sup>', un: 'cmolc/dm³' },
    { k: 'Al', rot: 'Alumínio de 20 a 40 cm', termo: 'Al<sup>3+</sup>', un: 'cmolc/dm³' },
    { k: 'argila', rot: 'Argila de 20 a 40 cm', termo: 'argila', un: '%' },
    { k: 'prem', rot: 'P-rem de 20 a 40 cm', termo: 'P-rem', un: 'mg/L' }
  ];

  const campoLaudo = (c, escopo) => {
    const id = `${escopo}-${c.k}`;
    const val = (escopo === 'a' ? estado.analise : estado.subsolo)[c.k] || '';
    const kExtra =
      c.unidadeK && escopo === 'a'
        ? `<div class="troca-un" role="radiogroup" aria-label="Unidade do potássio">
             <label><input type="radio" name="Kunidade" value="mg" ${estado.Kunidade === 'mg' ? 'checked' : ''}><span>mg/dm³</span></label>
             <label><input type="radio" name="Kunidade" value="cmolc" ${estado.Kunidade === 'cmolc' ? 'checked' : ''}><span>cmolc/dm³</span></label>
           </div>`
        : '';
    const un = c.unidadeK && escopo === 'a' ? '<span class="un" id="un-K">' + (estado.Kunidade === 'mg' ? 'mg/dm³' : 'cmolc/dm³') + '</span>' : c.un ? `<span class="un">${c.un}</span>` : '';
    return `
      <div class="campo" data-campo="${escopo}-${c.k}">
        <label for="${id}"><span class="campo-nome">${c.rot}</span> <span class="campo-termo">${c.termo}</span></label>
        <div class="entrada"><input id="${id}" data-escopo="${escopo}" data-k="${c.k}" type="text" inputmode="decimal" autocomplete="off" value="${esc(val)}" aria-describedby="l-${id}">${un}</div>
        ${kExtra}
        <p class="leitura" id="l-${id}"></p>
      </div>`;
  };

  function passo2HTML() {
    const grupos = CAMPOS.map(
      (g) => `
      <fieldset class="grupo-laudo">
        <legend>${g.titulo}</legend>
        <p class="campo-dica texto">${g.ajuda}</p>
        <div class="grade-campos">${g.campos.map((c) => campoLaudo(c, 'a')).join('')}</div>
      </fieldset>`
    ).join('');
    const cal = estado.manejo;
    return `
      <h2 class="passo-titulo" id="t-passo2">O que o laudo diz?</h2>
      <p class="passo-dica texto">Digite os números do laudo de solo, da camada de 0 a 20 cm. Pode usar vírgula. Conforme você digita, o guia mostra como o manual classifica cada número.</p>
      <div class="erros" id="erros" role="alert" hidden></div>
      ${grupos}
      <div class="derivados" id="derivados" aria-live="polite"></div>

      <details class="mais">
        <summary>Tenho também: matéria orgânica, enxofre, zinco, boro, cobre, manganês, sódio</summary>
        <p class="campo-dica texto">Opcionais. Entram na leitura do laudo e nos cartões de manejo. O sódio entra na soma de bases.</p>
        <div class="grade-campos">${OPCIONAIS.map((c) => campoLaudo(c, 'a')).join('')}</div>
      </details>

      <details class="mais">
        <summary>Tenho o laudo do subsolo (20 a 40 cm): para saber da gessagem</summary>
        <p class="campo-dica texto">O gesso só é indicado pela análise da camada de baixo. O manual indica quando o cálcio é 0,4 ou menos, o alumínio passa de 0,5 ou o alumínio ocupa mais de 30% da CTC. Sem esse laudo, o guia não inventa dose.</p>
        <div class="grade-campos">${SUBSOLO.map((c) => campoLaudo(c, 's')).join('')}</div>
      </details>

      <details class="mais">
        <summary>Como vou aplicar o calcário</summary>
        <p class="campo-dica texto">Os padrões abaixo valem para calcário incorporado em área total. Mude se o seu caso for outro.</p>
        <div class="grade-campos">
          ${campoSimples('m-PRNT', 'Poder do calcário', 'PRNT', cal.PRNT, '%', 'Está na nota ou na etiqueta do calcário. Se não souber, deixe 80.')}
          <div class="campo">
            <label for="m-SC"><span class="campo-nome">Onde espalhar</span> <span class="campo-termo">superfície coberta</span></label>
            <select id="m-SC">
              <option value="100" ${cal.SC === '100' ? 'selected' : ''}>Na área toda</option>
              <option value="75" ${cal.SC === '75' ? 'selected' : ''}>Só na faixa das plantas (75%)</option>
            </select>
          </div>
          <div class="campo">
            <label for="m-PF"><span class="campo-nome">Até onde entra</span> <span class="campo-termo">profundidade</span></label>
            <select id="m-PF">
              <option value="20" ${cal.PF === '20' ? 'selected' : ''}>0 a 20 cm (arado e grade)</option>
              <option value="10" ${cal.PF === '10' ? 'selected' : ''}>Até 10 cm (pomar formado)</option>
              <option value="5" ${cal.PF === '5' ? 'selected' : ''}>Até 5 cm (espalhado)</option>
            </select>
          </div>
        </div>
      </details>

      <div class="acoes acoes-duas">
        <button type="button" class="botao botao-voltar" data-acao="ir" data-passo="1">${SETA_VOLTA} Voltar</button>
        <button type="button" class="botao" data-acao="validar-laudo">Continuar ${SETA}</button>
      </div>`;
  }

  // ------------------------------------------------------- leitura ao vivo do laudo
  function lerAnaliseParcial() {
    const a = {};
    for (const k of ['argila', 'prem', 'pH', 'Al', 'HAl', 'Ca', 'Mg', 'K', 'P', 'MO', 'S', 'Zn', 'B', 'Cu', 'Mn', 'Na']) {
      a[k] = lerNumero(estado.analise[k]);
    }
    if (a.K !== null && estado.Kunidade === 'cmolc') a.K = a.K * B.K_MG_POR_CMOLC;
    return a;
  }

  const ROT_MENOS = ['muito baixo', 'baixo', 'médio', 'alto', 'muito alto'];

  function leituraDe(k, a) {
    const v = a[k];
    if (v === null || v === undefined) return null;
    const cl = (idx, rotulos, ideal) => {
      const r = (rotulos || B.classes5)[idx];
      let sit;
      if (ideal === 'menos') sit = idx <= 1 ? 'ok' : idx === 2 ? 'atencao' : 'critico';
      else sit = idx >= 3 ? 'ok' : idx === 2 ? 'atencao' : 'critico';
      return { texto: r, sit };
    };
    switch (k) {
      case 'pH': {
        const ag = B.pH.agronomica.find((f) => v <= f.ate);
        const qu = B.pH.quimica.find((f) => v <= f.ate);
        return { texto: `${ag.rotulo}, ${qu.rotulo}`, sit: ag.rotulo === 'bom' ? 'ok' : ag.rotulo === 'alto' ? 'atencao' : 'critico' };
      }
      case 'Ca': return cl(M.classeIndice(v, B.complexo.Ca));
      case 'Mg': return cl(M.classeIndice(v, B.complexo.Mg));
      case 'Al': return cl(M.classeIndice(v, B.complexo.Al), ROT_MENOS, 'menos');
      case 'HAl': return cl(M.classeIndice(v, B.complexo.HAl), ROT_MENOS, 'menos');
      case 'K': return cl(M.classeK(v, 'cap5').indice);
      case 'MO': return cl(M.classeIndice(v, B.complexo.MO));
      case 'P': {
        const c = M.classeP({ P: v, argila: a.argila, prem: a.prem }, 'cap5');
        return c ? cl(c.indice) : { texto: 'informe a argila ou o P-rem para ler', sit: null };
      }
      case 'S': {
        if (a.prem === null) return { texto: 'precisa do P-rem para ler', sit: null };
        const faixa = B.FAIXAS_PREM.findIndex((t) => a.prem <= t);
        return cl(M.classeIndice(v, B.S.prem[faixa === -1 ? B.FAIXAS_PREM.length - 1 : faixa]));
      }
      case 'Zn': case 'Mn': case 'Cu': case 'B': {
        const idx = M.classeIndice(v, B.micro[k]);
        const r = ['muito baixo', 'baixo', 'médio', 'bom', 'alto'][idx];
        return { texto: r, sit: idx >= 3 ? 'ok' : idx === 2 ? 'atencao' : 'critico' };
      }
      default:
        return null;
    }
  }

  function atualizarLeituras() {
    const a = lerAnaliseParcial();
    $$('#passo-2 [data-escopo="a"]').forEach((inp) => {
      const k = inp.dataset.k;
      const alvo = $('#l-a-' + k);
      if (!alvo) return;
      const r = leituraDe(k, a);
      if (!r) {
        alvo.textContent = '';
        alvo.removeAttribute('data-sit');
        return;
      }
      alvo.textContent = r.texto;
      if (r.sit) alvo.setAttribute('data-sit', r.sit);
      else alvo.removeAttribute('data-sit');
    });
    // P depende da textura: reavalia quando ela muda (já coberto acima, a cada digitação).
    const caixa = $('#derivados');
    if (!caixa) return;
    if ([a.Ca, a.Mg, a.Al, a.HAl].some((x) => x === null)) {
      caixa.innerHTML = '<p class="campo-dica">Preencha cálcio, magnésio, alumínio e acidez potencial para ver a saturação por bases e a CTC.</p>';
      return;
    }
    const d = M.derivados({ Ca: a.Ca, Mg: a.Mg, Al: a.Al, HAl: a.HAl, K: a.K || 0, Na: a.Na || 0 });
    const item = (rot, termo, valor, un, idx, rotulos, ideal) => {
      const r = (rotulos || B.classes5)[idx];
      let sit;
      if (ideal === 'menos') sit = idx <= 1 ? 'ok' : idx === 2 ? 'atencao' : 'critico';
      else sit = idx >= 3 ? 'ok' : idx === 2 ? 'atencao' : 'critico';
      return `<div class="derivado"><span class="derivado-nome">${rot} <span class="campo-termo">${termo}</span></span><span class="derivado-valor">${fmt(valor, 1)}<span class="un-peq">${un}</span></span><span class="leitura" data-sit="${sit}">${r}</span></div>`;
    };
    caixa.innerHTML = `
      <h3 class="derivados-titulo">Calculado a partir dos seus números</h3>
      <div class="derivados-lista">
        ${item('Bases na CTC', 'saturação por bases (V)', d.V, '%', M.classeIndice(d.V, B.complexo.V))}
        ${item('Alumínio na CTC', 'saturação por Al (m)', d.m, '%', M.classeIndice(d.m, B.complexo.m), ROT_MENOS, 'menos')}
        ${item('CTC a pH 7', 'T', d.T, 'cmolc/dm³', M.classeIndice(d.T, B.complexo.T))}
        ${item('CTC efetiva', 't', d.t, 'cmolc/dm³', M.classeIndice(d.t, B.complexo.t))}
      </div>`;
  }

  // ------------------------------------------------------------- passo 3: plantio
  function passo3HTML() {
    const id = idCultura();
    const cult = C[id];
    const perene = cult.tipo === 'perene';
    const sis = cult.grupo === 'cafe' ? cult.sistemas[estado.variante.sistema] : null;
    const eL = estado.espacamento.entreLinhas || '';
    const eP = estado.espacamento.entrePlantas || '';
    const padL = sis ? sis.entreLinhas : cult.entreLinhas;
    const padP = sis ? sis.entrePlantas : cult.entrePlantas;
    return `
      <h2 class="passo-titulo" id="t-passo3">Quando você planta?</h2>
      <p class="passo-dica texto">${perene ? 'Escolha a data de plantio. Se a lavoura já está plantada, ponha a data em que foi plantada: o guia calcula a idade e mostra as próximas adubações.' : 'Escolha o dia em que vai plantar. Se já plantou, ponha a data do plantio: o guia mostra o que ainda dá tempo de fazer.'}</p>
      <div class="grade-campos">
        <div class="campo">
          <label for="d-plantio"><span class="campo-nome">Data de plantio</span></label>
          <div class="entrada"><input id="d-plantio" type="date" value="${esc(estado.plantio)}" min="1990-01-01" max="2100-12-31"></div>
          <p class="campo-dica" id="d-dica"></p>
        </div>
      </div>
      <details class="mais" ${eL || eP ? 'open' : ''}>
        <summary>Espaçamento: ${perene ? 'usamos o do manual' : 'usamos o padrão'} (mude se o seu for outro)</summary>
        <p class="campo-dica texto">${perene ? 'O espaçamento define quantas plantas cabem em um hectare, e com isso passa a dose por planta para quilos por hectare e vice-versa.' : 'O espaçamento entre linhas converte os quilos por hectare em gramas por metro de sulco.'}</p>
        <div class="grade-campos">
          ${campoSimples('e-linhas', 'Entre linhas', '', eL, 'm', `Padrão: ${fmt(padL, 2)} m`, `placeholder="${fmt(padL, 2)}"`)}
          ${perene ? campoSimples('e-plantas', 'Entre plantas', '', eP, 'm', `Padrão: ${fmt(padP, 2)} m`, `placeholder="${fmt(padP, 2)}"`) : ''}
        </div>
      </details>
      <div class="erros" id="erros3" role="alert" hidden></div>
      <div class="acoes acoes-duas">
        <button type="button" class="botao botao-voltar" data-acao="ir" data-passo="2">${SETA_VOLTA} Voltar</button>
        <button type="button" class="botao" data-acao="ver-receita">Ver a receita ${SETA}</button>
      </div>`;
  }

  function atualizarDicaData() {
    const el = $('#d-dica');
    if (!el) return;
    const v = estado.plantio;
    if (!v) {
      el.textContent = '';
      return;
    }
    const d = K.diasEntre(hojeISO(), v);
    if (d > 0) el.textContent = `Faltam ${d} ${d === 1 ? 'dia' : 'dias'} para o plantio.`;
    else if (d === 0) el.textContent = 'O plantio é hoje.';
    else {
      const cult = C[idCultura()];
      const anos = Math.round(-d / 365.25);
      el.textContent = cult.tipo === 'perene' && anos >= 1 ? `A lavoura tem cerca de ${anos} ${anos === 1 ? 'ano' : 'anos'}.` : `O plantio foi há ${-d} ${-d === 1 ? 'dia' : 'dias'}.`;
    }
  }

  // ------------------------------------------------------------ navegação
  function mostrarPasso(n) {
    estado.passo = n;
    $$('.passo').forEach((el) => {
      el.hidden = Number(el.dataset.passo) !== n;
    });
    if (n === 2) {
      $('#passo-2').innerHTML = passo2HTML();
      atualizarLeituras();
    }
    if (n === 3) {
      $('#passo-3').innerHTML = passo3HTML();
      atualizarDicaData();
    }
    $$('#cinto .parada').forEach((b) => {
      const p = Number(b.dataset.passo);
      b.toggleAttribute('data-feito', p < n);
      b.toggleAttribute('data-atual', p === n);
      if (p === n) b.setAttribute('aria-current', 'step');
      else b.removeAttribute('aria-current');
      b.disabled = p > maiorPassoLiberado();
    });
    const alvo = $(`#passo-${n} h2`);
    if (alvo) {
      alvo.setAttribute('tabindex', '-1');
      alvo.focus({ preventScroll: true });
      alvo.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    }
  }

  function maiorPassoLiberado() {
    if (!estado.grupo) return 1;
    const a = lerAnaliseParcial();
    const temLaudo = ['pH', 'P', 'K', 'Ca', 'Mg', 'Al', 'HAl'].every((k) => a[k] !== null) && (a.argila !== null || a.prem !== null);
    return temLaudo ? 3 : 2;
  }

  // ---------------------------------------------------------- montar o plano
  function entradaDoPlano() {
    const a = lerAnaliseParcial();
    const analise = {};
    for (const k of Object.keys(a)) analise[k] = a[k];
    const s = {};
    for (const k of ['Ca', 'Mg', 'Al', 'argila', 'prem']) s[k] = lerNumero(estado.subsolo[k]);
    const v = estado.variante;
    return {
      cultura: idCultura(),
      variante: {
        sistema: v.sistema,
        sc: lerNumero(v.sc),
        Nfoliar: lerNumero(v.Nfoliar),
        tipo: v.tipo,
        produtividade: lerNumero(v.produtividade),
        sojaAntes: !!v.sojaAntes,
        plantioDireto: !!v.plantioDireto,
        nivel: lerNumero(v.nivel)
      },
      analise,
      subsolo: s,
      manejo: { PRNT: lerNumero(estado.manejo.PRNT), SC: lerNumero(estado.manejo.SC), PF: lerNumero(estado.manejo.PF), EC: 20 },
      espacamento: { entreLinhas: lerNumero(estado.espacamento.entreLinhas), entrePlantas: lerNumero(estado.espacamento.entrePlantas) }
    };
  }

  function mostrarErros(el, lista) {
    if (!lista.length) {
      el.hidden = true;
      el.innerHTML = '';
      return;
    }
    el.hidden = false;
    el.innerHTML = `<p class="erros-titulo">Antes de seguir:</p><ul>${lista.map((e) => `<li>${esc(e.texto)}</li>`).join('')}</ul>`;
  }

  function validarLaudo() {
    const v = M.validar(entradaDoPlano().analise);
    $$('#passo-2 input').forEach((i) => i.removeAttribute('aria-invalid'));
    v.erros.forEach((e) => {
      const el = $('#a-' + e.campo);
      if (el) el.setAttribute('aria-invalid', 'true');
    });
    if (v.erros.length) {
      mostrarErros($('#erros'), v.erros);
      const primeiro = $('#a-' + v.erros[0].campo);
      if (primeiro) primeiro.focus();
      return;
    }
    // avisos não travam: seguem para a tela do resultado, que os mostra
    mostrarErros($('#erros'), []);
    mostrarPasso(3);
  }

  function verReceita() {
    const erros3 = $('#erros3');
    if (!estado.plantio) {
      mostrarErros(erros3, [{ texto: 'Escolha a data de plantio.' }]);
      $('#d-plantio').focus();
      return;
    }
    const plano = M.plano(entradaDoPlano());
    if (!plano.ok) {
      mostrarErros(erros3, plano.erros);
      return;
    }
    mostrarErros(erros3, []);
    const cal = K.montar(plano, { plantio: estado.plantio, hoje: hojeISO() });
    ultimo = { plano, cal };
    if (!estado.filtro) estado.filtro = plano.cultura.tipo === 'perene' ? 'proximos' : 'tudo';
    guardar();
    renderResultado();
    const res = $('#resultado');
    res.hidden = false;
    res.classList.remove('chegou');
    void res.offsetWidth;
    res.classList.add('chegou');
    res.focus({ preventScroll: true });
    res.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  }

  // ------------------------------------------------------------- resultado
  const vazioDose = (v) => v === '' || v === null || v === undefined || v === 0 || v === '0';
  const roundel = (letra, valor, un) => {
    const vazio = vazioDose(valor);
    const txt = vazio ? 'nada' : String(valor);
    return `
    <div class="roundel${vazio ? ' roundel-vazio' : ''}">
      <span class="roundel-letra">${quim(letra)}</span>
      <span class="roundel-valor${vazio ? '' : txt.length > 5 ? ' longo' : txt.length > 3 ? ' medio' : ''}">${esc(txt)}</span>
      <span class="roundel-un">${vazio ? '&nbsp;' : esc(un)}</span>
    </div>`;
  };
  const trioRoundels = (N, P, K) => `
    <div class="roundels">
      ${roundel('N', N && N[0], N && N[1])}
      ${roundel('P2O5', P && P[0], P && P[1])}
      ${roundel('K2O', K && K[0], K && K[1])}
    </div>`;

  const fonteTxt = (f) => {
    if (!f) return '';
    if (f.obra) return `${f.obra}, p. ${f.pag}`;
    const sec = /^Cap\./.test(f.sec) ? `cap. ${f.sec.replace(/^Cap\.\s*/, '')}` : `seção ${f.sec}`;
    return `Manual, ${sec}, p. ${f.pag}`;
  };
  const fonteHTML = (f) => (f ? `<p class="fonte">${fonteTxt(f)}</p>` : '');
  const lidoPor = (criterio) => (criterio === 'P-rem' ? 'pelo P-rem' : 'pela argila');

  function explicaCalagem(plano) {
    const c = plano.calagem;
    const par = c.parametros;
    const cult = plano.cultura;
    let corpo;
    if (c.indisponivel) {
      const pH = plano.solo.a.pH;
      corpo = `<p>A ${esc(cult.obra)} não traz método de calagem. Ela pede solo com pH em água entre 5,5 e 6,5 e, na cova, 300 g de calcário quando não há análise. O seu pH é <strong>${fmt(pH)}</strong>${pH < 5.5 ? ', abaixo da faixa: peça a um técnico da Emater a dose de calcário para a área toda' : pH > 6.5 ? ', acima da faixa: não aplique calcário' : ', dentro da faixa'}. Por isso o guia não calcula calcário para a pitaya.</p>`;
    } else if (c.precisa) {
      const porque =
        c.porAl && c.porCaMg
          ? 'Neutraliza o alumínio, que machuca a raiz, e levanta o cálcio e o magnésio até o que a lavoura pede.'
          : c.porAl
          ? 'Neutraliza o alumínio, que machuca a raiz.'
          : 'Levanta o cálcio e o magnésio até o que a lavoura pede.';
      corpo = `
        <p>${porque} São <strong>${fmt(c.QC, 2)} t/ha</strong> de calcário com PRNT ${fmt(c.usar.PRNT)}%, ${c.usar.SC < 100 ? 'só na faixa das plantas' : 'na área toda'}, entrando ${c.usar.PF >= 20 ? 'de 0 a 20 cm' : 'até ' + c.usar.PF + ' cm'}.${c.dolomitico ? (c.dolomiticoObrigatorio ? ' O manual manda usar calcário dolomítico nesta cultura.' : ' O magnésio do seu solo está baixo: prefira calcário dolomítico.') : ''}</p>
        <p class="nota">Para ${esc(cult.nome.toLowerCase())}, o manual aceita até ${par.mt}% do alumínio na CTC e pede ${fmt(par.X)} cmolc/dm³ de cálcio mais magnésio, ou saturação por bases de ${par.Ve}%. Conferindo pela saturação por bases${c.bases.aplicavel ? '' : ' (que no café só vale com V abaixo de 50%)'}, a dose seria ${fmt(c.bases.QC, 2)} t/ha.</p>
        ${c.alertas.map((al) => `<p class="alerta"><span class="carimbo carimbo-alerta">Atenção</span> ${esc(al.texto)}</p>`).join('')}`;
    } else {
      corpo = `<p>O seu solo não precisa de calcário para ${esc(cult.nome.toLowerCase())}: o alumínio está dentro do que a lavoura tolera e o cálcio mais o magnésio já chegam ao que ela pede.</p>`;
    }
    return `
      <div class="receita-linha">
        <h3 class="receita-nome">Calagem: de onde vem a dose</h3>
        <div class="receita-texto">${corpo}</div>
        ${fonteHTML(c.indisponivel ? { obra: cult.obra, pag: 6 } : plano.fontes.calagem)}
      </div>`;
  }

  function explicaGesso(plano) {
    const g = plano.gesso;
    let corpo;
    if (g.indisponivel) {
      corpo = '<p>A cartilha da pitaya não trata de gesso, então o guia não calcula dose de gesso para essa cultura.</p>';
    } else if (!g.avaliado) {
      corpo = `<p>Para saber da gessagem, o manual usa o laudo da camada de 20 a 40 cm. Você não informou esse laudo, então o guia não calcula dose.</p>
        <p><button type="button" class="link-botao" data-acao="abrir-subsolo">Informar o laudo do subsolo</button></p>`;
    } else if (!g.indicado) {
      corpo = '<p>No subsolo o cálcio está acima de 0,4 cmolc/dm³ e o alumínio não passa dos limites do manual. O gesso não é indicado.</p>';
    } else {
      corpo = `
        <p>Indicado porque no subsolo há ${g.motivos.map(esc).join(' e ')}. São <strong>${fmt(g.QG, 2)} t/ha</strong> de gesso, que levam cálcio e enxofre para baixo e deixam a raiz descer. Dose para uma camada de ${g.usar.EC} cm${g.usar.SC < 100 ? ', só na faixa das plantas' : ''}.</p>
        ${g.nota ? `<p class="nota">${esc(g.nota)}</p>` : ''}
        ${g.alternativa ? `<p class="nota">Conferência por outro critério do manual (um quarto da necessidade de calagem da camada de baixo): ${fmt(g.alternativa.QG, 2)} t/ha.</p>` : ''}`;
    }
    return `
      <div class="receita-linha">
        <h3 class="receita-nome">Gessagem: de onde vem a dose</h3>
        <div class="receita-texto">${corpo}</div>
        ${g.indisponivel ? '' : fonteHTML(plano.fontes.gesso)}
      </div>`;
  }

  const NOTAS_CLASSE = {
    'P-muito-baixo': 'Fósforo muito baixo: o manual não traz coluna própria; usamos 1,25 vez a dose de "baixo", pelo princípio geral do capítulo 5.',
    'K-muito-baixo': 'Potássio muito baixo: o manual não traz coluna própria; usamos 1,25 vez a dose de "baixo", pelo princípio geral do capítulo 5.',
    'P-muito-bom': 'Fósforo muito bom: o manual traz dose só até "bom"; usamos a de "bom", que é de reposição.',
    'K-muito-bom': 'Potássio muito bom: o manual traz dose só até "bom"; usamos a de "bom", que é de reposição.'
  };
  function notasDeClasse(ad) {
    const todas = new Set();
    (ad.notasDose || []).forEach((n) => todas.add(n));
    (ad.fases || []).forEach((f) => (f.notas || []).forEach((n) => todas.add(n)));
    return Array.from(todas).map((n) => NOTAS_CLASSE[n]).filter(Boolean);
  }

  function explicaAnual(plano) {
    const ad = plano.adubacao;
    const plantio = ad.plantio;
    const cob = ad.cobertura;
    const extra = (ad.notas || []).map((n) => `<p class="nota">${esc(n)}</p>`).join('');
    return `
      <div class="receita-linha">
        <h3 class="receita-nome">Adubação: como o guia chegou nela</h3>
        <div class="receita-texto">
          <p>${
            ad.tipo === 'milho'
              ? `Para ${esc(ad.variante.toLowerCase())} de ${esc(ad.faixa)}. O N de plantio fica entre ${ad.plantio.NFaixa[0]} e ${ad.plantio.NFaixa[1]} kg/ha; usamos ${fmt(plantio.N)}.`
              : `${esc(ad.nivel)}: ${esc(ad.descricao)}.`
          }</p>
          <p>${cob.parcelas === 2 ? 'O N de cobertura vai dividido em duas aplicações.' : 'O N de cobertura vai em uma aplicação.'} ${
            ad.tipo === 'milho' ? (ad.arenoso ? 'Solo arenoso: o potássio é dividido entre o plantio e a cobertura.' : ad.dividirK ? 'O potássio passa de 80 kg/ha: metade no plantio e metade na cobertura.' : '') : ''
          }</p>
          <p class="nota">Fósforo em classe <strong>${esc(ad.classeP.rotulo)}</strong>, lido ${lidoPor(ad.classeP.criterio)}. Potássio em classe <strong>${esc(ad.classeK.rotulo)}</strong>.</p>
          ${extra}
        </div>
        ${fonteHTML({ sec: plano.cultura.sec, pag: plano.cultura.pag, obra: plano.cultura.obra })}
      </div>`;
  }

  /** Uma linha por fase: texto para a tabela e pares [valor, unidade] para os roundels do rótulo. */
  function linhasFases(plano) {
    const ad = plano.adubacao;
    const par = (v, un) => (v > 0 ? [fmt(v), un] : null);
    if (ad.tipo === 'cafe') {
      const pr = ad.producao;
      return [
        { id: 'cova', rot: 'Cova de plantio', un: 'g/cova', N: '', P: fmt(ad.cova.P2O5_g_cova), K: '', obs: `Fósforo em classe ${ad.cova.classeP.rotulo}.`, rP: par(ad.cova.P2O5_g_cova, 'g/cova') },
        { id: 'pos', rot: 'Depois do plantio', un: 'g/cova', N: '3 a 5 por vez', P: '', K: fmt(ad.posPlantio.K2O_g_cova_ano) + ' por ano', obs: 'Primeira cobertura depois do pegamento, de 30 a 45 dias uma da outra, até o fim das chuvas.', rN: ['3 a 5', 'g/cova por vez'], rK: par(ad.posPlantio.K2O_g_cova_ano, 'g/cova por ano') },
        { id: 'ano1', rot: '1º ano', un: 'g/cova', N: fmt(ad.ano1.N_g_cova_aplicacao) + ' por vez', P: '', K: fmt(ad.ano1.K2O_g_cova_ano) + ' por ano', obs: 'De 3 a 4 aplicações de outubro a março.', rN: par(ad.ano1.N_g_cova_aplicacao, 'g/cova por vez'), rK: par(ad.ano1.K2O_g_cova_ano, 'g/cova por ano') },
        { id: 'ano2', rot: '2º ano', un: 'g/cova', N: fmt(ad.ano2.N_g_cova_aplicacao) + ' por vez', P: '', K: fmt(ad.ano2.K2O_g_cova_ano) + ' por ano', obs: 'De 3 a 4 aplicações de outubro a março.', rN: par(ad.ano2.N_g_cova_aplicacao, 'g/cova por vez'), rK: par(ad.ano2.K2O_g_cova_ano, 'g/cova por ano') },
        { id: 'prod', rot: 'Lavoura em produção', un: 'kg/ha por ano', N: fmt(pr.N), P: fmt(pr.P2O5), K: fmt(pr.K2O), obs: `Safra de ${pr.faixaSc} sacas/ha. N: ${pr.notaN}. Fósforo em classe ${pr.classeP.rotulo}, potássio em classe ${pr.classeK.rotulo}. Enxofre: ${fmt(pr.S)} kg/ha se as fontes não o trouxerem.`, rN: par(pr.N, 'kg/ha por ano'), rP: par(pr.P2O5, 'kg/ha por ano'), rK: par(pr.K2O, 'kg/ha por ano') }
      ];
    }
    return ad.fases.map((f) => ({
      id: f.id,
      rot: f.titulo,
      un: f.unidade,
      N: fmt(f.total.N),
      P: fmt(f.total.P),
      K: fmt(f.total.K),
      obs: f.semClasse ? 'Dose fixa da cartilha, que não separa por classe de fertilidade.' : `Fósforo em classe ${f.classeP.rotulo}, potássio em classe ${f.classeK.rotulo}.`,
      rN: par(f.total.N, f.unidade),
      rP: par(f.total.P, f.unidade),
      rK: par(f.total.K, f.unidade)
    }));
  }

  function idFaseAtual(plano, cal) {
    const r = cal.fase ? cal.fase.rotulo : '';
    const ad = plano.adubacao;
    if (ad.tipo === 'cafe') {
      return { 'Antes do plantio': 'cova', 'Depois do plantio': 'pos', '1º ano': 'ano1', '2º ano': 'ano2', 'Lavoura em produção': 'prod' }[r] || 'cova';
    }
    if (r === 'Antes do plantio') return ad.fases[0].id;
    const f = ad.fases.find((x) => x.titulo === r);
    return f ? f.id : ad.fases[ad.fases.length - 1].id;
  }

  function explicaPerene(plano, cal) {
    const linhas = linhasFases(plano);
    const atual = idFaseAtual(plano, cal);
    const ad = plano.adubacao;
    const cult = C[plano.cultura.id];
    const cru = (v) => (v === '' ? 'nada' : v);
    const tabela = `
      <div class="tabela-rolagem" tabindex="0" role="region" aria-label="Doses de cada fase">
        <table class="tabela fases">
          <caption class="so-leitor">Doses de cada fase</caption>
          <thead><tr><th scope="col">Fase</th><th scope="col">N</th><th scope="col">P<sub>2</sub>O<sub>5</sub></th><th scope="col">K<sub>2</sub>O</th><th scope="col">Unidade</th></tr></thead>
          <tbody>
            ${linhas
              .map(
                (l) => `
              <tr ${l.id === atual ? 'data-atual' : ''}>
                <th scope="row">${esc(l.rot)}<span class="un-movel"> (${esc(l.un)})</span>${l.id === atual ? ' <span class="carimbo carimbo-aqui">Você está aqui</span>' : ''}<span class="obs">${esc(l.obs)}</span></th>
                <td><span class="rot-movel">Nitrogênio</span>${esc(cru(l.N))}</td>
                <td><span class="rot-movel">Fósforo (P<sub>2</sub>O<sub>5</sub>)</span>${esc(cru(l.P))}</td>
                <td><span class="rot-movel">Potássio (K<sub>2</sub>O)</span>${esc(cru(l.K))}</td>
                <td class="un-col">${esc(l.un)}</td>
              </tr>`
              )
              .join('')}
          </tbody>
        </table>
      </div>`;
    const extra = [];
    if (ad.tipo === 'fruta') {
      if (cult.suplementar) extra.push(cult.suplementar);
      if (cult.extras) extra.push(cult.extras);
      if (ad.aposPoda) {
        const f = ad.aposPoda;
        extra.push(`Depois da poda de restauração: N ${fmt(f.total.N)}, P2O5 ${fmt(f.total.P)} e K2O ${fmt(f.total.K)} g por planta, em setembro, janeiro e março.`);
      }
    }
    return `
      <div class="receita-linha">
        <h3 class="receita-nome">Adubação: todas as fases do manual para o seu solo</h3>
        <p class="nota">Os números grandes do rótulo são da fase em que você está. Os anos seguintes vêm do mesmo manual.</p>
        ${tabela}
        ${extra.map((t) => `<p class="nota">${quim(t)}</p>`).join('')}
        ${fonteHTML({ sec: plano.cultura.sec, pag: plano.cultura.pag, obra: plano.cultura.obra })}
      </div>`;
  }

  function avisosHTML(plano, cal) {
    const todos = plano.avisos.concat(cal.avisos);
    if (!todos.length) return '';
    return `
      <div class="avisos">
        <h3 class="so-leitor">Avisos</h3>
        ${todos.map((a) => `<p class="alerta"><span class="carimbo carimbo-alerta">Atenção</span> ${esc(a.texto)}</p>`).join('')}
      </div>`;
  }

  /** O rótulo: a resposta impressa como o saco. Três roundels do mesmo tamanho e a tabela de garantia. */
  function rotuloHTML(plano, cal) {
    const c = plano.calagem;
    const g = plano.gesso;
    const ad = plano.adubacao;
    const par = (v, un) => (v > 0 ? [fmt(v), un] : null);
    let grupos;
    if (plano.cultura.tipo === 'anual') {
      grupos = [
        { nome: 'No plantio (kg/ha)', html: trioRoundels(par(ad.plantio.N, 'kg/ha'), par(ad.plantio.P2O5, 'kg/ha'), par(ad.plantio.K2O, 'kg/ha')) },
        { nome: 'Na cobertura (kg/ha)', html: trioRoundels(par(ad.cobertura.N, 'kg/ha'), null, par(ad.cobertura.K2O, 'kg/ha')) }
      ];
    } else {
      const linhas = linhasFases(plano);
      const cur = linhas.find((l) => l.id === idFaseAtual(plano, cal)) || linhas[0];
      grupos = [{ nome: `${cur.rot} (${cur.un})`, html: trioRoundels(cur.rN, cur.rP, cur.rK) }];
      // A cova não leva nitrogênio: sem a fase seguinte, 'nada' no N pareceria 'sem nitrogênio nesta safra'.
      const prox = linhas[linhas.indexOf(cur) + 1];
      if (prox && !cur.rN) grupos.push({ nome: `Em seguida: ${prox.rot.toLowerCase()} (${prox.un})`, html: trioRoundels(prox.rN, prox.rP, prox.rK) });
    }
    const linhaG = (nome, valor, un) => `<tr><th scope="row">${nome}</th><td class="gar-valor">${valor}</td><td class="gar-un">${un}</td></tr>`;
    const calG = c.indisponivel ? linhaG('Calcário', '—', 'só 300 g na cova') : c.precisa ? linhaG('Calcário', fmt(c.QC, 2), 't/ha') : linhaG('Calcário', 'nada', 'não precisa');
    const gesG = g.indisponivel ? linhaG('Gesso', '—', 'a cartilha não trata') : !g.avaliado ? linhaG('Gesso', '?', 'sem laudo do subsolo') : g.indicado ? linhaG('Gesso', fmt(g.QG, 2), 't/ha') : linhaG('Gesso', 'nada', 'não indicado');
    return `
      <div class="rotulo">
        <div class="rotulo-topo">
          <h2 class="rotulo-titulo" id="t-receita">Receita para ${esc(plano.cultura.nome.toLowerCase())}</h2>
          <span class="carimbo carimbo-lote">Plantio ${esc(fmtDataCurta(estado.plantio))}</span>
        </div>
        <div class="rotulo-corpo">
          <div class="rotulo-adubos">
            ${grupos.map((x) => `<div class="rotulo-grupo"><h3 class="rotulo-grupo-nome">${esc(x.nome)}</h3>${x.html}</div>`).join('')}
          </div>
          <table class="garantia">
            <caption class="garantia-titulo">Corretivos</caption>
            <tbody>${calG}${gesG}</tbody>
          </table>
        </div>
      </div>`;
  }

  function receitaHTML(plano, cal) {
    const notas = notasDeClasse(plano.adubacao);
    return `
      <section class="bloco bloco-receita" aria-labelledby="t-receita">
        ${rotuloHTML(plano, cal)}
        ${avisosHTML(plano, cal)}
        <div class="receita-detalhe">
          ${explicaCalagem(plano)}
          ${explicaGesso(plano)}
          ${plano.cultura.tipo === 'anual' ? explicaAnual(plano) : explicaPerene(plano, cal)}
          ${notas.length ? `<div class="notas-classe">${notas.map((n) => `<p class="nota">${esc(n)}</p>`).join('')}</div>` : ''}
        </div>
        <p class="botoes-fim"><button type="button" class="botao botao-voltar" data-acao="editar">${SETA_VOLTA} Mudar os dados</button></p>
      </section>`;
  }

  const fmtDataCurta = (iso) => {
    const p = partes(iso);
    return `${String(p.d).padStart(2, '0')}/${String(p.m).padStart(2, '0')}/${p.a}`;
  };

  // --------------------------------------------------------- modo de usar (calendário)
  function dataBloco(m) {
    const p = partes(m.data);
    if (m.precisao === 'mes') {
      return `<span class="marco-data"><span class="data-mes">${MES3[p.m - 1]}</span><span class="data-ano">${p.a}</span><span class="data-prec">no mês</span></span>`;
    }
    if (m.fim && m.fim !== m.data) {
      const q = partes(m.fim);
      return `<span class="marco-data"><span class="data-dia">${p.d}</span><span class="data-mes">${MES3[p.m - 1]}</span><span class="data-ano">${p.a}</span><span class="data-ate-linha">até ${q.d} ${MES3[q.m - 1]}</span></span>`;
    }
    return `<span class="marco-data"><span class="data-dia">${p.d}</span><span class="data-mes">${MES3[p.m - 1]}</span><span class="data-ano">${p.a}</span></span>`;
  }

  function chipsDose(d) {
    if (!d) return '';
    const itens = [];
    if (d.calcarioTha) itens.push(`<li><span class="dose-letra">Calcário</span> <span class="dose-num">${fmt(d.calcarioTha, 2)}</span> <span class="dose-un">t/ha</span></li>`);
    if (d.gessoTha) itens.push(`<li><span class="dose-letra">Gesso</span> <span class="dose-num">${fmt(d.gessoTha, 2)}</span> <span class="dose-un">t/ha</span></li>`);
    if (d.N > 0) itens.push(`<li><span class="dose-letra">N</span> <span class="dose-num">${fmt(d.N)}</span> <span class="dose-un">${esc(d.unidade)}</span></li>`);
    if (d.P2O5 > 0) itens.push(`<li><span class="dose-letra">P<sub>2</sub>O<sub>5</sub></span> <span class="dose-num">${fmt(d.P2O5)}</span> <span class="dose-un">${esc(d.unidade)}</span></li>`);
    if (d.K2O > 0) itens.push(`<li><span class="dose-letra">K<sub>2</sub>O</span> <span class="dose-num">${fmt(d.K2O)}</span> <span class="dose-un">${esc(d.unidade)}</span></li>`);
    return itens.length ? `<ul class="doses" aria-label="Doses">${itens.join('')}</ul>` : '';
  }

  const ESTADO_ROTULO = { agora: 'Agora', proximo: 'Próxima', passado: 'Já passou', atrasado: 'Atrasada' };

  function marcosFiltrados(cal) {
    if (estado.filtro !== 'proximos') return cal.marcos;
    const ini = K.somarDias(cal.hoje, -30);
    const fim = K.somarDias(cal.hoje, 365);
    return cal.marcos.filter((m) => (m.fim || m.data) >= ini && m.data <= fim);
  }

  function marcosHTML(cal) {
    const lista = marcosFiltrados(cal);
    const hoje = cal.hoje;
    let hojeDesenhado = false;
    const linhas = [];
    lista.forEach((m, i) => {
      if (!hojeDesenhado && m.data > hoje) {
        linhas.push(`<li class="hoje-linha" aria-label="Hoje, ${dataLonga(hoje)}"><span class="hoje-rotulo">Hoje, ${dataLonga(hoje)}</span></li>`);
        hojeDesenhado = true;
      }
      const rot = ESTADO_ROTULO[m.estado];
      linhas.push(`
        <li class="marco" data-estado="${m.estado}" data-cat="${m.categoria}" style="--i:${Math.min(i, 9)}">
          ${dataBloco(m)}
          <div class="marco-corpo">
            <h4 class="marco-titulo">${esc(m.titulo)}</h4>
            ${chipsDose(m.dose)}
            <p class="marco-texto">${quim(m.texto)}</p>
            ${m.estimado ? `<p class="marco-estimado"><span class="etiqueta">Data estimada</span> ${esc(m.gatilho || 'O manual não dá o dia exato.')}</p>` : m.gatilho ? `<p class="nota">${esc(m.gatilho)}</p>` : ''}
            ${m.fase ? `<p class="nota">Fase: ${esc(m.fase)}</p>` : ''}
            ${m.fonte ? fonteHTML(m.fonte) : ''}
          </div>
          ${rot ? `<span class="carimbo carimbo-${m.estado}">${rot}</span>` : ''}
        </li>`);
    });
    if (!hojeDesenhado) {
      linhas.push(`<li class="hoje-linha" aria-label="Hoje, ${dataLonga(hoje)}"><span class="hoje-rotulo">Hoje, ${dataLonga(hoje)}</span></li>`);
    }
    return linhas.join('');
  }

  function modoDeUsarHTML(plano, cal) {
    const perene = cal.tipo === 'perene';
    return `
      <section class="bloco bloco-modo" aria-labelledby="t-modo">
        <div class="bloco-topo">
          <h2 class="bloco-titulo" id="t-modo">Modo de usar</h2>
          ${perene ? `<div class="filtro" role="group" aria-label="Período mostrado">
            <button type="button" data-acao="filtro" data-valor="proximos" aria-pressed="${estado.filtro === 'proximos'}">Próximos 12 meses</button>
            <button type="button" data-acao="filtro" data-valor="tudo" aria-pressed="${estado.filtro === 'tudo'}">Tudo (3 anos)</button>
          </div>` : ''}
        </div>
        <p class="bloco-dica texto">Cada parada vem da data de plantio ${esc(fmtDataCurta(estado.plantio))}. Onde está escrito <strong>data estimada</strong>, o manual dá só o momento (por exemplo, a planta com 6 a 8 folhas) ou o prazo em meses, e o dia saiu de uma conta nossa.</p>
        ${marcosFiltrados(cal).some((m) => m.estado === 'atrasado') ? '<p class="alerta alerta-lista"><span class="carimbo carimbo-alerta">Atrasada</span> As etapas com este carimbo já passaram do prazo que o manual indica. Se ainda não foram feitas, faça o quanto antes.</p>' : ''}
        <ol class="marcos" id="marcos">${marcosHTML(cal)}</ol>
      </section>`;
  }

  // ------------------------------------------------------------- manejo
  function manejoHTML(plano) {
    const cartoes = MJ.para(plano, estado.variante);
    const temas = ['solo', 'nutricao', 'planta', 'atencao'];
    const blocos = temas
      .map((t) => {
        const doTema = cartoes.filter((c) => c.tema === t);
        if (!doTema.length) return '';
        return `
        <div class="tema" data-tema="${t}">
          <h3 class="tema-titulo">${MJ.TEMAS[t]}</h3>
          <div class="tema-lista">
            ${doTema
              .map(
                (c) => `
              <details class="estrategia" ${c.laudo ? 'open' : ''}>
                <summary><span class="estrategia-titulo">${esc(c.titulo)}</span>${c.laudo ? '<span class="etiqueta etiqueta-laudo">No seu laudo</span>' : ''}</summary>
                <div class="estrategia-corpo">
                  ${c.laudo ? `<p class="estrategia-laudo">${esc(c.laudo)}</p>` : ''}
                  <p class="texto">${quim(c.texto)}</p>
                  ${fonteHTML(c.fonte)}
                </div>
              </details>`
              )
              .join('')}
          </div>
        </div>`;
      })
      .join('');
    return `
      <section class="bloco bloco-manejo" aria-labelledby="t-manejo">
        <div class="bloco-topo"><h2 class="bloco-titulo" id="t-manejo">Estratégias de manejo</h2></div>
        <p class="bloco-dica texto">O que o manual orienta para ${esc(plano.cultura.nome.toLowerCase())}, em palavras curtas. Abra cada item para ler.</p>
        ${blocos}
      </section>`;
  }

  // ------------------------------------------------------ do nutriente ao saco
  const paraKgHa = (d, dens) => {
    if (!d) return { N: 0, P2O5: 0, K2O: 0 };
    if (d.unidade === 'kg/ha') return { N: d.N, P2O5: d.P2O5, K2O: d.K2O };
    if (!dens) return { N: 0, P2O5: 0, K2O: 0 };
    return { N: (d.N * dens) / 1000, P2O5: (d.P2O5 * dens) / 1000, K2O: (d.K2O * dens) / 1000 };
  };

  function sacoHTML(plano, cal) {
    const dens = plano.solo.densidade;
    const entre = plano.solo.espacamento.entreLinhas;
    const f = estado.fontes;
    const opts = (grupo, sel) => P.FONTES[grupo].map((x) => `<option value="${x.id}" ${x.id === sel ? 'selected' : ''}>${esc(x.nome)}</option>`).join('');
    const escolha = { N: f.N, P: f.P, K: f.K };
    const lista = marcosFiltrados(cal).filter((m) => m.dose && (m.dose.N > 0 || m.dose.P2O5 > 0 || m.dose.K2O > 0) && m.estado !== 'passado');
    const tot = {};
    const linhas = lista.map((m) => {
      const mix = P.mistura({ N: m.dose.N, P2O5: m.dose.P2O5, K2O: m.dose.K2O }, escolha);
      const kg = paraKgHa(m.dose, dens);
      const mixHa = P.mistura(kg, escolha);
      mixHa.itens.forEach((it) => {
        tot[it.produto.id] = tot[it.produto.id] || { nome: it.produto.nome, kg: 0 };
        tot[it.produto.id].kg += it.kg;
      });
      const celulas = mix.itens
        .map((it) => {
          const g = m.dose.unidade === 'kg/ha';
          const kgHa = it.kg;
          let detalhe;
          if (g) {
            detalhe = `${fmt(kgHa, 1)} kg/ha`;
            if (plano.cultura.tipo === 'anual') detalhe += ` · ${fmt(P.gramasPorMetro(kgHa, entre), 1)} g por metro de sulco`;
            else if (dens) detalhe += ` · ${fmt(P.gramasPorPlanta(kgHa, dens), 0)} g por planta`;
          } else {
            detalhe = `${fmt(it.kg, 0)} g por ${m.dose.unidade === 'g/cova' ? 'cova' : 'planta'}`;
          }
          return `<li><span class="prod-nome">${esc(it.produto.nome)}</span> <span class="prod-qtd">${detalhe}</span></li>`;
        })
        .join('');
      const p = partes(m.data);
      return `<tr><th scope="row">${String(p.d).padStart(2, '0')} ${MES3[p.m - 1]} ${p.a}<span class="obs">${esc(m.titulo)}</span></th><td><ul class="prod-lista">${celulas}</ul>${mix.enxofreKg > 0 ? `<p class="nota">Leva ${fmt(mix.enxofreKg, 1)} ${m.dose.unidade === 'kg/ha' ? 'kg/ha' : 'g'} de enxofre junto.</p>` : ''}</td></tr>`;
    });
    const resumo = Object.values(tot)
      .map((t) => `<li><span class="prod-nome">${esc(t.nome)}</span> <span class="prod-qtd">${fmt(t.kg, 0)} kg por hectare, cerca de ${Math.ceil(t.kg / 50)} ${Math.ceil(t.kg / 50) === 1 ? 'saco' : 'sacos'} de 50 kg</span></li>`)
      .join('');
    const obsFontes = [achar(P.FONTES.N, f.N), achar(P.FONTES.P, f.P), achar(P.FONTES.K, f.K)].map((x) => x.nota).filter(Boolean);
    return `
      <section class="bloco bloco-saco" aria-labelledby="t-saco">
        <div class="bloco-topo"><h2 class="bloco-titulo" id="t-saco">Do nutriente ao saco</h2></div>
        <p class="bloco-dica texto">As doses acima são de nutriente puro. Escolha o adubo que você compra e veja quanto pesar. Os teores são os mínimos garantidos por lei, que o manual traz no apêndice (p. 344 a 348).</p>
        <div class="grade-campos escolha-fontes">
          <div class="campo"><label for="fonte-N"><span class="campo-nome">Fonte de nitrogênio</span></label><select id="fonte-N" data-fonte="N">${opts('N', f.N)}</select></div>
          <div class="campo"><label for="fonte-P"><span class="campo-nome">Fonte de fósforo</span></label><select id="fonte-P" data-fonte="P">${opts('P', f.P)}</select></div>
          <div class="campo"><label for="fonte-K"><span class="campo-nome">Fonte de potássio</span></label><select id="fonte-K" data-fonte="K">${opts('K', f.K)}</select></div>
        </div>
        ${obsFontes.map((t) => `<p class="nota">${esc(t)}</p>`).join('')}
        ${
          linhas.length
            ? `<div class="tabela-rolagem" tabindex="0" role="region" aria-label="Adubo comercial por parada"><table class="tabela produtos"><caption class="so-leitor">Adubo comercial por parada</caption><thead><tr><th scope="col">Quando</th><th scope="col">Quanto pesar</th></tr></thead><tbody>${linhas.join('')}</tbody></table></div>
               ${resumo ? `<h3 class="tema-titulo">Soma do período mostrado</h3><ul class="prod-lista prod-resumo">${resumo}</ul>` : ''}`
            : '<p class="texto">Não há adubação pela frente no período mostrado.</p>'
        }
      </section>`;
  }
  const achar = (lista, id) => lista.find((x) => x.id === id) || lista[0];

  // -------------------------------------------------------------- seu laudo
  function laudoHTML(plano) {
    const itens = plano.solo.interpretacao;
    const escala = (idx, ideal) => {
      const seg = [0, 1, 2, 3, 4].map((i) => `<span class="seg ${i === idx ? 'seg-aqui' : ''}"></span>`).join('');
      return `<span class="escala" aria-hidden="true">${seg}</span>`;
    };
    return `
      <section class="bloco bloco-laudo" aria-labelledby="t-laudo">
        <div class="bloco-topo"><h2 class="bloco-titulo" id="t-laudo">O seu laudo, como o manual lê</h2></div>
        <div class="tabela-rolagem" tabindex="0" role="region" aria-label="Leitura do laudo">
          <table class="tabela laudo">
            <caption class="so-leitor">Leitura do laudo</caption>
            <thead><tr><th scope="col">Medida</th><th scope="col">Valor</th><th scope="col">Classe</th><th scope="col" class="col-escala"><span class="so-leitor">Posição</span></th></tr></thead>
            <tbody>
              ${itens
                .map(
                  (i) => `
                <tr data-sit="${i.situacao}">
                  <th scope="row">${esc(i.rotulo)}<span class="obs">${quim(i.termo)}</span></th>
                  <td>${i.chave === 'pH' ? Number(i.valor).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : fmt(i.valor, ['V', 'm'].includes(i.chave) ? 1 : 2)} <span class="un-peq">${esc(i.unidade)}</span></td>
                  <td><span class="leitura" data-sit="${i.situacao}">${esc(i.classe)}</span>${i.quimica ? `<span class="obs">${esc(i.quimica)}</span>` : ''}</td>
                  <td class="col-escala">${escala(i.indice, i.ideal)}</td>
                </tr>`
                )
                .join('')}
            </tbody>
          </table>
        </div>
        <p class="nota">O fósforo foi lido ${lidoPor(plano.solo.a.prem !== null ? 'P-rem' : 'argila')}. ${plano.solo.arenoso ? 'O solo é arenoso, e isso muda o parcelamento.' : ''} ${fonteTxt(plano.fontes.interpretacao)}.</p>
      </section>`;
  }

  // ---------------------------------------------------------- estimativas
  function estimativasHTML() {
    return `
      <section class="bloco bloco-notas" aria-labelledby="t-notas">
        <div class="bloco-topo"><h2 class="bloco-titulo" id="t-notas">O que é estimativa</h2></div>
        <ul class="lista-simples texto">
          <li>Datas de amostragem (4 meses antes do plantio) e a emergência em 7 dias são hipóteses nossas.</li>
          <li>Milho com 6 a 8 folhas, citros e manga por estádios, banana por fases da planta: o manual dá o momento, não o dia.</li>
          <li>Nas perenes, a primeira cobertura vem 30 dias depois do plantio, quando a muda pega. O ano agrícola vai de agosto a julho e cada estação começa em agosto, três meses ou mais depois do plantio.</li>
          <li>Quando o solo cai em classe muito baixa ou muito boa de P ou K e o manual só traz três colunas, usamos a regra descrita em cada aviso.</li>
          <li>A dose de calcário assume os padrões que você informou para o PRNT, a profundidade e a faixa de aplicação.</li>
          <li>A tabela do manual para banana vale para mãe e filha; nos ciclos seguintes repetimos a dose da filha.</li>
        </ul>
      </section>`;
  }

  function renderResultado() {
    if (!ultimo) return;
    const { plano, cal } = ultimo;
    $('#resultado').innerHTML = `
      ${receitaHTML(plano, cal)}
      ${modoDeUsarHTML(plano, cal)}
      ${manejoHTML(plano)}
      ${sacoHTML(plano, cal)}
      ${laudoHTML(plano)}
      ${estimativasHTML()}`;
  }

  // -------------------------------------------------------------- eventos
  function aoDigitar(e) {
    const t = e.target;
    if (t.matches('[data-escopo]')) {
      const alvo = t.dataset.escopo === 'a' ? estado.analise : estado.subsolo;
      alvo[t.dataset.k] = t.value;
      if (t.dataset.escopo === 'a') atualizarLeituras();
      guardar();
    } else if (t.id === 'v-sc') {
      estado.variante.sc = t.value;
      estado.scTocado = true;
      guardar();
    } else if (t.id === 'v-Nfoliar') {
      estado.variante.Nfoliar = t.value;
      guardar();
    } else if (t.id === 'v-produtividade') {
      estado.variante.produtividade = t.value;
      estado.prodTocada = true;
      guardar();
    } else if (t.id === 'm-PRNT') {
      estado.manejo.PRNT = t.value;
      guardar();
    } else if (t.id === 'e-linhas') {
      estado.espacamento.entreLinhas = t.value;
      guardar();
    } else if (t.id === 'e-plantas') {
      estado.espacamento.entrePlantas = t.value;
      guardar();
    } else if (t.id === 'd-plantio') {
      estado.plantio = t.value;
      atualizarDicaData();
      guardar();
    }
  }

  function aoMudar(e) {
    const t = e.target;
    if (t.name === 'grupo') {
      estado.grupo = t.value;
      if (estado.grupo === 'cafe' && !estado.scTocado) estado.variante.sc = { tradicional: '25', semiadensado: '35', adensado: '50' }[estado.variante.sistema];
      $('#variante').innerHTML = varianteHTML();
      $('#continuar-1').disabled = false;
      $('#dica-continuar').hidden = true;
      guardar();
      atualizarCinto();
    } else if (t.name === 'sistema') {
      estado.variante.sistema = t.value;
      if (!estado.scTocado) {
        estado.variante.sc = { tradicional: '25', semiadensado: '35', adensado: '50' }[t.value];
        const campo = $('#v-sc');
        if (campo) campo.value = estado.variante.sc;
      }
      guardar();
    } else if (t.name === 'tipo') {
      estado.variante.tipo = t.value;
      if (!estado.prodTocada) estado.variante.produtividade = t.value === 'silagem' ? '45' : '7';
      $('#variante').innerHTML = varianteHTML();
      guardar();
    } else if (t.name === 'nivel') {
      estado.variante.nivel = t.value;
      guardar();
    } else if (t.name === 'fruta') {
      estado.fruta = t.value;
      guardar();
    } else if (t.name === 'Kunidade') {
      estado.Kunidade = t.value;
      const un = $('#un-K');
      if (un) un.textContent = t.value === 'mg' ? 'mg/dm³' : 'cmolc/dm³';
      atualizarLeituras();
      guardar();
    } else if (t.id === 'v-sojaAntes') {
      estado.variante.sojaAntes = t.checked;
      guardar();
    } else if (t.id === 'v-plantioDireto') {
      estado.variante.plantioDireto = t.checked;
      guardar();
    } else if (t.id === 'm-SC') {
      estado.manejo.SC = t.value;
      guardar();
    } else if (t.id === 'm-PF') {
      estado.manejo.PF = t.value;
      guardar();
    } else if (t.dataset && t.dataset.fonte) {
      estado.fontes[t.dataset.fonte] = t.value;
      guardar();
      const sec = $('.bloco-saco');
      if (sec && ultimo) {
        sec.outerHTML = sacoHTML(ultimo.plano, ultimo.cal);
        const novo = document.getElementById('fonte-' + t.dataset.fonte);
        if (novo) novo.focus();
      }
    }
  }

  function atualizarCinto() {
    $$('#cinto .parada').forEach((b) => {
      b.disabled = Number(b.dataset.passo) > maiorPassoLiberado();
    });
  }

  function aoClicar(e) {
    const alvo = e.target.closest('[data-acao], .parada');
    if (!alvo) return;
    if (alvo.classList.contains('parada')) {
      if (!alvo.disabled) mostrarPasso(Number(alvo.dataset.passo));
      return;
    }
    const acao = alvo.dataset.acao;
    if (acao === 'ir') {
      const n = Number(alvo.dataset.passo);
      if (n === 2 && !estado.grupo) return;
      mostrarPasso(n);
    } else if (acao === 'validar-laudo') validarLaudo();
    else if (acao === 'ver-receita') verReceita();
    else if (acao === 'editar') {
      mostrarPasso(maiorPassoLiberado() >= 3 ? 3 : 2);
      $('#resultado').hidden = true;
    } else if (acao === 'filtro') {
      estado.filtro = alvo.dataset.valor;
      guardar();
      renderResultado();
      const f = document.querySelector(`[data-acao="filtro"][data-valor="${estado.filtro}"]`);
      if (f) f.focus();
    } else if (acao === 'abrir-subsolo') {
      $('#resultado').hidden = true;
      mostrarPasso(2);
      const det = $$('#passo-2 details.mais')[1];
      if (det) {
        det.open = true;
        det.scrollIntoView({ block: 'center' });
      }
    }
  }

  // --------------------------------------------------------------- partida
  function iniciar() {
    carregar();
    $('#passo-1').innerHTML = passo1HTML();
    $('#variante').innerHTML = varianteHTML();
    document.addEventListener('input', aoDigitar);
    document.addEventListener('change', aoMudar);
    document.addEventListener('click', aoClicar);
    atualizarCinto();
    $$('#cinto .parada').forEach((b) => {
      const p = Number(b.dataset.passo);
      b.toggleAttribute('data-atual', p === 1);
    });
  }

  iniciar();
})();
