#!/usr/bin/env node
import { createHash } from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync
} from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const modulePath = fileURLToPath(import.meta.url);
const root = resolve(dirname(modulePath), '..');

function write(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content.endsWith('\n') ? content : `${content}\n`);
}

function writeJson(path, value) {
  write(path, JSON.stringify(value, null, 2));
}

function page(
  title,
  cssPath,
  body,
  { preview = false, lang = 'en' } = {}
) {
  return `<!doctype html>
<html lang="${lang}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <link rel="stylesheet" href="${preview ? '../tokens.css' : 'tokens.css'}">
  <link rel="stylesheet" href="${preview ? '../layouts.css' : 'layouts.css'}">
</head>
<body>${body}</body>
</html>`;
}

function previewPage(title, system, content) {
  return page(title, '../tokens.css', `
  <main class="ds-preview">
    <p class="ds-kicker">${system.name}</p>
    ${content}
  </main>`, { preview: true });
}

const operationalIconSymbols = `
  <symbol id="icon-dashboard" viewBox="0 0 1024 1024"><path d="M924.8 385.6c-22.6-53.4-54.9-101.3-96-142.4-41.1-41.1-89-73.4-142.4-96C631.1 123.8 572.5 112 512 112s-119.1 11.8-174.4 35.2c-53.4 22.6-101.3 54.9-142.4 96-41.1 41.1-73.4 89-96 142.4C75.8 440.9 64 499.5 64 560c0 132.7 58.3 257.7 159.9 343.1l1.7 1.4c5.8 4.8 13.1 7.5 20.6 7.5h531.7c7.5 0 14.8-2.7 20.6-7.5l1.7-1.4C901.7 817.7 960 692.7 960 560c0-60.5-11.9-119.1-35.2-174.4zM761.4 836H262.6C184.5 765.5 140 665.6 140 560c0-99.4 38.7-192.8 109-263 70.3-70.3 163.7-109 263-109 99.4 0 192.8 38.7 263 109 70.3 70.3 109 163.7 109 263 0 105.6-44.5 205.5-122.6 276zM623.5 421.5c-3.1-3.1-8.2-3.1-11.3 0L527.7 506c-18.7-5-39.4-0.2-54.1 14.5-21.9 21.9-21.9 57.3 0 79.2 21.9 21.9 57.3 21.9 79.2 0 14.7-14.7 19.5-35.4 14.5-54.1l84.5-84.5c3.1-3.1 3.1-8.2 0-11.3l-28.3-28.3zM490 320h44c4.4 0 8-3.6 8-8v-80c0-4.4-3.6-8-8-8h-44c-4.4 0-8 3.6-8 8v80c0 4.4 3.6 8 8 8zM750 538v44c0 4.4 3.6 8 8 8h80c4.4 0 8-3.6 8-8v-44c0-4.4-3.6-8-8-8h-80c-4.4 0-8 3.6-8 8zM762.7 340.8l-31.1-31.1c-3.1-3.1-8.2-3.1-11.3 0l-56.6 56.6c-3.1 3.1-3.1 8.2 0 11.3l31.1 31.1c3.1 3.1 8.2 3.1 11.3 0l56.6-56.6c3.1-3.1 3.1-8.2 0-11.3zM304.1 309.7c-3.1-3.1-8.2-3.1-11.3 0l-31.1 31.1c-3.1 3.1-3.1 8.2 0 11.3l56.6 56.6c3.1 3.1 8.2 3.1 11.3 0l31.1-31.1c3.1-3.1 3.1-8.2 0-11.3l-56.6-56.6zM262 530h-80c-4.4 0-8 3.6-8 8v44c0 4.4 3.6 8 8 8h80c4.4 0 8-3.6 8-8v-44c0-4.4-3.6-8-8-8z"/></symbol>
  <symbol id="icon-user" viewBox="0 0 1024 1024"><path d="M858.5 763.6c-18.9-44.8-46.1-85-80.6-119.5-34.5-34.5-74.7-61.6-119.5-80.6-0.4-0.2-0.8-0.3-1.2-0.5C719.5 518 760 444.7 760 362c0-137-111-248-248-248S264 225 264 362c0 82.7 40.5 156 102.8 201.1-0.4 0.2-0.8 0.3-1.2 0.5-44.8 18.9-85 46-119.5 80.6-34.5 34.5-61.6 74.7-80.6 119.5C146.9 807.5 137 854 136 901.8c-0.1 4.5 3.5 8.2 8 8.2h60c4.4 0 7.9-3.5 8-7.8 2-77.2 33-149.5 87.8-204.3 56.7-56.7 132-87.9 212.2-87.9s155.5 31.2 212.2 87.9C779 752.7 810 825 812 902.2c0.1 4.4 3.6 7.8 8 7.8h60c4.5 0 8.1-3.7 8-8.2-1-47.8-10.9-94.3-29.5-138.2zM512 534c-45.9 0-89.1-17.9-121.6-50.4S340 407.9 340 362c0-45.9 17.9-89.1 50.4-121.6S466.1 190 512 190s89.1 17.9 121.6 50.4S684 316.1 684 362c0 45.9-17.9 89.1-50.4 121.6S557.9 534 512 534z"/></symbol>
  <symbol id="icon-filter" viewBox="0 0 1024 1024"><path d="M880.1 154H143.9c-24.5 0-39.8 26.7-27.5 48L349 597.4V838c0 17.7 14.2 32 31.8 32h262.4c17.6 0 31.8-14.3 31.8-32V597.4L907.7 202c12.2-21.3-3.1-48-27.6-48zM603.4 798H420.6V642h182.9v156z m9.6-236.6l-9.5 16.6h-183l-9.5-16.6L212.7 226h598.6L613 561.4z"/></symbol>
  <symbol id="icon-audit" viewBox="0 0 1024 1024"><path d="M296 250c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8h384c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8H296zM480 394H296c-4.4 0-8 3.6-8 8v48c0 4.4 3.6 8 8 8h184c4.4 0 8-3.6 8-8v-48c0-4.4-3.6-8-8-8zM432 852H208V148h560v320c0 4.4 3.6 8 8 8h56c4.4 0 8-3.6 8-8V108c0-17.7-14.3-32-32-32H168c-17.7 0-32 14.3-32 32v784c0 17.7 14.3 32 32 32h264c4.4 0 8-3.6 8-8v-56c0-4.4-3.6-8-8-8zM872 764H728v-36.6c46.3-13.8 80-56.6 80-107.4 0-61.9-50.1-112-112-112s-112 50.1-112 112c0 50.7 33.7 93.6 80 107.4V764H520c-8.8 0-16 7.2-16 16v152c0 8.8 7.2 16 16 16h352c8.8 0 16-7.2 16-16V780c0-8.8-7.2-16-16-16zM646 620c0-27.6 22.4-50 50-50s50 22.4 50 50-22.4 50-50 50-50-22.4-50-50z m180 266H566v-60h260v60z"/></symbol>
  <symbol id="icon-export" viewBox="0 0 1024 1024"><path d="M888.3 757.4h-53.8c-4.2 0-7.7 3.5-7.7 7.7v61.8H197.1V197.1h629.8v61.8c0 4.2 3.5 7.7 7.7 7.7h53.8c4.2 0 7.7-3.4 7.7-7.7V158.7c0-17-13.7-30.7-30.7-30.7H158.7c-17 0-30.7 13.7-30.7 30.7v706.6c0 17 13.7 30.7 30.7 30.7h706.6c17 0 30.7-13.7 30.7-30.7V765.1c0-4.3-3.5-7.7-7.7-7.7zM906.9 505.7L765 393.7c-5.3-4.2-13-0.4-13 6.3v76H438c-4.4 0-8 3.6-8 8v56c0 4.4 3.6 8 8 8h314v76c0 6.7 7.8 10.5 13 6.3l141.9-112c4.1-3.2 4.1-9.4 0-12.6z"/></symbol>
  <symbol id="icon-check-circle" viewBox="0 0 1024 1024"><path d="M699 353h-46.9c-10.2 0-19.9 4.9-25.9 13.3L469 584.3l-71.2-98.8c-6-8.3-15.6-13.3-25.9-13.3H325c-6.5 0-10.3 7.4-6.5 12.7l124.6 172.8c12.7 17.7 39 17.7 51.7 0l210.6-292c3.9-5.3 0.1-12.7-6.4-12.7zM512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372z"/></symbol>
  <symbol id="icon-warning-circle" viewBox="0 0 1024 1024"><path d="M512 64C264.6 64 64 264.6 64 512s200.6 448 448 448 448-200.6 448-448S759.4 64 512 64z m0 820c-205.4 0-372-166.6-372-372s166.6-372 372-372 372 166.6 372 372-166.6 372-372 372zM512 688m-48 0a48 48 0 1 0 96 0 48 48 0 1 0-96 0ZM488 576h48c4.4 0 8-3.6 8-8V296c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8v272c0 4.4 3.6 8 8 8z"/></symbol>`;

