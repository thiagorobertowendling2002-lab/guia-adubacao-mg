---
name: Guia de Adubação MG
description: A fertilizer-bag label as an interface. Bag yellow, field-green ink, signal-red stamps, cool paper to read on.
colors:
  amarelo: "#f2c230"
  amarelo-claro: "#faebb0"
  amarelo-trama: "#d9a91a"
  tinta: "#14402b"
  tinta-hover: "#1d5a3b"
  tinta-2: "#2f5d45"
  folha: "#5fa86f"
  sinal: "#b92e15"
  sinal-claro: "#fbe9e3"
  osso: "#f2f5ef"
  osso-2: "#e2e8dd"
  papel: "#ffffff"
typography:
  display:
    fontFamily: "Archivo, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "clamp(2.1rem, 9.4vw, 4.6rem)"
    fontWeight: 900
    lineHeight: 0.95
    letterSpacing: "0.005em"
    fontVariation: "'wdth' 125"
  headline:
    fontFamily: "Archivo, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "clamp(1.6rem, 6.2vw, 2.6rem)"
    fontWeight: 900
    lineHeight: 1.05
    letterSpacing: "0.002em"
    fontVariation: "'wdth' 125"
  title:
    fontFamily: "Archivo, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1.15rem"
    fontWeight: 850
    lineHeight: 1.3
    fontVariation: "'wdth' 110"
  body:
    fontFamily: "Archivo, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "1.0625rem"
    fontWeight: 450
    lineHeight: 1.55
    fontFeature: "'tnum'"
    fontVariation: "'wdth' 100"
  numeral:
    fontFamily: "Archivo, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "2.5rem"
    fontWeight: 900
    lineHeight: 1.05
    fontVariation: "'wdth' 120"
  label:
    fontFamily: "Archivo, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "0.88rem"
    fontWeight: 800
    lineHeight: 1
    letterSpacing: "0.1em"
    fontVariation: "'wdth' 68"
rounded:
  stamp: "3px"
  sm: "6px"
  panel: "12px"
  label-panel: "14px"
  pill: "999px"
  round: "50%"
spacing:
  xs: "8px"
  sm: "12px"
  md: "18px"
  lg: "26px"
  xl: "40px"
  block: "56px"
  gutter: "clamp(16px, 4vw, 32px)"
components:
  button-primary:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.osso}"
    rounded: "{rounded.sm}"
    padding: "0 24px"
    height: "56px"
  button-primary-hover:
    backgroundColor: "{colors.tinta-hover}"
  button-primary-disabled:
    backgroundColor: "{colors.osso-2}"
    textColor: "{colors.tinta-2}"
  button-back:
    backgroundColor: "transparent"
    textColor: "{colors.tinta}"
    rounded: "{rounded.sm}"
    height: "56px"
  chip:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
    height: "56px"
  chip-selected:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.osso}"
  field:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.sm}"
    padding: "0 14px"
    height: "52px"
  field-invalid:
    backgroundColor: "{colors.sinal-claro}"
    textColor: "{colors.tinta}"
  panel:
    backgroundColor: "{colors.osso}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.panel}"
  guarantee-label:
    backgroundColor: "{colors.amarelo}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.label-panel}"
  roundel:
    backgroundColor: "{colors.amarelo}"
    textColor: "{colors.tinta}"
    rounded: "{rounded.round}"
    size: "132px"
  stamp:
    backgroundColor: "{colors.osso}"
    textColor: "{colors.sinal}"
    rounded: "{rounded.stamp}"
    typography: "{typography.label}"
    padding: "4px 8px 3px"
  reading-ok:
    backgroundColor: "{colors.tinta}"
    textColor: "{colors.osso}"
    rounded: "{rounded.stamp}"
  reading-attention:
    backgroundColor: "{colors.amarelo}"
    textColor: "{colors.tinta}"
  reading-critical:
    backgroundColor: "{colors.papel}"
    textColor: "{colors.sinal}"
---

# Design System: Guia de Adubação MG

## Overview

**Creative North Star: "Saco de Adubo"**

