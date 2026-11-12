# STORYBOARD MAESTRO — CINEMÁTICA DE APERTURA «LA NOCHE QUE VUELVE» (10 PLANOS / 35.0s)

> **Implementación en Motor:** `src/dd_cinematic_camera.js` (`window.DD_CINE`)
> **Sincronización Musical:** Pulso de **128 BPM** (crescendo progresivo desde sub-bajo filtrado a los 38 Hz hasta el drop estroboscópico del Plano 7)
> **Activos 2.5D:** `assets/cinematics/backgrounds/final/cine_bg01..06` y `CINEMATIC_ASSETS/scenes/BG01_CITY..BG06_HERO`

---

## Desglose de los 10 Planos Canónicos (`storyboardcinematica.txt`)

| Plano | Duración | Escena / Fondo 2.5D | Título en Pantalla | Subtítulo / Narrativa Canónica | Acción Visual y Cámara |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | `3.5s` | `cine_bg01_city` (3 capas parallax) | **LA CIUDAD DE ASFALTO MOJADO** | *«Bajo la lluvia perpetua, todas las calles descienden hacia el mismo neón.»* | Paneo vertical descendente entre rascacielos góticos; lluvia diagonal y reflejos magenta sobre el asfalto. |
| **02** | `3.4s` | `cine_bg02_queue_facade` | **LA FACHADA DE OBSIDIANA** | *«Nadie recuerda cuándo abrió sus puertas. Nadie recuerda haber salido.»* | Zoom lento hacia la marquesina **DEADBEAT DISCO** coronada por el emblema del Zorro Neón. |
| **03** | `3.4s` | `cine_bg02_queue_facade` (Foco cercano) | **EL UMBRAL DEL SELLO** | *«La fila de almas avanza en silencio al compás de 128 latidos por minuto.»* | Siluetas bajo la lluvia frente a los cordones de terciopelo; destello cálido de las puertas de bronce. |
| **04** | `3.5s` | `cine_bg03_entrance` + `hero_walk_01` | **EL PASILLO DE ENTRADA** | *«Un intruso cruza las bóvedas góticas buscando el eco de Áurea.»* | *El Desafinado* camina en contraluz magenta y oro entre columnas góticas con oclusión de primer plano (`03_foreground_pillars_occlusion.png`). |
| **05** | `3.5s` | `cine_bg03_entrance` + `hero_idle_00` | **EL LATIDO FUERA DE COMPÁS** | *«Mientras el club respira a un solo pulso, su corazón se niega a sincronizarse.»* | Primer plano medio del protagonista; ondas concéntricas de bajo vibran en el suelo de obsidiana. |
| **06** | `3.6s` | `cine_bg04_main_hall` | **LA CATEDRAL DEL RUIDO** | *«Nueve pistas excavadas hacia el abismo. Nueve Soberanos custodiando la noche.»* | Apertura panorámica a la nave central; lámpara de araña dorada, láseres cian/magenta y siluetas bailando en trance. |
| **07** | `3.6s` | `cine_bg04_main_hall` + `hero_shoot_00` | **LA PISTA CENTRAL Y LA CABINA DE TEMPO** | *«A 128 BPM cae el drop: los espejos despiertan y el contrato reclama sangre.»* | **Beat Drop (128 BPM):** barrido de láseres cruzados sobre el medallón astrológico central y el protagonista armado. |
| **08** | `3.5s` | `cine_bg05_dj_booth` | **EL ALTAR DE TEMPO** | *«Sobre la cabina blindada brilla el Zorro Coronado, vigía de El Refugio.»* | Contrapicado hacia la cabina monumental del DJ; ecualizadores, torres de altavoces y humo iluminado. |
| **09** | `3.5s` | `cine_bg06_hero` + `hero_shoot_00` | **EL DESAFINADO** | *«Si la noche no termina por las buenas, habrá que apagarla pista por pista.»* | Plano heroico con partículas ascendentes de brasa y neón; el protagonista alza su arma hacia el abismo. |
| **10** | `3.5s` | `cine_bg06_hero` + `logo_deadbeat_graffiti` | **DEADBEAT DISCO — LA NOCHE QUE VUELVE** | *«Desciende a las Nueve Pistas. Rompe el Sello. Encuentra a Áurea.»* | Estampado final del logotipo graffiti de **DEADBEAT DISCO** y transición directa a **El Refugio (HUB)**. |
