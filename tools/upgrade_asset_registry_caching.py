import re

with open("src/dd_asset_registry.js", "r", encoding="utf-8") as f:
    code = f.read()

# Let's inspect preloadAll and add ASSET_VERSION cache bust + fallback
old_preload_snippet = """  function preloadAll() {
    const ids = Object.keys(MANIFEST.entries);
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const meta = MANIFEST.entries[id];
      const img = new Image();
      img.decoding = "async";
      status[id] = "loading";"""

new_preload_snippet = """  // Versión de assets para invalidación automática de caché en navegadores / GitHub Pages
  const ASSET_CACHE_VERSION = (window.__DD_ASSET_VERSION || "20261109.1");

  function getVersionedUrl(url) {
    if (!url) return url;
    // Si ya contiene parámetro de versión o data URI, respetar
    if (url.indexOf("?") !== -1 || url.startsWith("data:")) return url;
    return url + "?v=" + encodeURIComponent(ASSET_CACHE_VERSION);
  }

  function preloadAll() {
    const ids = Object.keys(MANIFEST.entries);
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      const meta = MANIFEST.entries[id];
      const img = new Image();
      img.decoding = "async";
      status[id] = "loading";"""

assert old_preload_snippet in code, "old_preload_snippet not found"
code = code.replace(old_preload_snippet, new_preload_snippet, 1)

old_error_snippet = """      img.onerror = function () {
        status[id] = "error";
        errorCount++;
      };
      img.src = meta.src;
      images[id] = img;"""

new_error_snippet = """      img.onerror = function () {
        // Fallback automático si existe una ruta secundaria declarada y no se ha probado aún
        if (meta.fallback && img.getAttribute("data-tried-fallback") !== "true") {
          img.setAttribute("data-tried-fallback", "true");
          img.src = getVersionedUrl(meta.fallback);
          return;
        }
        status[id] = "error";
        errorCount++;
      };
      img.src = getVersionedUrl(meta.src);
      images[id] = img;"""

assert old_error_snippet in code, "old_error_snippet not found"
code = code.replace(old_error_snippet, new_error_snippet, 1)

with open("src/dd_asset_registry.js", "w", encoding="utf-8") as f:
    f.write(code)

print("Successfully upgraded src/dd_asset_registry.js with cache busting & fallback mechanism!")
