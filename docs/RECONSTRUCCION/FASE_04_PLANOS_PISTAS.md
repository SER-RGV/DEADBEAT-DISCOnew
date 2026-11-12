# FASE 04 — PLANOS TILE-A-TILE · 9 PISTAS
# 2026-11-12 · Coordenadas mundo real + capas + navegación

**Sistema:** Tile 64×32 diamante 2:1, suelo 512 tileable, muro 256×384/320px, pilar 192×384, puerta 320×384, viewport 960×540 (canvas 480×640)  
**Grafo:** DMO_DUNGEON 8–12 nodos, 4–5 capas, cada nodo = 1 sala (880×460 jugable) con muros 320px + puertas diamante 320×64  
**Notación:** Sala `Sx` con `x,y` centro mundo, `w×h` jugable, props con `x,y,br`, spawn con `x,y`, conexiones con `→` (ruta principal `—` / alternativa `··`)

---

## PISTA 01 — LA INVITACIÓN · VÉSPERA (8 nodos, 4 capas)

### Grafo y coordenadas base

```
Mundo P01: offset P01 = {x:200, y:200} + sala spacing 1000px (grid 3×3 con hueco corazón)
Sala S (spawn, entrada abanico):      x=700, y=700, 880×460, suelo floor_01_lust_dancefloor, muro neon_crown
  C01 (reverencia izq):                x=700, y=1150, 880×460, C01→C03 (pasillo curvo 100px, columnas br38×3 en 620,1050 / 700,1100 / 780,1050)
  C02 (reverencia dcha):               x=1600, y=1150, 880×460, C02→C04 (pasillo curvo)
  C03 (pre-corazón izq):               x=700, y=1600, 880×460, C03—★ (puerta corazón 320×64 diamante curva)
  C04 (pre-corazón dcha):              x=1600, y=1600, 880×460, C04—★
  ★ Corazón roto central (sala especial): x=1150, y=1600, 880×460 circular (muro curvo radio 440px, no rect), suelo corazón roto asset radial, Véspera en 1150,1600 r34
  T (tienda):                          x=700, y=2050, 880×460, T—★ (ruta izq segura)
  H (curación):                        x=1150, y=2050, 880×460, H—★
  $ (tesoro, Último Centavo):           x=1600, y=2050, 880×460, $—★ (ruta dcha corta)
  A (armería/afinación):               x=1150, y=2250, 880×460 (ante-sala Véspera, 1 sala, Afinación pacto)
```

### Capas y props

| Sala | Suelo | Muros | Props | Interactivos |
|---|---|---|---|---|
| S | floor_01 | neon_crown ×4 + pillar ×2 | lámpara rosa 700,650 br24 + columnas curvas 620,700 br32 | Foco arrastre (arrastra 30px/s hacia 700,650) |
| C01 | floor_01 | neon_crown | columnas curvas 620,1050/700,1100/780,1050 br38×3 | Cortina rosa 780,1150 120×80 destructible (rasgar → secreto) |
| C02 | floor_01 | neon_crown | lámpara 1600,1100 br24 | Foco arrastre |
| C03 | floor_01 | neon_crown | lámpara 700,1550 br24 | Foco + cortina 620,1600 destructible |
| C04 | floor_01 | neon_crown | lámpara 1600,1550 br24 | Foco |
| ★ Corazón | floor_01 radial | corazón roto curvo radio 440px | Véspera 1150,1600 r34 + sombra abrazadora spawn 1100,1550 | Corazón no interactivo; sombra se desprende con área |
| T/H/$/A | floor_01 | neon_crown | vitrina/shop/chest assets | T/H/$ garantizados si ruta viable |

### Spawns combate

- C01: 3 bailarinas arco 60° en 700,1100 radio 120px, 1 sombra abrazadora
- C02: 4 bailarinas 1600,1100 radio 100px
- C03/C04: 2 bailarinas + 1 sombra cada una
- ★ Véspera: 3 fases — pulsos graves cada 6s (sector 120°), doble señuelo fase2, foco único fase3

### Conexiones verticales

- Desniveles 12px alfombra (visual, sin colisión)
- Balcones decorativos C02/C04 a +0px (no navegables, solo `drawSoftShadow` 0.30)

---

## PISTA 02 — EL BANQUETE · VORAZ (9 nodos, 4 capas, horizontal)

### Grafo

```
S x=200,y=600 880×460 (mesa larga 640×80 en 200,600 br32 como prop, pasillo 100px)
  C01 x=200,y=1050 880×460 (mesa 2:1) → C03
  C02 x=1100,y=1050 880×460 → T
  C03 x=200,y=1500 880×460 (horno +18px) → $
  C04 x=1100,y=1500 880×460 (horno) → H
  T x=200,y=1950 880×460 —★
  H x=1100,y=1950 880×460 —★
  $ x=650,y=1950 880×460 (bandejas móviles br36 en 650,1900/650,2000)
  C05 x=650,y=1700 880×460 (bandejas)
  ★ Voraz x=650,y=2400 880×460 horno ventral
```

