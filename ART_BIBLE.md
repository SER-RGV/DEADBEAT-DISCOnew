# BIBLIA VISUAL — DEADBEAT DISCO

> Documento único de dirección artística. Fase 1 · Tanda 01. Aplica a todas las tandas futuras.
> Fuente de verdad técnica: `v9_t3_fase1b_cache_probe.html` y `DEADBEAT_DISCO.ART.html`.
> Fuentes de verdad visual: `ART_REFERENCES/REF_01…03` (analizadas antes de generar ningún recurso).

## 0. Identidad

DEADBEAT DISCO es un juego indie premium, isométrico, de estructura híbrida, para PC y consola, con narrativa original y tono mixto. Su universo visual es una **discoteca oscura, extravagante y decadente**: arquitectura art-déco/gótica de club, neón selectivo, oro como acento y una masa negra que da valor a la luz.

Decisiones cerradas que **no se reabren**: nombre DEADBEAT DISCO · indie · PC + consola · isométrica · estructura híbrida · premium · narrativa original y tono mixto · **sin Dante, sin círculos del infierno, sin estructura autobiográfica** · no es un roguelike genérico.

**Pilares que un asset puede incumplir**

1. Toda pieza parece dibujada por el mismo equipo: misma tinta, mismo volumen, misma luz.
2. La silueta se reconoce antes que el detalle, a escala real de juego y en movimiento.
3. El neón y el oro son jerarquía, no saturación: señalan peligro, interacción o identidad.
4. El escenario nunca compite con jugador, enemigos, proyectiles o indicadores.

**Desempate:** cuando un pilar entra en conflicto con otro, gana la **legibilidad durante el combate**, después la coherencia de familia, después el detalle ilustrado.

## 1. Jerarquía de contradicciones (normativa)

Las tres láminas de referencia contienen etiquetas incompatibles con las decisiones cerradas. Se establece esta jerarquía, de mayor a menor autoridad:

1. **Decisiones narrativas cerradas** > cualquier etiqueta de las láminas. «Sin Dante / círculos del infierno / autobiografía» es vinculante.
2. **Los nombres de círculos de las imágenes** («CÍRCULO IV», «I LUJURIA…IX NÚCLEO», «BOSSES (9 + NÚCLEO)», «MAPA DE PROGRESIÓN») se interpretan **exclusivamente como codenames cromáticos internos y claves de paleta**. No son lore, no fijan número de niveles ni de jefes, no imponen una progresión.
3. **El grafo real del juego determina geometría y progresión**: `r0`, 12 nodos, «VESTÍBULO DE TURNOS · ENTRADA SEGURA», «REFUGIO DEL CLUB». Las estructuras dibujadas en las láminas no sustituyen a la generación de salas, puertas ni navegación del motor.
4. **Las etiquetas de catálogo** («ARMAS (120)», «SUELOS (10 MATERIALES BASE)») son inventarios de diseño, **no autorización para producir todos sus recursos de una vez**. Se respeta el límite de ≤10 assets por tanda.
5. **El estilo painterly de alta definición se adapta** a silueta, material y neón para sobrevivir a la escala isométrica, **sin degradar la definición**: se reduce microdetalle, no se pixela, no se aplican filtros de baja resolución.
6. **El protagonista del banner** (`REF_01`, ilustración 3/4 sentada) debe convertirse en un **sprite isométrico orientable** (pelo despeinado, camiseta negra con ribetes magenta, tatuajes, pantalón con piping neón). No se pega como imagen plana.
7. **El texto `CÍRCULO I · LIMBO` visible en el HUD no se modifica en esta fase**: es texto/lore del motor, fuera del alcance artístico de Fase 1. Se registra la contradicción; cualquier renombrado requiere una tanda de narrativa/UI con sus propias pruebas.

Consecuencia operativa: se usa el **lenguaje de formas, paleta, iluminación y siluetas** de las referencias; se descarta su nomenclatura infernal y su conteo de niveles.

