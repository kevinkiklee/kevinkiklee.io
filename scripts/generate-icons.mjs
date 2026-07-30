import sharp from 'sharp';
const svg = 'public/favicon.svg';
await sharp(svg).resize(192, 192).png().toFile('public/favicon-192.png');
await sharp(svg).resize(512, 512).png().toFile('public/favicon-512.png');
// Maskable: same mark with extra safe-zone padding.
await sharp(svg)
  .resize(400, 400)
  .extend({ top: 56, bottom: 56, left: 56, right: 56, background: '#eff1e7' })
  .png()
  .toFile('public/icon-maskable.png');
console.log('icons written');
