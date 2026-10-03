# Guia de Adubação MG

Digite o laudo do solo, escolha a lavoura e a data de plantio. O guia mostra a calagem, a gessagem, a adubação de plantio e de cobertura, as estratégias de manejo do manual e **a data de cada aplicação**.

Lavouras: café, milho (grão e silagem), feijão (níveis de tecnologia 1 a 4) e seis frutas (banana prata-anã, citros, manga, mamão, maracujá e pitaya).

É um site estático: HTML, CSS e JavaScript puros, sem build e sem servidor. Os cálculos rodam no aparelho de quem usa, e nada do laudo sai dele.

## Como usar

1. **A lavoura.** Escolha um dos quatro sacos e responda as perguntas da lavoura (sistema do café, tipo do milho, nível do feijão, qual fruta).
2. **O laudo.** Digite os números do laudo de solo de 0 a 20 cm. Conforme você digita, o guia mostra como o manual classifica cada número. O laudo do subsolo (20 a 40 cm) é opcional e serve para a gessagem.
3. **O plantio.** Escolha a data. Pode ser futura (plantio novo) ou passada (lavoura já plantada: o guia calcula a idade e mostra as próximas adubações).

O resultado traz: a receita (calcário, gesso, N, P₂O₅ e K₂O), o modo de usar com as datas, os cartões de manejo, a conversão para adubo comercial (ureia, sulfato de amônio, nitrato de amônio, superfosfatos, MAP e cloreto de potássio, em kg/ha, g por metro de sulco e g por planta) e a leitura do laudo.

## De onde vêm os números

Tudo sai de:

> COMISSÃO DE FERTILIDADE DO SOLO DO ESTADO DE MINAS GERAIS (CFSEMG). *Recomendações para o uso de corretivos e fertilizantes em Minas Gerais – 5ª Aproximação.* Viçosa, 1999.

O manual autoriza a reprodução parcial com citação da fonte. Este repositório traz **só as regras e as doses que o guia usa**, nunca o PDF nem o texto do livro. Cada resultado mostra a seção e a página (as páginas são as do Sumário do manual impresso).

O que está implementado do manual:

- **Calagem** (cap. 8): neutralização do alumínio e elevação de Ca + Mg, com o poder tampão (Y) por argila ou por P-rem, e a saturação por bases como conferência. Dose real pela superfície coberta, profundidade e PRNT. Parâmetros de cada cultura do Quadro 8.1; no milho vale a seção da cultura (V = 60%), que difere do quadro (50%).
- **Gessagem** (cap. 10): indicação pela camada de 20 a 40 cm e dose por argila ou por P-rem, com o critério de 25% da necessidade de calagem como conferência.
- **Classes de fertilidade** (cap. 5, item 18.1.1 e quadros do café): fósforo por argila ou P-rem, potássio, complexo de troca e micronutrientes.
- **Doses por cultura** (seções 18.2, 18.4.6, 18.4.8 e 18.4.13), com as tabelas por fase, por estádio ou por faixa de produtividade.
- **Estratégias de manejo** de cada cultura, em cartões curtos que citam a seção.

## A pitaya vem de outra fonte

O manual de 1999 não fala de pitaya. As doses, o calendário e o manejo dela vêm da *Cultivo da Pitaya* (Emater-MG, Belo Horizonte, 2023). A cartilha dá a adubação em gramas de NPK 20-00-20 por planta e diz que é baseada em experiência de cultivo, com pouca pesquisa. O guia converte para nutriente (200 g = 40 g de N e 40 g de K₂O). A cartilha **não traz método de calagem nem de gesso**, então para a pitaya o guia não calcula calcário nem gesso: mostra a faixa de pH da cartilha (5,5 a 6,5) e os 300 g de calcário por cova. Nas telas e nas citações a pitaya aparece com a fonte dela.

## Escolhas e estimativas (leia antes de confiar numa data)

O manual dá prazos em meses ("dois a três meses antes") e gatilhos ("seis a oito folhas", "logo depois de cair a pétala"), raramente datas. As datas do guia são conversões, e as estimadas aparecem com a etiqueta **Data estimada** e o gatilho original.

- Amostragem de solo: 4 meses antes do plantio (o manual diz só "com boa antecedência").
- Emergência de milho e feijão: 7 dias depois do plantio.
- Milho com 6 a 8 folhas: de 30 a 38 dias depois do plantio; 10 folhas, de 45 a 52 dias.
- Perenes: a primeira cobertura vem 30 dias depois do plantio; o ano agrícola vai de agosto a julho.
- Estádios de citros e manga e fases da banana: o mês é estimativa, o gatilho é o do manual.
- Café: 4 aplicações por ano de outubro a março (o manual pede de 3 a 4, e mais em solo arenoso).
- Classe "muito baixo" de P ou K, quando a tabela da cultura só tem três colunas: 1,25 vez a dose de "baixo" (princípio geral do capítulo 5). Classe "muito bom": a dose de "bom".
- Dois pontos em que o texto impresso do manual foi corrigido ou mantido com nota no código: a faixa de argila de 0 a 15% do item 18.1.1 vem impressa com "48,1" onde o certo é 40,1; e o limite de "bom" do P-rem de 0 a 4 mg/L no plantio do café (Quadro 18.4.6.1) vem 24,0 onde 3 × 9,0 daria 27,0. O primeiro foi corrigido, o segundo foi mantido como impresso.

É um guia de apoio para ler o laudo. **Não substitui um engenheiro agrônomo**, e o manual tem mais de vinte anos e vale para Minas Gerais.

## Rodar no seu computador

Abra o `index.html` com duplo clique, ou sirva a pasta com qualquer servidor estático:

```
npx serve .
```

## Testes

```
node --test "tests/*.test.cjs"
```

Os testes reproduzem os exemplos resolvidos do próprio manual (calagem do café por argila, por P-rem e por saturação por bases; gesso por argila e por P-rem; quantidade de calcário; PRNT; conversão de K e a mistura 20-80-40 do capítulo 6) e conferem, para cada fruta, que as linhas de cada tabela somam o "Total" impresso. Há também cenários de calendário (plantio futuro e passado, lavoura com anos de idade, prazo de calagem vencido, virada de ano).

## Estrutura

```
index.html            página única
css/estilo.css        identidade visual (saco de adubo)
fonts/                Archivo (variável), licença SIL OFL
img/favicon.svg
js/dados-base.js      classes de fertilidade, quadros comuns
js/dados-culturas.js  doses e parâmetros por cultura
js/dados-manejo.js    cartões de manejo, cada um com a seção do manual
js/motor.js           interpretação, calagem, gesso e doses
js/calendario.js      da data de plantio às datas das aplicações
js/produtos.js        do nutriente ao adubo comercial
js/app.js             interface
tests/                node --test
PRODUCT.md, DESIGN.md contexto de produto e sistema visual
```