## 2. Paleta

| Rol | Hex | Uso |
|---|---|---|
| Base oscura | `#0a0c12` | Fondo, masa de sombra, contornos |
| Superficie | `#191a25` | Planos medios, piedra, metal mate |
| Borgoña | `#2d0619` | Transición cálida, telas, interiores |
| Magenta | `#ff2d95` | Neón principal, identidad, interacción |
| Oro | `#facc15` | Acento metálico, rareza, HUD |
| Oro claro | `#f0e090` | Reflejos, filetes, brillo especular |
| Cian | `#38bdf8` | Neón secundario, peligro frío, rim light |
| Cian secundario | `#22d3ee` | Efectos, profundidad |
| Violeta | `#c084fc` | Transición magenta→cian, decoración |

Paletas por entorno, extraídas del propio motor (`ART_AUDIT/circle_themes.json`, `CIRCLE_THEMES` en el HTML): `limbo` `#0e1525/#1e293b/#475569/#38bdf8`, `lujuria` `#1b0826/#3b0f4c/#86198f/#ff2d95`, `gula` `#210e09/…/#f97316`, `avaricia` `#171206/…/#facc15`, `ira` `#210709/…/#ef4444`, `herejia` `#150826/…/#c084fc`, `violencia` `#091813/…/#4ade80`, `fraude` `#081829/…/#22d3ee`, `traicion` `#081526/…/#7dd3fc`, `nucleo` `#120924/…/#e2e8f0`.

**Reglas de color**
- Entornos: baja saturación, valor bajo; el neón aparece en ≤ ~15 % de la superficie.
- Personajes/jefes: saturación y contraste superiores al entorno; silueta con contorno más oscuro que cualquier línea interior.
- Peligro: rojo/#ef4444 y cian saturado; interacción: magenta/oro; rareza: oro → violeta → cian.
- HUD: chasis `#0a0c12`, texto crema/oro claro, atención magenta. Prohibido fondo puro blanco o verde.

## 3. Forma, línea, material, luz

- **Contorno:** tinta negra/near-black, cerrado, limpio, sin gaps. El borde exterior es la línea más oscura del asset.
- **Volumen:** 2–3 tonos por material como máximo (base, sombra, reflejo); volúmenes definidos por planos, no por degradados suaves infinitos.
- **Materiales:** piedra pulida, metal cepillado, cromo, terciopelo, cristal, tela. Cada familia mantiene su respuesta especular.
- **Texturas:** vetas, filetes, mosaicos art-déco y desgaste controlado. **Prohibido** ruido, grano, dithering, pixel art automático, pixelado artificial o cualquier degradación de definición.
- **Iluminación:** luz principal desde el **noroeste** (desde el punto de vista del artista); **rim light** magenta en un lado y cian en el otro cuando aporte lectura. Bloom **exclusivamente** sobre emisores de neón.
- **Sombras:** las **sombras de contacto las calcula el motor**; **no se hornean** en los sprites. Fondo de generación negro puro solo como croma técnico, eliminado en el postproceso. Prohibidas sombras accidentales que contradigan la luz del motor.
- **Detalle:** piso de detalle = lo que se lee al tamaño real de representación. Microdetalle que desaparece se sustituye por color, no por forma.

## 4. Perspectiva, escala y pivotes