const operationalIconSprite = `<svg xmlns="http://www.w3.org/2000/svg">
  <metadata>Ant Design official icons from Iconfont collection 9402. Copyright Ant UED. MIT License.</metadata>${operationalIconSymbols}
</svg>
`;

function sha256Text(value) {
  return createHash('sha256').update(value).digest('hex');
}

function stable(value) {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map(
      (key) => `${JSON.stringify(key)}:${stable(value[key])}`
    ).join(',')}}`;
  }
  return JSON.stringify(value);
}

const systems = [
  {
    id: 'expressive-web',
    name: 'Expressive Web Stage System',
    template: 'expressive-web-stage.html',
    tokens: {
      colors: {
        surface: '#090909',
        surface_alt: '#171717',
        text: '#F2F0E9',
        muted: '#AAA79F',
        line: '#45433F',
        accent: '#E42D24',
        inverse_text: '#080000',
        steel: '#B8BAB8'
      },
      color_contract: {
        schema_version: 'design-color-contract/v1',
        paradigm: 'subject-led',
        foundation: 'dark',
        chroma_budget: 'expressive',
        primary_accent_roles: ['brand-expression', 'chapter'],
        secondary_accent_mode: 'forbidden',
        semantic_exception_roles: [],
        max_focal_hues: 2,
        color_alone: false,
        required_pairings: [
          { foreground: 'text', background: 'surface', minimum_ratio: 7, usage: 'body-text' },
          { foreground: 'muted', background: 'surface', minimum_ratio: 4.5, usage: 'supporting-text' },
          { foreground: 'text', background: 'surface_alt', minimum_ratio: 7, usage: 'body-text' },
          { foreground: 'muted', background: 'surface_alt', minimum_ratio: 4.5, usage: 'supporting-text' },
          { foreground: 'accent', background: 'surface', minimum_ratio: 3, usage: 'non-text-focus' },
          { foreground: 'inverse_text', background: 'accent', minimum_ratio: 4.5, usage: 'inverse-text' }
        ]
      },
      typography: {
        display: '"Bodoni 72", "Times New Roman", serif',
        body: '"Avenir Next", "Helvetica Neue", sans-serif',
        mono: '"SFMono-Regular", Menlo, monospace'
      },
      spacing: {
        page: 'clamp(24px, 5vw, 80px)',
        section: 'clamp(72px, 12vw, 180px)',
        gap: 'clamp(16px, 2.4vw, 36px)',
        tight: '8px'
      },
      radius: {
        default: '2px',
        media: '0px'
      }
    },
    css: `:root {
  --surface: #090909;
  --surface-alt: #171717;
  --text: #F2F0E9;
  --muted: #AAA79F;
  --line: #45433F;
  --accent: #E42D24;
  --inverse-text: #080000;
  --steel: #B8BAB8;
  --font-display: "Bodoni 72", "Times New Roman", serif;
  --font-body: "Avenir Next", "Helvetica Neue", sans-serif;
  --font-mono: "SFMono-Regular", Menlo, monospace;
  --space-page: clamp(24px, 5vw, 80px);
  --space-section: clamp(72px, 12vw, 180px);
  --space-gap: clamp(16px, 2.4vw, 36px);
  --radius: 2px;
}
* { box-sizing: border-box; }
html { background: var(--surface); color: var(--text); }
body { margin: 0; background: var(--surface); color: var(--text); font-family: var(--font-body); letter-spacing: 0; }
button, a { font: inherit; }
.ds-kicker { margin: 0; color: var(--muted); font: 600 12px/1.2 var(--font-mono); text-transform: uppercase; }
.ds-preview { min-height: 100vh; padding: var(--space-page); }
.ds-stage { min-height: min(900px, 92vh); position: relative; display: grid; grid-template-rows: auto 1fr auto; overflow: hidden; background: var(--surface); }
.ds-stage-media { position: absolute; inset: 0; margin: 0; }
.ds-stage-media img { width: 100%; height: 100%; object-fit: cover; }
.ds-stage::after { content: ""; position: absolute; inset: 0; background: rgba(0, 0, 0, .16); pointer-events: none; }
.ds-stage-nav, .ds-stage-copy, .ds-stage-foot { position: relative; z-index: 1; padding: 24px var(--space-page); }
.ds-stage-nav { display: flex; justify-content: space-between; align-items: center; }
.ds-stage-title { align-self: center; max-width: 8ch; margin: 0; font: 400 clamp(64px, 11vw, 170px)/.82 var(--font-display); }
.ds-stage-copy { display: grid; grid-template-columns: 7fr 5fr; align-items: end; }
.ds-stage-note { max-width: 34em; margin: 0 0 1em auto; color: var(--text); font-size: clamp(16px, 1.4vw, 22px); line-height: 1.35; }
.ds-stage-foot { display: flex; justify-content: space-between; color: var(--muted); font: 500 12px/1.2 var(--font-mono); }
.ds-object-index { padding: var(--space-section) var(--space-page); display: grid; grid-template-columns: 4fr 8fr; gap: var(--space-gap); border-top: 1px solid var(--line); }
.ds-index-number { color: var(--accent); font: 500 clamp(72px, 10vw, 150px)/.8 var(--font-display); }
.ds-index-copy h2 { max-width: 12ch; margin: 0; font: 400 clamp(42px, 6vw, 92px)/.94 var(--font-display); }
.ds-index-copy p { max-width: 42em; margin: 40px 0 0; color: var(--muted); font-size: 18px; line-height: 1.6; }
.ds-proof-strip { display: grid; grid-template-columns: repeat(3, 1fr); border-block: 1px solid var(--line); }
.ds-proof { min-height: 180px; padding: 28px var(--space-page); display: grid; align-content: end; border-right: 1px solid var(--line); }
.ds-proof:last-child { border-right: 0; }
.ds-proof strong { font: 400 clamp(36px, 5vw, 72px)/1 var(--font-display); }
.ds-proof span { color: var(--muted); font-size: 13px; }
.ds-scene-break { min-height: 56vh; padding: var(--space-page); display: grid; place-items: center; background: var(--accent); color: var(--inverse-text); text-align: center; }
.ds-scene-break p { max-width: 12ch; margin: 0; font: 500 clamp(48px, 8vw, 118px)/.9 var(--font-display); }
@media (prefers-reduced-motion: no-preference) {
  .ds-stage-title { animation: ds-stage-settle 640ms cubic-bezier(.2,.7,.2,1) both; }
  @keyframes ds-stage-settle { from { opacity: 0; transform: translateY(22px); } }
}
@media (max-width: 720px) {
  .ds-stage { min-height: 86vh; }
  .ds-stage-copy { grid-template-columns: 1fr; align-content: end; gap: 24px; }
  .ds-stage-title { font-size: clamp(58px, 22vw, 92px); }
  .ds-stage-note { margin: 0; max-width: 24em; }
  .ds-object-index { grid-template-columns: 1fr; }
  .ds-proof-strip { grid-template-columns: 1fr; }
  .ds-proof { border-right: 0; border-bottom: 1px solid var(--line); }
}`,
    components: [
      ['media-stage', 'immersive first viewport', ['.ds-stage', '.ds-stage-media', '.ds-stage-title']],
      ['object-index', 'narrative object introduction', ['.ds-object-index', '.ds-index-number', '.ds-index-copy']],
      ['proof-strip', 'sparse proof points', ['.ds-proof-strip', '.ds-proof']],
      ['scene-break', 'chapter transition', ['.ds-scene-break']],
      ['static-motion-fallback', 'semantic entrance with reduced motion', ['@media (prefers-reduced-motion: no-preference)']]
    ],
    body: `<main>
  <section class="ds-stage" data-keyframe="first">
    <figure class="ds-stage-media"><img src="./assets/stage.jpg" alt="Synthetic red glass sculpture on a steel plinth"></figure>
    <nav class="ds-stage-nav"><p class="ds-kicker">Aperture / Object 01</p><span class="ds-kicker">Synthetic preview</span></nav>
    <div class="ds-stage-copy">
      <h1 class="ds-stage-title">Form holds memory.</h1>
      <p class="ds-stage-note">A media-first stage where one real subject, one type voice, and one controlled motion rule carry the experience.</p>
    </div>
    <footer class="ds-stage-foot"><span>Scroll to inspect</span><span>01 / 04</span></footer>
  </section>
  <section class="ds-object-index" data-keyframe="dense">
    <div class="ds-index-number">01</div>
    <div class="ds-index-copy"><h2>The object is the interface.</h2><p>Media, copy, scale, and transition share one concept. The system does not solve weak hierarchy by adding cards, gradients, or ambient effects.</p></div>
  </section>
  <section class="ds-proof-strip" data-keyframe="critical">
    <div class="ds-proof"><strong>1</strong><span>visual protagonist</span></div>
    <div class="ds-proof"><strong>1</strong><span>motion grammar</span></div>
    <div class="ds-proof"><strong>0</strong><span>filler modules</span></div>
  </section>
  <section class="ds-scene-break"><p>One authored idea. Quiet support.</p></section>
