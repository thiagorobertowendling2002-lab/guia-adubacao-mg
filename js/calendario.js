/*
 * Calendário: da data de plantio às datas de amostragem, calagem, gessagem, cova, plantio e coberturas.
 *
 * O manual dá prazos em meses ("dois a três meses antes", "de outubro a março") e gatilhos
 * ("seis a oito folhas", "logo após a queda das pétalas"), não datas. As datas daqui são
 * conversões desses prazos. Quando o manual dá só o gatilho, o marco sai com estimado = true.
 *
 * Datas são texto AAAA-MM-DD. Contas em UTC ao meio-dia para o horário de verão não mexer em nada.
 */
(function (G) {
  'use strict';

  const C = G.culturas;

  // ------------------------------------------------------------------- datas
  const paraData = (s) => {
    const [a, m, d] = s.split('-').map(Number);
    return new Date(Date.UTC(a, m - 1, d, 12));
  };
  const paraTexto = (dt) => dt.toISOString().slice(0, 10);
  const somarDias = (s, n) => {
    const dt = paraData(s);
    dt.setUTCDate(dt.getUTCDate() + n);
    return paraTexto(dt);
  };
  const somarMeses = (s, n) => {
    const dt = paraData(s);
    const dia = dt.getUTCDate();
    dt.setUTCDate(1);
    dt.setUTCMonth(dt.getUTCMonth() + n);
    const ultimo = new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 0, 12)).getUTCDate();
    dt.setUTCDate(Math.min(dia, ultimo));
    return paraTexto(dt);
  };
  const diasEntre = (a, b) => Math.round((paraData(b) - paraData(a)) / 86400000);
  const monta = (ano, mes, dia) => paraTexto(new Date(Date.UTC(ano, mes - 1, dia, 12)));
  const anoDe = (s) => Number(s.slice(0, 4));
  const mesDe = (s) => Number(s.slice(5, 7));
  const fimDoMes = (ano, mes) => paraTexto(new Date(Date.UTC(ano, mes, 0, 12)));

  /** Primeiro 1º de agosto em ou depois da data (o ano agrícola das perenes vai de agosto a julho). */
  const proximoAgosto = (s) => {
    const a = anoDe(s);
    return s <= monta(a, 8, 1) ? monta(a, 8, 1) : monta(a + 1, 8, 1);
  };

  /** Início da estação k (k >= 1): agosto depois de três meses de plantio. A estação 0 vai do plantio até lá. */
  const inicioDaEstacao = (plantio, k) => {
    const ano1 = anoDe(proximoAgosto(somarDias(plantio, 90)));
    return monta(ano1 + k - 1, 8, 1);
  };
  const estacaoDe = (plantio, data) => {
    if (data < inicioDaEstacao(plantio, 1)) return 0;
    let k = 1;
    while (data >= inicioDaEstacao(plantio, k + 1)) k += 1;
    return k;
  };

  /** Data civil de um mês dentro da estação (agosto a julho): meses 8 a 12 caem no ano de início, 1 a 7 no seguinte. */
  const mesNaEstacao = (inicio, mes, dia) => monta(anoDe(inicio) + (mes >= 8 ? 0 : 1), mes, dia);

  // --------------------------------------------------------------- marcos
  function marco(base) {
    return Object.assign({ fim: null, precisao: 'dia', estimado: false, gatilho: null, dose: null, nutrientes: [], fonte: null }, base);
  }
  const nutrientesDe = (dose) => {
    if (!dose) return [];
    const n = [];
    if (dose.N > 0) n.push('N');
    if (dose.P2O5 > 0) n.push('P');
    if (dose.K2O > 0) n.push('K');
    return n;
  };
  const comDose = (base, dose) => marco(Object.assign({}, base, { dose, nutrientes: nutrientesDe(dose) }));

  const fmt = (n) => (Math.round(n * 10) / 10).toString().replace('.', ',');
  const FONTE_CAL = { sec: '8.5', pag: 59 };
  const FONTE_GESSO = { sec: '10.3', pag: 69 };
  const FONTE_AMOSTRA = { sec: '3.3', pag: 15 };

  // ----------------------------------------------- marcos de preparo (comuns)
  function preparo(plano, cult, plantio, opcoes) {
    const m = [];
    const cal = plano.calagem;
    const ges = plano.gesso;
    const o = Object.assign({ amostra: -120, calagemIni: -90, calagemFim: -60, gesso: -60 }, opcoes);
    m.push(
      marco({
        id: 'amostragem',
        categoria: 'amostragem',
        titulo: 'Colher a amostra de solo',
        texto:
          'Colha a amostra de 0 a 20 cm e, para saber do gesso, também a de 20 a 40 cm. Peça o P-rem no laboratório. Deixe tempo para o laudo chegar antes da calagem.',
        data: somarDias(plantio, o.amostra),
        estimado: true,
        gatilho: 'O manual manda amostrar "com boa antecedência" do plantio ou da adubação.',
        fonte: FONTE_AMOSTRA
      })
    );
    if (cal.precisa) {
      const prof = cal.usar.PF;
      m.push(
        marco({
          id: 'calagem',
          categoria: 'calagem',
          titulo: 'Espalhar o calcário',
          texto: `Aplique ${fmt(cal.QC)} t/ha de calcário com PRNT ${fmt(cal.usar.PRNT)}%${cal.dolomitico ? ', de preferência dolomítico' : ''}, incorporado ${
            prof >= 20 ? 'de 0 a 20 cm, com arado e grade' : `a ${prof} cm`
          }. O solo precisa de umidade para o calcário reagir.`,
          data: somarDias(plantio, o.calagemIni),
          fim: somarDias(plantio, o.calagemFim),
          gatilho: 'O manual manda aplicar de dois a três meses antes do plantio.',
          dose: { calcarioTha: cal.QC },
          fonte: FONTE_CAL
        })
      );
    }
    if (ges && ges.indicado) {
      m.push(
        marco({
          id: 'gesso',
          categoria: 'gesso',
          titulo: 'Espalhar o gesso agrícola',
          texto: `Aplique ${fmt(ges.QG)} t/ha de gesso, junto com o calcário ou logo depois. O gesso leva cálcio e enxofre para a camada de baixo, onde as raízes precisam entrar.`,
          data: somarDias(plantio, o.gesso),
          gatilho: 'O manual aceita o gesso junto da calagem ou depois dela.',
          dose: { gessoTha: ges.QG },
          fonte: FONTE_GESSO
        })
      );
    }
    return m;
  }

  // ----------------------------------------------------------------- anuais
  function anual(plano, cult, plantio) {
    const ad = plano.adubacao;
    const m = preparo(plano, cult, plantio);
    const chaveSec = { sec: cult.sec, pag: cult.pag };

    if (cult.grupo === 'milho') {
      m.push(
        comDose(
          {
            id: 'plantio',
            categoria: 'plantio',
            titulo: 'Plantar e adubar no sulco',
            texto: `Aplique no sulco o N, o fósforo e o potássio de plantio (${ad.variante.toLowerCase()}, produtividade de ${ad.faixa}). O N de plantio fica entre ${ad.plantio.NFaixa[0]} e ${ad.plantio.NFaixa[1]} kg/ha; usamos ${fmt(ad.plantio.N)}.${
              ad.dividirK ? ' Metade do potássio vai agora e metade com a cobertura.' : ''
            }`,
            data: plantio,
            fonte: chaveSec
          },
          { N: ad.plantio.N, P2O5: ad.plantio.P2O5, K2O: ad.plantio.K2O, unidade: 'kg/ha' }
        )
      );
      const mi = cult;
      const [i1, f1] = mi.coberturaFolhas.primeiraDias;
      const dividida = ad.cobertura.parcelas === 2;
      const nPor = dividida ? ad.cobertura.N / 2 : ad.cobertura.N;
      m.push(
        comDose(
          {
            id: 'cobertura-1',
            categoria: 'cobertura',
            titulo: dividida ? 'Primeira cobertura de N (6 folhas)' : 'Cobertura de N (6 a 8 folhas)',
            texto: `Aplique o N em cobertura com a planta com ${dividida ? 'seis' : 'seis a oito'} folhas bem abertas. Se for ureia, incorpore a uns 5 cm ou use com o solo úmido.${
              ad.cobertura.K2O > 0 ? ' Aproveite e leve junto o potássio da cobertura.' : ''
            }`,
            data: somarDias(plantio, i1),
            fim: somarDias(plantio, f1),
            estimado: true,
            gatilho: 'O manual dá o gatilho (folhas), não os dias. Convertemos com emergência em 7 dias.',
            fonte: chaveSec
          },
          { N: nPor, P2O5: 0, K2O: ad.cobertura.K2O, unidade: 'kg/ha' }
        )
      );
      if (dividida) {
        const [i2, f2] = mi.coberturaFolhas.arenosoSegundaDias;
        m.push(
          comDose(
            {
              id: 'cobertura-2',
              categoria: 'cobertura',
              titulo: 'Segunda cobertura de N (10 folhas)',
              texto: 'Em solo arenoso o manual manda dividir o N em duas coberturas, com seis e com dez folhas. Dividimos meio a meio.',
              data: somarDias(plantio, i2),
              fim: somarDias(plantio, f2),
              estimado: true,
              gatilho: 'Gatilho do manual: dez folhas.',
              fonte: chaveSec
            },
            { N: ad.cobertura.N - nPor, P2O5: 0, K2O: 0, unidade: 'kg/ha' }
          )
        );
      }
    } else {
      const fe = cult;
      const emerge = fe.emergenciaDias;
      m.push(
        comDose(
          {
            id: 'plantio',
            categoria: 'plantio',
            titulo: 'Plantar e adubar no sulco',
            texto: `Aplique no sulco o N, o fósforo e o potássio de plantio (${ad.nivel}: ${ad.produtividade}). Vale inocular a semente com rizóbio, principalmente nos níveis 1 e 2.`,
            data: plantio,
            fonte: chaveSec
          },
          { N: ad.plantio.N, P2O5: ad.plantio.P2O5, K2O: ad.plantio.K2O, unidade: 'kg/ha' }
        )
      );
      m.push(
        marco({
          id: 'molibdenio',
          categoria: 'foliar',
          titulo: 'Pulverizar molibdênio nas folhas',
          texto: `Aplique ${fe.molibdenio.dose} nas folhas.`,
          data: somarDias(plantio, emerge + fe.molibdenio.dae[0]),
          fim: somarDias(plantio, emerge + fe.molibdenio.dae[1]),
          estimado: true,
          gatilho: 'O manual manda de 15 a 25 dias depois da emergência; emergência em 7 dias.',
          fonte: chaveSec
        })
      );
      if (ad.cobertura.parcelas === 1) {
        const [a, b] = fe.coberturaDAE.umaParcela;
        m.push(
          comDose(
            {
              id: 'cobertura-1',
              categoria: 'cobertura',
              titulo: 'Cobertura de N',
              texto: 'Aplique o N em cobertura com o solo úmido, ao lado da linha.',
              data: somarDias(plantio, emerge + a),
              fim: somarDias(plantio, emerge + b),
              estimado: true,
              gatilho: 'O manual manda de 25 a 30 dias depois da emergência; emergência em 7 dias.',
              fonte: chaveSec
            },
            { N: ad.cobertura.N, P2O5: 0, K2O: 0, unidade: 'kg/ha' }
          )
        );
      } else {
        const [a, b] = fe.coberturaDAE.duasParcelas;
        const metade = ad.cobertura.N / 2;
        for (const [i, dae] of [[1, a], [2, b]]) {
          m.push(
            comDose(
              {
                id: `cobertura-${i}`,
                categoria: 'cobertura',
                titulo: i === 1 ? 'Primeira cobertura de N (20 dias)' : 'Segunda cobertura de N (30 dias)',
                texto: 'Nos níveis 3 e 4 o N de cobertura é dividido aos 20 e aos 30 dias depois da emergência. Dividimos meio a meio.',
                data: somarDias(plantio, emerge + dae),
                estimado: true,
                gatilho: 'O manual manda 20 e 30 dias depois da emergência; emergência em 7 dias.',
                fonte: chaveSec
              },
              { N: metade, P2O5: 0, K2O: 0, unidade: 'kg/ha' }
            )
          );
        }
      }
    }
    return m;
  }

  // ------------------------------------------------------------------- café
  const datasEspacadas = (inicio, n, passo) => Array.from({ length: n }, (_, i) => somarDias(inicio, i * passo));

  function cafe(plano, cult, plantio, hoje, horizonte) {
    const ad = plano.adubacao;
    const chave = { sec: cult.sec, pag: cult.pag };
    const m = [];
    const novo = plantio >= hoje;

    if (novo) {
      m.push(...preparo(plano, cult, plantio));
      m.push(
        comDose(
          {
            id: 'cova',
            categoria: 'cova',
            titulo: 'Preparar a cova',
            texto: `Misture na terra da cova: fósforo (${ad.cova.P2O5_g_cova} g de P2O5, classe ${ad.cova.classeP.rotulo}), 3 a 5 kg de esterco de curral (ou 1 a 2 kg de esterco de galinha, ou 0,5 a 1 kg de torta de mamona, ou 1 a 2 kg de palha de café), 0,6 a 1,0 g de boro e 1 a 2 g de zinco. Sem enxofre nas outras fontes, ponha 12 g de S. Fora o esterco de curral, espere 30 a 60 dias entre encher a cova e plantar. Onde o calcário já foi incorporado, a dose extra na cova cai à metade.`,
            data: somarDias(plantio, -45),
            estimado: true,
            gatilho: 'O manual manda 30 a 60 dias entre encher a cova e plantar.',
            fonte: chave
          },
          { N: 0, P2O5: ad.cova.P2O5_g_cova, K2O: 0, unidade: 'g/cova' }
        )
      );
      m.push(
        marco({
          id: 'plantio',
          categoria: 'plantio',
          titulo: 'Plantar as mudas',
          texto: 'Plante no começo das chuvas, com a cova cheia e o solo úmido.',
          data: plantio,
          fonte: chave
        })
      );
    }

    const lim = horizonte;
    const sMax = estacaoDe(plantio, lim);
    const sHoje = estacaoDe(plantio, hoje);
    const sMin = Math.max(0, sHoje - (novo ? 0 : 1));

    for (let k = sMin; k <= sMax; k++) {
      if (k === 0) {
        // Do pegamento até o fim das chuvas (31 de março).
        const ini = somarDias(plantio, 30);
        const fimChuvas = fimDoMes(anoDe(ini) + (mesDe(ini) > 3 ? 1 : 0), 3);
        const n = Math.max(1, Math.min(4, Math.floor(diasEntre(ini, fimChuvas) / 40) + 1));
        const datas = datasEspacadas(ini, n, 40).filter((d) => d <= fimChuvas);
        const K = ad.posPlantio.K2O_g_cova_ano;
        const posK = datas.length >= 3 ? [1, 2] : datas.length === 2 ? [1] : [0];
        datas.forEach((d, i) => {
          const dose = { N: 4, P2O5: 0, K2O: K > 0 && posK.includes(i) ? K / posK.length : 0, unidade: 'g/cova' };
          m.push(
            comDose(
              {
                id: `pos-${i + 1}`,
                categoria: 'cobertura',
                titulo: `Cobertura do pegamento (${i + 1} de ${datas.length})`,
                texto: `Aplique em círculo, a pelo menos 5 cm do caule, sem encostar na planta. N de 3 a 5 g por cova; usamos 4.${dose.K2O > 0 ? ' Leve junto o potássio.' : ''}`,
                data: d,
                estimado: true,
                gatilho: 'A primeira cobertura vem depois do pegamento; as seguintes de 30 a 45 dias uma da outra, até o fim das chuvas.',
                fase: 'Depois do plantio',
                fonte: chave
              },
              dose
            )
          );
        });
        continue;
      }

      const inicio = inicioDaEstacao(plantio, k);
      const outubro = monta(anoDe(inicio), 10, 15);
      if (k === 1 || k === 2) {
        const f = k === 1 ? ad.ano1 : ad.ano2;
        datasEspacadas(outubro, 4, 45).forEach((d, i) => {
          m.push(
            comDose(
              {
                id: `ano${k}-${i + 1}`,
                categoria: 'cobertura',
                titulo: `Cobertura do ${k}º ano (${i + 1} de 4)`,
                texto: `Aplique na superfície, na faixa entre o caule e a ponta dos ramos. N de ${f.N_g_cova_aplicacao} g por cova por aplicação; o potássio do ano é dividido entre as 4. O manual pede de 3 a 4 aplicações de outubro a março; usamos 4.${
                  k === 2 ? ' Se a lavoura já tiver perspectiva de safra no 2º ano, siga a recomendação de lavoura em produção.' : ''
                }`,
                data: d,
                estimado: true,
                gatilho: 'O manual manda de 3 a 4 aplicações, de outubro a março, a cada 30 a 45 dias.',
                fase: `${k}º ano`,
                fonte: chave
              },
              { N: f.N_g_cova_aplicacao, P2O5: 0, K2O: f.K2O_g_cova_ano / 4, unidade: 'g/cova' }
            )
          );
        });
      } else {
        const pr = ad.producao;
        const arenoso = plano.solo.arenoso;
        const n = arenoso ? 5 : pr.sc <= 30 ? 3 : 4;
        const passo = n === 3 ? 56 : n === 4 ? 50 : 40;
        datasEspacadas(outubro, n, passo).forEach((d, i) => {
          m.push(
            comDose(
              {
                id: `prod${k}-${i + 1}`,
                categoria: 'cobertura',
                titulo: `Adubação da safra (${i + 1} de ${n})`,
                texto: `${i === 0 ? 'Todo o fósforo vai nesta primeira aplicação. ' : ''}Aplique entre o caule e a ponta dos ramos, ou em sulco sob a copa. ${
                  pr.S > 0 && i === 0 ? `Se as fontes não tiverem enxofre, some ${fmt(pr.S / n)} kg/ha de S por aplicação (1/8 do N). ` : ''
                }O manual pede de 3 a 4 aplicações a cada 40 a 60 dias${arenoso ? ' e mais aplicações em solo arenoso' : ''}.`,
                data: d,
                estimado: true,
                gatilho: 'Datas espaçadas dentro de outubro a março, como manda o manual.',
                fase: 'Lavoura em produção',
                fonte: chave
              },
              { N: pr.N / n, P2O5: i === 0 ? pr.P2O5 : 0, K2O: pr.K2O / n, unidade: 'kg/ha' }
            )
          );
        });
        m.push(
          marco({
            id: `foliar${k}`,
            categoria: 'foliar',
            titulo: 'Colher folhas para a análise foliar',
            texto:
              'Na fase de chumbinho, antes de encher o grão, colha o 3º ou 4º par de folhas de ramos produtivos do meio da planta (100 folhas por área igual). O resultado ajusta o N das duas coberturas seguintes.',
            data: monta(anoDe(inicio), 12, 10),
            estimado: true,
            gatilho: 'O manual manda amostrar em dezembro, no chumbinho, 30 dias depois da segunda adubação.',
            fonte: chave
          })
        );
        m.push(
          marco({
            id: `amostra${k}`,
            categoria: 'amostragem',
            titulo: 'Amostra anual do solo',
            texto: 'Colha sob a projeção da copa, de 0 a 20 cm, pelo menos 60 dias depois da última adubação. Ela decide a calagem e a adubação da safra seguinte.',
            data: monta(anoDe(inicio) + 1, 6, 1),
            estimado: true,
            gatilho: 'O manual manda amostrar todo ano, a partir de 60 dias depois da última adubação.',
            fonte: chave
          })
        );
      }
    }

    if (!novo) {
      // Lavoura formada: calagem e gesso antes das adubações de outubro, a próxima janela que ainda vem.
      const ano = anoDe(hoje);
      const ini = monta(mesDe(hoje) > 9 ? ano + 1 : ano, 8, 15);
      const fim = monta(anoDe(ini), 9, 15);
      if (plano.calagem.precisa) {
        m.push(
          marco({
            id: 'calagem',
            categoria: 'calagem',
            titulo: 'Espalhar o calcário',
            texto: `Aplique ${fmt(plano.calagem.QC)} t/ha de calcário com PRNT ${fmt(plano.calagem.usar.PRNT)}%${plano.calagem.dolomitico ? ', de preferência dolomítico' : ''}, sobre a faixa sob a copa. Lavoura formada não deixa incorporar fundo; a dose já considera a profundidade que você informou. O solo precisa de umidade.`,
            data: ini,
            fim,
            estimado: true,
            gatilho: 'Em lavoura formada, antes das adubações de outubro, com a amostra anual na mão.',
            dose: { calcarioTha: plano.calagem.QC },
            fonte: FONTE_CAL
          })
        );
      }
      if (plano.gesso && plano.gesso.indicado) {
        m.push(
          marco({
            id: 'gesso',
            categoria: 'gesso',
            titulo: 'Espalhar o gesso agrícola',
            texto: `Aplique ${fmt(plano.gesso.QG)} t/ha de gesso, junto com o calcário ou logo depois, sob a copa. Em lavoura formada o gesso leva o cálcio para baixo quando o calcário não entra.`,
            data: fim,
            estimado: true,
            gatilho: 'O manual indica o gesso para camada de baixo com pouco cálcio ou muito alumínio.',
            dose: { gessoTha: plano.gesso.QG },
            fonte: FONTE_GESSO
          })
        );
      }
    }
    return m;
  }

  // ------------------------------------------------------------------ frutas
  /** Nome curto da estação k para o rótulo da fase. */
  const fasePorEstacao = (cult, k) => {
    const fases = cult.fases;
    const exata = fases.find((f) => f.ano === k && !f.emDiante);
    if (exata) return exata;
    const ultima = fases[fases.length - 1];
    const emDiante = fases.filter((f) => f.emDiante && f.ano <= k).pop();
    if (emDiante) return emDiante;
    return k <= ultima.ano ? fases.find((f) => f.ano === k) || null : null;
  };

  function fruta(plano, cult, plantio, hoje, horizonte, avisos) {
    const ad = plano.adubacao;
    const chave = { sec: cult.sec, pag: cult.pag };
    const m = [];
    const novo = plantio >= hoje;
    const fasesCalc = ad.fases;
    const calcDe = (id) => fasesCalc.find((f) => f.id === id);

    const doseDe = (e, fase) => ({ N: e.N, P2O5: e.P, K2O: e.K, unidade: fase.unidade.startsWith('g/cova') ? 'g/cova' : 'g/planta' });

    if (novo) {
      m.push(...preparo(plano, cult, plantio));
      const cova = calcDe(cult.fases[0].id);
      const evCova = cova.eventos.find((e) => e.quando.tipo === 'plantio');
      const frac = cult.fracaoNatural;
      const pNat = evCova && evCova.P > 0 ? Math.round(evCova.P * frac) : 0;
      const pSol = evCova ? evCova.P - pNat : 0;
      m.push(
        comDose(
          {
            id: 'cova',
            categoria: 'cova',
            titulo: 'Abrir e adubar a cova',
            texto: `Misture na terra de enchimento: ${cult.organicoCova}${cult.calcarioCova ? `; ${cult.calcarioCova}` : ''}. ${
              pNat > 0 ? `Do fósforo, ${pNat} g de P2O5 vão como fosfato natural reativo, e o potássio da cova também entra agora. ` : ''
            }Adubo nitrogenado não vai na terra da cova. Prepare a cova com pelo menos dois meses de antecedência.`,
            data: somarDias(plantio, -60),
            gatilho: 'O manual manda preparar a cova de 2 meses antes do plantio e aplicar o orgânico 60 dias antes.',
            fonte: chave
          },
          { N: 0, P2O5: pNat, K2O: evCova ? evCova.K : 0, unidade: cova.unidade.startsWith('g/cova') ? 'g/cova' : 'g/planta' }
        )
      );
      m.push(
        comDose(
          {
            id: 'plantio',
            categoria: 'plantio',
            titulo: 'Plantar a muda',
            texto: `Plante no começo das chuvas.${pSol > 0 ? ` Ponha ${pSol} g de P2O5 solúvel em água, mais localizado e sem enterrar fundo.` : ''}${
              evCova && evCova.N > 0 ? '' : ' Nada de nitrogênio no plantio.'
            }`,
            data: plantio,
            fonte: chave
          },
          { N: 0, P2O5: pSol, K2O: 0, unidade: 'g/cova' }
        )
      );
    }

    // Banana: ciclos contados em dias desde o plantio (os gatilhos do manual são fases da planta).
    if (cult.id === 'banana') {
      const mae = calcDe('mae');
      const filha = calcDe('filha');
      const limite = horizonte;
      const empurra = (fase, extra) => {
        fase.eventos.forEach((e) => {
          const data = somarDias(plantio, e.quando.dias + extra);
          if (data > limite || data < somarDias(hoje, -400)) return;
          m.push(
            comDose(
              {
                id: `${e.id}${extra ? '-c' + extra : ''}`,
                categoria: 'cobertura',
                titulo: `${fase.titulo}: ${e.rotulo.toLowerCase()}`,
                texto: `Aplique em volta da touceira, com o solo úmido.${cult.esterco ? ' ' + cult.esterco : ''}`,
                data,
                estimado: true,
                gatilho: `Gatilho do manual: ${e.quando.gatilho}.`,
                fase: fase.titulo,
                fonte: chave
              },
              doseDe(e, fase)
            )
          );
        });
      };
      empurra(mae, 0);
      empurra(filha, 0);
      for (let j = 1; j <= 3; j++) empurra(filha, 365 * j);
      return m;
    }

    const sHoje = estacaoDe(plantio, hoje);
    const sMax = estacaoDe(plantio, horizonte);
    const sMin = Math.max(0, sHoje - (novo ? 0 : 1));
    let alertouAlemDoManual = false;

    for (let k = sMin; k <= sMax; k++) {
      const faseDef = fasePorEstacao(cult, k);
      if (!faseDef) {
        if (!alertouAlemDoManual) {
          alertouAlemDoManual = true;
          avisos.push({
            tipo: 'alem-do-manual',
            texto: `O manual traz doses de ${cult.nome.toLowerCase()} só até o ${cult.fases[cult.fases.length - 1].ano}º ano de frutificação${
              cult.aposPoda ? '. Depois disso ele indica a adubação após a poda de restauração (veja a tabela completa)' : ''
            }. Para os anos seguintes, procure um agrônomo.`
          });
        }
        continue;
      }
      const fase = calcDe(faseDef.id);
      if (k === 0) {
        const base = somarDias(plantio, 30);
        const mesBase = fase.eventos.find((e) => e.quando.tipo === 'mes');
        const primeiroMes = mesBase ? mesBase.quando.mes : 10;
        fase.eventos.forEach((e) => {
          if (e.quando.tipo === 'plantio') return;
          const meses = (e.quando.mes - primeiroMes + 12) % 12;
          const data = somarMeses(base, meses);
          if (data > horizonte) return;
          m.push(
            comDose(
              {
                id: e.id,
                categoria: 'cobertura',
                titulo: `Cobertura: ${e.rotulo.toLowerCase()}`,
                texto: `Aplique na projeção da copa, com o solo úmido. A primeira cobertura vem depois do pegamento da muda; as outras seguem o intervalo de meses do manual.${
                  e.P > 0 ? ' Esta leva o fósforo.' : ''
                }`,
                data,
                estimado: true,
                gatilho: 'O manual dá meses; contamos a partir de 30 dias depois do plantio, quando a muda pega.',
                fase: faseDef.titulo,
                fonte: chave
              },
              doseDe(e, fase)
            )
          );
        });
        continue;
      }
      const inicio = inicioDaEstacao(plantio, k);
      fase.eventos.forEach((e) => {
        const mes = e.quando.mes;
        const data = mesNaEstacao(inicio, mes, 15);
        if (data > horizonte) return;
        const estadio = e.quando.tipo === 'estadio';
        m.push(
          comDose(
            {
              id: `${e.id}-k${k}`,
              categoria: 'cobertura',
              titulo: `${estadio ? 'Estádio ' + e.quando.estadio + ': ' : 'Cobertura de '}${estadio ? e.rotulo.toLowerCase() : mesNome(mes)}`,
              texto: `Aplique na projeção da copa, com o solo úmido.${e.P > 0 ? ' Esta leva o fósforo.' : ''}${
                cult.semProducao && estadio ? ' Em ano sem produção, pule as aplicações depois do pegamento dos frutos e depois da colheita.' : ''
              }`,
              data,
              fim: fimDoMes(anoDe(data), mes),
              precisao: 'mes',
              estimado: !!(e.quando.estimado),
              gatilho: estadio ? `Gatilho do manual: ${e.quando.gatilho}.` : null,
              fase: faseDef.titulo + (faseDef.emDiante && k > faseDef.ano ? ' (e seguintes)' : ''),
              fonte: chave
            },
            doseDe(e, fase)
          )
        );
      });
    }

    if (!novo) {
      const ano = anoDe(hoje);
      const ini = monta(mesDe(hoje) > 9 ? ano + 1 : ano, 8, 15);
      const fim = monta(anoDe(ini), 9, 15);
      if (plano.calagem.precisa) {
        m.push(
          marco({
            id: 'calagem',
            categoria: 'calagem',
            titulo: 'Espalhar o calcário',
            texto: `Aplique ${fmt(plano.calagem.QC)} t/ha de calcário com PRNT ${fmt(plano.calagem.usar.PRNT)}%${plano.calagem.dolomitico ? ', de preferência dolomítico' : ''}. Em pomar formado o manual calcula a dose para incorporação a 10 cm e manda gradear de leve.`,
            data: ini,
            fim,
            estimado: true,
            gatilho: 'Antes das adubações do começo das chuvas, com o solo úmido.',
            dose: { calcarioTha: plano.calagem.QC },
            fonte: FONTE_CAL
          })
        );
      }
      if (plano.gesso && plano.gesso.indicado) {
        m.push(
          marco({
            id: 'gesso',
            categoria: 'gesso',
            titulo: 'Espalhar o gesso agrícola',
            texto: `Aplique ${fmt(plano.gesso.QG)} t/ha de gesso, junto com o calcário ou logo depois.`,
            data: fim,
            estimado: true,
            gatilho: 'O manual indica o gesso para camada de baixo com pouco cálcio ou muito alumínio.',
            dose: { gessoTha: plano.gesso.QG },
            fonte: FONTE_GESSO
          })
        );
      }
    }
    return m;
  }

  const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
  const mesNome = (n) => MESES[n - 1];

  // ------------------------------------------------------------------ montagem
  /** Etapas de preparo que, vencidas antes de um plantio que ainda vem, estão atrasadas e não concluídas. */
  const PREPARO = new Set(['amostragem', 'calagem', 'gesso', 'cova']);

  /**
   * Monta o calendário.
   * @param plano    saída de Guia.motor.plano (ok = true)
   * @param opcoes   { plantio: 'AAAA-MM-DD', hoje: 'AAAA-MM-DD' }
   */
  function montar(plano, opcoes) {
    const cult = C[plano.cultura.id];
    const plantio = opcoes.plantio;
    const hoje = opcoes.hoje;
    const avisos = [];
    let marcos = [];
    const perene = cult.tipo === 'perene';
    const horizonte = perene ? somarMeses(plantio > hoje ? plantio : hoje, 36) : somarDias(plantio, 160);

    if (perene) {
      marcos = cult.grupo === 'cafe' ? cafe(plano, cult, plantio, hoje, horizonte) : fruta(plano, cult, plantio, hoje, horizonte, avisos);
    } else {
      marcos = anual(plano, cult, plantio);
    }

    // Alertas
    const novo = plantio >= hoje;
    const mesPlantio = mesDe(plantio);
    if (perene && novo && cult.janelaPlantio && !cult.janelaPlantio.meses.includes(mesPlantio)) {
      avisos.push({
        tipo: 'janela',
        texto: `O manual manda plantar ${cult.janelaPlantio.texto}. Em ${mesNome(mesPlantio)} a muda pega com menos chuva pela frente. Se puder, mude a data.`
      });
    }
    const precisaPreparo = plano.calagem.precisa || (plano.gesso && plano.gesso.indicado);
    if (novo && precisaPreparo) {
      const dias = diasEntre(hoje, plantio);
      if (dias < 60) {
        avisos.push({
          tipo: 'calagem-atrasada',
          texto:
            dias < 0
              ? 'O prazo já passou.'
              : `Faltam só ${dias} dias para o plantio. O manual manda o calcário de 2 a 3 meses antes. Aplique assim mesmo, com umidade no solo, e plante quando houver chuva; sem umidade o calcário não reage e é melhor fazer calagem e plantio na mesma sequência de operações.`
        });
      }
    }
    if (!novo && !perene) {
      avisos.push({
        tipo: 'plantio-passado',
        texto: 'A data de plantio já passou. O calendário mostra tudo, mas só dá tempo das coberturas que ainda não venceram.'
      });
    }
    if (!novo && perene) {
      const anos = Math.round(diasEntre(plantio, hoje) / 365.25);
      avisos.push({
        tipo: 'lavoura-formada',
        texto: `A lavoura tem cerca de ${anos} ${anos === 1 ? 'ano' : 'anos'}. O calendário mostra as próximas adubações e a janela de calagem e gesso que vem antes delas.`
      });
    }

    // Ordenação e estado
    marcos.sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
    let proximoMarcado = false;
    for (const x of marcos) {
      const fim = x.fim || x.data;
      if (fim < hoje) x.estado = novo && PREPARO.has(x.categoria) ? 'atrasado' : 'passado';
      else if (x.data <= hoje && hoje <= fim) x.estado = 'agora';
      else if (!proximoMarcado) {
        x.estado = 'proximo';
        proximoMarcado = true;
      } else x.estado = 'futuro';
      x.diasAte = diasEntre(hoje, x.data);
    }

    // Fase atual
    let fase = null;
    if (perene) {
      if (novo) fase = { rotulo: 'Antes do plantio', detalhe: 'Preparo da área, da cova e das mudas.' };
      else {
        const k = estacaoDe(plantio, hoje);
        const f = cult.grupo === 'cafe' ? null : fasePorEstacao(cult, k);
        const cafeRotulo = k === 0 ? 'Depois do plantio' : k <= 2 ? `${k}º ano` : 'Lavoura em produção';
        fase = { rotulo: cult.grupo === 'cafe' ? cafeRotulo : f ? f.titulo : 'Além das tabelas do manual', detalhe: '' };
      }
    } else {
      fase = { rotulo: novo ? 'Antes do plantio' : 'Depois do plantio', detalhe: '' };
    }

    return { marcos, avisos, fase, plantio, hoje, horizonte, tipo: cult.tipo };
  }

  G.calendario = {
    somarDias,
    somarMeses,
    diasEntre,
    inicioDaEstacao,
    estacaoDe,
    proximoAgosto,
    montar,
    mesNome
  };
})((globalThis.Guia = globalThis.Guia || {}));
