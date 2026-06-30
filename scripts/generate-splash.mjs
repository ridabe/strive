/**
 * Gera splash screens Apple iOS com o logo oficial completo:
 * hexágono + barras + texto STRIVE + PERSONAL
 * Uso: node scripts/generate-splash.mjs
 */

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);
const { Resvg } = require('@resvg/resvg-js');

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'splash');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const BRAND = '#C8FF00';
const BG    = '#0E0E1A';

const SPLASH_SIZES = [
  { w: 1290, h: 2796, name: 'apple-splash-1290x2796.png' },
  { w: 1179, h: 2556, name: 'apple-splash-1179x2556.png' },
  { w: 1284, h: 2778, name: 'apple-splash-1284x2778.png' },
  { w: 1170, h: 2532, name: 'apple-splash-1170x2532.png' },
  { w: 828,  h: 1792, name: 'apple-splash-828x1792.png'  },
  { w: 750,  h: 1334, name: 'apple-splash-750x1334.png'  },
  { w: 2048, h: 2732, name: 'apple-splash-2048x2732.png' },
  { w: 1668, h: 2388, name: 'apple-splash-1668x2388.png' },
  { w: 1640, h: 2360, name: 'apple-splash-1640x2360.png' },
];

function buildSplashSvg(w, h) {
  const cx = w / 2;
  // Bloco do logo centralizado verticalmente com leve deslocamento para cima
  const logoBlockH = h * 0.52;   // altura total do bloco (hex + textos)
  const blockTop   = (h - logoBlockH) / 2;

  // --- Hexágono ---
  const R  = Math.min(w, h) * 0.175;   // raio do hexágono
  const hexCY = blockTop + R * 1.1;    // centro Y do hexágono
  const s3 = Math.sqrt(3) / 2;

  const pts = [
    [cx,        hexCY - R],
    [cx + R*s3, hexCY - R/2],
    [cx + R*s3, hexCY + R/2],
    [cx,        hexCY + R],
    [cx - R*s3, hexCY + R/2],
    [cx - R*s3, hexCY - R/2],
  ].map(([x,y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

  const sw   = Math.max(4, w * 0.013);
  const glowB = (R * 0.08).toFixed(1);

  // Barras
  const barW   = R * 0.28;
  const barGap = R * 0.09;
  const totalW = 3 * barW + 2 * barGap;
  const bx     = cx - totalW / 2;
  const bBot   = hexCY + R * 0.50;
  const h1     = R * 0.42;
  const h2     = R * 0.68;
  const h3     = R * 0.95;
  const rx     = Math.max(2, barW * 0.15);

  // --- Textos ---
  const hexBottom  = hexCY + R;
  const gap        = R * 0.30;               // espaço entre hex e "STRIVE"
  const striveSize = R * 1.00;               // tamanho fonte STRIVE
  const personalSz = R * 0.30;              // tamanho fonte PERSONAL
  const ls         = (R * 0.08).toFixed(1); // letter-spacing PERSONAL

  const striveY    = hexBottom + gap + striveSize * 0.75;
  const personalY  = striveY + striveSize * 0.55 + personalSz;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#16162a"/>
      <stop offset="100%" stop-color="${BG}"/>
    </linearGradient>
    <filter id="glow" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="${glowB}" result="blur"/>
      <feFlood flood-color="${BRAND}" flood-opacity="0.5" result="color"/>
      <feComposite in="color" in2="blur" operator="in" result="g"/>
      <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="textglow" x="-10%" y="-20%" width="120%" height="140%">
      <feGaussianBlur stdDeviation="${(R*0.04).toFixed(1)}" result="blur"/>
      <feFlood flood-color="#ffffff" flood-opacity="0.25" result="color"/>
      <feComposite in="color" in2="blur" operator="in" result="g"/>
      <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Fundo -->
  <rect width="${w}" height="${h}" fill="url(#bg)"/>

  <!-- Hexágono -->
  <polygon
    points="${pts}"
    fill="none"
    stroke="${BRAND}"
    stroke-width="${sw.toFixed(1)}"
    stroke-linejoin="round"
    filter="url(#glow)"
  />

  <!-- Barras -->
  <rect x="${bx.toFixed(1)}" y="${(bBot-h1).toFixed(1)}" width="${barW.toFixed(1)}" height="${h1.toFixed(1)}" rx="${rx.toFixed(1)}" fill="${BRAND}" filter="url(#glow)"/>
  <rect x="${(bx+barW+barGap).toFixed(1)}" y="${(bBot-h2).toFixed(1)}" width="${barW.toFixed(1)}" height="${h2.toFixed(1)}" rx="${rx.toFixed(1)}" fill="${BRAND}" filter="url(#glow)"/>
  <rect x="${(bx+2*(barW+barGap)).toFixed(1)}" y="${(bBot-h3).toFixed(1)}" width="${barW.toFixed(1)}" height="${h3.toFixed(1)}" rx="${rx.toFixed(1)}" fill="${BRAND}" filter="url(#glow)"/>

  <!-- STRIVE -->
  <text
    x="${cx.toFixed(1)}"
    y="${striveY.toFixed(1)}"
    font-family="Impact, Arial Black, 'Arial Narrow Bold', sans-serif"
    font-size="${striveSize.toFixed(1)}"
    font-weight="900"
    fill="#FFFFFF"
    text-anchor="middle"
    filter="url(#textglow)"
  >STRIVE</text>

  <!-- PERSONAL -->
  <text
    x="${cx.toFixed(1)}"
    y="${personalY.toFixed(1)}"
    font-family="Arial, Helvetica, sans-serif"
    font-size="${personalSz.toFixed(1)}"
    font-weight="400"
    fill="${BRAND}"
    text-anchor="middle"
    letter-spacing="${ls}"
  >PERSONAL</text>
</svg>`;
}

function renderPng(svgStr) {
  const resvg = new Resvg(svgStr, { fitTo: { mode: 'original' } });
  return resvg.render().asPng();
}

console.log('Gerando splash screens com logo oficial Strive...\n');

for (const { w, h, name } of SPLASH_SIZES) {
  const svg = buildSplashSvg(w, h);
  fs.writeFileSync(path.join(OUTPUT_DIR, name), renderPng(svg));
  console.log(`✓ ${name} (${w}×${h})`);
}

console.log('\n✅ Splash screens geradas em public/splash/');
