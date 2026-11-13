#!/usr/bin/env python3
"""Genera un único HTML autónomo del juego, para descargar y abrir con doble clic.

index.html necesita la carpeta assets/ a su lado (unos 100 MB en 278 archivos).
Este script mete esos archivos DENTRO del HTML, de modo que el archivo resultante
funciona solo, sin servidor y sin conexión.

  python3 tools/build_standalone_html.py [salida.html]

- Parte de index.html (generarlo antes con tools/build_active_html.py).
- Los PNG se recodifican a WebP SIN PÉRDIDA (píxeles idénticos) para reducir el
  tamaño; los archivos de assets/ no se tocan.
- No se sube a Git: es un derivado grande. Necesita Pillow.
"""
import base64, hashlib, io, json, os, re, sys
from concurrent.futures import ProcessPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "index.html")
ARGS = [a for a in sys.argv[1:] if not a.startswith("--")]
# --ligero: WebP con pérdida (calidad 95, transparencia exacta). El archivo queda
# en torno a un tercio, pero los píxeles ya no son idénticos a los originales.
LIGHT = "--ligero" in sys.argv[1:]
OUT = ARGS[0] if ARGS else os.path.join(
    ROOT, "descarga", "DEADBEAT_DISCO_COMPLETO_LIGERO.html" if LIGHT else "DEADBEAT_DISCO_COMPLETO.html")
CACHE = os.path.join(os.environ.get("TMPDIR", "/tmp"), "dd_standalone_cache")
MIME = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
        ".woff2": "font/woff2", ".woff": "font/woff"}


def encode(rel):
    path = os.path.join(ROOT, rel)
    raw = open(path, "rb").read()
    ext = os.path.splitext(rel)[1].lower()
    mime, data = MIME[ext], raw
    if ext == ".png":
        key = os.path.join(CACHE, hashlib.sha1(raw).hexdigest() + (".q95.webp" if LIGHT else ".webp"))
        if os.path.exists(key):
            webp = open(key, "rb").read()
        else:
            from PIL import Image
            im = Image.open(io.BytesIO(raw))
            if im.mode not in ("RGB", "RGBA"):
                im = im.convert("RGBA")
            buf = io.BytesIO()
            if LIGHT:
                im.save(buf, "WEBP", quality=95, method=4, alpha_quality=100, exact=True)
                webp = buf.getvalue()
            else:
                im.save(buf, "WEBP", lossless=True, quality=70, method=4, exact=True)
                webp = buf.getvalue()
                # Garantía: los píxeles decodificados son exactamente los del PNG.
                back = Image.open(io.BytesIO(webp)).convert(im.mode)
                assert back.size == im.size and back.tobytes() == im.tobytes(), "WebP no idéntico: " + rel
            os.makedirs(CACHE, exist_ok=True)
            open(key, "wb").write(webp)
        if len(webp) < len(raw):
            mime, data = "image/webp", webp
    return rel, "data:" + mime + ";base64," + base64.b64encode(data).decode("ascii"), len(raw), len(data)


HOOK = r"""
(function(){
  var M = window.__DD_EMBED || {};
  function res(u){
    if (typeof u !== "string" || u.slice(0,5) === "data:") return u;
    var k = u.split("?")[0].split("#")[0], i = k.indexOf("assets/");
    if (i < 0) return u;
    return M[k.slice(i)] || u;
  }
  window.__DD_EMBED_RESOLVE = res;
  var d = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, "src");
  Object.defineProperty(HTMLImageElement.prototype, "src", {
    configurable: true, enumerable: true,
    get: function(){ return d.get.call(this); },
    set: function(v){ d.set.call(this, res(String(v))); }
  });
  var sa = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function(n, v){
    if (this.tagName === "IMG" && String(n).toLowerCase() === "src") v = res(String(v));
    return sa.call(this, n, v);
  };
  /* Imágenes creadas con innerHTML o presentes en el marcado. */
  function fix(el){
    if (!el || el.nodeType !== 1) return;
    if (el.tagName === "IMG") { var a = el.getAttribute("src"), r = a && res(a); if (r && r !== a) sa.call(el, "src", r); }
    var l = el.querySelectorAll ? el.querySelectorAll("img[src]") : [];
    for (var i = 0; i < l.length; i++) { var b = l[i].getAttribute("src"), q = res(b); if (q !== b) sa.call(l[i], "src", q); }
  }
  new MutationObserver(function(ms){
    for (var i = 0; i < ms.length; i++) {
      if (ms[i].type === "attributes") fix(ms[i].target);
      for (var j = 0; j < ms[i].addedNodes.length; j++) fix(ms[i].addedNodes[j]);
    }
  }).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ["src"] });
})();
"""


def main():
    html = open(SRC, encoding="utf-8").read()
    refs = sorted(set(re.findall(r"assets/[A-Za-z0-9_\-./]+\.[A-Za-z0-9]{2,5}", html)))
    # Rutas compuestas en ejecución (BASE + "archivo"): de cada carpeta citada como
    # literal "assets/…/" se incrustan los archivos cuyo nombre aparece en el código.
    for d in sorted(set(re.findall(r"[\"'](assets/[A-Za-z0-9_\-./]*/)[\"']", html))):
        full = os.path.join(ROOT, d)
        if os.path.isdir(full):
            refs += [d + f for f in sorted(os.listdir(full))
                     if os.path.isfile(os.path.join(full, f)) and ('"' + f + '"' in html or "'" + f + "'" in html)]
    refs = sorted(set(refs))
    refs = [r for r in refs if os.path.splitext(r)[1].lower() in MIME and os.path.exists(os.path.join(ROOT, r))]
    with ProcessPoolExecutor() as ex:
        done = list(ex.map(encode, refs, chunksize=4))
    table = {rel: uri for rel, uri, _, _ in done}
    before, after = sum(d[2] for d in done), sum(d[3] for d in done)

    # Hojas de estilo y marcado estático: el navegador los resuelve sin pasar por
    # JavaScript, así que ahí la ruta se sustituye por el propio contenido.
    def css(m):
        return 'url("' + table[m.group(2)] + '")' if m.group(2) in table else m.group(0)
    html, n_css = re.subn(r"url\(\s*([\"']?)(assets/[A-Za-z0-9_\-./]+)\1\s*\)", css, html)
    marker = "<head>"
    assert html.count(marker) >= 1
    inject = ("<head><script>window.__DD_EMBED=" + json.dumps(table, separators=(",", ":")) +
              ";</script><script>" + HOOK + "</script>")
    html = html.replace(marker, inject, 1)

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    open(OUT, "w", encoding="utf-8").write(html)
    print("Recursos incrustados: %d (%.1f MB -> %.1f MB, %s)" % (
        len(done), before / 1e6, after / 1e6, "con pérdida, calidad 95" if LIGHT else "sin pérdida"))
    print("url() de CSS sustituidas: %d" % n_css)
    print("Salida: %s (%.1f MB)" % (OUT, os.path.getsize(OUT) / 1e6))


if __name__ == "__main__":
    main()