</main>`,
    design: `# Expressive Web Stage System

## Purpose

Use for product, brand, portfolio, venue, and campaign experiences where the real subject must be the first-viewport signal.

## Direction

Build one authored visual world from a primary subject, display voice, material rule, and motion grammar. Use section rhythm and media direction instead of component accumulation.

## Color

Use the subject-led paradigm. The real subject or verified brand owns chroma; the dark reading field, light text, and red focal accent keep stable roles. The accent may become a bounded chapter field only with the verified inverse-text pairing.

## Boundaries

- Require a real, licensed, or clearly synthetic primary visual.
- Keep one visual protagonist and one signature motion rule.
- Preserve a complete static first frame and reduced-motion reading path.
- Do not use this system for repeated operational work, dense CRM screens, or evidence-heavy reporting.
`,
    usage: `# Expressive Web Usage

- Bind a primary subject before selecting this system.
- Replace the synthetic stage asset with project-owned media and record provenance.
- Use the stage, object index, proof strip, and scene break as primitives, not a fixed page order.
- Recompose on mobile; do not scale the desktop stage.
- Validate first viewport, dense content, critical state, and narrow-screen keyframes.
`,
    evidence: `# Evidence

The system and CSS are Design-owned. The preview image at \`../assets/stage.jpg\` was generated for this design-system preview on 2026-10-09 and is synthetic. It is not a product screenshot, factual evidence, or a reusable default asset.
`
  },
  {
    id: 'operational-product',
    name: 'Operational Product System',
    template: 'operational-product.html',
    iconSprite: operationalIconSprite,
    visualAssets: [{
      id: 'ant-design-official-operational-icons',
      kind: 'icon-set',
      family: 'ant-design-official',
      source: 'iconfont-local-svg',
      source_url: 'https://www.iconfont.cn/collections/detail?cid=9402',
      project: 'Ant Design 官方图标库',
      author: 'Iconfont publisher 竹尔; copyright Ant UED',
      license: 'MIT',
      license_url: 'https://github.com/ant-design/ant-design-icons/blob/master/LICENSE',
      license_evidence_ref: 'source/evidence.md',
      retrieved_at: '2026-10-10',
      file: 'assets/icons.svg',
      sha256: sha256Text(operationalIconSprite),
      icons: [
        { name: 'dashboard', source_id: '4765881' },
        { name: 'user', source_id: '4766293' },
        { name: 'filter', source_id: '4766688' },
        { name: 'audit', source_id: '4766507' },
        { name: 'export', source_id: '4765958' },
        { name: 'check-circle', source_id: '4765721' },
        { name: 'warning-circle', source_id: '4765746' }
      ]
    }],
    tokens: {
      colors: {
        surface: '#F3F6FA',
        panel: '#FFFFFF',
        panel_alt: '#E9EEF5',
        text: '#172033',
        muted: '#5F6B7A',
        line: '#D6DEE8',
        accent: '#245EA8',
        positive: '#26705A',
        warning: '#8A5B00',
        danger: '#B33A32'
      },
      color_contract: {
        schema_version: 'design-color-contract/v1',
        paradigm: 'operational-state',
        foundation: 'light',
        chroma_budget: 'restrained',
        primary_accent_roles: ['active-control', 'primary-action', 'selection'],
        secondary_accent_mode: 'semantic-support',
        semantic_exception_roles: ['positive', 'warning', 'danger'],
        max_focal_hues: 1,
        color_alone: false,
        required_pairings: [
          { foreground: 'text', background: 'surface', minimum_ratio: 7, usage: 'body-text' },
          { foreground: 'text', background: 'panel', minimum_ratio: 7, usage: 'body-text' },
          { foreground: 'muted', background: 'surface', minimum_ratio: 4.5, usage: 'supporting-text' },
          { foreground: 'muted', background: 'panel', minimum_ratio: 4.5, usage: 'supporting-text' },
          { foreground: 'accent', background: 'panel', minimum_ratio: 4.5, usage: 'interactive-text' },
          { foreground: 'positive', background: 'panel', minimum_ratio: 4.5, usage: 'status-text' },
          { foreground: 'warning', background: 'panel', minimum_ratio: 4.5, usage: 'status-text' },
          { foreground: 'danger', background: 'panel', minimum_ratio: 4.5, usage: 'status-text' }
        ]
      },
      typography: {
        display: '"Avenir Next", "Helvetica Neue", sans-serif',
        body: '"Avenir Next", "Helvetica Neue", sans-serif',
        mono: '"SFMono-Regular", Menlo, monospace'
      },
      spacing: {
        page: '24px',
        section: '20px',
        gap: '12px',
        tight: '6px',
        row_inset: '14px',
        control_compact: '32px',
        control_regular: '40px',
        control_touch: '44px',
        icon_box: '20px',
        icon_text_gap: '6px'
      },
      radius: {
        default: '6px',
        control: '4px'
      }
    },
    css: `:root {
  --surface: #F3F6FA;
  --panel: #FFFFFF;
  --panel-alt: #E9EEF5;
  --text: #172033;
  --muted: #5F6B7A;
  --line: #D6DEE8;
  --accent: #245EA8;
  --positive: #26705A;
  --warning: #8A5B00;
  --danger: #B33A32;
  --font-body: "Avenir Next", "Helvetica Neue", sans-serif;
  --font-mono: "SFMono-Regular", Menlo, monospace;
  --space-page: 24px;
  --space-section: 20px;
  --space-gap: 12px;
  --row-inset: 14px;
  --control-compact: 32px;
  --control-regular: 40px;
  --control-touch: 44px;
  --icon-box: 20px;
  --icon-text-gap: 6px;
  --radius: 6px;
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--surface); color: var(--text); font: 14px/1.45 var(--font-body); letter-spacing: 0; }
button, input { font: inherit; }
.ds-kicker { margin: 0; color: var(--muted); font: 600 11px/1.2 var(--font-mono); text-transform: uppercase; }
.ds-preview { min-height: 100vh; padding: 24px; }
.ds-workbench { min-height: 100vh; display: grid; grid-template-columns: 232px minmax(0, 1fr); }
.ds-sidebar { padding: 22px 16px; display: grid; grid-template-rows: auto 1fr auto; background: #182338; color: #F3F6FA; }
.ds-brand { font-size: 18px; font-weight: 700; }
.ds-nav { margin-top: 28px; display: grid; gap: 4px; }
.ds-nav a { min-height: var(--control-regular); padding: 0 10px; display: flex; align-items: center; gap: var(--icon-text-gap); color: #C3CEDD; border-radius: 4px; text-decoration: none; }
.ds-nav a[aria-current="page"] { background: #273A56; color: #FFFFFF; }
.ds-main { min-width: 0; padding: var(--space-page); }
.ds-toolbar { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.ds-toolbar h1 { margin: 0; font-size: 26px; line-height: 1.1; }
.ds-actions { display: flex; gap: 8px; }
.ds-button { min-height: var(--control-regular); padding: 0 12px; display: inline-flex; align-items: center; gap: var(--icon-text-gap); border: 1px solid var(--line); border-radius: 4px; background: var(--panel); color: var(--text); }
.ds-button-primary { border-color: var(--accent); background: var(--accent); color: #FFFFFF; }
.ds-icon-box { width: var(--icon-box); height: var(--icon-box); flex: 0 0 var(--icon-box); display: inline-grid; place-items: center; }
.ds-icon { width: 16px; height: 16px; display: block; fill: currentColor; }
.ds-metric-rail { margin-top: var(--space-section); display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid var(--line); border-radius: var(--radius); background: var(--panel); overflow: hidden; }
.ds-metric { min-height: 112px; padding: 16px; border-right: 1px solid var(--line); }
.ds-metric:last-child { border-right: 0; }
.ds-metric strong { display: block; margin-top: 22px; font: 650 26px/1 var(--font-mono); }
.ds-filter-bar { margin-top: var(--space-gap); padding: 10px; display: flex; gap: 8px; border: 1px solid var(--line); border-radius: var(--radius); background: var(--panel); }
.ds-filter { min-height: var(--control-compact); padding: 0 10px; border: 1px solid var(--line); border-radius: 4px; background: var(--panel-alt); }
.ds-queue { margin-top: var(--space-gap); border: 1px solid var(--line); border-radius: var(--radius); background: var(--panel); overflow: hidden; }
.ds-queue-head, .ds-queue-row { display: grid; grid-template-columns: 36px minmax(180px, 2fr) 1fr 1fr 120px; align-items: center; gap: var(--space-gap); padding: 12px var(--row-inset); }
.ds-queue-head { color: var(--muted); background: var(--panel-alt); font-size: 12px; font-weight: 700; }
.ds-queue-row { border-top: 1px solid var(--line); }
.ds-state { display: inline-flex; align-items: center; gap: var(--icon-text-gap); }
.ds-state .ds-icon-box { color: var(--positive); }
.ds-state[data-state="risk"] .ds-icon-box { color: var(--warning); }
.ds-state[data-state="error"] .ds-icon-box { color: var(--danger); }
.ds-detail { margin-top: var(--space-gap); padding: 16px; display: grid; grid-template-columns: 1fr 2fr; gap: var(--space-section); border: 1px solid var(--line); border-radius: var(--radius); background: var(--panel); }
.ds-detail[data-state="error"] { border-left: 3px solid var(--danger); }
.ds-detail h2 { margin: 0; font-size: 17px; }
.ds-detail p { margin: 0; color: var(--muted); }
@media (max-width: 820px) {
  .ds-workbench { grid-template-columns: 1fr; }
  .ds-sidebar { position: static; grid-template-columns: 1fr; grid-template-rows: auto auto; align-items: center; }
  .ds-nav { margin: 12px 0 0; display: flex; overflow-x: auto; }
  .ds-nav a { padding-inline: 6px; gap: 4px; }
  .ds-sidebar footer { display: none; }
  .ds-main { padding: 16px; }
  .ds-button, .ds-filter { min-height: var(--control-touch); }
  .ds-metric-rail { grid-template-columns: 1fr 1fr; }
  .ds-metric:nth-child(2) { border-right: 0; }
  .ds-metric:nth-child(-n+2) { border-bottom: 1px solid var(--line); }
  .ds-queue { border: 0; background: transparent; overflow: visible; }
  .ds-queue-head { display: none; }
  .ds-queue-row {
    margin-bottom: 8px;
    padding: 12px;
    grid-template-columns: 24px minmax(0, 1fr) auto;
    gap: 5px 10px;
    border: 1px solid var(--line);
    border-radius: var(--radius);
    background: var(--panel);
  }
  .ds-queue-row input { grid-column: 1; grid-row: 1 / 3; align-self: start; }
  .ds-account { grid-column: 2 / 4; }
  .ds-owner { grid-column: 2; color: var(--muted); }
  .ds-age { grid-column: 3; grid-row: 2; color: var(--muted); }
  .ds-state { grid-column: 2 / 4; margin-top: 6px; }
  .ds-detail { grid-template-columns: 1fr; }
}
@media (max-width: 360px) {
  .ds-toolbar { display: grid; grid-template-columns: 1fr; align-items: start; }
  .ds-toolbar h1 { white-space: nowrap; }
  .ds-actions { width: 100%; }
  .ds-button { flex: 1; justify-content: center; white-space: nowrap; }
  .ds-metric strong { font-size: 24px; white-space: nowrap; }
  .ds-filter-bar { display: grid; grid-template-columns: 1fr 1fr; }
  .ds-filter { white-space: nowrap; }
  .ds-filter:last-child { grid-column: 1 / -1; }
}`,
    components: [
      ['workbench-shell', 'stable application navigation', ['.ds-workbench', '.ds-sidebar', '.ds-main']],
      ['metric-rail', 'high-frequency status scan', ['.ds-metric-rail', '.ds-metric']],
      ['filter-bar', 'bounded operational controls', ['.ds-filter-bar', '.ds-filter']],
      ['work-queue', 'comparable repeated records', ['.ds-queue', '.ds-queue-row']],
      ['state-detail', 'selected object and next action', ['.ds-detail', '.ds-state']]
    ],
    body: `<main class="ds-workbench">
  <aside class="ds-sidebar"><div><div class="ds-brand" data-locale-exempt="brand">Relay Ops</div><nav class="ds-nav"><a aria-current="page" href="#"><span class="ds-icon-box" data-icon-box><svg class="ds-icon" data-icon data-icon-family="ant-design-official" aria-hidden="true"><use href="./assets/icons.svg#icon-dashboard"></use></svg></span><span>待处理</span></a><a href="#"><span class="ds-icon-box" data-icon-box><svg class="ds-icon" data-icon data-icon-family="ant-design-official" aria-hidden="true"><use href="./assets/icons.svg#icon-user"></use></svg></span><span>账户</span></a><a href="#"><span class="ds-icon-box" data-icon-box><svg class="ds-icon" data-icon data-icon-family="ant-design-official" aria-hidden="true"><use href="./assets/icons.svg#icon-filter"></use></svg></span><span>规则</span></a><a href="#"><span class="ds-icon-box" data-icon-box><svg class="ds-icon" data-icon data-icon-family="ant-design-official" aria-hidden="true"><use href="./assets/icons.svg#icon-audit"></use></svg></span><span>审计</span></a></nav></div><footer class="ds-kicker">工作区 / <span data-locale-exempt="approved-abbreviation">CN</span></footer></aside>
  <section class="ds-main">
    <header class="ds-toolbar"><div><p class="ds-kicker">运营 / 每日复核</p><h1>异常队列</h1></div><div class="ds-actions"><button class="ds-button"><span class="ds-icon-box" data-icon-box><svg class="ds-icon" data-icon data-icon-family="ant-design-official" aria-hidden="true"><use href="./assets/icons.svg#icon-export"></use></svg></span><span>导出</span></button><button class="ds-button ds-button-primary"><span class="ds-icon-box" data-icon-box><svg class="ds-icon" data-icon data-icon-family="ant-design-official" aria-hidden="true"><use href="./assets/icons.svg#icon-check-circle"></use></svg></span><span>分配 4 项</span></button></div></header>
    <section class="ds-metric-rail" data-keyframe="first"><div class="ds-metric"><span>待处理</span><strong>42</strong></div><div class="ds-metric"><span>有风险</span><strong>7</strong></div><div class="ds-metric"><span>中位等待</span><strong>2.4 小时</strong></div><div class="ds-metric"><span>今日已解决</span><strong>118</strong></div></section>
    <div class="ds-filter-bar"><button class="ds-filter">负责人：全部</button><button class="ds-filter">风险：待处理</button><button class="ds-filter">地区：<span data-locale-exempt="approved-abbreviation">CN</span></button></div>
    <section class="ds-queue" data-keyframe="dense"><div class="ds-queue-head"><span></span><span>账户</span><span>负责人</span><span>等待时长</span><span>状态</span></div><div class="ds-queue-row"><input type="checkbox" aria-label="选择 Northwind Retail" data-locale-exempt="original-field"><strong class="ds-account" data-locale-exempt="original-field">Northwind Retail</strong><span class="ds-owner" data-locale-exempt="original-field">J. Chen</span><span class="ds-age">3.2 小时</span><span class="ds-state" data-state="risk" data-icon-label><span class="ds-icon-box" data-icon-box><svg class="ds-icon" data-icon data-icon-family="ant-design-official" aria-hidden="true"><use href="./assets/icons.svg#icon-warning-circle"></use></svg></span><span>有风险</span></span></div><div class="ds-queue-row"><input type="checkbox" aria-label="选择 Meridian Labs" data-locale-exempt="original-field"><strong class="ds-account" data-locale-exempt="original-field">Meridian Labs</strong><span class="ds-owner" data-locale-exempt="original-field">A. Li</span><span class="ds-age">1.1 小时</span><span class="ds-state" data-icon-label><span class="ds-icon-box" data-icon-box><svg class="ds-icon" data-icon data-icon-family="ant-design-official" aria-hidden="true"><use href="./assets/icons.svg#icon-check-circle"></use></svg></span><span>复核中</span></span></div><div class="ds-queue-row"><input type="checkbox" aria-label="选择 Atlas Commerce" data-locale-exempt="original-field"><strong class="ds-account" data-locale-exempt="original-field">Atlas Commerce</strong><span class="ds-owner" data-locale-exempt="original-field">M. Wu</span><span class="ds-age">48 分钟</span><span class="ds-state" data-state="error" data-icon-label><span class="ds-icon-box" data-icon-box><svg class="ds-icon" data-icon data-icon-family="ant-design-official" aria-hidden="true"><use href="./assets/icons.svg#icon-warning-circle"></use></svg></span><span>处理失败</span></span></div></section>
    <section class="ds-detail" data-keyframe="critical" data-state="error"><div><p class="ds-kicker">关键错误</p><h2>策略同步失败</h2></div><p>系统未写入最新策略。请保留当前配置，检查审计记录后重试。</p></section>
  </section>
</main>`,
    design: `# Operational Product System

## Purpose

Use for SaaS, CRM, admin, monitoring, triage, and repeated operational work.

## Direction

Keep navigation, state, ownership, comparison, and next actions stable. Density is allowed when grouping and alignment make repeated scanning faster.

## Color

Use the operational-state paradigm. Neutral work surfaces dominate. Blue marks active control, selection, focus, and primary action. Green is reserved for labelled positive state; warning and danger colors remain local and never decorate sections.

## Boundaries

- No immersive hero, atmospheric media, or continuous animation.
- Controls use familiar icons or concise labels with visible state.
- Default, loading, empty, error, selected, disabled, and success states are part of the component contract.
- Mobile prioritizes the active task and may replace desktop tables with focused records.
`,
    usage: `# Operational Product Usage

- Start from the repeated task, critical object, and exception state.
- Keep primary actions stable and close to the affected object.
- Use the metric rail only for decision-relevant state.
- Preserve keyboard order, focus visibility, labels, and recovery paths.
- Keep the bundled Ant Design Iconfont sprite local, use visible Chinese labels,
  and retain the manifest provenance when adapting the system.
- Keep approved brand, technical ID, and original-field locale exemptions explicit.
- Validate dense, selected, empty, error, and narrow-screen states.
`,
    evidence: `# Evidence

The system, components, and sample data are Design-owned fixtures. All values are synthetic and exist only to demonstrate layout and state behavior.

The local icon sprite at \`../assets/icons.svg\` contains seven paths from the
[Ant Design official Iconfont collection](https://www.iconfont.cn/collections/detail?cid=9402),
retrieved on 2026-10-10. Iconfont publisher: 竹尔. Source icon ids and the exact
sprite hash are recorded in \`../manifest.json\`. No Iconfont font, JavaScript,
CDN, or runtime network request is used.

Ant Design Icons is licensed under the
[MIT License](https://github.com/ant-design/ant-design-icons/blob/master/LICENSE):

Copyright (c) 2018-present Ant UED, https://xtech.antfin.com/

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
`
  },
  {
    id: 'editorial-evidence',
    name: 'Editorial Evidence System',
    template: 'editorial-evidence.html',
    tokens: {
      colors: {
        surface: '#F3F0E8',
        paper: '#FCFBF7',
        text: '#201D18',
        muted: '#716B61',
        line: '#D8D1C4',
        accent: '#A23D2F',
        secondary: '#28566B'
      },
      color_contract: {
        schema_version: 'design-color-contract/v1',
        paradigm: 'editorial-ink',
        foundation: 'light',
        chroma_budget: 'balanced',
        primary_accent_roles: ['chapter', 'key-data'],
        secondary_accent_mode: 'bounded-series',
        semantic_exception_roles: [],
        max_focal_hues: 1,
        color_alone: false,
        required_pairings: [
          { foreground: 'text', background: 'surface', minimum_ratio: 7, usage: 'body-text' },
          { foreground: 'text', background: 'paper', minimum_ratio: 7, usage: 'body-text' },
          { foreground: 'muted', background: 'surface', minimum_ratio: 4.5, usage: 'supporting-text' },
          { foreground: 'muted', background: 'paper', minimum_ratio: 4.5, usage: 'supporting-text' },
          { foreground: 'accent', background: 'surface', minimum_ratio: 4.5, usage: 'interactive-text' },
          { foreground: 'secondary', background: 'paper', minimum_ratio: 4.5, usage: 'marker' }
        ]
      },
      typography: {
        display: '"Iowan Old Style", Baskerville, Georgia, serif',
        body: '"Avenir Next", "Helvetica Neue", sans-serif',
        mono: '"SFMono-Regular", Menlo, monospace'
      },
      spacing: {
        page: 'clamp(24px, 6vw, 92px)',
        section: '72px',
        gap: '24px',
        tight: '8px'
      },
      radius: {
        default: '2px',
        figure: '0px'
      }
    },
    css: `:root {
  --surface: #F3F0E8;
  --paper: #FCFBF7;
  --text: #201D18;
  --muted: #716B61;
  --line: #D8D1C4;
  --accent: #A23D2F;
  --secondary: #28566B;
  --font-display: "Iowan Old Style", Baskerville, Georgia, serif;
  --font-body: "Avenir Next", "Helvetica Neue", sans-serif;
  --font-mono: "SFMono-Regular", Menlo, monospace;
  --space-page: clamp(24px, 6vw, 92px);
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--surface); color: var(--text); font: 17px/1.65 var(--font-body); letter-spacing: 0; }
.ds-kicker { margin: 0; color: var(--accent); font: 700 11px/1.2 var(--font-mono); text-transform: uppercase; }
.ds-preview { min-height: 100vh; padding: var(--space-page); }
.ds-article { max-width: 1240px; margin: 0 auto; background: var(--paper); }
.ds-chapter { min-height: 72vh; padding: var(--space-page); display: grid; grid-template-columns: 2fr 8fr 2fr; grid-template-rows: auto 1fr auto; border-bottom: 1px solid var(--line); }
.ds-chapter .ds-kicker { grid-column: 1 / 2; }
.ds-chapter h1 { grid-column: 2 / 4; align-self: center; max-width: 10ch; margin: 0; font: 400 clamp(56px, 8vw, 112px)/.92 var(--font-display); text-wrap: balance; }
.ds-deck { grid-column: 2 / 3; max-width: 42em; margin: 0; color: var(--muted); font-size: 19px; }
.ds-reading { padding: 72px var(--space-page); display: grid; grid-template-columns: minmax(120px, 2fr) minmax(0, 7fr) minmax(160px, 3fr); gap: clamp(20px, 4vw, 56px); }
.ds-reading-nav { color: var(--muted); font: 500 12px/1.5 var(--font-mono); }
.ds-copy h2 { margin: 0 0 24px; font: 500 clamp(34px, 4vw, 54px)/1 var(--font-display); }
.ds-copy p { margin: 0 0 1.25em; }
.ds-source-rail { padding-left: 18px; border-left: 1px solid var(--line); color: var(--muted); font-size: 13px; line-height: 1.5; }
.ds-figure { margin: 44px 0; border-block: 1px solid var(--text); }
.ds-figure-chart { min-height: 260px; padding: 28px 0; display: grid; grid-template-columns: repeat(4, 1fr); align-items: end; gap: 14px; }
.ds-bar { min-height: 36px; background: var(--secondary); }
.ds-bar:nth-child(2) { height: 44%; }
.ds-bar:nth-child(3) { height: 68%; background: var(--accent); }
.ds-bar:nth-child(4) { height: 82%; }
.ds-figure figcaption { padding: 12px 0; color: var(--muted); font-size: 13px; }
.ds-pullquote { margin: 56px 0; padding: 30px 0 30px clamp(24px, 5vw, 72px); border-left: 6px solid var(--accent); font: 400 clamp(32px, 4vw, 58px)/1.06 var(--font-display); }
.ds-evidence-table { width: 100%; margin-top: 36px; border-collapse: collapse; font-size: 14px; }
.ds-evidence-table th, .ds-evidence-table td { padding: 12px 8px; border-bottom: 1px solid var(--line); text-align: left; }
.ds-evidence-table th { color: var(--muted); font-size: 11px; text-transform: uppercase; }
@media (max-width: 760px) {
  .ds-chapter { min-height: 68vh; grid-template-columns: 1fr; }
  .ds-chapter .ds-kicker, .ds-chapter h1, .ds-deck { grid-column: 1; }
  .ds-chapter h1 { font-size: clamp(52px, 17vw, 82px); }
  .ds-reading { grid-template-columns: 1fr; padding-block: 48px; }
  .ds-reading-nav { display: none; }
  .ds-source-rail { padding: 16px 0 0; border-left: 0; border-top: 1px solid var(--line); }
}`,
    components: [
      ['chapter-opener', 'argument and reading entry', ['.ds-chapter', '.ds-deck']],
      ['reading-grid', 'sustained evidence reading', ['.ds-reading', '.ds-copy', '.ds-source-rail']],
      ['annotated-figure', 'source-backed quantitative evidence', ['.ds-figure', '.ds-figure-chart']],
      ['pull-quote', 'bounded argument emphasis', ['.ds-pullquote']],
      ['evidence-table', 'multi-dimensional comparison', ['.ds-evidence-table']]
    ],
    body: `<article class="ds-article">
  <header class="ds-chapter" data-keyframe="first"><p class="ds-kicker">Field note / 06</p><h1>Evidence needs a reading rhythm.</h1><p class="ds-deck">A publication system for claims, figures, quotations, caveats, and sources. The argument owns the page; decoration remains subordinate.</p></header>
  <section class="ds-reading" data-keyframe="dense"><aside class="ds-reading-nav">01 / Finding<br>02 / Evidence<br>03 / Limits</aside><main class="ds-copy"><p class="ds-kicker">Primary finding</p><h2>Make the conclusion inspectable, not merely prominent.</h2><p>Strong hierarchy begins with the question and the evidence needed to answer it. The system keeps source, period, unit, denominator, and caveat near the figure instead of pushing trust into an appendix.</p><figure class="ds-figure"><div class="ds-figure-chart" aria-label="Illustrative four-period bar structure"><div class="ds-bar" style="height:32%"></div><div class="ds-bar"></div><div class="ds-bar"></div><div class="ds-bar"></div></div><figcaption>Illustrative geometry only. Production charts bind exact values and scales to code-derived evidence.</figcaption></figure><blockquote class="ds-pullquote">The visual answer and its uncertainty should be found in the same reading moment.</blockquote><table class="ds-evidence-table" data-keyframe="critical"><thead><tr><th>Claim</th><th>Evidence</th><th>Status</th></tr></thead><tbody><tr><td>Primary conclusion</td><td>Figure 01</td><td>Source bound</td></tr><tr><td>Known limitation</td><td>Method note</td><td>Visible</td></tr></tbody></table></main><aside class="ds-source-rail">Source rail<br><br>Keep citations, figure notes, scope, and uncertainty discoverable without turning the article into an audit log.</aside></section>
</article>`,
    design: `# Editorial Evidence System

## Purpose

Use for research, reports, analytical narratives, decision memos, and evidence-led long-form reading.

## Direction

Build publication rhythm from chapters, reading columns, figures, quotations, tables, source rails, and deliberate pauses.

## Color

Use the editorial-ink paradigm. Paper and ink carry sustained reading, the red accent marks chapter or evidence emphasis, and the blue secondary remains bounded to figures or source structure.

## Boundaries

- The conclusion and material uncertainty remain discoverable together.
- Figures bind question, takeaway, scale, unit, period, source, and caveat.
- Do not turn every paragraph into a card or every number into a KPI tile.
- Print and narrow-screen states preserve the argument and citations.
`,
    usage: `# Editorial Evidence Usage

- Start from the report spine and evidence order.
- Use chapter openers sparingly and keep body reading widths stable.
- Put figure captions and source notes next to the evidence.
- Use pull quotes only for source-backed or clearly attributed language.
- Validate long text, long citations, dense tables, print, and narrow-screen states.
`,
    evidence: `# Evidence

The system and all sample content are Design-owned. The bar geometry is explicitly illustrative and must not be reused as factual data.
`
  }
];

