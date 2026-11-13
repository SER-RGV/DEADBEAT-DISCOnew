# 10 · Intro en cómic animado — narración para validar

Estado: **REVISIÓN 2, INTEGRADA EN EL JUEGO COMO CARTELAS.** Sin voz. Fuente única: `docs/LORE/BIBLIA_MAESTRA_UNIVERSO_v1.0.txt`.

Todos los textos son **cartelas de narrador** (cajas de texto dentro de la viñeta). No hay
ninguna frase puesta en boca de un personaje: la biblia no da diálogos para esta escena.

| Plano | Tiempo | Texto en pantalla | Respaldo en la biblia |
|---|---|---|---|
| 01 El mundo | 0–4 s | LA GUERRA HABÍA TERMINADO. | §2.1 «La fiesta celebraba el final de una guerra» |
| | | ESA NOCHE, POR FIN, NADIE ESPERABA MORIR. | §2.1 «personas que habían vivido esperando la muerte pudieron reunirse sin miedo» |
| 02 La estación | 4–9 s | UNA VIEJA ESTACIÓN DE TREN. CRISTAL, HIERRO… Y UN BAILE. | §2.1 «antigua estación de tren reconvertida en sala de baile, con techos de cristal y columnas de hierro» |
| | | POR UNAS HORAS, TODOS IMAGINARON UN MAÑANA. | §2.1 «personas que por fin podían imaginar un mañana» |
| 03 Las nueve pistas | 9–14 s | PERO LA NOCHE NO TERMINÓ. | §2.3 |
| | | EL SALÓN CRECIÓ HACIA ABAJO. | §2.3 «El salón creció hacia abajo, como un surco que se hunde en un disco» |
| | | NUEVE PISTAS. UNA DEBAJO DE OTRA. | §5.1 |
| 04 Algo no funciona | 14–19 s | LAS PUERTAS YA NO LLEVAN FUERA. | §2.3 «Las puertas dejaron de llevar al exterior» |
| | | LA ÚLTIMA CANCIÓN VUELVE ANTES DE TERMINAR. | §3.1 «la última nota estaba regresando antes de haber terminado» |
| | | TODOS BAILAN. NADIE RECUERDA DESDE CUÁNDO. | §3.2 «Los bailarines olvidan» |
| 05 El protagonista | 19–24 s | UNO NO SIGUE EL COMPÁS. | §4.1 «alguien dio un paso fuera de tiempo» |
| | | A ÉL, LA TORRE LE DUELE. | §4.3 «la torre le duele porque intenta corregirlo y no puede» |
| 06 El descenso | 24–29 s | Y EL SUELO SE ABRE. | §5.3 |
| 07 El comienzo | 29–32 s | (logotipo) LA NOCHE QUE DEVORÓ EL AMANECER | lema ya usado en el menú |

Onomatopeyas dibujadas: **CLAC** (la aguja vuelve), **TUM-TUM** (el compás repetido),
**TAC** (el paso fuera de tiempo), **CRRRAC** (el suelo), **FSSSSH** (la caída).

## Lo que la intro calla a propósito

La biblia pide que el origen de la torre se descubra jugando (§1, pilar «Misterio») y que
Tempo «no explique el misterio completo al principio» (§3.4). Por eso no aparecen:

- la Escucha ni qué es;
- el anfitrión y su petición (el Rey del Compás);
- que fue Tempo quien enlazó la canción (sólo se ve una mano sobre el plato);
- de dónde sale el protagonista ni qué son sus tatuajes;
- quién abre el suelo (§5.3 lo prohíbe expresamente).

## Revisión 2 (validada la dirección; aplicada en el juego)

- **Sin narrador hablado:** sólo cartelas y sonido. No hay ninguna voz grabada ni integrada.
- **El protagonista ya está dentro.** No llega de ninguna parte; aparece pisando fuera de compás.
- **Eliminada la ciudad.** El plano 01 muestra únicamente la estación sobre negro.
- La tabla de textos de arriba no cambia y es la que está en `src/dd_opening.js`.
- Se mantiene el paso fuera de compás (§4.1) y «la torre le duele» (§4.3) sin explicar el origen.
- Onomatopeya añadida en el descenso de NUEVA PARTIDA: **CLONK** (la plataforma toca fondo).
