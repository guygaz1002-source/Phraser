// Offline print renderer. Plate colours and ink are flattened into the WebP for native and web.
const sharp = require("sharp");
const path = require("node:path");
const paperPath = path.resolve(__dirname, "../assets/art-materials/cotton-paper.webp");
const paper = sharp(paperPath).resize(256, 256).removeAlpha().greyscale().raw().toBuffer();

const styles = {
  kids: { size: 520, radius: 4, colors: 38, chroma: 1.24, lift: 17, ink: .66, grain: .63, hatch: 0 },
  teen: { size: 616, radius: 3, colors: 52, chroma: 1.13, lift: 10, ink: .87, grain: .57, hatch: .50 },
  classic: { size: 664, radius: 3, colors: 64, chroma: .93, lift: 13, ink: .73, grain: .82, hatch: .75 }
};
const clamp = n => Math.max(0, Math.min(255, n));
const luminance = (r, g, b) => r * .25 + g * .62 + b * .13;

// A Kuwahara brush picks the least-varied quadrant near an edge, laying down broad
// paint without averaging a hand into a sleeve or a bird into the surrounding sky.
function brushFields(rgb, width, height, radius) {
  const stride = width + 1;
  const length = stride * (height + 1);
  const red = new Float64Array(length), green = new Float64Array(length);
  const blue = new Float64Array(length), square = new Float64Array(length);
  for (let y = 0; y < height; y++) {
    let sr = 0, sg = 0, sb = 0, sq = 0;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 3;
      sr += rgb[i]; sg += rgb[i + 1]; sb += rgb[i + 2];
      const l = luminance(rgb[i], rgb[i + 1], rgb[i + 2]); sq += l * l;
      const end = (y + 1) * stride + x + 1, above = end - stride;
      red[end] = red[above] + sr; green[end] = green[above] + sg;
      blue[end] = blue[above] + sb; square[end] = square[above] + sq;
    }
  }
  const result = Buffer.alloc(rgb.length);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const offset = (y * width + x) * 3;
    let lowest = Infinity;
    for (let quad = 0; quad < 4; quad++) {
      const x0 = quad & 1 ? x : Math.max(0, x - radius);
      const x1 = quad & 1 ? Math.min(width, x + radius + 1) : x + 1;
      const y0 = quad & 2 ? y : Math.max(0, y - radius);
      const y1 = quad & 2 ? Math.min(height, y + radius + 1) : y + 1;
      const n = (x1 - x0) * (y1 - y0);
      const a = y0 * stride + x0, b = y0 * stride + x1;
      const c = y1 * stride + x0, d = y1 * stride + x1;
      const r = (red[d] + red[a] - red[b] - red[c]) / n;
      const g = (green[d] + green[a] - green[b] - green[c]) / n;
      const bl = (blue[d] + blue[a] - blue[b] - blue[c]) / n;
      const l = luminance(r, g, bl);
      const variance = (square[d] + square[a] - square[b] - square[c]) / n - l * l;
      if (variance < lowest) {
        lowest = variance; result[offset] = r; result[offset + 1] = g; result[offset + 2] = bl;
      }
    }
  }
  return result;
}

async function paintPicture(source, destination, edition) {
  const s = styles[edition];
  const { data: rgb, info: {width, height} } = await sharp(source)
    .resize({width:s.size, height:s.size, fit:'inside'}).removeAlpha().toColourspace('srgb').raw().toBuffer({resolveWithObject:true});
  const raw = {width, height, channels:3};
  const brushed = brushFields(rgb, width, height, s.radius);
  const indexed = await sharp(brushed,{raw}).blur(.65)
    .png({palette:true, colours:s.colors, dither:0, effort:2}).toBuffer();
  const fields = await sharp(indexed).removeAlpha().toColourspace('srgb').raw().toBuffer();
  // Smooth at two scales: their difference gives a thin dark-side ink wash at object boundaries.
  const fine = await sharp(brushed,{raw}).greyscale().blur(.65).raw().toBuffer();
  const broad = await sharp(brushed,{raw}).greyscale().blur(2.6).raw().toBuffer();
  const detail = await sharp(rgb,{raw}).greyscale().blur(.58).raw().toBuffer();
  const shape = await sharp(rgb,{raw}).greyscale().blur(2.1).raw().toBuffer();
  const texture = await paper;
  const inkRGB = edition === 'kids' ? [80,52,45] : edition === 'teen' ? [50,39,44] : [66,49,42];
  for(let y=0; y<height; y++) for(let x=0;x<width;x++){
    const i=y*width+x, at=i*3, l=luminance(fields[at],fields[at+1],fields[at+2]);
    const paperLight=(texture[(y%256)*256+(x%256)]-218)/5;
    const edge=Math.min(1,Math.max(0,(broad[i]-fine[i]-1.8)/20));
    // Two lightly wavering sets of engraving strokes follow the shadow values.
    const band=Math.abs(((x+1.65*y+2*Math.sin(y/24))%8)-4);
    const cross=Math.abs(((x-1.8*y+height*2+2*Math.sin(x/30))%9)-4.5);
    const hatch=(band<.8 ? Math.max(0,(115-l)/160) : 0) + (cross<.52 ? Math.max(0,(60-l)/175) : 0);
    const opacity=Math.min(.9, s.ink*Math.max(edge, Math.min(1, Math.max(0,(shape[i]-detail[i]-5)/27))) + s.hatch*hatch);
    for(let ch=0;ch<3;ch++){
      const color=l+(fields[at+ch]-l)*s.chroma;
      const tint=[4,2,-2][ch];
      const strokes=Math.max(-10,Math.min(10,(detail[i]-fine[i])*.28));
      const pigment=strokes+s.lift+color*(239-s.lift)/255+tint+paperLight*s.grain;
      fields[at+ch]=clamp(pigment*(1-opacity)+inkRGB[ch]*opacity);
    }
  }
  return sharp(fields,{raw}).webp({quality:89, effort:3}).toFile(destination);
}
module.exports = { paintPicture };
