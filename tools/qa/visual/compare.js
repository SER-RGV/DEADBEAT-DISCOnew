/* ==========================================================================
   Comparación de capturas sin dependencias.

   Las dos imágenes se decodifican y comparan dentro del propio navegador
   (createImageBitmap + canvas), así que no hace falta ninguna librería de PNG.
   Devuelve el porcentaje de píxeles distintos con una tolerancia por canal, que
   absorbe el ruido del render software.
   ========================================================================== */
'use strict';

/**
 * @param {import('playwright-core').Page} page
 * @param {Buffer} actual  captura nueva (PNG)
 * @param {Buffer} reference captura de referencia (PNG)
 * @param {number} tolerance diferencia máxima por canal (0-255) que se ignora
 */
async function compare(page, actual, reference, tolerance) {
  return page.evaluate(async ({ a, b, tol }) => {
    const load = (b64) => new Promise((resolve, reject) => {
      const bin = atob(b64);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      createImageBitmap(new Blob([bytes], { type: 'image/png' })).then(resolve, reject);
    });

    const [ia, ib] = await Promise.all([load(a), load(b)]);
    if (ia.width !== ib.width || ia.height !== ib.height) {
      return { sizeMismatch: true, actual: [ia.width, ia.height], reference: [ib.width, ib.height] };
    }
    const w = ia.width, h = ia.height;
    const draw = (img) => {
      const c = new OffscreenCanvas(w, h);
      const ctx = c.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      return ctx.getImageData(0, 0, w, h).data;
    };
    const da = draw(ia), db = draw(ib);
    let diff = 0;
    for (let i = 0; i < da.length; i += 4) {
      if (Math.abs(da[i] - db[i]) > tol || Math.abs(da[i + 1] - db[i + 1]) > tol || Math.abs(da[i + 2] - db[i + 2]) > tol) diff++;
    }
    const total = w * h;
    return { width: w, height: h, diffPixels: diff, total, pct: (diff / total) * 100 };
  }, { a: actual.toString('base64'), b: reference.toString('base64'), tol: tolerance == null ? 24 : tolerance });
}

module.exports = { compare };