### Capas

- **Mesas 2:1:** 640×80 rect `br32` + vajilla rota props `br12` encima (no colisión)
- **Hornos:** +18px visual (sombra 0.45), `br38` destructible (8 impactos, libera mano curativa)
- **Bandejas móviles:** `br36` plataformas que cruzan salas cada 5s (generan enemigo si no detenidas — disparo eje)
- **Pasillos 100px:** Entre mesas, validados >64px mínimo

---

## PISTA 03 — CÁMARA INSTANTES · ÁUREA (10 nodos, 5 capas, retícula)

### Grafo (grid 90°)

```
Capa1: S 1100,200 880×460 — C01 660,600 — C02 1540,600
Capa2:   C03 660,1000 — ● 1100,1000 (caja fuerte 4×4 vitrinas 80×80 cada una, br40) — C04 1540,1000
Capa3:   H 660,1400 — $ 1100,1400 — $ 1540,1400 — C05 1100,1600
Capa4:   T 660,1800 — A 1100,1800 — C06 1540,1800
Capa5:   ★ Áurea 1100,2200 880×460 trono relojes (reloj asset cada 160px)
```

### Capas

- **Vitrinas:** `br40` cada 80px, reflejan proyectiles (zona cian suelo 32px radio), junta atrás única vulnerabilidad (círculo 12px)
- **Paneles orientación:** Cambian 90° cada 6s al compás (flecha suelo indica dirección reflejo)
- **Caja fuerte central:** 4×4 vitrinas 80×80 (640×640 sala), abrir sin limpiar = 3 enemigos reflejados
- **Cover 32px:** Vitrinas altas 32px (no navegables, cover visual)

---

## PISTA 04 — AMPLIFICACIÓN · BRAMA (9 nodos, 4 capas, estrella)

### Grafo (estrella trapecio)

```
Capa1: S 1100,300 880×460 trapecio (ancho N 880 → S 640)
Capa2: C01 600,700 + C02 1100,700 + C03 1600,700 (cada uno trapecio con altavoz en punta 600,650/1100,650/1600,650 br38)
Capa3: C04 750,1100 (cables) — T 1100,1100 — C05 1450,1100
Capa4: ★ Brama 1100,1600 880×460 escenario hundido -24px (radio 360px, barandilla br12)
```

### Capas y verticalidad

- **Altavoces:** `br38` destructibles, al destruir reduce alcance Brama pero crea zona incendiada 3s (radio 80px, daño 2/s)
- **Cables colgando:** `br12` catenaria 1100,900→1100,1100 (daño si pasas durante sobrecarga; disparo corta y crea ruta)
- **Escenario hundido:** -24px `drawSoftShadow` 0.55, barandilla `br12` (no bloquea, visual)
- **Pasarela técnica:** +24px (1100,900 madera, 320×80), balcón observación conos

---

## PISTA 05 — NOTA AUSENTE · OBISPO (10 nodos, 5 capas, cruz latina)

### Grafo

```
        C01 1100,200 (nave norte, diapasón 1100,150 br36)
         |
   C02 800,600 — S 1100,600 — C03 1400,600
        |             |            \
   H 800,1000 — C04 1100,1000 — C05 1400,1000 — C06 1400,1400 (órgano 1400,1350 160×384 +32px)
        |             |             \
   T 800,1400 — C07 1100,1400 — $ 1100,1600 — ★ Obispo 1100,1800 880×460 nave alta 640px
                        \
                     ? Archivo 800,1700 (confesionario -12px 320×240)
```

### Capas

- **Diapasones:** `br36` 2m alto, no bloquean, al golpear revelan hazard invisible 2s (círculo violeta 40px)
- **Órgano:** 160×384 +32px, al activar tras limpiar afinadores abre atajo C05→C07 (2 salas)
- **Vitrales:** `br42` destructibles, rompen luz violeta → oscuridad donde afinadores no patrullan
- **Coro +24px:** 800,1000 madera 400×160, balcón observación

---

## PISTA 06 — UMBRAL ENCADENADO · CORAZÓN (8 nodos, 3 capas, masa)

### Grafo (búnker)

```
Capa1 (ante-sur): S 1100,400 880×460 — C01 730,700 — C02 1470,700
Capa2 (búnker malla): C03 700,1100 — C04 1100,1100 (tambor 1100,1100 br48 +32px) — C05 1500,1100 — C06 1100,1400
Capa3 (ante-norte): C07 1100,1700 880×460 — ★ Corazón 1100,2000 880×460 puerta blindada 1100,1900 320×32 rect + 4 cadenas radiales br12
```

