# 19 · REVERSIÓN DE V3.0

**Entregable 12 de la directiva §11.**
Cómo se vuelve de **V3.0 «El bucle eterno»** (70 s · 14 planos · 5 actos) a
**V2.2**, que queda conservada e intacta como versión estable.

- Versión estable de referencia: **`2739f59`** — *V2.2: el desenlace ocurre dentro del Refugio del motor, no en una pintura*.
- Versión entregada: **V3.0**, commit `a23d2c1` más los arreglos de calidad de esta misma rama.
- La rama **no reescribe historia**: el rollback es un `checkout` de archivos, nunca un `revert` ni un `reset`.

---

## 1 · Qué cambia exactamente entre V2.2 y V3.0

| Archivo | V2.2 (`2739f59`) | V3.0 | ¿Entra en el rollback? |
|---|---|---|---|
| `src/dd_opening.js` | 42 s, 8 planos, 1 acto | 70 s, 14 planos, 5 actos, partitura nueva | **Sí** |
| `src/dd_boot.js` | la intro desemboca en el menú | la intro entrega el control en el Refugio | **Sí** |
| `src/dd_ui_system.js` | — | menú lateral: reentrada de selección, `arriveAtRefuge` público | **Sí** |
| `src/dd_rebuild_ui.css` | — | los botones del menú no dejan de ser accionables y el lienzo no se traga sus clics | **Sí** |
| `index.html`, `DEADBEAT_DISCO.html` | compilados de V2.2 | compilados de V3.0 | **Sí — se regeneran, no se copian** |
| `tools/qa/test_restart_flow.js` | contrato de 8 planos y desenlace en menú | contrato de 14 planos y entrega en el Refugio | **Sí** |
| `tools/qa/playwright_shim.js` | no existía | adaptador Playwright→puppeteer del banco | No (herramienta nueva) |
| `src/dd_hub_system.js` | — | **sin tocar** | No |
| `assets/**` | — | **sin cambios**: V3.0 reutiliza el arte existente | No |

**Nada de combate, IA, armas, balance, HUD, economía, progresión ni diseño del
Refugio se tocó en V3.0.** El rollback no puede, por tanto, dejar el juego en un
estado distinto al de V2.2 en esas áreas: nunca se apartaron de él.

---

## 2 · Rollback completo (recomendado)

Deja el árbol exactamente en V2.2 y reconstruye los HTML compilados.

```bash
git checkout 2739f59 -- \
  src/dd_opening.js \
  src/dd_boot.js \
  src/dd_ui_system.js \
  src/dd_rebuild_ui.css \
  tools/qa/test_restart_flow.js \
  index.html \
  DEADBEAT_DISCO.html

python3 tools/build_active_html.py
```

`build_active_html.py` se ejecuta **aunque se hayan copiado los HTML**: es
idempotente y garantiza que lo que corre en el navegador es la suma exacta de
`src/`, no un compilado que se quedó de un estado intermedio.

Comprobación mínima después del rollback:

```bash
node --check src/dd_opening.js && node --check src/dd_boot.js
grep -n "INTRO_DURATION = " src/dd_opening.js     # V2.2 -> 42 · V3.0 -> 70
LD_LIBRARY_PATH=/tmp/al2023/lib DD_CHROMIUM=/tmp/chromium_bin \
  node tools/qa/test_restart_flow.js http://localhost:8080 work/qa_rollback
```

Con V2.2 restaurado, la batería debe volver a su contrato antiguo (8 planos,
desenlace en el menú). **Si se restaura el `src/` pero no
`tools/qa/test_restart_flow.js`, la batería fallará en ~20 comprobaciones por
diseño**: estaría midiendo V2.2 con el contrato de V3.0. Por eso el archivo de
pruebas va en el mismo `checkout`.

---

## 3 · Rollback quirúrgico (sólo la cinemática)

Si lo que se quiere es recuperar **la secuencia de apertura de V2.2** dejando el
resto del trabajo de calidad de esta rama:

```bash
git checkout 2739f59 -- src/dd_opening.js
python3 tools/build_active_html.py
```

Con esto la intro vuelve a 42 s y 8 planos, pero `dd_boot.js` seguirá esperando
una entrega en el Refugio al terminar. Es un estado **coherente pero no
deseado**: la cinemática de 42 s también termina llamando a su `onDone`, y
`finish()` entrega el Refugio igual. Funciona; simplemente ya no es V2.2.

Para volver a V2.2 de verdad hace falta el rollback completo de §2.

---

## 4 · Qué NO se puede revertir por separado

- **`dd_boot.js` sin `dd_opening.js`** (o al revés) deja el relevo a medias: la
  versión vieja de la cinemática llama a un `finish()` que ya no espera lo mismo.
  Los dos archivos forman una sola unidad de rollback.
- **`index.html` / `DEADBEAT_DISCO.html`**: nunca se editan a mano. Si se
  restauran sin ejecutar `build_active_html.py`, el navegador puede servir una
  mezcla de V3.0 y V2.2. Siempre se regeneran.
- **`assets/`**: V3.0 no añadió arte nuevo del protagonista ni del Refugio. No
  hay nada que retirar, y por eso el rollback no toca esa carpeta.

---

## 5 · Estado de la evidencia tras la reversión

Los artefactos de V3.0 se quedan donde están y **no estorban**:

- `docs/RESTART/18_V30_STORYBOARD.md`, `19_V30_ENTREGA.md`, este mismo archivo.
- `docs/RESTART/evidencia_cine_v30/` — capturas y los cuatro informes JSON.
- `work/qa_v30/` — capturas de la batería de V3.0.

Son registro histórico de lo entregado, no configuración activa. Un rollback
correcto no los borra: si se borraran, se perdería la prueba de que V3.0 existió
y de qué se comparó contra V2.2 (entregable 10).

---

## 6 · Verificación de que la rama sigue siendo revertible

```bash
git cat-file -t 2739f59          # -> commit
git diff --stat 2739f59 -- src/  # lo que V3.0 añade sobre V2.2
```

Mientras `2739f59` exista en el historial —y existe, porque la rama no reescribe
historia—, el rollback de §2 es válido en cualquier momento.
