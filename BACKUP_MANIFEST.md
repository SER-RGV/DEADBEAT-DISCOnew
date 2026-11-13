# Manifiesto de copia de seguridad — DEADBEAT DISCO (Fase 0.2)

- Fecha: 2026-11-02 22:25 CET (21:25 UTC).
- Rama: `arena/b89cd6bc-deadbeat-disco`.
- Motivo: regla de `CURRENT_STATE.md` — «Toda modificación debe partir de una copia de seguridad».
- Esta copia se ha creado **antes de cualquier otra modificación** del repositorio.

## Archivo protegido

| Campo | Valor |
|---|---|
| Archivo histórico original (retirado de la raíz en la limpieza 2026-11-13) | `v9_t3_fase1b_cache_probe.html` |
| Copia de seguridad | `backups/v9_t3_fase1b_cache_probe.ORIGINAL.html` |
| Tamaño | 13.380.910 bytes |
| Líneas | 19.835 |
| **SHA-256** | `b2ef4ad892d6411b1745bdf8b2786202db5cea8daba397cd9023d41749f22e4a` |
| Blob Git de origen (`main`) | `dcc4cce0ffac2037ae4cb2f8fa94d8b31b47c197` |
| Commit de origen | `09df237d5f98de7aee8b0499648610acdf1bae71` |

## Verificaciones ejecutadas sobre la copia

- `cmp -s original copia` → idénticos byte a byte.
- `sha256sum original` = `sha256sum copia` = `sha256sum` del blob `dcc4cce0…` de `main` → los tres coinciden.
- `wc -c -l` → 13.380.910 bytes y 19.835 líneas en ambos.

Estas son comprobaciones de integridad de archivo, **no** pruebas de funcionamiento en navegador.

## Regla de uso

- El archivo `backups/v9_t3_fase1b_cache_probe.ORIGINAL.html` es inmutable: no editar, no regenerar, no sustituir.
- En la rama `chore/pre-merge-cleanup`, la copia raíz `v9_t3_fase1b_cache_probe.html` se retiró al comprobar que era idéntica al backup. El backup inmutable conserva el SHA-256 registrado.
- Para recuperar la ruta histórica, copiar el backup a `v9_t3_fase1b_cache_probe.html` y verificar de nuevo el SHA-256 indicado arriba.

## Ampliación 2026-11-07 — copia previa a la reparación del arranque/HUB/controles

- Copia creada antes de regenerar la build oficial: `index.html` (SHA-256 `d87e2bd9ecba06812a521518ced1749575443f1db0fb5c5e2433576feb80d7f4`, 5.020.635 B) → `backups/index_PRE-HUBFIX_2026-11-07.html`.
- `backups/DEADBEAT_DISCO_v3.3_FLOORBAG_AUDITFIX.ORIGINAL.html` permanece **inmutable** (el build solo lo lee).
- Restauración de la build pre-reparación: copiar el archivo del punto anterior sobre `index.html`. Restauración completa: `python3 tools/build_active_html.py` sobre los `src/` originales de Git.


## Actualización de ubicación · 2026-11-13

La copia inmutable sigue en `backups/v9_t3_fase1b_cache_probe.ORIGINAL.html` con el SHA-256 indicado arriba. La copia de trabajo duplicada que existía en la raíz (`v9_t3_fase1b_cache_probe.html`) se retiró de la rama de limpieza tras comprobar que su blob Git era idéntico al backup. No se ha modificado ni eliminado el backup.