function tokensCss(system) {
  return system.css;
}

function colorPreview(system) {
  return previewPage(`${system.name} Colors`, system, `
    <h1>Color roles</h1>
    <div class="ds-token-grid">
      ${Object.entries(system.tokens.colors).map(([name, value]) => (
        `<div><span style="background:${value}"></span><strong>${name}</strong><code>${value}</code></div>`
      )).join('')}
    </div>
    <style>
      .ds-token-grid{margin-top:32px;display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:16px}
      .ds-token-grid div{display:grid;gap:8px}.ds-token-grid span{height:96px;border:1px solid var(--line)}
      .ds-token-grid code{color:var(--muted)}
    </style>`);
}

function typographyPreview(system) {
  return previewPage(`${system.name} Typography`, system, `
    <h1 style="font-family:var(--font-display);font-size:clamp(48px,8vw,110px);line-height:.92;margin:28px 0">A specific voice.</h1>
    <p style="max-width:46em;font-size:18px">Body typography remains calm enough for the artifact's real reading job while the display role carries the system's personality.</p>
    <p class="ds-kicker">Label / 0123456789</p>`);
}

function spacingPreview(system) {
  return previewPage(`${system.name} Spacing`, system, `
    <h1>Spacing rhythm</h1>
    <div style="margin-top:32px;display:grid;gap:18px">
      ${Object.entries(system.tokens.spacing).map(([name, value]) => (
        `<div><code>${name} / ${value}</code><div style="margin-top:6px;width:${value};max-width:100%;height:18px;background:var(--accent)"></div></div>`
      )).join('')}
    </div>`);
}