### Capas

- **Tambor 2m:** `br48 +32px`, 3 golpes abren 1 cadena; fallar cierra 1 ruta alt
- **Cadenas:** 4 radiales 1100,1900→(700,1100/1500,1100/700,1400/1500,1400) `br12` destructibles 8 impactos
- **Puerta blindada:** 320×32 rect, no jugable hasta vencer Corazón (intentar genera oleada guardianes)
- **Búnker 2 alturas:** 0 y +18px pasarela mantenimiento 1100,1250 240×60 madera

---

## PISTA 07 — SALÓN MIL VOCES · CRUPIER (10 nodos, 5 capas, diamante)

### Grafo (rombo)

```
          C01 1100,300 (entrada)
         /   \
Capa2  C02 800,600 — C03 1400,600 (espejo rombo 80×80 br40 cada 160px)
      / \  / \  \
Capa3 C04 600,1000 — $ 1100,1000 — C05 1600,1000 (palcos +18px 200×160 en 600,950/1600,950)
     / \  / \  / \
Capa4 C06 700,1400 — T 1100,1400 — H 1500,1400 — C07 1100,1450 (ruleta 1100,1400 80×80)
     \  \ /  /  /
Capa5    ★ Crupier 1100,1800 880×460 ruleta + camerinos -12px 1100,1850 320×240
```

### Capas

- **Espejos:** `br40` destructibles 1 disparo, revelan ruta real detrás (sala ? Archivo tras C05)
- **Máscaras:** `br24` consumible (inmunidad 1 voz falsa)
- **Mesa ruleta:** Interactuable baraja enemigos, revela real por sombra
- **Palcos +18px:** 200×160 madera con barandilla `br12`, observación copias desde arriba

---

## PISTA 08 — ANDÉN AUSENTE · NIX (9 nodos, 4 capas, 3 vías)

### Grafo (andén 3:1)

```
Capa1: S 1100,400 880×120 (andén central 400×1200 total, raíl 8×1200 cada lado en 700 y 1500, traviesas cada 80px)
Capa2: C02 600,700 (vía izq -8px) — C03 1100,700 (andén +12px) — C04 1600,700 (vía dcha)
Capa3: T 600,1000 — H 1100,1000 — C05 1600,1000
        \      \       \
Capa4:         ★ Nix 1100,1400 880×120 andén + línea divisoria cian 1100,1350 880×4
```

### Capas

- **Raíles 8×1200 rect:** Vías hundidas -8px, traviesas props `br8` cada 80px, hazard tren cruza cada 8s (carrera roja 1s antes, daño 20)
- **Andenes +12px:** 400×1200 cada uno (central + 2 laterales), velos `br30` colgando 1100,650/600,650/1600,650, bloquean proyectiles espejo
- **Línea divisoria:** Trazo cian 4px 880×4, divide sala en 2; ecos disparan desde lado contrario
- **Espejo viviente:** Repite último ataque con demora 1.2s

---

## PISTA 09 — NÚCLEO · REY DEL COMPÁS (6 nodos, 5 capas, vacío)

### Grafo (lineal fragmentado)

```
Capa1: S 1100,300 880×460 vacío blanco + fragmentos P01-04 flotando (terciopelo 20px, mesa 30px, vitrina 35px, altavoz 40px) a 20-40px
Capa2: C01 1100,600 880×460 — ● Anclaje1 1100,550 br40 (cristal cadena)
Capa3: C02 1100,900 880×460 — ● Anclaje2 1100,850 br40 (fragmentos P05-08)
Capa4: C03 1100,1200 880×460 — ● Anclaje3 1100,1150 br40
Capa5: ★ Rey 1100,1600 880×460 (bola espejos fase1 → cuerpo teselas fase2 → anclajes fase3)
       └─ Vacío blanco final -60px 1100,1800 880×460 (corona 1100,1750 + cadena 1100,1850 interactivos)
```

### Capas

- **Fragmentos:** `br42` flotantes 20–40px, plataformas temporales 2s (tras 2s caen, dejan de ser navegables), cada uno emite neón original pista
- **Anclajes:** 4 cristalinas `br40`, cada rota quita 1 capa fragmento + acerca a suelo blanco
- **Arena Rey:** 880×460 sin cover central, 3 fases (Espejo siluetas anticipan → Corona usa rasgo arma prota → Última Vuelta reconstruye salas run)

---

## VALIDACIÓN COMÚN

- Pasillos ≥100px (validado >64px mínimo)
- Puertas 320×64 libres (<40px de prop)
- Arena jefe 880×460 sin cover central
- Spawn soberano ≥80px muros
- Ruta alt nunca requiere destructible obligatorio
- Desniveles siempre con alternativa sin desnivel
