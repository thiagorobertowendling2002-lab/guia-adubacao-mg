# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Plain static HTML/CSS/JS, no build step, hosted on GitHub Pages (user-requested: "um html compartilhável hospedado no github"). Classic scripts so `index.html` also works when opened from disk.

## Users

Rural producers and field technicians in Minas Gerais who already have a laboratory soil analysis (laudo) in hand and a crop in mind. They are not asking for agronomy theory; they want to know how much lime, gypsum, N, P and K to apply and on which dates. The user (Thiago, agronomy student/professional) asked for the interface to be simple and direct, using the manual's technical terms (V%, CTC, P-rem, saturação por Al, PRNT) but never showing formulas.

## Product Purpose

Turn the 5ª Aproximação "Recomendações para o uso de corretivos e fertilizantes em Minas Gerais" (CFSEMG, Viçosa, 1999, 359 p.) into a tool a person can use in two minutes: type the soil analysis, pick the crop, pick the planting date, and get (1) quantities of lime, gypsum and fertilizer, (2) a dated calendar of what to do and when, and (3) the management strategies the manual gives for that crop. Success is a producer who leaves with a dated plan and understands why each number is what it is.

## Positioning

The manual's own method, applied faithfully and tied to the planting date. Neighbouring calculators give a lime number; this one gives a dated trail (sampling, liming, gypsum, planting, topdressing) and the manual's management advice for the chosen crop, with every figure traceable to a manual section and page.

## Operating Context

Phone in the field or desktop at the farm office, with the laboratory report next to it. Inputs follow the PROFERT-MG report: pH em água, P e K (Mehlich-1), Ca, Mg, Al (KCl), H+Al, argila ou P-rem, optionally S, Zn, B, Cu, Mn and a 20–40 cm sample for gypsum. Dates are anchored on the planting date; perennial crops may already be planted (age drives the phase).

## Capabilities and Constraints

- Crops in scope: Café, Milho (grão e silagem), Feijão (níveis tecnológicos 1 a 4) and five tropical fruits: banana prata-anã, citros, manga, mamão, maracujá.
- Outputs: calagem (NC, dose real with PRNT), gessagem (when subsoil data is given), N/P₂O₅/K₂O for planting and topdressing, nutrient-to-product conversion (ureia, sulfato de amônio, nitrato de amônio, superfosfatos, MAP, KCl) with g per metre of furrow or per plant, and an option to use formulated NPK fertilizers instead (ratio method of the manual's chapter 6; up to 10% excess of a nutrient accepted and the remainder topped up with simple fertilizers, both flagged as the guide's own calculation).
- Out of scope by user decision: calendar (.ics) export, dedicated print layout, a "fill example" button, other crops, other states.
- Several dates are estimates because the manual gives a trigger, not a date (leaf stage of corn, citrus stages A–D, banana mother/daughter plant, mango stages). The product must say so wherever it shows them.
- Where the manual has three fertility classes but the soil is "muito baixo" or "muito bom", the nearest class dose is used and flagged.
- The manual dates from 1999 and covers Minas Gerais soils. It is a reading aid, not a substitute for an agronomist.
- The manual allows partial reproduction with the source cited; the repository carries only the data and rules used, never the PDF or its full text.
- Hosting: public GitHub repository `guia-adubacao-mg` with GitHub Pages, created only after the user has seen the result and confirmed.

## Brand Commitments

Working title "Guia de Adubação MG", open to change. Language is Brazilian Portuguese. No emoji anywhere in the UI (the user's standing preference: illustration and icons are drawn SVG). Decorative backgrounds are welcome on the opening; the results area stays flat and legible. The user asked for the result to feel "lúdico, criativo e simples de entender".

## Evidence on Hand

The full manual text and tables were provided by the user in conversation (322 pages as a downloaded PDF). Worked examples printed in the manual (café liming 4,94 / 4,92 / 4,6 t/ha; gypsum 0,977 t/ha and 0,851 t/ha; limestone QC 1,25 t/ha; PRNT 74,4%; 558,9 kg/ha mixture) are the ground truth for tests. No photographs, logos, testimonials or farm data exist, and none may be invented.

## Product Principles

1. Faithful to the manual: every number carries its section and page, and anything the manual does not state is labelled as an estimate.
2. Dates before doses: a number without a day to apply it is half an answer.
3. Plain words, real terms: use V%, CTC, P-rem and the like, explain them in one line, and never show a formula.
4. Honest about gaps: ask for the subsoil sample instead of guessing gypsum, and say when a class falls outside the table.
5. Playful without noise: delight lives in the metaphor and the drawing, never in anything that makes a figure harder to read.

## Accessibility & Inclusion

Phone-first with large touch targets, high contrast readable outdoors, numeric inputs with the right on-screen keyboard, text size that survives system font scaling, and no information carried by colour alone (every class has a word). Works offline once loaded.
