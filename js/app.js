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

  // Emblemas desenhados à mão em SVG, em tinta chapada com uma segunda cor de sombra (serigrafia de duas passadas).
  // Os grupos com classe emb-* recebem a animação do CSS.
  const graosDeMilho = () => {
    const porLinha = [2, 3, 4, 4, 4, 4, 3];
    let s = '';
    porLinha.forEach((n, r) => {
      const y = 16 + r * 5.6;
      for (let c = 0; c < n; c++) {
        const x = 32 + (c - (n - 1) / 2) * 5.6;
        s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="2.6" class="grao-m"/>`;
      }
    });
    return s;
  };

  const EMBLEMAS = {
    cafe: `
      <g class="emb-sway">
        <path d="M5 57 C20 46 36 40 58 19" class="tr" fill="none"/>
        <g class="emb-folha" style="--d:0s">
          <path d="M31 40 C20 33 19 20 34 17 C41 27 39 35 31 40Z" class="tr f-folha"/>
          <path d="M34 17 C41 27 39 35 31 40 C34 31 35 24 34 17Z" class="f-folha2"/>
          <path d="M31 40 C31 31 32 24 34 17" class="fino-claro" fill="none"/>
        </g>
        <g class="emb-folha" style="--d:.5s">
          <path d="M45 29 C45 16 58 13 61 21 C60 30 52 33 45 29Z" class="tr f-folha"/>
          <path d="M61 21 C60 30 52 33 45 29 C52 27 58 25 61 21Z" class="f-folha2"/>
          <path d="M45 29 C51 25 57 22 61 21" class="fino-claro" fill="none"/>
        </g>
        <g class="emb-folha" style="--d:1s">
          <path d="M15 49 C8 43 9 34 18 33 C23 39 21 46 15 49Z" class="tr f-folha"/>
          <path d="M18 33 C23 39 21 46 15 49 C17 43 18 38 18 33Z" class="f-folha2"/>
        </g>
        <path d="M22 48 L21 53 M31 43 L31 51 M39 38 L40 44" class="fino" fill="none"/>
        <g class="emb-fruto" style="--d:0s"><circle cx="21" cy="57" r="6" class="tr f-sinal"/><path d="M18 55 C18 53.5 19.5 52.5 21 52.7" class="fino-claro" fill="none"/><circle cx="21" cy="62.3" r="0.9" class="f-tinta"/></g>
        <g class="emb-fruto" style="--d:.35s"><circle cx="31" cy="55" r="6" class="tr f-sinal"/><path d="M28 53 C28 51.5 29.5 50.5 31 50.7" class="fino-claro" fill="none"/></g>
        <g class="emb-fruto" style="--d:.7s"><circle cx="41" cy="48" r="5.6" class="tr f-sinal"/><path d="M38.2 46.2 C38.2 44.8 39.6 43.9 41 44.1" class="fino-claro" fill="none"/></g>
      </g>`,
    milho: `
      <g class="emb-casca-e"><path d="M25 56 C9 52 5 33 10 18 C19 27 25 40 30 57Z" class="tr f-folha"/><path d="M10 18 C19 27 25 40 30 57 C20 44 14 31 10 18Z" class="f-folha2"/><path d="M26 54 C17 44 13 32 11 22" class="fino-claro" fill="none"/></g>
      <g class="emb-casca-d"><path d="M39 56 C55 52 59 33 54 18 C45 27 39 40 34 57Z" class="tr f-folha"/><path d="M54 18 C45 27 39 40 34 57 C44 44 50 31 54 18Z" class="f-folha2"/><path d="M38 54 C47 44 51 32 53 22" class="fino-claro" fill="none"/></g>
      <path d="M32 7 C43 12 45 32 40 53 L24 53 C19 32 21 12 32 7Z" class="tr f-trama"/>
      ${graosDeMilho()}
      <g class="emb-seda"><path d="M32 8 C30 4 27 2 24 3 M32 8 C33 4 36 1 40 2 M32 8 C32 5 32 3 33 0" class="seda" fill="none"/></g>
      <g class="emb-casca-fe"><path d="M26 57 C17 51 17 40 22 33 C26 41 29 49 32 57Z" class="tr f-folha"/><path d="M22 33 C26 41 29 49 32 57 C26 49 23 41 22 33Z" class="f-folha2"/></g>
      <g class="emb-casca-fd"><path d="M38 57 C47 51 47 40 42 33 C38 41 35 49 32 57Z" class="tr f-folha"/><path d="M42 33 C38 41 35 49 32 57 C38 49 41 41 42 33Z" class="f-folha2"/></g>`,
    feijao: `
      <g class="emb-vagem">
        <path d="M4 45 C5 24 26 7 59 8 C61 37 43 58 14 57 C8 57 4 52 4 45Z" class="tr f-folha2"/>
        <path d="M10 44 C11 28 28 14 52 14 C52 36 38 50 16 51 C12 51 10 48 10 44Z" class="f-folha"/>
        <path d="M59 8 C62 5 63 3 62 1" class="tr" fill="none"/>
      </g>
      <g class="emb-feijao" style="--d:0s"><ellipse cx="19" cy="43" rx="6.6" ry="4.6" transform="rotate(-42 19 43)" class="tr3 f-grao"/><path d="M15 42 C17 44.5 20 45.5 23 44.5 M16 39.5 C18 41 20 41.5 22 40.5" class="risca" fill="none"/><ellipse cx="21.5" cy="39.5" rx="1.3" ry="0.8" transform="rotate(-42 21.5 39.5)" class="f-osso"/></g>
      <g class="emb-feijao" style="--d:.25s"><ellipse cx="29" cy="35" rx="6.6" ry="4.6" transform="rotate(-42 29 35)" class="tr3 f-grao"/><path d="M25 34 C27 36.5 30 37.5 33 36.5 M26 31.5 C28 33 30 33.5 32 32.5" class="risca" fill="none"/><ellipse cx="31.5" cy="31.5" rx="1.3" ry="0.8" transform="rotate(-42 31.5 31.5)" class="f-osso"/></g>
      <g class="emb-feijao" style="--d:.5s"><ellipse cx="39" cy="27" rx="6.6" ry="4.6" transform="rotate(-42 39 27)" class="tr3 f-grao"/><path d="M35 26 C37 28.5 40 29.5 43 28.5 M36 23.5 C38 25 40 25.5 42 24.5" class="risca" fill="none"/><ellipse cx="41.5" cy="23.5" rx="1.3" ry="0.8" transform="rotate(-42 41.5 23.5)" class="f-osso"/></g>
      <g class="emb-feijao" style="--d:.75s"><ellipse cx="48" cy="20" rx="5.2" ry="3.7" transform="rotate(-42 48 20)" class="tr3 f-grao"/><path d="M45 19 C47 21 49 21.5 51.5 20.5" class="risca" fill="none"/></g>`,
    frutas: `
      <g class="emb-fruta">
        <circle cx="37" cy="36" r="21" class="tr f-laranja"/>
        <path d="M37 57 C52 57 58 44 56 33 C52 46 46 52 37 53Z" class="f-laranja2"/>
        <path d="M26 24 C29 19 34 17 39 17.5" class="fino-claro" fill="none"/>
        <circle cx="30" cy="40" r="0.9" class="f-laranja2"/><circle cx="40" cy="30" r="0.9" class="f-laranja2"/><circle cx="45" cy="42" r="0.9" class="f-laranja2"/><circle cx="35" cy="48" r="0.9" class="f-laranja2"/><circle cx="46" cy="26" r="0.9" class="f-laranja2"/>
      </g>
      <g class="emb-folha" style="--d:.2s"><path d="M37 16 C31 6 38 1 47 2 C48 10 43 16 37 16Z" class="tr f-folha"/><path d="M47 2 C48 10 43 16 37 16 C42 12 45 7 47 2Z" class="f-folha2"/><path d="M37 16 C41 11 44 7 47 2" class="fino-claro" fill="none"/></g>
      <path d="M37 17 L37 14" class="tr" fill="none"/>
      <g class="emb-fatia">
        <circle cx="19" cy="45" r="15" class="tr f-laranja"/>
        <circle cx="19" cy="45" r="11.5" class="fino f-osso"/>
        <g class="emb-gomos"><path d="M19 45 V34 M19 45 L27 37 M19 45 L30 45 M19 45 L27 53 M19 45 V56 M19 45 L11 53 M19 45 L8 45 M19 45 L11 37" class="fino" fill="none"/><circle cx="19" cy="45" r="1.8" class="f-osso fino"/></g>
      </g>`
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
    variante: { fase: 'plantio', poda: 'recepa', vigorosa: false, sistema: 'tradicional', sc: '25', Nfoliar: '', tipo: 'grao', produtividade: '7', sojaAntes: false, plantioDireto: false, nivel: '2' },
    scTocado: false,
    manejoTocado: false,
    prodTocada: false,
    analise: {},
    Kunidade: 'mg',
    subsolo: {},
    manejo: { PRNT: '80', SC: '100', PF: '20' },
    espacamento: { entreLinhas: '', entrePlantas: '' },
    plantio: '',
    fontes: { N: 'ureia', P: 'sup-simples', K: 'kcl' },
    modoSaco: 'simples',
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

  /**
   * Calcário do café: na implantação entra fundo (0 a 20 cm); em lavoura formada o manual manda calcular pela superfície
   * de aplicação (faixa ou área toda), pela profundidade (cerca de 7 cm) e pelo PRNT. Faixa em lavoura nova ou larga,
   * área toda em lavoura adensada.
   */
  function aplicarPadroesManejo() {
    if (estado.manejoTocado) return;
    const v = estado.variante;
    if (estado.grupo === 'cafe' && v.fase !== 'plantio') {
      estado.manejo.PF = '7';
      estado.manejo.SC = v.sistema === 'adensado' ? '100' : '75';
    } else {
      estado.manejo.PF = '20';
      estado.manejo.SC = '100';
    }
  }

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
      </div>
      <p class="limpar"><button type="button" class="link-botao" data-acao="limpar">Começar de novo: apagar os dados que o guia lembrou</button></p>`;
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
      const fase = v.fase;
      return `
        <fieldset class="grupo-var">
          <legend>Em que fase está o café?</legend>
          <div class="chips chips-largos">
            ${chip('fasecafe', 'plantio', fase === 'plantio', 'Plantio', 'lavoura nova: cova, pós-plantio, 1º e 2º ano')}
            ${chip('fasecafe', 'producao', fase === 'producao', 'Produção', 'lavoura formada, em safra')}
            ${chip('fasecafe', 'poda', fase === 'poda', 'Pós-poda ou recepa', 'lavoura podada, que vai voltar a produzir')}
          </div>
        </fieldset>
        ${
          fase === 'poda'
            ? `<fieldset class="grupo-var">
                 <legend>Que poda foi?</legend>
                 <div class="chips chips-largos">
                   ${chip('tipopoda', 'recepa', v.poda === 'recepa', 'Recepa ou esqueletamento', 'no 1º ano vale a adubação do 2º ano; do 2º ano em diante, a de produção')}
                   ${chip('tipopoda', 'outra', v.poda === 'outra', 'Outro tipo de poda', 'as demais podas seguem a adubação de produção')}
                 </div>
               </fieldset>
               ${
                 v.poda === 'recepa'
                   ? `<div class="marcas"><label class="marca-caixa"><input type="checkbox" id="v-vigorosa" ${v.vigorosa ? 'checked' : ''}><span>As brotações estão vigorosas (o manual dispensa a adubação do 1º ano)</span></label></div>`
                   : ''
               }`
            : ''
        }
        <fieldset class="grupo-var">
          <legend>Como é a lavoura?</legend>
          <div class="chips">
            ${chip('sistema', 'tradicional', v.sistema === 'tradicional', 'Tradicional', 'até 2.500 plantas/ha')}
            ${chip('sistema', 'semiadensado', v.sistema === 'semiadensado', 'Semi-adensado', '2.500 a 5.000 plantas/ha')}
            ${chip('sistema', 'adensado', v.sistema === 'adensado', 'Adensado', '5.000 a 10.000 plantas/ha')}
          </div>
        </fieldset>
        ${
          fase === 'plantio'
            ? ''
            : `<div class="grade-campos">
                 ${campoSimples('v-sc', 'Produtividade esperada', 'sacas por hectare', v.sc, 'sc/ha', 'O manual usa de 20 a 30 sacas no tradicional, de 30 a 40 no semi-adensado e de 40 a 60 no adensado.')}
                 ${campoSimples('v-Nfoliar', 'Teor de N na folha', 'se tiver análise foliar', v.Nfoliar, 'dag/kg', 'Opcional. Com ele o N da safra é ajustado; sem ele usamos a dose preestabelecida.')}
               </div>`
        }`;
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
              <option value="7" ${cal.PF === '7' ? 'selected' : ''}>Até 7 cm (café formado)</option>
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
  const faseCafe = () => (estado.grupo === 'cafe' ? estado.variante.fase : null);

  function passo3HTML() {
    const id = idCultura();
    const cult = C[id];
    const perene = cult.tipo === 'perene';
    const sis = cult.grupo === 'cafe' ? cult.sistemas[estado.variante.sistema] : null;
    const eL = estado.espacamento.entreLinhas || '';
    const eP = estado.espacamento.entrePlantas || '';
    const padL = sis ? sis.entreLinhas : cult.entreLinhas;
    const padP = sis ? sis.entrePlantas : cult.entrePlantas;
    const fc = faseCafe();
    if (fc === 'producao' && !estado.plantio) estado.plantio = K.proximoOutubro15(hojeISO());
    const T3 = {
      plantio: { titulo: 'Quando você planta?', rotulo: 'Data de plantio', dica: perene ? 'Escolha a data de plantio. Se a lavoura já está plantada, ponha a data em que foi plantada: o guia calcula a idade e mostra as próximas adubações.' : 'Escolha o dia em que vai plantar. Se já plantou, ponha a data do plantio: o guia mostra o que ainda dá tempo de fazer.' },
      producao: { titulo: 'Quando começa a adubação da safra?', rotulo: 'Data da primeira adubação', dica: 'O manual manda adubar de outubro a março, em 3 a 4 parcelas. Ponha a data da primeira aplicação (em geral, meados de outubro). O guia monta as parcelas, a amostra do solo e a calagem a partir dela.' },
      poda: { titulo: 'Quando foi a poda?', rotulo: 'Data da poda ou recepa', dica: 'Ponha a data da poda, que pode ser futura. A adubação começa no primeiro outubro depois dela.' }
    }[fc || 'plantio'];
    return `
      <h2 class="passo-titulo" id="t-passo3">${T3.titulo}</h2>
      <p class="passo-dica texto">${T3.dica}</p>
      <div class="grade-campos">
        <div class="campo">
          <label for="d-plantio"><span class="campo-nome">${T3.rotulo}</span></label>
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
    const fc = faseCafe();
    if (fc === 'producao' || fc === 'poda') {
      const o = fc === 'poda' ? 'a poda' : 'a primeira adubação';
      el.textContent = d > 0 ? `Faltam ${d} ${d === 1 ? 'dia' : 'dias'} para ${o}.` : d === 0 ? `${o[0].toUpperCase() + o.slice(1)} é hoje.` : `${o[0].toUpperCase() + o.slice(1)} foi há ${-d} ${-d === 1 ? 'dia' : 'dias'}.`;
      return;
    }
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
        fase: v.fase,
        poda: v.poda,
        vigorosa: !!v.vigorosa,
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
      mostrarErros(erros3, [{ texto: faseCafe() === 'producao' ? 'Escolha a data da primeira adubação.' : faseCafe() === 'poda' ? 'Escolha a data da poda.' : 'Escolha a data de plantio.' }]);
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
        ${
          c.complementarCova
            ? `<p>Na cova: se você já incorporou o calcário na área toda, ponha só <strong>${fmt(c.complementarCova.gCova, 0)} g</strong> por cova de 40 x 40 x 40 cm (ou ${fmt(c.complementarCova.gMetroSulco, 0)} g por metro de sulco). É a regra do manual: a necessidade de calagem vezes o volume da cova, dividido por 2.</p>`
            : ''
        }
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
      const cova = { id: 'cova', rot: 'Cova de plantio', un: 'g/cova', N: '', P: fmt(ad.cova.P2O5_g_cova), K: '', obs: `Fósforo em classe ${ad.cova.classeP.rotulo}.`, rP: par(ad.cova.P2O5_g_cova, 'g/cova') };
      const pos = { id: 'pos', rot: 'Depois do plantio', un: 'g/cova', N: '3 a 5 por vez', P: '', K: fmt(ad.posPlantio.K2O_g_cova_ano) + ' por ano', obs: 'Primeira cobertura depois do pegamento, de 30 a 45 dias uma da outra, até o fim das chuvas.', rN: ['3 a 5', 'g/cova por vez'], rK: par(ad.posPlantio.K2O_g_cova_ano, 'g/cova por ano') };
      const ano1 = { id: 'ano1', rot: '1º ano', un: 'g/cova', N: fmt(ad.ano1.N_g_cova_aplicacao) + ' por vez', P: '', K: fmt(ad.ano1.K2O_g_cova_ano) + ' por ano', obs: 'De 3 a 4 aplicações de outubro a março.', rN: par(ad.ano1.N_g_cova_aplicacao, 'g/cova por vez'), rK: par(ad.ano1.K2O_g_cova_ano, 'g/cova por ano') };
      const ano2 = { id: 'ano2', rot: '2º ano', un: 'g/cova', N: fmt(ad.ano2.N_g_cova_aplicacao) + ' por vez', P: '', K: fmt(ad.ano2.K2O_g_cova_ano) + ' por ano', obs: 'De 3 a 4 aplicações de outubro a março.', rN: par(ad.ano2.N_g_cova_aplicacao, 'g/cova por vez'), rK: par(ad.ano2.K2O_g_cova_ano, 'g/cova por ano') };
      const prod = { id: 'prod', rot: ad.posPoda ? 'A partir do 2º ano depois da poda' : 'Lavoura em produção', un: 'kg/ha por ano', N: fmt(pr.N), P: fmt(pr.P2O5), K: fmt(pr.K2O), obs: `Safra de ${pr.faixaSc} sacas/ha. N: ${pr.notaN}. Fósforo em classe ${pr.classeP.rotulo}, potássio em classe ${pr.classeK.rotulo}. Enxofre: ${fmt(pr.S)} kg/ha se as fontes não o trouxerem.`, rN: par(pr.N, 'kg/ha por ano'), rP: par(pr.P2O5, 'kg/ha por ano'), rK: par(pr.K2O, 'kg/ha por ano') };
      if (ad.fase === 'plantio') return [cova, pos, ano1, ano2];
      if (ad.fase === 'producao') return [prod];
      if (!ad.posPoda) return [prod];
      const pp = ad.posPoda;
      const poda1 = pp.dispensada
        ? { id: 'ano-poda', rot: '1º ano depois da poda', un: 'g/cova', N: '', P: '', K: '', obs: 'Brotações vigorosas: o manual dispensa a adubação deste ano.' }
        : { id: 'ano-poda', rot: '1º ano depois da poda', un: 'g/cova', N: fmt(pp.N_g_cova_aplicacao) + ' por vez', P: '', K: fmt(pp.K2O_g_cova_ano) + ' por ano', obs: 'Vale a adubação do 2º ano: de 3 a 4 aplicações de outubro a março.', rN: par(pp.N_g_cova_aplicacao, 'g/cova por vez'), rK: par(pp.K2O_g_cova_ano, 'g/cova por ano') };
      return [poda1, prod];
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
      return { 'Antes do plantio': 'cova', 'Depois do plantio': 'pos', '1º ano': 'ano1', '2º ano': 'ano2', 'Depois do 2º ano': 'ano2', 'Lavoura em produção': 'prod', 'Poda: 1º ano': 'ano-poda' }[r] || 'cova';
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
        <h3 class="receita-nome">${linhas.length > 1 ? 'Adubação: todas as fases do manual para o seu solo' : 'Adubação: como o guia chegou nela'}</h3>
        ${linhas.length > 1 ? '<p class="nota">Os números grandes do rótulo são da fase em que você está. Os anos seguintes vêm do mesmo manual.</p>' : ''}
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
          <h2 class="rotulo-titulo" id="t-receita">Receita para ${esc(plano.cultura.nome.toLowerCase())}${nomeFaseCafe(plano)}</h2>
          <span class="carimbo carimbo-lote">${nomeDataReferencia(plano)} ${esc(fmtDataCurta(estado.plantio))}</span>
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

  const nomeFaseCafe = (plano) => {
    const ad = plano.adubacao;
    if (ad.tipo !== 'cafe') return '';
    return { plantio: ' em plantio', producao: ' em produção', poda: ad.poda.tipo === 'recepa' ? ' depois da recepa' : ' depois da poda' }[ad.fase] || '';
  };
  const nomeDataReferencia = (plano) => {
    const ad = plano.adubacao;
    if (ad.tipo !== 'cafe') return 'Plantio';
    return { plantio: 'Plantio', producao: '1ª adubação', poda: 'Poda' }[ad.fase] || 'Plantio';
  };

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
        <p class="bloco-dica texto">Cada parada vem da ${esc(nomeDataReferencia(plano).toLowerCase() === 'plantio' ? 'data de plantio' : nomeDataReferencia(plano).toLowerCase() === 'poda' ? 'data da poda' : 'data da primeira adubação')} ${esc(fmtDataCurta(estado.plantio))}. Onde está escrito <strong>data estimada</strong>, o manual dá só o momento (por exemplo, a planta com 6 a 8 folhas) ou o prazo em meses, e o dia saiu de uma conta nossa.</p>
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
    const formulado = estado.modoSaco === 'formulado';
    const opts = (grupo, sel) => P.FONTES[grupo].map((x) => `<option value="${x.id}" ${x.id === sel ? 'selected' : ''}>${esc(x.nome)}</option>`).join('');
    const escolha = { N: f.N, P: f.P, K: f.K };
    const lista = marcosFiltrados(cal).filter((m) => m.dose && (m.dose.N > 0 || m.dose.P2O5 > 0 || m.dose.K2O > 0) && m.estado !== 'passado');
    const tot = {};
    const somar = (it) => {
      tot[it.produto.id] = tot[it.produto.id] || { nome: it.produto.nome, kg: 0 };
      tot[it.produto.id].kg += it.kg;
    };
    /** Fórmula (quando há) seguida do adubo simples que completa a dose. */
    const itensFormulado = (r) => (r.formula ? [{ produto: r.formula, kg: r.kg }] : []).concat(r.complemento.itens.map((it) => Object.assign({ completa: !!r.formula }, it)));
    const NOME_NUTR = { N: 'nitrogênio', P2O5: 'fósforo', K2O: 'potássio' };
    let usouComplemento = false;
    let usouFormula = false;
    let usouExcesso = false;
    const linhas = lista.map((m) => {
      const dose = { N: m.dose.N, P2O5: m.dose.P2O5, K2O: m.dose.K2O };
      const porHa = m.dose.unidade === 'kg/ha';
      const kg = paraKgHa(m.dose, dens);
      const form = formulado ? P.formulado(dose, escolha) : null;
      const mix = formulado ? form.complemento : P.mistura(dose, escolha);
      const itens = formulado ? itensFormulado(form) : mix.itens;
      (formulado ? itensFormulado(P.formulado(kg, escolha)) : P.mistura(kg, escolha).itens).forEach(somar);
      const item = (it) => {
        let detalhe;
        if (porHa) {
          detalhe = `${fmt(it.kg, formulado ? 0 : 1)} kg/ha`;
          if (plano.cultura.tipo === 'anual') detalhe += ` · ${fmt(P.gramasPorMetro(it.kg, entre), 1)} g por metro de sulco`;
          else if (dens) detalhe += ` · ${fmt(P.gramasPorPlanta(it.kg, dens), 0)} g por planta`;
        } else {
          detalhe = `${fmt(it.kg, 0)} g por ${m.dose.unidade === 'g/cova' ? 'cova' : 'planta'}`;
        }
        return `<li><span class="prod-nome">${esc(it.produto.nome)}</span> <span class="prod-qtd">${detalhe}</span></li>`;
      };
      const visivel = (it) => it.kg >= (porHa ? 0.05 : 0.5);
      const principais = itens.filter((it) => !it.completa && visivel(it));
      const completam = itens.filter((it) => it.completa && visivel(it));
      if (completam.length) usouComplemento = true;
      if (formulado && form.formula) usouFormula = true;
      let extra = '';
      let outras = '';
      if (formulado && form.formula) {
        extra += `<p class="nota">Relação ${form.relacao.map((x) => fmt(x, 1)).join(' : ')} de N, P<sub>2</sub>O<sub>5</sub> e K<sub>2</sub>O.</p>`;
        const desvio = (campo, rotulo, palavra) => {
          const quais = Object.keys(NOME_NUTR).filter((n) => form[campo][n] >= (porHa ? 0.05 : 0.5));
          if (!quais.length) return;
          usouExcesso = true;
          extra += `<p class="nota">${rotulo}: ${quais.map((n) => `${fmt(form[campo][n], porHa ? 1 : 0)} ${porHa ? 'kg/ha' : 'g'} de ${NOME_NUTR[n]} ${palavra} (${fmt((form[campo][n] / dose[n]) * 100, 0)}%)`).join(' e ')}.</p>`;
        };
        desvio('excesso', 'Passa um pouco da dose', 'a mais');
        desvio('abaixo', 'Fica um pouco abaixo da dose', 'a menos');
        if (completam.length) extra += `<p class="prod-rotulo">Completar com</p><ul class="prod-lista">${completam.map(item).join('')}</ul>`;
        if (form.outras.length) {
          const outra = (o) => {
            const comp = o.complemento.itens.filter(visivel);
            const fora = Object.keys(NOME_NUTR).some((n) => o.excesso[n] + o.abaixo[n] >= (porHa ? 0.05 : 0.5));
            const obs = comp.length ? `Completar com ${comp.map((it) => `${it.produto.nome.toLowerCase()} ${fmt(it.kg, 0)} ${porHa ? 'kg/ha' : 'g'}`).join(' e ')}.` : fora ? 'Fecha sozinha, com pequena diferença da dose.' : 'Fecha sozinha.';
            return item({ produto: o.formula, kg: o.kg }).replace('</li>', `<span class="obs">${esc(obs)}</span></li>`);
          };
          outras = `<details class="prod-outras"><summary>Se não achar essa fórmula</summary><ul class="prod-lista">${form.outras.map(outra).join('')}</ul></details>`;
        }
      } else if (formulado) {
        extra += `<p class="nota">${form.nutrientes.length === 1 ? `Esta parada leva só ${NOME_NUTR[form.nutrientes[0]]}: não há fórmula para isso, use o adubo simples.` : `Esta parada leva só ${form.nutrientes.map((n) => NOME_NUTR[n]).join(' e ')}, e nenhuma fórmula da lista serve: use os adubos simples.`}</p>`;
      }
      const p = partes(m.data);
      return `<tr><th scope="row">${String(p.d).padStart(2, '0')} ${MES3[p.m - 1]} ${p.a}<span class="obs">${esc(m.titulo)}</span></th><td><ul class="prod-lista">${principais.map(item).join('')}</ul>${extra}${mix.enxofreKg > 0 ? `<p class="nota">Leva ${fmt(mix.enxofreKg, 1)} ${porHa ? 'kg/ha' : 'g'} de enxofre junto.</p>` : ''}${outras}</td></tr>`;
    });
    const resumo = Object.values(tot)
      .filter((t) => t.kg >= 0.5)
      .map((t) => `<li><span class="prod-nome">${esc(t.nome)}</span> <span class="prod-qtd">${fmt(t.kg, 0)} kg por hectare, cerca de ${Math.ceil(t.kg / 50)} ${Math.ceil(t.kg / 50) === 1 ? 'saco' : 'sacos'} de 50 kg</span></li>`)
      .join('');
    const obsFontes = [achar(P.FONTES.N, f.N), achar(P.FONTES.P, f.P), achar(P.FONTES.K, f.K)].map((x) => x.nota).filter(Boolean);
    const rotFonte = (nome) => (formulado ? `Para completar o ${nome}` : `Fonte de ${nome}`);
    return `
      <section class="bloco bloco-saco" aria-labelledby="t-saco">
        <div class="bloco-topo"><h2 class="bloco-titulo" id="t-saco">Do nutriente ao saco</h2>
          <div class="filtro" role="group" aria-label="Tipo de adubo">
            <button type="button" data-acao="modo-saco" data-valor="simples" aria-pressed="${!formulado}">Adubos simples</button>
            <button type="button" data-acao="modo-saco" data-valor="formulado" aria-pressed="${formulado}">Formulado NPK</button>
          </div>
        </div>
        ${
          formulado
            ? `<p class="bloco-dica texto">As doses acima são de nutriente puro. Aqui o guia procura, para cada parada, o adubo formulado que tem a relação mais próxima entre nitrogênio, fósforo e potássio e diz quanto pesar, com mais duas opções para o caso de a loja não ter a primeira. Para a fórmula fechar sozinha, aceita até ${fmt(P.TOLERANCIA * 100, 0)}% a mais ou a menos de um nutriente. Os três números do saco são as porcentagens de N, P<sub>2</sub>O<sub>5</sub> e K<sub>2</sub>O. Quando a fórmula não fecha a dose, o que falta vai em adubo simples.</p>`
            : `<p class="bloco-dica texto">As doses acima são de nutriente puro. Escolha o adubo que você compra e veja quanto pesar. Os teores são os mínimos garantidos por lei, que o manual traz no apêndice (p. 344 a 348).</p>`
        }
        <div class="grade-campos escolha-fontes">
          <div class="campo"><label for="fonte-N"><span class="campo-nome">${rotFonte('nitrogênio')}</span></label><select id="fonte-N" data-fonte="N">${opts('N', f.N)}</select></div>
          <div class="campo"><label for="fonte-P"><span class="campo-nome">${rotFonte('fósforo')}</span></label><select id="fonte-P" data-fonte="P">${opts('P', f.P)}</select></div>
          <div class="campo"><label for="fonte-K"><span class="campo-nome">${rotFonte('potássio')}</span></label><select id="fonte-K" data-fonte="K">${opts('K', f.K)}</select></div>
        </div>
        ${obsFontes.map((t) => `<p class="nota">${esc(t)}</p>`).join('')}
        ${
          linhas.length
            ? `<div class="tabela-rolagem" tabindex="0" role="region" aria-label="Adubo comercial por parada"><table class="tabela produtos"><caption class="so-leitor">Adubo comercial por parada</caption><thead><tr><th scope="col">Quando</th><th scope="col">Quanto pesar</th></tr></thead><tbody>${linhas.join('')}</tbody></table></div>
               ${resumo ? `<h3 class="tema-titulo">Soma do período mostrado</h3><ul class="prod-lista prod-resumo">${resumo}</ul>` : ''}`
            : '<p class="texto">Não há adubação pela frente no período mostrado.</p>'
        }
        ${
          formulado && usouFormula
            ? `<ul class="lista-simples texto">
                 ${usouComplemento || usouExcesso ? `<li><span class="etiqueta">Conta nossa</span> O manual ensina a escolher a fórmula pela relação entre os nutrientes. Aceitar até ${fmt(P.TOLERANCIA * 100, 0)}% a mais ou a menos de um nutriente e completar com adubo simples o que a fórmula não cobre são escolhas do guia.</li>` : ''}
                 <li>Na loja, outra fórmula com a mesma relação serve: muda só o peso. Fórmula mais concentrada pode não trazer enxofre.</li>
                 <li>Usar sempre a mesma fórmula, sem acompanhamento de um agrônomo, pode desequilibrar a adubação.</li>
               </ul>
               <p class="fonte">Manual, cap. 6, p. 33 a 35. Os dois avisos e parte das fórmulas: Embrapa (Veloso, Botelho e Rodrigues, 2020), cap. 9. As demais fórmulas são as correntes no comércio</p>`
            : ''
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
      aplicarPadroesManejo();
      $('#variante').innerHTML = varianteHTML();
      $('#continuar-1').disabled = false;
      $('#dica-continuar').hidden = true;
      guardar();
      atualizarCinto();
    } else if (t.name === 'fasecafe') {
      estado.variante.fase = t.value;
      estado.plantio = '';
      aplicarPadroesManejo();
      $('#variante').innerHTML = varianteHTML();
      guardar();
    } else if (t.name === 'tipopoda') {
      estado.variante.poda = t.value;
      $('#variante').innerHTML = varianteHTML();
      guardar();
    } else if (t.id === 'v-vigorosa') {
      estado.variante.vigorosa = t.checked;
      guardar();
    } else if (t.name === 'sistema') {
      estado.variante.sistema = t.value;
      aplicarPadroesManejo();
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
      estado.manejoTocado = true;
      guardar();
    } else if (t.id === 'm-PF') {
      estado.manejo.PF = t.value;
      estado.manejoTocado = true;
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
    } else if (acao === 'limpar') {
      try {
        localStorage.removeItem(CHAVE);
      } catch (e) {
        /* sem armazenamento: nada a apagar */
      }
      estado = PADRAO();
      ultimo = null;
      $('#resultado').hidden = true;
      $('#passo-1').innerHTML = passo1HTML();
      $('#variante').innerHTML = varianteHTML();
      atualizarCinto();
      mostrarPasso(1);
    } else if (acao === 'inicio') {
      // volta ao primeiro passo sem apagar o que já foi digitado
      e.preventDefault();
      $('#resultado').hidden = true;
      mostrarPasso(1);
      window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
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
    } else if (acao === 'modo-saco') {
      estado.modoSaco = alvo.dataset.valor;
      guardar();
      const sec = $('.bloco-saco');
      if (sec && ultimo) {
        sec.outerHTML = sacoHTML(ultimo.plano, ultimo.cal);
        const b = document.querySelector(`[data-acao="modo-saco"][data-valor="${estado.modoSaco}"]`);
        if (b) b.focus();
      }
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
  function aplicarTema(t) {
    document.documentElement.setAttribute('data-tema', t);
    const b = $('#tema');
    if (b) {
      b.setAttribute('aria-pressed', String(t === 'dark'));
      $('.tema-rotulo', b).textContent = t === 'dark' ? 'Modo claro' : 'Modo escuro';
    }
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.setAttribute('content', t === 'dark' ? 'dark' : 'light');
  }

  function iniciar() {
    aplicarTema(document.documentElement.getAttribute('data-tema') || 'light');
    $('#tema').addEventListener('click', () => {
      const novo = document.documentElement.getAttribute('data-tema') === 'dark' ? 'light' : 'dark';
      aplicarTema(novo);
      try {
        localStorage.setItem('guia-adubacao-mg:tema', novo);
      } catch (e) {
        /* sem armazenamento: vale só nesta visita */
      }
    });
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