The interface is a screenprinted fertilizer bag. The page opens on a bag-yellow band, the visitor chooses a bag per crop from a shelf, types soil data into a ruled panel, and the answer arrives as a printed label with N, P2O5 and K2O roundels and a "Modo de usar" list stamped with dates. Flat colour is the whole material: bag yellow, field-green ink, signal red used only for stamps and alerts, and a cool paper ground to read on. The ground is deliberately cool (a bone-green white), moved off an earlier warm cream.

Density is moderate and phone-first. Frames are thick (3 to 4px) and green; seams between regions are dashed, like stitching. The woven-sack hatch appears only on the top band and the footer band; the working area and the results stay flat on paper so figures read cleanly. Delight lives in the drawing (hand-made SVG bag emblems per crop) and in one motion, never in anything that makes a number harder to read.

**Key Characteristics:**
- Four-colour print palette on a cool paper ground; no gradients, no glass, no blur.
- One variable face (Archivo): heavy and expanded for names and numbers, condensed uppercase for stamps and tags, normal width for reading.
- Thick green frames, dashed stitched seams, slightly rotated red stamps.
- Class readings always appear as words with a distinct fill style, never colour alone.
- Hard offset depth on exactly two things: the chosen bag and the nutrient roundels.

## Colors

A restrained print palette: one loud yellow, one dark green doing the work of black, one red that means a stamp or a warning, and two cool paper tones.

### Primary
- **Bag Yellow** (`amarelo`): the top and footer bands, the results label panel, roundel fill, highlighter underline on block titles, "atenção" readings, dose pills, the current stop on the progress belt.
- **Field-Green Ink** (`tinta`): all text, all frames and rules, primary buttons, selected chips, "ok" readings. It replaces black everywhere.

### Secondary
- **Signal Red** (`sinal`): stamps ("Escolhido", "Agora", "Atrasado", alert), the "hoje" line, invalid fields and alert borders, the underline under the chosen bag's name. Rare by design.
- **Leaf Green** (`folha`): fill inside the hand-drawn bag emblems only.

### Neutral
- **Cool Paper** (`osso`): page ground, panel ground, stamp ground.
- **Paper Shade** (`osso-2`): hover on chips, unit caps on inputs, disabled button, track under scrollbars.
- **Paper White** (`papel`): fields, chips, tables inside the yellow label, roundels in the label.
- **Pale Yellow** (`amarelo-claro`): the current row or current "Modo de usar" step, guarantee note boxes.
- **Weave Gold** (`amarelo-trama`): hatch lines in the top and footer band only.
- **Soft Green Ink** (`tinta-2`): secondary text, hints, placeholders, past or disabled states. **Ink Hover** (`tinta-hover`) is the primary button hover.
- **Alert Tint** (`sinal-claro`): background of invalid fields, error summary and alert boxes.

### Named Rules
**The Red Is A Stamp Rule.** Signal red marks a stamp, a deadline or an error. It never fills a button, a heading or decoration.

**The Hatch Stays Up Top Rule.** The woven-sack hatch lives only on the header band and the footer band. Results and forms stay flat on paper.

**The Word Beside The Colour Rule.** A class or status is always a word, and each state has its own fill: solid green ink (ok), yellow (attention), dashed red outline on white (critical).

## Typography

**Display Font:** Archivo variable (self-hosted woff2, weight 100-900, width 62-125%), fallback system-ui sans.
**Body Font:** Archivo at normal width (100%), weight 450.
**Label/Mono Font:** Archivo condensed (width 68-80%), uppercase, tracked. No monospace.

**Character:** One family speaking in three widths. Expanded black for what the bag would print big (crop names, doses, titles), condensed caps for stamps and tags, and a plain width for explanatory text. Body numerals are tabular everywhere.

