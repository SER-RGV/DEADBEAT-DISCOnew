# Manifiesto de copia de seguridad — DEADBEAT DISCO (Fase 0.2)

- Fecha: 2026-11-02 22:25 CET (21:25 UTC).
- Rama: `arena/b89cd6bc-deadbeat-disco`.
- Motivo: regla de `CURRENT_STATE.md` — «Toda modificación debe partir de una copia de seguridad».
- Esta copia se ha creado **antes de cualquier otra modificación** del repositorio.

## Archivo protegido

| Campo | Valor |
|---|---|
| Original (no se modifica) | `v9_t3_fase1b_cache_probe.html` |
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
- El original `v9_t3_fase1b_cache_probe.html` **no se ha sobrescrito** en esta fase y conserva el mismo SHA-256.
- Para restaurar: copiar el contenido del backup sobre el original y verificar de nuevo el SHA-256 indicado arriba.