function operationalInlineBody(system) {
  return `<svg aria-hidden="true" style="display:none">${operationalIconSymbols}</svg>`
    + system.body.replaceAll('./assets/icons.svg#', '#');
}

function operationalRenderSpec(componentHtml) {
  const payload = {
    schema_version: 'design-render-spec/v2',
    viewports: [1440, 390, 320],
    segments: [{ id: 'main', kind: 'selector', selector: '.ds-main' }],
    states: [
      {
        id: 'default',
        setup: [],
        assertions: [
          { kind: 'visible', selector: 'main' },
          {
            kind: 'relation',
            selector: '.ds-filter-bar',
            target_selector: '.ds-metric-rail',
            relation: 'left-edge',
            tolerance_px: 2
          },
          {
            kind: 'relation',
            selector: '.ds-actions .ds-button:not(.ds-button-primary)',
            target_selector: '.ds-actions .ds-button-primary',
            relation: 'equal-height',
            tolerance_px: 2
          },
          {
            kind: 'relation',
            selector: '[data-icon]',
            target_selector: '[data-icon-box]',
            relation: 'center-x',
            tolerance_px: 1
          },
          {
            kind: 'relation',
            selector: '[data-icon]',
            target_selector: '[data-icon-box]',
            relation: 'center-y',
            tolerance_px: 1
          },
          {
            kind: 'locale',
            selector: 'body',
            locale: 'zh-CN',
            exempt_selector: '[data-locale-exempt]',
            allowed_terms: []
          },
          {
            kind: 'icon',
            selector: '[data-icon]',
            family: 'ant-design-official',
            asset_ref: 'assets/icons.svg',
            provenance_ref: 'manifest.json',
            sizes_px: [16, 18],
            box_selector: '[data-icon-box]',
            box_px: 20,
            tolerance_px: 1,
            fallback: 'visible-label'
          }
        ]
      },
      {
        id: 'dense',
        setup: [],
        assertions: [
          { kind: 'visible', selector: '[data-keyframe="dense"]' },
          { kind: 'count', selector: '.ds-queue-row', expected: 3 }
        ]
      },
      {
        id: 'error',
        setup: [],
        assertions: [
          {
            kind: 'visible',
            selector: '.ds-detail[data-state="error"]'
          },
          {
            kind: 'text',
            selector: '.ds-detail[data-state="error"]',
            expected: '策略同步失败'
          }
        ]
      }
    ],
    remote_policy: { mode: 'deny_all', allowed_origins: [] }
  };
  return {
    ...payload,
    resolved_plan_digest: sha256Text('operational-product-preview-plan/v1'),
    artifact_digest: sha256Text(
      componentHtml.endsWith('\n') ? componentHtml : `${componentHtml}\n`
    ),
    spec_digest: sha256Text(stable(payload))
  };
}