### Hierarchy
- **Display** (900, width 125%, `clamp(2.1rem, 9.4vw, 4.6rem)`, 0.95): the page title in the top band, uppercase.
- **Headline** (900, width 125%, `clamp(1.6rem, 6.2vw, 2.6rem)`, 1.05; label title `clamp(1.8rem, 6.4vw, 2.8rem)`, block titles `clamp(1.6rem, 5.4vw, 2.4rem)`): step titles and result block titles; balanced wrapping.
- **Title** (850, width 110-112%, 1.05-1.15rem, 1.3): legends, table row heads, milestone titles, summaries. Crop names on bags are 1.35rem, 900, width 125%, uppercase.
- **Body** (450, 1.0625rem = 17px, 1.55): all running text; measure capped at 68ch. Notes are 0.95rem, hints 0.9rem, source lines 0.86rem condensed uppercase.
- **Numeral** (900, width 115-120%): roundel values 2.5rem, guarantee values 2rem, derived values 1.7rem, dose numbers 1.1rem.
- **Label** (800, 0.82-0.9rem, tracking 0.1em, width 68-75%, uppercase): stamps, tags, table heads, month abbreviations.

### Named Rules
**The Width Carries The Role Rule.** Role is set by font width as much as size: expanded for names and numbers, condensed uppercase for stamps and tags, 100% for reading.

**The 68ch Rule.** Running text never exceeds 68ch.

## Layout

A single centred column, 1040px max, with a fluid side gutter of `clamp(16px, 4vw, 32px)`. Order: yellow band, three-stop progress belt, one framed panel holding the active step, results below it, yellow footer. Mobile first: the crop shelf is 2 columns and becomes 4 from 720px; field grids are auto-fit with a 250px minimum; the label body goes two-column (list plus 280-340px guarantee table) from 900px; the guarantee phase table collapses to stacked rows under 560px; roundels shrink from 132px to 96px under 460px.

Rhythm is tight inside groups (6 to 12px) and generous between them (18 to 26px between fields and groups, 40 to 56px between result blocks, which are separated by a 4px dashed rule with more space above the block than below its title). Action rows sit bottom right; on narrow screens two-button rows stack full width with the primary on top.

Touch sizes: buttons 56px high, chips 56px, text fields and selects 52px, summaries 52px, checkbox rows 44px (26px box), filter buttons 46px, progress stops 48px.

## Elevation & Depth

Flat colour is the default. Depth is conveyed by thick frames, dashed inner seams (a dashed inset border at 40-55% opacity inside the panel and the label) and by position (a bag lifting). Two hard offset shadows exist, and only these two.

### Shadow Vocabulary
- **Chosen bag** (`filter: drop-shadow(6px 6px 0 var(--tinta))`): on the selected bag emblem, which also lifts 10px (hover lifts 4px).
- **Nutrient roundel** (`box-shadow: 5px 5px 0 var(--tinta)`, 4px 4px at 460px and below): N, P2O5, K2O roundels. Absent nutrients are dashed with no shadow.
- **Focus ring** (`outline: 3px solid tinta; outline-offset: 3px; box-shadow: 0 0 0 6px amarelo`): a double ring on every `:focus-visible`; removed only on programmatic focus targets (the results region and step titles).

### Named Rules
**The Flat Results Rule.** Result tables, doses, milestones and text blocks carry no shadow. Only the roundels are lifted.

## Shapes

Modest corners on a rigid, printed grid. Controls and small boxes are 6px; the main panel is 12px and the yellow label 14px; stamps and tags are 3px; dose pills are fully round; roundels and stops on the belt are circles. Borders are the shape language: 3px solid for controls, 4px for panels and the label, 2px for table rules and stamps. Stitching is always a dashed border (belt connector, seams between blocks, inset panel border, the disabled button). Stamps are rotated about -3 degrees; the "MG" mark in the title is rotated -2.5 degrees. Bag emblems are hand-drawn SVG with a 3.5px round-joined ink stroke and flat fills.

## Components

### Buttons
- **Shape:** 6px corners, 3px green border, 56px tall, 24px side padding, Archivo 850 at width 112%.
- **Primary:** Field-green fill with cool paper text. Hover lightens to the ink-hover green; active presses down 2px.
- **Back:** same frame, transparent fill, hover to paper shade.
- **Disabled:** paper shade fill, soft green text, dashed border, not-allowed cursor; a visible line beside it states the reason.
- **Text link button:** bold, underlined 2px, 0.2em offset.