- **Isométrica real del motor**, diamante de suelo **2:1** donde corresponda. Ortográfica, sin perspectiva de cámara.
- **Suelos:** tile de referencia **512×512** (`__T3B_IMAGES`, patrón `repeat` con desplazamiento `x0%512`); repetición sin costuras visibles.
- **Relación de escala:** el personaje ocupa ~1/12 del ancho de sala visible en 1280×900; paredes ≈ 1,5–2× la altura del personaje; puertas ≈ altura de pared, ancho suficiente para el paso real del motor; mobiliario ≤ altura de personaje salvo elementos arquitectónicos.
- **Pivotes:** `bottom-center` para personajes, enemigos, jefes y props con apoyo en suelo; `center` para emblemas, armas e iconos; `tile` para materiales. Todos los sprites de una familia comparten punto de apoyo y baseline.
- **Orientación:** las direcciones/animaciones existentes en el motor son las que mandan. No se duplican fotogramas para simular animaciones inexistentes; las direcciones faltantes se documentan como pendientes.
- **Profundidad/oclusión:** respeta el orden de dibujo del motor (`sortY`, capas de HUB/campaña). La decoración nunca tapa jugador, enemigos, proyectiles ni indicadores.

## 5. Reglas por familia

| Familia | Prioridad de lectura | Restricción específica |
|---|---|---|
| Entornos / arquitectura | Personalidad sin perder navegación | Respetar geometría, límites y colisiones del motor; no confundir decoración con elemento jugable |
| Suelos | Continuidad de material | Tileable, sin viñeta, sin borde, sin objetos |
| Paredes / puertas / obstáculos | Límite legible | No tapar indicadores; puertas conservan su lógica de apertura |
| Decoración | Acento | Nunca dominar; no proyectar sombras propias |
| Protagonista | Silueta + estados reales | Correspondencia con los estados del motor; continuidad de volumen entre fotogramas |
| Enemigos | Familia reconocible | Varias unidades simultáneas legibles entre sí |
| Jefes | Presencia diferenciada | Lectura clara de fase/ataque; no rediseñar comportamientos ni stats |
| Armas / proyectiles | Contraste funcional | `wa` = proyectiles del jugador; `Ia` = proyectiles enemigos (no confundir) |
| Objetos / rarezas | Icono + color | Coherencia con HUD e inventario |
| Efectos | Brevedad | Flash/estela/chispa/anillo/humo sin saturar |
| HUD / menús | Legibilidad | Sin solapamientos, recortes ni fuera de pantalla; probar resoluciones |
| Transiciones | Continuidad | Mismo universo visual; no alterar `floorDrop` ni su lógica |

## 6. Plan de prioridades (orden vigente)

1. **Suelos** — mayor superficie en pantalla.
2. **Emblema e identidad** — foco del HUB.
3. **Muros, puertas y umbrales modulares.**
4. **Decoración sin tapar la jugabilidad.**
5. **Protagonista orientable.**
6. **Familia de enemigos ILT.**
7. **Jefes y lectura de ataques.**
8. **Armas, proyectiles y efectos.**
9. **HUD y menús.**
10. **Transiciones y presentación.**

**Tanda 01 cubre:** ① (3 de 10 materiales), ② (emblema), ④ parcial (alfombra, palmera), ⑥/⑦ un jefe (`boss_01_anden`), ⑧ un arma (`weapon_m1911`). **Tanda 02 cubre:** ③ arquitectura modular (primera familia completa de 10 piezas: muro recto, esquina interior, esquina exterior, remate, pilar, puerta cerrada, puerta abierta adaptada, marco, umbral y detalle de neón), integrada en el pintor real de muros/puertas con continuidad de cornisa, zócalo, contorno y luz NW. **Permanecen pendientes:** ⑤, ⑥ y ⑦ completas, ⑧ completa, ⑨, ⑩, los 7 materiales de suelo restantes, y la verificación aislada de las piezas de Tanda 02 que no entran en el encuadre de cámara de las salas probadas.

## 7. Prohibiciones absolutas

Usar las referencias como imágenes planas · pixel art o degradación de definición · fondos verdes o de croma en el asset final · halos blancos o restos de fondo · sombras horneadas · estilos mezclados · microdetalle que compita con la silueta · decoración sobre la jugabilidad · modificar mecánicas para acomodar una imagen · crear gestores de carga duplicados.

## 8. Control de versiones