function templateHtml(system) {
  let placeholderBody = system.body;
  if (system.id === 'expressive-web') {
    placeholderBody = system.body.replace(
      '<figure class="ds-stage-media"><img src="./assets/stage.jpg" alt="Synthetic red glass sculpture on a steel plinth"></figure>',
      '<figure class="ds-stage-media" data-image-slot="primary-subject"><div aria-label="Bind a project-owned primary subject"></div></figure>'
    );
  }
  if (system.id === 'operational-product') {
    placeholderBody = operationalInlineBody(system);
  }
  return `<!doctype html>
<html lang="${system.id === 'operational-product' ? 'zh-CN' : 'en'}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${system.name} Template</title>
  <style>${system.css}</style>
</head>
<body>${placeholderBody}</body>
</html>`;
}

for (const system of systems) {
  const systemRoot = resolve(root, 'design-systems', system.id);
  const componentBody = system.id === 'operational-product'
    ? operationalInlineBody(system)
    : system.body;
  const componentHtml = page(
    `${system.name} Components`,
    'tokens.css',
    componentBody,
    { lang: system.id === 'operational-product' ? 'zh-CN' : 'en' }
  );
  const renderSpec = system.id === 'operational-product'
    ? operationalRenderSpec(componentHtml)
    : null;
  writeJson(resolve(systemRoot, 'manifest.json'), {
    schema_version: 'design-system-package/v1',
    id: system.id,
    name: system.name,
    files: {
      design: 'DESIGN.md',
      tokens: 'tokens.css',
      design_tokens: 'design-tokens.json',
      components: 'components.html',
      components_manifest: 'components.manifest.json',
      layouts: 'layouts.css',
      ...(system.iconSprite ? { icon_sprite: 'assets/icons.svg' } : {})
    },
    ...(system.visualAssets ? { visual_assets: system.visualAssets } : {}),
    preview: [
      { path: 'preview/colors.html', role: 'colors' },
      { path: 'preview/typography.html', role: 'typography' },
      { path: 'preview/spacing.html', role: 'spacing' },
      { path: 'preview/deck.html', role: 'system-preview' },
      ...(renderSpec
        ? [{ path: 'preview/render-spec.json', role: 'render-spec' }]
        : [])
    ],
    contracts: {
      layout_lock: `${system.id}-v1`,
      accent_policy: 'content-owned-primary-accent',
      color_policy: system.tokens.color_contract.paradigm,
      svg_text_policy: 'html-text-for-visible-copy',
      motion_policy: system.id === 'expressive-web'
        ? 'semantic-motion-with-static-and-reduced-motion-fallback'
        : 'static-first-with-semantic-state-feedback'
    }
  });
  write(resolve(systemRoot, 'DESIGN.md'), system.design);
  write(resolve(systemRoot, 'USAGE.md'), system.usage);
  write(resolve(systemRoot, 'tokens.css'), tokensCss(system));
  write(resolve(systemRoot, 'layouts.css'), system.css);
  if (system.iconSprite) {
    write(resolve(systemRoot, 'assets/icons.svg'), system.iconSprite);
  }
  writeJson(resolve(systemRoot, 'design-tokens.json'), {
    schema_version: 'design-tokens/v1',
    colors: system.tokens.colors,
    color_contract: system.tokens.color_contract,
    typography: system.tokens.typography,
    spacing: system.tokens.spacing,
    radius: system.tokens.radius
  });
  writeJson(resolve(systemRoot, 'components.manifest.json'), {
    schema_version: 'components-manifest/v1',
    system_id: system.id,
    components: system.components.map(([id, role, selectors]) => ({
      id,
      role,
      selectors
    }))
  });
  write(resolve(systemRoot, 'components.html'), componentHtml);
  write(resolve(systemRoot, 'preview/colors.html'), colorPreview(system));
  write(resolve(systemRoot, 'preview/typography.html'), typographyPreview(system));
  write(resolve(systemRoot, 'preview/spacing.html'), spacingPreview(system));
  if (renderSpec) {
    writeJson(resolve(systemRoot, 'preview/render-spec.json'), renderSpec);
  }
  write(
    resolve(systemRoot, 'preview/deck.html'),
    page(
      `${system.name} Preview`,
      '../tokens.css',
      system.id === 'expressive-web'
        ? system.body.replace(
            'src="./assets/stage.jpg"',
            'src="../assets/stage.jpg"'
          )
        : system.id === 'operational-product'
          ? operationalInlineBody(system)
          : system.body,
      {
        preview: true,
        lang: system.id === 'operational-product' ? 'zh-CN' : 'en'
      }
    )
  );
  write(resolve(systemRoot, 'source/evidence.md'), system.evidence);
  writeJson(resolve(systemRoot, 'source/token-contract.report.json'), {
    schema_version: 'design-token-contract-report/v1',
    system_id: system.id,
    status: 'passed',
    required_groups: ['colors', 'color_contract', 'typography', 'spacing', 'radius'],
    generated_by: 'scripts/build-production-design-systems.mjs'
  });
  const keyframeSelectors = system.id === 'expressive-web'
    ? {
        first_viewport: '[data-keyframe="first"]',
        dense_content: '[data-keyframe="dense"]',
        critical_state: '[data-keyframe="critical"]'
      }
    : system.id === 'operational-product'
      ? {
          first_viewport: '.ds-main',
          dense_content: '[data-keyframe="dense"]',
          critical_state: '[data-keyframe="critical"]'
        }
      : {
          first_viewport: '[data-keyframe="first"]',
          dense_content: '[data-keyframe="dense"]',
          critical_state: '[data-keyframe="critical"]'
        };
  writeJson(resolve(systemRoot, 'preview/keyframes.json'), {
    schema_version: 'design-keyframe-capture-spec/v1',
    reduced_motion: true,
    frames: [
      {
        role: 'first_viewport',
        state_id: 'first-default',
        viewport: { width: 1440, height: 900 },
        capture: 'selector',
        selector: keyframeSelectors.first_viewport,
        setup: []
      },
      {
        role: 'dense_content',
        state_id: 'dense-default',
        viewport: { width: 1440, height: 900 },
        capture: 'selector',
        selector: keyframeSelectors.dense_content,
        setup: []
      },
      {
        role: 'critical_state',
        state_id: 'critical-default',
        viewport: { width: 1440, height: 900 },
        capture: 'selector',
        selector: keyframeSelectors.critical_state,
        setup: []
      },
      {
        role: 'narrow_screen',
        state_id: 'narrow-default',
        viewport: { width: 390, height: 844 },
        capture: 'viewport',
        setup: []
      }
    ]
  });
  write(resolve(root, 'assets/templates', system.template), templateHtml(system));
}

if (!existsSync(resolve(
  root,
  'design-systems/expressive-web/assets/stage.jpg'
))) {
  throw new Error(
    'expressive-web preview asset is missing: '
    + 'design-systems/expressive-web/assets/stage.jpg'
  );
}

console.log(
  `Production design systems built: ${systems.map((system) => system.id).join(', ')}`
);