### Chips and bag shelf
- **Chip:** 56px min height, 150px min width, 3px green border, white fill; hover paper shade; selected inverts to green fill with paper text. Two-line (name plus one line of detail).
- **Bag (crop choice):** hand-drawn SVG emblem over an ink "shelf" bar, name in expanded black caps. Selected: lifts, drop-shadow, red "Escolhido" stamp, red underline bar.

### Inputs / Fields
- **Style:** 52px, 3px green border, 6px corners, white fill, 1.1rem weight 650; unit caps attached on the right in paper shade; select uses a drawn chevron.
- **Focus:** the double ring.
- **Error:** red border and alert-tint fill, with an error summary box (3px red border, alert tint) above the actions.
- **Reading under a field:** a small word-label (ok, attention, critical) styled per The Word Beside The Colour Rule.

### Stamps and tags
- **Stamp:** condensed uppercase, 2px current-colour border, 3px corners, paper fill, rotated -3 degrees. Red for now, late, alert, chosen; green ink for upcoming; soft green and dashed for past. Lot stamp is yellow-filled.
- **Tag:** the same condensed caps on a yellow fill, 2px green border.

### Progress belt
Three stops (32px circles, 3px border) joined by a 3px dashed line. Done is solid green, current is yellow with a double ring, unavailable is dashed.

### Yellow label with guarantee table (signature)
The results open on a bag-yellow panel (4px frame, 14px corners, dashed inset seam). Inside, the roundel trio (N, P2O5, K2O, 132px, one size, absent nutrient dashed), the lime and gypsum "Corretivos" guarantee table (green caption bar, ruled rows, 2rem right-aligned values), and a lot stamp. Below it results sit flat on paper with a yellow highlighter underline on block titles.

### Modo de usar (milestones)
Rows with a framed date block (96-112px wide) and a body of title, text and dose pills, divided by dashed rules; the current row sits on pale yellow; a red dashed "hoje" line carries a red tab. Motion: the one authored moment, stamps thump on one after another (420ms, `cubic-bezier(0.16, 1, 0.3, 1)`, 90ms stagger), all animation and transition off under `prefers-reduced-motion`.

### Tables and disclosures
Data tables have a green header with condensed caps, 2px green row rules, pale-yellow current row. Disclosures are ruled by 3px dashed (or 2px solid) lines with a drawn chevron that rotates.

## Do's and Don'ts

### Do:
- **Do** draw every icon and emblem as inline SVG in the 3.5px ink stroke or the 2px fine stroke; the build contains no emoji and no glyph icons.
- **Do** use `tinta` for text and rules; use `tinta-2` for secondary text and hints.
- **Do** keep tap targets at 44px or more (56px for buttons and chips, 52px for fields).
- **Do** show every status as a word with its own fill style.
- **Do** keep running text at 17px, line-height 1.55, max 68ch, tabular numerals.
- **Do** keep display sizes in `clamp()` and headlines balanced.
- **Do** give dashed stitching to seams and disabled states; give solid thick frames to things you can act on.

### Don't:
- **Don't** put the woven hatch behind forms, tables or results.
- **Don't** use red for buttons, headings or decoration.
- **Don't** add gradients, glass, blur or soft ambient shadows; the system uses flat fills and focus rings only.
- **Don't** set a heading in a system display face; names and numbers are Archivo expanded.
- **Don't** let a shadow touch result text, tables or milestones.
- **Don't** suppress the focus ring except on programmatic focus targets.

### Not canonized
Hard offset shadows on the chosen bag (6px drop-shadow) and on the roundels (5px box-shadow) are floor-listed defaults to refuse outside a neobrutalist world. The direction contract sanctioned them as this world's screenprint depth, and the build carries them as a defect against the floor, not as a rule for future surfaces to inherit. The yellow zero-blur focus halo is a functional ring, not a depth device. The detector's side-tab hits on the header and footer dashed seams are a false positive (ignored for index.html in `.impeccable/config.json`). The finish review ended at "fix" twice; the last three fixes (0.78rem roundel units, one-decimal pH, second roundel trio for perennials) were not re-scored, so the surface is not fully approved.