| Versión | Cambio | Motivo |
|---|---|---|
| 1.0 | Creación; identidad, jerarquía, paleta, reglas, prioridades | Cierre documental de la Tanda 01 |
| 1.1 | Cobertura actualizada con la familia modular de arquitectura (prioridad ③): cornisa/zócalo/contorno/luz compartidos, diamante 2:1 en umbrales, adaptación de piezas a `edge`/paneles y a la animación `Ot.openT` del motor | Cierre de la Tanda 02; las reglas visuales 1.0 no se relajan |
| 1.2 | Nueve jefes vinculados a IDs existentes; estética expresionista de club nocturno, fondo RGBA y silueta limpia; se preservan alias de residentes y despacho nativo de estados | Integración parcial BOSS-T01; faltan fotogramas ilustrados para fases 05–09 |
| 1.3 | BOSS-T02 añade attack/attack1/hit/death para 05–06 y attack/attack1 para 07 en las cachés HD ya existentes; el `artId` estable prevalece sobre aliases residentes al resolver el arte | QA runtime y regresión aprobados; rendimiento SwiftShader inconcluso, tanda integrada pero aún no cerrada |

## 9. Extensión visual de jefes (BOSS-T01)

La identidad del motor prevalece sobre los apodos/conceptos de referencia. `boss_art_*` son **claves de recurso**, no IDs nuevos de juego. Se asocian solo a los nueve `artId` estables existentes:

| ID de juego | Nombre/identidad del motor | Clave visual | Motivo de forma |
|---|---|---|---|
| `boss_01_djdoom` | DJ Doom | `boss_art_boss_01_djdoom` | Esqueleto de DJ con asta/controlador de vinilo; figura vertical y lectura frontal |
| `boss_02_reinaespectro` | Reina Espectro | `boss_art_boss_02_reinaespectro` | Realeza espectral, velo largo y brazos/atributos legibles |
| `boss_03_reydisco` | Rey Disco | `boss_art_boss_03_reydisco` | Monarca de pista con capa de mosaico en abanico |
| `boss_04_entidadvoraz` | Entidad Voraz | `boss_art_boss_04_entidadvoraz` | Masa voraz de bocas/tentáculos; perímetro orgánico y boca focal |
| `boss_05_fusioncosmica` | Fusión Cósmica | `boss_art_boss_05_fusioncosmica` | Deidad ocular astral con lectura radial |
| `boss_06_djabismo` | DJ Abismo | `boss_art_boss_06_djabismo` | Arácnido/orbe ocular sobre sello de vinilo |
| `boss_07_altavoztitan` | Altavoz Titán | `boss_art_boss_07_altavoztitan` | Gólem de stacks de altavoces, volumen ancho y extremidades distinguibles |
| `boss_08_djcalavera` | DJ Calavera | `boss_art_boss_08_djcalavera` | Esqueleto ceremonial alado, disco y corazón como focos |
| `boss_09_nucleofinal` | Núcleo Final | `boss_art_boss_09_nucleofinal` | Esfera ocular fracturada, órbitas rotas y extremidades mecánicas |

**Criterios aplicados:** ilustración HD, negros profundos, magenta/cian/violeta, oro envejecido, encuadre transparente y lectura a escala de arena. No se altera el gameplay para acomodar el arte. BOSS-T01 llevó los masters a reposo; BOSS-T02 conserva esos masters y añade, usando el loader/cachés existentes, cuatro estados para Boss 05, cuatro para Boss 06 y dos ataques para Boss 07. Bosses 07–09 mantienen los estados sin arte T02 en sus recursos nativos; Boss 09 `attack_01` también continúa usando su PNG RGBA de T01. La asociación por `artId` estable tiene prioridad visual y los aliases residentes siguen siendo fallback legacy. T02 pasó la QA de integración y regresión; su medición de rendimiento en SwiftShader carece de baseline emparejado y sigue inconclusa, por lo que la tanda no se marca cerrada.
