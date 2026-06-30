/**
 * Gera ícones PWA usando o logo oficial Strive Personal.
 * Logo: hexágono pontudo (topo/base) + gráfico de barras ascendente + cor neon #C8FF00
 * Uso: node scripts/generate-icons.mjs
 */

import { createRequire } from 'module';
import fs from 'fs';
import path from 'path';

const require = createRequire(import.meta.url);
const { Resvg } = require('@resvg/resvg-js');

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'icons');
const PUBLIC_DIR = path.join(process.cwd(), 'public');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const BRAND   = '#C8FF00';  // neon yellow-green do logo
const BG      = '#0E0E1A';  // fundo escuro

/**
 * Gera o SVG do ícone (apenas o símbolo: hexágono + barras).
 * Para ícones pequenos, texto seria ilegível — usamos só o mark.
 */
function buildIconSvg(size, maskable = false) {
  const cx = size / 2;
  const cy = size / 2;

  // Para maskable, Google recomenda que o conteúdo fique dentro de 80% do ícone
  const R = maskable ? size * 0.34 : size * 0.40;

  // Hexágono pointy-top (vértices em topo e base)
  const s3 = Math.sqrt(3) / 2;
  const pts = [
    [cx,          cy - R],       // topo
    [cx + R*s3,   cy - R/2],     // superior-direito
    [cx + R*s3,   cy + R/2],     // inferior-direito
    [cx,          cy + R],       // base
    [cx - R*s3,   cy + R/2],     // inferior-esquerdo
    [cx - R*s3,   cy - R/2],     // superior-esquerdo
  ].map(([x,y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');

  const sw = Math.max(2, size * 0.030); // espessura do contorno

  // Gráfico de barras: 3 barras ascendentes (esq→dir) centralizadas no hexágono
  const barW   = R * 0.28;
  const barGap = R * 0.09;
  const totalW = 3 * barW + 2 * barGap;
  const bx     = cx - totalW / 2;           // x inicial da barra 1
  const bBot   = cy + R * 0.50;             // base das barras
  const h1     = R * 0.42;                  // barra esquerda (baixa)
  const h2     = R * 0.68;                  // barra central (média)
  const h3     = R * 0.95;                  // barra direita (alta)
  const rx     = Math.max(1, barW * 0.15);  // arredondamento das barras

  // Raio de border-radius do ícone (não maskable)
  const iconRx = size * 0.22;

  // Glow filter: sutil brilho neon no hexágono
  const glowBlur = (size * 0.03).toFixed(1);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="${glowBlur}" result="blur"/>
      <feFlood flood-color="${BRAND}" flood-opacity="0.55" result="color"/>
      <feComposite in="color" in2="blur" operator="in" result="g"/>
      <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Fundo -->
  <rect width="${size}" height="${size}" fill="${BG}"${maskable ? '' : ` rx="${iconRx.toFixed(1)}"`}/>

  <!-- Hexágono contorno com glow neon -->
  <polygon
    points="${pts}"
    fill="none"
    stroke="${BRAND}"
    stroke-width="${sw.toFixed(1)}"
    stroke-linejoin="round"
    filter="url(#glow)"
  />

  <!-- Barras do gráfico -->
  <rect x="${bx.toFixed(1)}" y="${(bBot-h1).toFixed(1)}" width="${barW.toFixed(1)}" height="${h1.toFixed(1)}" rx="${rx.toFixed(1)}" fill="${BRAND}" filter="url(#glow)"/>
  <rect x="${(bx+barW+barGap).toFixed(1)}" y="${(bBot-h2).toFixed(1)}" width="${barW.toFixed(1)}" height="${h2.toFixed(1)}" rx="${rx.toFixed(1)}" fill="${BRAND}" filter="url(#glow)"/>
  <rect x="${(bx+2*(barW+barGap)).toFixed(1)}" y="${(bBot-h3).toFixed(1)}" width="${barW.toFixed(1)}" height="${h3.toFixed(1)}" rx="${rx.toFixed(1)}" fill="${BRAND}" filter="url(#glow)"/>
</svg>`;
}

function renderPng(svgStr, size) {
  const resvg = new Resvg(svgStr, { fitTo: { mode: 'width', value: size } });
  return resvg.render().asPng();
}

const SIZES = [72, 96, 128, 144, 152, 180, 192, 384, 512];

console.log('Gerando ícones com logo oficial Strive...\n');

for (const size of SIZES) {
  const png = renderPng(buildIconSvg(size, false), size);
  fs.writeFileSync(path.join(OUTPUT_DIR, `icon-${size}.png`), png);
  console.log(`✓ icon-${size}.png`);
}

// Maskable (512×512)
const maskPng = renderPng(buildIconSvg(512, true), 512);
fs.writeFileSync(path.join(OUTPUT_DIR, 'icon-512-maskable.png'), maskPng);
console.log('✓ icon-512-maskable.png');

// Apple touch icon (raiz)
fs.writeFileSync(path.join(PUBLIC_DIR, 'apple-touch-icon.png'), renderPng(buildIconSvg(180, false), 180));
console.log('✓ apple-touch-icon.png (public/)');

// Favicons
fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon-32.png'), renderPng(buildIconSvg(32, false), 32));
console.log('✓ favicon-32.png');
fs.writeFileSync(path.join(PUBLIC_DIR, 'favicon-16.png'), renderPng(buildIconSvg(16, false), 16));
console.log('✓ favicon-16.png');

console.log('\n✅ Todos os ícones gerados com o logo oficial em public/icons/');
