/* ==========================================================================
   DEADBEAT DISCO — PLAYABLE ISOMETRIC REFUGIO / HUB (window.DD_HUB)
   Faithful playable reconstruction of REF_05 -> REFUGIO / HUB with full
   keyboard, mouse & Xbox gamepad navigation, NPCs, stations & Descent Pad.
   ========================================================================== */
(function () {
  "use strict";

  const HUB_BOUNDS = { x: 130, y: 145, w: 1560, h: 950 };
  const DESCENT = { x: 910, y: 875 };
  const state = {
    active: false,
    px: 910,
    py: 700,
    vx: 0,
    vy: 0,
    aimAngle: -Math.PI / 4,
    time: 0,
    walkPhase: 0,
    walkFrame: 0,
    walking: false,
    facingLeft: false,
    lastTs: 0,
    keys: Object.create(null),
    nearStation: null,
    interactCooldown: 0,
    roomCache: null,
    roomCacheStamp: ""
  };

  /* En reposo se conserva el IDLE 07B, sin sombrero, entero y sin espejar.
     Para caminar se usan imágenes derivadas de ese diseño; al desplazarse a
     la izquierda se reflejan, por lo que los tatuajes también se reflejan.
     Los sprites de combate no cambian: fuera del Refugio pinta el motor. */
  const REFUGE_IDLE = {
    src: "assets/characters/protagonist_master/fidelidad/pm_idle_fid_00.png",
    w: 288, h: 512,          /* tamaño del PNG */
    feetY: 505, midX: 140,   /* suela y eje del cuerpo dentro del PNG */
    bodyH: 462,              /* alto del dibujo (sin márgenes transparentes) */
    drawH: 134,              /* alto del cuerpo en unidades del Refugio (como la figura anterior y los personajes de la sala) */
    img: null, ok: false, failed: false, lastRect: null
  };
  function ensureRefugeIdle() {
    if (REFUGE_IDLE.img) return;
    const im = new Image();
    im.onload = function () { REFUGE_IDLE.ok = im.naturalWidth === REFUGE_IDLE.w && im.naturalHeight === REFUGE_IDLE.h; REFUGE_IDLE.failed = !REFUGE_IDLE.ok; };
    im.onerror = function () { REFUGE_IDLE.failed = true; };
    im.src = REFUGE_IDLE.src;
    REFUGE_IDLE.img = im;
  }
  function drawRefugeIdle(ctx) {
    ensureRefugeIdle();
    if (!REFUGE_IDLE.ok) return false;
    const k = REFUGE_IDLE.drawH / REFUGE_IDLE.bodyH;
    const moving = Math.hypot(state.vx, state.vy) > 12;
    /* Sólo traslación y giro: respiración parado, paso corto al andar. */
    const bob = moving ? -Math.abs(Math.sin(state.time * 9.5)) * 2.2 : Math.sin(state.time * 2.4) * 1.05;
    const dw = REFUGE_IDLE.w * k, dh = REFUGE_IDLE.h * k;
    const dx = state.px - REFUGE_IDLE.midX * k, dy = state.py + 16 - REFUGE_IDLE.feetY * k + bob;
    ctx.save();
    /* Balanceo lentísimo de respiración alrededor de los pies. */
    const feetX = dx + REFUGE_IDLE.midX * k, feetY = dy + REFUGE_IDLE.feetY * k;
    ctx.translate(feetX, feetY);
    ctx.rotate(Math.sin(state.time * 0.7) * 0.008);
    ctx.translate(-feetX, -feetY);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const knightIdle = window.DD_APPEARANCE && window.DD_APPEARANCE.outfitFrame('idle');
    ctx.drawImage(knightIdle || (window.DD_APPEARANCE ? window.DD_APPEARANCE.recolor(REFUGE_IDLE.img) : REFUGE_IDLE.img), dx, dy, dw, dh);
    ctx.restore();
    REFUGE_IDLE.lastRect = { x: +dx.toFixed(1), y: +dy.toFixed(1), w: +dw.toFixed(2), h: +dh.toFixed(2) };
    return true;
  }

  // Tres poses generadas a partir del diseño 07B; la pose intermedia se repite
  // para suavizar la ida y vuelta. Si no cargan, se conserva el idle existente.
  const REFUGE_WALK_ORDER = [0, 1, 2, 1];
  const REFUGE_WALK = [0, 1, 2].map(function (i) {
    return { src: "assets/characters/protagonist_master/walk/pm_walk_0" + i + ".png", img: null };
  });
  function ensureRefugeWalk() {
    REFUGE_WALK.forEach(function (frame) {
      if (frame.img) return;
      frame.img = new Image();
      frame.img.src = frame.src;
    });
  }
  function drawRefugeWalk(ctx) {
    if (!state.walking) return false;
    ensureRefugeWalk();
    const frame = REFUGE_WALK[REFUGE_WALK_ORDER[state.walkFrame]].img;
    if (!frame || !frame.complete || !frame.naturalWidth || !frame.naturalHeight) return false;
    const k = REFUGE_IDLE.drawH / REFUGE_IDLE.bodyH;
    const w = REFUGE_IDLE.w * k, h = REFUGE_IDLE.h * k;
    ctx.save();
    ctx.translate(state.px, state.py + 16);
    if (state.facingLeft) ctx.scale(-1, 1);
    /* Balanceo de paso fluido: bob y vaivén con la fase real de caminata. */
    const strideAngle = state.walkPhase * Math.PI;
    ctx.translate(Math.sin(strideAngle) * 1.1, -Math.abs(Math.sin(strideAngle)) * 2.4);
    ctx.rotate(Math.sin(strideAngle) * 0.014);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    const knightWalk = window.DD_APPEARANCE && window.DD_APPEARANCE.outfitFrame(state.walkFrame % 2 ? 'walk_a' : 'idle');
    ctx.drawImage(knightWalk || (window.DD_APPEARANCE ? window.DD_APPEARANCE.recolor(frame) : frame), -REFUGE_IDLE.midX * k, -REFUGE_IDLE.feetY * k, w, h);
    ctx.restore();
    REFUGE_IDLE.lastRect = { x: +(state.px - REFUGE_IDLE.midX * k).toFixed(1), y: +(state.py + 16 - REFUGE_IDLE.feetY * k).toFixed(1), w: +w.toFixed(2), h: +h.toFixed(2) };
    return true;
  }

  /* Refugio rediseñado: conserva los sectores y mobiliario del HUB actual.
     La animación al caminar se integra sin alterar la distribución. */
  const HUB_PROPS = [
    // E · Barra Social (NO) — backbar apoyado en el muro norte (fuera de la
    //   banda de portales, que empieza en x≈616) y barra alineada con él
    { kind: "shelf", x: 235, y: 330, br: 44, dw: 150 },
    { kind: "shelf", x: 390, y: 330, br: 44, dw: 150 },    { kind: "barcounter", x: 400, y: 362, br: 64, dw: 250 },
    { kind: "cooler", x: 545, y: 330, br: 36, dw: 105 },
    { kind: "bench", x: 340, y: 452, br: 30, dw: 130 },
    { kind: "bench", x: 480, y: 452, br: 30, dw: 130 },
    // E · Escenario DJ Virgilio (NE) — los tres elementos sobre la misma
    //   línea del muro norte (y≈315-318), flanqueados por palmeras
    { kind: "speaker", x: 1185, y: 318, br: 36, dw: 96 },
    { kind: "djbooth", x: 1400, y: 315, br: 58, dw: 196 },
    { kind: "subwoofer", x: 1572, y: 318, br: 38, dw: 110 },    // C · Armería (O) — todo contra el muro oeste, en columna bajo la barra
    { kind: "weaponrack", x: 235, y: 565, br: 62, dw: 228 },
    { kind: "shelf", x: 232, y: 690, br: 42, dw: 140 },
    { kind: "chest", x: 430, y: 622, br: 32, dw: 112 },    // A · Centro de operaciones (mando) — Mesa Astral, eje del Refugio
    { kind: "astraltable", x: 905, y: 578, br: 78, dw: 235 },
    { kind: "candelabra", x: 742, y: 500, br: 22, dw: 92 },
    { kind: "candelabra", x: 1070, y: 500, br: 22, dw: 92 },
    // D · Ala experimental de la Torre (E) — exposición sobre su eje
    { kind: "teslaorb", x: 1520, y: 462, br: 56, dw: 150 },
    { kind: "pedestal", x: 1382, y: 505, br: 30, dw: 118 },
    // B · Salón de descanso (SO) — simétrico sobre la alfombra
    { kind: "sofa", x: 300, y: 865, br: 48, dw: 205 },
    { kind: "sofa", x: 505, y: 865, br: 48, dw: 205, flipX: true },
    { kind: "armchair", x: 205, y: 858, br: 32, dw: 124 },
    { kind: "armchair", x: 600, y: 858, br: 32, dw: 124, flipX: true },
    { kind: "bench", x: 402, y: 912, br: 28, dw: 128 },
    { kind: "neonflower", x: 402, y: 878, br: 14, dw: 78 },    // E · Ocio (SE) — fila alineada en el rincón (misma línea de apoyo)
    { kind: "arcade", x: 1352, y: 838, br: 38, dw: 150 },
    { kind: "bench", x: 1458, y: 935, br: 30, dw: 132 }
  ];

  const STATIONS = [
    {
      id: "descent",
      label: "GRIETA DEL REFUGIO · INICIAR INCURSIÓN",
      prompt: "Pulsa [E] / (A) para lanzarte por la grieta · Círculo I · Limbo",
      x: DESCENT.x,
      y: DESCENT.y,
      r: 110
    },
    {
      id: "armory",
      label: "THE DICE VAULT",
      prompt: "Pulsa [E] / (A) para inspeccionar los dados",
      x: 240,
      y: 615,
      r: 75
    },
    {
      id: "dj",
      label: "CABINA DE TEMPO",
      prompt: "Pulsa [E] / (A) para hablar con Tempo",
      x: 1400,
      y: 330,
      r: 105
    },
    {
      id: "map",
      label: "MESA ASTRAL · MAPA DE PROGRESIÓN",
      prompt: "Pulsa [E] / (A) para inspeccionar la Torre de los 9 Círculos",
      x: 905,
      y: 585,
      r: 95
    },
    {
      id: "bar",
      label: "BARRA DEL REFUGIO · TEMPO EN LA RADIO",
      prompt: "Pulsa [E] / (A) para barra y consejo de la casa",
      x: 400,
      y: 415,
      r: 80
    },
    {
      id: "armorer",
      label: "ARMERO DEL REFUGIO · CONSEJO DE ARMAS",
      prompt: "Pulsa [E] / (A) para hablar con la armera",
      x: 378,
      y: 585,
      r: 70
    }
  ];

  // Walkable sectors on the existing floor, not nine run rooms or narrative tracks.
  const record=window.DD_REFUGE_RECORD;
  const points=[
    ['bedroom','02 · HABITACIÓN','Examinar la funda / cambiar de atuendo',1210,665],
    ['keepsake','02 · RECUERDOS','Colocar el siguiente recuerdo encontrado',1342,651],
    ['mix','01 · MEZCLA','Ajustar la mezcla de la cabina',1240,387],
    ['upgrades','02 · MEJORAS','Consultar el kit permanente',1245,740],
    ['workshop','05 · TALLER','Restaurar el equipo del Refugio',1460,535],
    ['rest','07 · DESCANSO','Examinar el sillón / escuchar',480,943],
    ['gallery','08 · GALERÍA','Consultar el siguiente registro',1330,908],
    ['practice','03 · ENSAYO','Probar el dado equipado sin gastar recursos',570,650],
    ['ledger','04 · HALLAZGOS','Leer el catálogo de hallazgos',1068,616],
    ['prepare','09 · PREPARACIÓN','Revisar equipo antes de bajar',1065,860]
  ];
  for(const [id,label,action,x,y] of points) STATIONS.push({id,label,prompt:`[E] / (A) · ${action}`,x,y,r:64});
  HUB_PROPS.push({kind:'sofa',x:1210,y:609,br:44,dw:146},{kind:'shelf',x:1295,y:600,br:30,dw:90});
  const WAYFINDING = { descent:'↓ DESCENSO', map:'◎ ATLAS', armory:'◇ DADOS', dj:'♫ CABINA', bar:'— BARRA', armorer:'+ ARMERA' };
  for(const [id,label] of points)WAYFINDING[id]=label;
  const zones={salon:['dj','mix'],habitacion:['bedroom','upgrades','keepsake'],arsenal:['armory','practice'],archivo:['map','ledger'],taller:['workshop'],residentes:['bar','armorer'],descanso:['rest'],galeria:['gallery'],acceso:['prepare','descent']};
  const voices={
    dj:['TEMPO','dialogue_portrait_dj',['Escucha la sala antes de bajar. Aquí puedes dejar pasar un compás.','¿Oyes la diferencia? La cabina escucha de vuelta.','Hoy puedes quedarte junto a los altavoces. No hace falta decir nada.']],
    bar:['EL BARTENDER','dialogue_portrait_bartender',['Deja el vaso sobre la marca. Así no se desliza con los graves.','Te guardé el mismo sitio.','No hace falta pedir nada. La barra también sirve para descansar.']],
    armorer:['LA ARMERA','dialogue_portrait_armorer',['El circuito del salón está aislado. Ya puedes encenderlo desde el taller.','Prueba tu dado en la marca de ensayo. Aquí no te cuesta nada.','Si ya reconoces el peso, cierra los ojos y escucha cómo cae.']]
  };
  let galleryPage=0,ledgerPage=0,practiceUntil=0,padHeld=false,pendingPad=null;
  function speak(st){
    const ui=window.DD_UI,p=ui.readProgress(),dice=window.DD_DICE, id=st.id;
    let msg='';
    if(id==='upgrades'||id==='mix'){openKit(id);return;}
    if(voices[id]){
      const [who,portrait,lines]=voices[id], n=record.talk(id);
      const milestone=record.event(id,p);
      const special={win:'Esta vez la pista ha tenido que dejarte volver.',loss:'La última incursión terminó. Aquí puedes recuperar el pulso.',boss:'Ese encuentro ha quedado registrado. No todas las noches dejan esa marca.',find:'Has encontrado las tres piezas. Pasa por el archivo: ninguna está ya sin identificar.',repair:'Se oye la mezcla desde el sillón. El circuito ha vuelto a cerrar.'};
      const rapport=n<2?'Presentación':n<5?'Conocido':'Habitual';
      const relationLine=n===5?['Te reconocería por el ritmo de tus pasos.','Tu vaso está donde lo dejaste.','Ya conoces el banco tan bien como yo.'][['dj','bar','armorer'].indexOf(id)]:null;
      const line=special[milestone] || relationLine || (n===2&&p.history.length?'Has vuelto de la pista. Hoy nos quedamos un compás más.':n===3&&record.repairs?'Desde aquí se nota la luz del salón.':lines[n%lines.length]);
      if(n>=2&&!milestone)openKit(id,{who,portrait,rapport,line});
      else ui.showDialogue(who,line,5.6,portrait);return;
    }
    if(id==='workshop')msg=record.repair(p);
    if(id==='bedroom'){
      msg=record.discover('sleeve');
      if(!msg){const looks=DD_APPEARANCE.list().filter(v=>v.unlocked),idx=looks.findIndex(v=>v.selected),next=looks[(idx+1)%looks.length];if(next)DD_APPEARANCE.equip(next.id);
        msg=`Atuendo: ${DD_APPEARANCE.current().name}. Mejoras permanentes activas: ${Object.values(p.upgrades).filter(Boolean).length}.`;}
    }
    if(id==='rest'){
      msg=record.discover('groove');
      if(!msg&&record.repairs<2)msg='El reproductor está desconectado. Lleva el surco de prueba al taller.';
      else if(!msg){const quiet=record.toggle();const audio=window.DD_BOOT?.audio;if(quiet)audio?.stopMenuMusic(.4);else audio?.startMenuMusic(.5);msg=quiet?'Reproductor en pausa.':'Suena la mezcla del Refugio.';}
    }
    if(id==='keepsake'){const item=record.displayNext();msg=item?'En la vitrina: '+item.name+'. '+item.description:'La vitrina está vacía. Examina la funda junto al sofá.';}
    if(id==='ledger'&&record.reveal()){msg='Las tres marcas coinciden. El sello del zorro se enciende sobre la estantería.';}
    else if(id==='ledger'){const list=Object.entries(record.finds),[key,entry]=list[ledgerPage++%list.length];msg=record.snapshot().found[key]?`${entry.name} · ${entry.description}`:`Pendiente · Examina ${STATIONS.find(s=>s.id===entry.zone).label}.`;}
    if(id==='gallery'){
      msg=record.discover('plate');
      if(!msg){
        const pages=[`Récord: ${p.best} puntos · Sala más profunda: ${p.bestRound} · Victorias: ${p.victories}.`];
        for(const h of p.history)if(h)pages.push(`${h.date||'Incursión'} · Sala ${h.round??'—'} · ${h.kills??'—'} bajas · ${h.score??'—'} puntos.`);
        if(record.repairs>=3)pages.push(...p.achievements.map(id=>'Hito registrado: '+id.replaceAll('_',' ')));
        pages.push(p.history.length?'Fin del registro.':'Todavía no hay incursiones registradas.');
        msg=pages[galleryPage++%pages.length];
      }
    }
    if(id==='practice'){
      if(practiceUntil>state.time){const t=2-(practiceUntil-state.time);practiceUntil=0;msg=`Tirada detenida: cara ${DD_DICE_GEOMETRY.top(dice.d.id,t*4,t*2)}. Sin coste ni daño.`;}
      else{practiceUntil=state.time+2;msg=`Ensayo D${dice.d.id} · Pulsa otra vez para detener la tirada.`;}
    }
    if(id==='prepare')msg=`${DD_APPEARANCE.current().name} · D${dice.d.id} · ${dice.catalog[dice.d.id].name}. Para bajar, camina hasta la grieta.`;
    ui.showDialogue(st.label,msg,6.5);
  }
  // Purchases dispatch the native offer's click. No duplicate prices, money or effect code.
  let kit=null,kitPadNav=0;
  function openKit(kind,conversation){
    if(!kit){kit=document.createElement('dialog');kit.id='dd-refuge-kit';kit.setAttribute('aria-label','Kit permanente');document.body.appendChild(kit);
      kit.addEventListener('close',()=>{state.interactCooldown=.35;state.keys=Object.create(null);});}
    const rows=Array.from(document.querySelectorAll('#shop .shop-row'));
    const title=document.createElement('h2');title.textContent='Habitación · Kit permanente';
    const balance=document.createElement('p');balance.textContent=`${DD_UI.readProgress().currency} fichas · Mejoras para futuras incursiones`;
    kit.replaceChildren(title,balance);
    if(conversation){
      const {who,portrait,rapport,line}=conversation;
      title.textContent=who+' · '+rapport;kit.setAttribute('aria-label',who);balance.textContent=line;
      const topics={dj:[['Preguntar por la cabina','Maestro mueve toda la sala. Música sólo mueve la mezcla; las voces siguen donde estaban.'],['Escuchar juntos','Cuenta el silencio entre dos golpes. Ahí también hay música.']],bar:[['Preguntar por el salón','Desde esta barra se ve quién va a bajar y quién sólo necesita sentarse.'],['Recordar la última visita','Lo primero que hago al abrir es dejar un sitio libre. Ya sabes cuál es.']],armorer:[['Preguntar por la mesa de ensayo','Detén el giro antes de que acabe. La cara que ves no se guarda en el dado de la incursión.'],['Preguntar por el taller',record.repairs?'Vi las lámparas encendidas. Buen trabajo.':'El primer trabajo es la iluminación. No hacen falta fichas, sólo cerrar el circuito.']]};
      topics[kind].forEach(([label,reply],i)=>{const key=i?'memory':'craft',b=document.createElement('button');b.textContent=label+(record.snapshot().events[kind+':'+key]?' · leído':'');b.onclick=()=>{record.topic(kind,key);kit.close();DD_UI.showDialogue(who,reply,6,portrait);};kit.appendChild(b);});
    }else if(kind==='mix'){
      title.textContent='Cabina · Mesa de mezclas';kit.setAttribute('aria-label',title.textContent);
      balance.textContent='Mezcla del juego · Los cambios se comparten con Opciones.';
      for(const [id,label] of [['master','Maestro'],['music','Música']]){
        const range=document.getElementById('menu-vol-'+id);if(!range)continue;
        const level=document.createElement('p');level.textContent=`${label}: ${range.value} %`;kit.appendChild(level);
        for(const [step,caption] of [[-5,'Bajar'],[5,'Subir']]){const b=document.createElement('button');b.textContent=`${caption} ${label.toLowerCase()}`;
          b.onclick=()=>{range.value=String(Math.max(Number(range.min),Math.min(Number(range.max),Number(range.value)+step)));range.dispatchEvent(new Event('input',{bubbles:true}));window.DDC_COVER?.music?.setVol?.();level.textContent=`${label}: ${range.value} %`;};kit.appendChild(b);}
      }
    }else kit.setAttribute('aria-label',title.textContent);
    if(kind==='upgrades')for(const row of rows){const native=row.querySelector('button'),button=document.createElement('button');button.textContent=row.querySelector('span').textContent+(native&&!native.disabled?' · Comprar':'');button.disabled=!native||native.disabled;
      button.onclick=()=>{if(native.isConnected&&!native.disabled){native.click();openKit(kind);}};kit.appendChild(button);}
    const back=document.createElement('button');back.textContent='Volver al Refugio';back.onclick=()=>kit.close();kit.appendChild(back);
    state.keys=Object.create(null);kitPadNav=0;
    if(!kit.open)kit.showModal();kit.querySelector('button:not(:disabled)').focus();
  }
  function enter() {
    ensureRefugeIdle();
    ensureRefugeWalk();
    state.walking = false;
    state.walkFrame = 0;
    state.walkPhase = 0;
    state.facingLeft = false;
    state.active = true;
    state.px = 910;
    state.py = 700;
    state.vx = 0;
    state.vy = 0;
    state.interactCooldown = 0.35;
    initAmbient();
    // Freeze the live run (if any) while the player walks the safe zone, so no
    // offscreen simulation can damage/kill the protagonist behind the HUB camera.
    if (window.__DD_BRIDGE && typeof window.__DD_BRIDGE.setPaused === "function") {
      window.__DD_BRIDGE.setPaused(true);
    }
    record.load();galleryPage=ledgerPage=0;practiceUntil=0;padHeld=true;pendingPad=null;state.nearStation=null;
    if(window.DD_UI){window.DD_UI.hideMainMenu();window.DD_UI.showDialogue('TEMPO',window.DD_UI.readProgress().history.length?'Bienvenido de vuelta. Tu registro espera en la galería.':'Escucha. La cabina, la barra y el taller están abiertos.',5.2);}
    // Cama musical del Refugio (pista del club en fundido). Se agenda con
    // retraso: enterGame() para la música del menú al validar el arranque y
    // llegaría después que este enter().
    setTimeout(function () {
      if (!state.active || record.quiet) return;
      try {
        if (window.DD_BOOT && window.DD_BOOT.audio && typeof window.DD_BOOT.audio.startMenuMusic === "function") {
          window.DD_BOOT.audio.startMenuMusic(2.0);
        } else if (window.DDC_COVER && window.DDC_COVER.music && typeof window.DDC_COVER.music.start === "function") {
          window.DDC_COVER.music.start(4);
        }
      } catch (e) { /* sin audio: silencio, no rompe */ }
    }, 900);
  }

  function exitToRun() {
    if (!state.active) return;
    state.active = false;
    try {
      if (window.DD_BOOT && window.DD_BOOT.audio && typeof window.DD_BOOT.audio.stopMenuMusic === "function") {
        window.DD_BOOT.audio.stopMenuMusic(0.4);
      } else if (window.DDC_COVER && window.DDC_COVER.music && typeof window.DDC_COVER.music.stop === "function") {
        window.DDC_COVER.music.stop(0.4);
      }
    } catch (e) { /* sin audio */ }
    const triggerRun = function () {
      // rp() clears the pause flag on startRun; this covers the no-run case too.
      if (window.__DD_BRIDGE && typeof window.__DD_BRIDGE.setPaused === "function") {
        window.__DD_BRIDGE.setPaused(false);
      }
      const br = window.__DD_BRIDGE;
      if (br && typeof br.startRun === "function") {
        br.startRun();
      } else if (window.DDC_COVER && typeof window.DDC_COVER.start === "function") {
        // Legacy sanctioned entry: the ddc cover owns #start-btn while locked,
        // so route through its own exposed start() (unlocks keyboard too).
        window.DDC_COVER.start();
      } else {
        const startBtn = document.getElementById("start-btn");
        if (startBtn) { startBtn.disabled = false; startBtn.click(); }
      }
      if (window.DD_UI) {
        window.DD_UI.hideMainMenu();
      }
    };
    if (window.DD_CINE && typeof window.DD_CINE.playCircleDescent === "function") {
      window.DD_CINE.playCircleDescent(0, triggerRun);
    } else {
      triggerRun();
    }
  }

  function triggerStation(st) {
    if (!st || state.interactCooldown > 0) return;
    state.interactCooldown = 0.35;
    if (st.id === "descent") {
      exitToRun();
    } else if (st.id === "armory" && window.DD_UI) {
      window.DD_UI.openShop();
    } else if (st.id === "map" && window.DD_UI) {
      window.DD_UI.openMap();
    } else if(window.DD_UI) speak(st);
  }

  function pollGamepad() {
    const out = { mx: 0, my: 0, ax: 0, ay: 0, interact: false };
    if (!navigator.getGamepads) return out;
    const pads = navigator.getGamepads();
    for (let i = 0; i < pads.length; i++) {
      const gp = pads[i];
      if (!gp || !gp.connected) continue;
      const lx = gp.axes[0] || 0;
      const ly = gp.axes[1] || 0;
      const rx = gp.axes[2] || 0;
      const ry = gp.axes[3] || 0;
      if (Math.hypot(lx, ly) > 0.18) { out.mx = lx; out.my = ly; }
      if (Math.hypot(rx, ry) > 0.22) { out.ax = rx; out.ay = ry; }
      out.nav=gp.buttons[12]?.pressed||ly<-.6?-1:gp.buttons[13]?.pressed||ly>.6?1:0;out.back=gp.buttons[1]?.pressed;
      if (gp.buttons[0] && gp.buttons[0].pressed) out.interact = true;
      break;
    }
    return out;
  }

  function update(dt) {
    if (!state.active) return;
    const cdt = Math.min(0.05, Math.max(0.001, dt || 0.016));
    state.time += cdt;
    updateAmbient(cdt);
    if (state.interactCooldown > 0) state.interactCooldown = Math.max(0, state.interactCooldown - cdt);

    if(practiceUntil && state.time>=practiceUntil){practiceUntil=0;window.DD_UI?.showDialogue('ENSAYO',`Cara de muestra: ${DD_DICE_GEOMETRY.top(DD_DICE.d.id,8,4)}. El dado de la incursión no ha cambiado.`,3);}
    const gp = pollGamepad(), pressed=gp.interact&&!padHeld;padHeld=gp.interact;
    if(kit?.open){
      const nav=gp.nav||0, buttons=Array.from(kit.querySelectorAll('button:not(:disabled)'));
      if(nav&&!kitPadNav){const i=buttons.indexOf(document.activeElement);buttons[(i+buttons.length+nav)%buttons.length].focus();}
      kitPadNav=nav;
      if(gp.back)kit.close();else if(pressed&&kit.contains(document.activeElement))document.activeElement.click();
      state.walking=false;state.vx=state.vy=0;return;
    }
    // Pause HUB movement while modal or blocking cinematic is open
    if ((window.DD_UI && window.DD_UI.isModalOpen()) || (window.DD_CINE && window.DD_CINE.isBlocking())) {
      state.walking = false;
      state.vx = state.vy = 0;
      return;
    }

    let ix = 0, iy = 0;
    if (state.keys["KeyW"] || state.keys["ArrowUp"]) iy -= 1;
    if (state.keys["KeyS"] || state.keys["ArrowDown"]) iy += 1;
    if (state.keys["KeyA"] || state.keys["ArrowLeft"]) ix -= 1;
    if (state.keys["KeyD"] || state.keys["ArrowRight"]) ix += 1;

    if (Math.hypot(gp.mx, gp.my) > 0.1) {
      ix = gp.mx;
      iy = gp.my;
    }
    const mag = Math.hypot(ix, iy);
    if (mag > 1) { ix /= mag; iy /= mag; }

    const speed = 285;
    state.vx = ix * speed;
    state.vy = iy * speed;
    let nx = state.px + state.vx * cdt;
    let ny = state.py + state.vy * cdt;

    // Room wall bounds
    const margin = 38;
    nx = Math.max(HUB_BOUNDS.x + margin, Math.min(HUB_BOUNDS.x + HUB_BOUNDS.w - margin, nx));
    ny = Math.max(HUB_BOUNDS.y + margin + 24, Math.min(HUB_BOUNDS.y + HUB_BOUNDS.h - margin, ny));

    // Furniture solid circle pushout
    for (let i = 0; i < HUB_PROPS.length; i++) {
      const p = HUB_PROPS[i];
      const minD = (p.br || 32) * 0.72 + 18;
      const dx = nx - p.x;
      const dy = ny - p.y;
      const d = Math.hypot(dx, dy);
      if (d > 0.001 && d < minD) {
        nx = p.x + (dx / d) * minD;
        ny = p.y + (dy / d) * minD;
      }
    }
    const movedX = nx - state.px, movedY = ny - state.py;
    state.px = nx;
    state.py = ny;
    // Animar por desplazamiento real: empujar una pared no produce pasos.
    const moved = Math.hypot(movedX, movedY);
    state.walking = mag > 0.15 && moved > 0.25;
    if (state.walking) {
      state.walkPhase += moved / 30;
      state.walkFrame = Math.floor(state.walkPhase) % REFUGE_WALK_ORDER.length;
      if (Math.abs(movedX) > 0.2) state.facingLeft = movedX < 0;
    }

    if (Math.hypot(gp.ax, gp.ay) > 0.2) {
      state.aimAngle = Math.atan2(gp.ay, gp.ax);
    } else if (mag > 0.15) {
      state.aimAngle = Math.atan2(iy, ix);
    }

    // Drive organic player animation state machine so HUB walks/idles smoothly!
    if (window.DMO && window.DMO.playerAnim) {
      const pa = window.DMO.playerAnim;
      pa.speed = Math.hypot(state.vx, state.vy);
      pa.breathePhase += cdt * 2.8;
      if (pa.speed > 12) {
        pa.stridePhase += cdt * 9.5;
        pa.walkFrame = Math.floor(pa.stridePhase) % 4;
        pa.bobY = Math.sin(pa.stridePhase * Math.PI) * 2.4;
        pa.upperPose = "player_idle";
        pa.lowerPose = "player_walk" + pa.walkFrame;
        pa.waistSplitActive = true;
      } else {
        pa.bobY = Math.sin(pa.breathePhase) * 1.1;
        pa.upperPose = "player_idle";
        pa.lowerPose = "player_idle";
        pa.waistSplitActive = false;
      }
    }

    // Check nearest interactive station
    let best = null;
    let bestDist = Infinity;
    for (let i = 0; i < STATIONS.length; i++) {
      const st = STATIONS[i];
      const d = Math.hypot(state.px - st.x, state.py - st.y);
      if (d <= st.r && d < bestDist) {
        best = st;
        bestDist = d;
      }
    }
    state.nearStation = best;

    if(pressed)pendingPad=best;
    if(!gp.interact||pendingPad!==best)pendingPad=null;
    if(pendingPad&&state.interactCooldown<=0){pendingPad=null;triggerStation(best);}

  }

  /* Suelo damero del HUB (FASE 2). La banda de 9 portales del mezzanine se
     retiró (TR_W20, decisión de diseño: no servía de nada y saturaba el muro).
     Reversible con
     window.__DD_HUB_REBUILD = false desde el arranque (suelo clásico, sin
     mezzanine). No hay estaciones ni lógica detrás de los portales. */
  const HUB_REBUILD = function () { return window.__DD_HUB_REBUILD !== false; };
  /* Arquitectura interior del Refugio rediseñado (TR_W15): delimita sectores
     SIN levantar muros — la línea de visión se conserva (2.5D cenital).
     Todo se pinta una vez en la caché de la sala:
       · alfombra del Salón (violeta, SO) con doble ribete neón;
       · círculo rúnico de la Mesa Astral (A · Mando);
       · anillo achicharrado bajo la grieta (F · salida);
       · runner ámbar frente a la barra (E · Social);
       · charcos de luz de ambiente por sector (cálida/fría según función). */
  function hexA(hex, a) {
    const n = parseInt(String(hex).slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }
  function paintRefugeArchitecture(cctx) {
    if (!cctx) return;
    // — Charcos de luz: se dibujan por frame en render() (respiración
    //   lenta); aquí ya no se hornean en la caché.
    // — Runner ámbar frente a la barra (entre contrabarra y taburetes)
    const run = cctx.createLinearGradient(0, 400, 0, 450);
    run.addColorStop(0, "rgba(250, 204, 21, 0.0)");
    run.addColorStop(0.5, "rgba(250, 204, 21, 0.15)");
    run.addColorStop(1, "rgba(250, 204, 21, 0.0)");
    cctx.fillStyle = run;
    cctx.fillRect(262, 400, 300, 50);
    // — Alfombra del Salón (SO) con doble ribete neón
    const rug = { x: 182, y: 782, w: 470, h: 202 };
    const rg = cctx.createRadialGradient(rug.x + rug.w / 2, rug.y + rug.h / 2, 24, rug.x + rug.w / 2, rug.y + rug.h / 2, rug.w * 0.62);
    rg.addColorStop(0, "rgba(88, 28, 135, 0.82)");
    rg.addColorStop(0.72, "rgba(59, 7, 100, 0.74)");
    rg.addColorStop(1, "rgba(30, 6, 50, 0.0)");
    cctx.fillStyle = rg;
    cctx.fillRect(rug.x - 44, rug.y - 44, rug.w + 88, rug.h + 88);
    if (typeof cctx.roundRect === "function") {
      cctx.strokeStyle = "rgba(255, 45, 122, 0.62)";
      cctx.lineWidth = 3;
      cctx.beginPath(); cctx.roundRect(rug.x, rug.y, rug.w, rug.h, 24); cctx.stroke();
      cctx.strokeStyle = "rgba(250, 204, 21, 0.4)";
      cctx.lineWidth = 1.5;
      cctx.beginPath(); cctx.roundRect(rug.x + 9, rug.y + 9, rug.w - 18, rug.h - 18, 18); cctx.stroke();
    }
    // — Círculo rúnico de la Mesa Astral (Mando): elipses + radios, violeta
    cctx.save();
    cctx.translate(905, 586);
    cctx.globalAlpha = 0.8;
    cctx.strokeStyle = "rgba(192, 132, 252, 0.5)";
    const rings = [122, 90, 56];
    for (let i = 0; i < rings.length; i++) {
      cctx.lineWidth = i === 0 ? 3 : 2;
      cctx.beginPath(); cctx.ellipse(0, 8, rings[i], rings[i] * 0.5, 0, 0, Math.PI * 2); cctx.stroke();
    }
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      cctx.beginPath();
      cctx.moveTo(Math.cos(a) * 60, 8 + Math.sin(a) * 30);
      cctx.lineTo(Math.cos(a) * 94, 8 + Math.sin(a) * 47);
      cctx.stroke();
    }
    cctx.restore();
    // — Anillo achicharrado bajo la grieta (salida F)
    cctx.save();
    cctx.translate(910, 880);
    cctx.scale(1, 0.52);
    const sc = cctx.createRadialGradient(0, 0, 12, 0, 0, 132);
    sc.addColorStop(0, "rgba(0, 0, 0, 0.58)");
    sc.addColorStop(0.55, "rgba(16, 5, 20, 0.4)");
    sc.addColorStop(1, "rgba(0, 0, 0, 0)");
    cctx.fillStyle = sc;
    cctx.fillRect(-132, -132, 264, 264);
    cctx.restore();
  }

  /* Ambiente vivo del Refugio (procedural, sin assets):
     · brasas cian/magenta/ámbar que ascienden de la grieta;
     · motas de polvo flotando en los charcos de luz (barra, Mesa Astral, salón).
     Se inicializan al entrar y se actualizan/dibujan por frame. */
  /* Charcos de luz por sector: cálida/fría según función. Base estática
     pintada antes por la caché; ahora se dibujan por frame con una
     respiración muy lenta (±18%) para que el Refugio no parezca una foto. */
  const LIGHT_POOLS = [
    { x: 400, y: 345, r: 170, color: "#f59e0b", a: 0.15, ph: 0.0, sp: 0.55 },  // barra · ámbar cálido
    { x: 1400, y: 292, r: 205, color: "#22d3ee", a: 0.13, ph: 1.1, sp: 0.7 },   // escenario DJ · cian frío
    { x: 240, y: 640, r: 165, color: "#fb7185", a: 0.12, ph: 2.2, sp: 0.62 },   // armería · brasa
    { x: 905, y: 580, r: 245, color: "#a855f7", a: 0.16, ph: 0.6, sp: 0.5 },    // mando · violeta arcano
    { x: 1500, y: 465, r: 160, color: "#8b5cf6", a: 0.19, ph: 1.7, sp: 1.15 },  // orbe Tesla · violeta eléctrico
    { x: 402, y: 852, r: 220, color: "#ff2d7a", a: 0.15, ph: 2.8, sp: 0.58 },   // salón · magenta sofá
    { x: 1460, y: 838, r: 178, color: "#22d3ee", a: 0.11, ph: 0.4, sp: 0.66 },  // ocio · cian arcade
    { x: 910, y: 880, r: 170, color: "#38bdf8", a: 0.12, ph: 1.9, sp: 0.9 }     // grieta · frío ascendente
  ];
  function drawLightPools(ctx, t) {
    for (let i = 0; i < LIGHT_POOLS.length; i++) {
      const p = LIGHT_POOLS[i];
      const a = p.a * (1 + 0.18 * Math.sin(t * p.sp + p.ph));
      const pg = ctx.createRadialGradient(p.x, p.y, 4, p.x, p.y, p.r);
      pg.addColorStop(0, hexA(p.color, a));
      pg.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = pg;
      ctx.fillRect(p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
  }

  const EMBER_N = 26;
  const MOTE_N = 24;
  function spawnEmber(q) {
    q.x = 845 + Math.random() * 130;
    q.y = 856 + Math.random() * 42;
    q.vy = -40 - Math.random() * 30;
    q.phase = Math.random() * Math.PI * 2;
    q.swayAmp = 7 + Math.random() * 11;
    q.life = 1.5 + Math.random() * 1.3;
    q.age = Math.random() * q.life; // fase desincronizada
    q.size = 1.7 + Math.random() * 2.4;
    q.hue = Math.random() < 0.42 ? "255,45,122" : (Math.random() < 0.5 ? "56,189,248" : "250,204,21");
    return q;
  }
  function spawnMote(q) {
    const pool = [[400, 345], [905, 580], [402, 880], [1400, 330]][(Math.random() * 4) | 0];
    q.cx = pool[0]; q.cy = pool[1];
    q.r = 24 + Math.random() * 96;
    q.a = Math.random() * Math.PI * 2;
    q.w = (Math.random() < 0.5 ? -1 : 1) * (0.05 + Math.random() * 0.085);
    q.size = 0.8 + Math.random() * 1.3;
    q.alpha = 0.05 + Math.random() * 0.075;
    return q;
  }
  function initAmbient() {
    if (!state.embers) {
      state.embers = [];
      for (let i = 0; i < EMBER_N; i++) state.embers.push(spawnEmber({}));
      state.motes = [];
      for (let i = 0; i < MOTE_N; i++) state.motes.push(spawnMote({}));
    }
  }
  function updateAmbient(cdt) {
    if (!state.embers) return;
    for (let i = 0; i < state.embers.length; i++) {
      const q = state.embers[i];
      q.age += cdt;
      q.y += q.vy * cdt;
      q.x += Math.sin((state.time + q.phase) * 2.1) * q.swayAmp * cdt;
      if (q.age >= q.life) spawnEmber(q);
    }
    for (let i = 0; i < state.motes.length; i++) {
      state.motes[i].a += state.motes[i].w * cdt;
    }
  }
  function drawAmbient(ctx) {
    if (!state.embers) return;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < state.embers.length; i++) {
      const q = state.embers[i];
      const t = q.age / q.life;
      const a = (1 - t) * 0.92;
      ctx.fillStyle = "rgba(" + q.hue + "," + a.toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(q.x, q.y, Math.max(0.4, q.size * (1 - t * 0.55)), 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < state.motes.length; i++) {
      const m = state.motes[i];
      const mx = m.cx + Math.cos(m.a) * m.r;
      const my = m.cy + Math.sin(m.a) * m.r * 0.62;
      ctx.fillStyle = "rgba(255, 240, 222," + m.alpha.toFixed(3) + ")";
      ctx.beginPath();
      ctx.arc(mx, my, m.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function ensureHubCache() {
    const stats = window.DD_ASSETS ? window.DD_ASSETS.stats() : { loaded: 0 };
    const stamp = String(stats.loaded) + (HUB_REBUILD() ? "|rebuild" : "|classic");
    if (state.roomCache && state.roomCacheStamp === stamp) return state.roomCache;

    const cnv = document.createElement("canvas");
    cnv.width = 2240;
    cnv.height = 1420;
    const cctx = cnv.getContext("2d");
    if (window.DD_WORLD) {
      if (HUB_REBUILD()) {
        window.DD_WORLD.buildHighResRoomCache(cctx, cnv.width, cnv.height, HUB_BOUNDS, 0, 777, null,
          { floorAsset: "hub_floor_main", vipInset: false });
        paintRefugeArchitecture(cctx);
        // The three new work areas have ground plates, not interactive menu tiles.
        cctx.save();
        for(const [x,y,w,label] of [[1255,604,220,'02 / HABITACIÓN'],[1460,474,188,'05 / RESTAURACIÓN'],[1340,838,194,'08 / GALERÍA']]){
          cctx.fillStyle='#211927da';cctx.fillRect(x-w/2,y-18,w,31);cctx.fillStyle='#edcba3';cctx.font='bold 13px monospace';cctx.textAlign='center';cctx.fillText(label,x,y+2);
        }cctx.restore();
      } else {
        window.DD_WORLD.buildHighResRoomCache(cctx, cnv.width, cnv.height, HUB_BOUNDS, 0, 777, null);
      }
    }
    state.roomCache = cnv;
    state.roomCacheStamp = stamp;
    return cnv;
  }

  // Optical model above the physical table, in the same painter's order as its prop.
  let astralPlate, astralRequested = false;
  const astralMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  function drawAstralModel(ctx, table) {
    if (!astralRequested) {
      astralRequested = true;
      const source = new Image();
      source.onload = () => {
        // Cache at 2x projected size, not 768×1706 resampled every frame.
        const plate = document.createElement('canvas');
        plate.width = 124; plate.height = 276;
        plate.getContext('2d').drawImage(source, 0, 0, plate.width, plate.height);
        astralPlate = plate;
      };
      source.src = 'assets/cinematics/restart/opening/mc_03_nine.jpg';
    }
    if (!astralPlate) return;
    const lit = state.nearStation && state.nearStation.id === 'map';
    const breath = astralMotion.matches ? 0 : Math.sin(state.time * 1.1);
    ctx.save();ctx.translate(table.x,table.y-62);
    ctx.fillStyle=lit?'#85e8dc28':'#85e8dc18';ctx.beginPath();ctx.moveTo(-35,-104);ctx.lineTo(35,-104);ctx.lineTo(9,0);ctx.lineTo(-9,0);ctx.closePath();ctx.fill();
    ctx.globalAlpha=(lit?.95:.85)+breath*.035;ctx.drawImage(astralPlate,-31,-139,62,138);
    ctx.fillStyle='#a8e6df';ctx.globalAlpha=.15+breath*.06;ctx.fillRect(-21,-1,42,2);
    ctx.globalAlpha=1;
    ctx.strokeStyle='#a0d5c8';ctx.lineWidth=1;ctx.beginPath();ctx.ellipse(0,-1,22,6,0,0,Math.PI*2);ctx.stroke();ctx.restore();
  }

  function render(ctx, viewW, viewH) {
    if (!state.active || !window.DD_WORLD) return false;
    const W = window.DD_WORLD;
    W.setSmooth(ctx);

    ctx.fillStyle = "#05020a";
    ctx.fillRect(0, 0, viewW, viewH);

    // Smooth camera tracking protagonist inside Refugio.
    // Zoom keeps the clubroom filling the viewport (no black void bands at the edges)
    // and the protagonist clearly readable; camera is clamped to the room + wall band.
    // QA hook (development only): window.__DD_HUB_DEBUG_ZOOM renders the whole room
    // centred, e.g. 0.62 — used by the redesign captures; off by default.
    const dbgZoom = Number(window.__DD_HUB_DEBUG_ZOOM);
    const zoom = (dbgZoom && isFinite(dbgZoom) && dbgZoom > 0)
      ? dbgZoom
      : Math.min(1.6, Math.max(1.02, Math.min(viewW / 1150, viewH / 780)));
    let camX = state.px * 0.55 + (HUB_BOUNDS.x + HUB_BOUNDS.w * 0.5) * 0.45;
    let camY = state.py * 0.48 + (HUB_BOUNDS.y + HUB_BOUNDS.h * 0.42) * 0.52;
    if (dbgZoom && isFinite(dbgZoom) && dbgZoom > 0) {
      camX = HUB_BOUNDS.x + HUB_BOUNDS.w * 0.5;
      camY = HUB_BOUNDS.y + HUB_BOUNDS.h * 0.46;
    }
    const halfW = viewW * 0.5 / zoom;
    const halfH = viewH * 0.5 / zoom;
    const x0 = HUB_BOUNDS.x - 56, x1 = HUB_BOUNDS.x + HUB_BOUNDS.w + 56;
    const y0 = HUB_BOUNDS.y - 150, y1 = HUB_BOUNDS.y + HUB_BOUNDS.h + 56;
    camX = (halfW * 2 >= x1 - x0) ? (x0 + x1) * 0.5 : Math.max(x0 + halfW, Math.min(x1 - halfW, camX));
    camY = (halfH * 2 >= y1 - y0) ? (y0 + y1) * 0.5 : Math.max(y0 + halfH, Math.min(y1 - halfH, camY));

    ctx.save();
    ctx.translate(viewW * 0.5, viewH * 0.5);
    ctx.scale(zoom, zoom);
    ctx.translate(-camX, -camY);

    const bg = ensureHubCache();
    ctx.drawImage(bg, 0, 0);
    drawLightPools(ctx, state.time);

    if(record.repairs>=1){for(const lx of [742,1070])W.drawNeonGlow(ctx,lx,478,80,'#ffc47a',.48);}
    // Restored furniture is added to the painter's list below, never to path blockers.
    if(practiceUntil>state.time){const t=2-(practiceUntil-state.time);ctx.save();ctx.translate(570+48*Math.sin(t*Math.PI),630-30*Math.abs(Math.sin(t*Math.PI)));const id=DD_DICE.d.id;DD_DICE_GEOMETRY.draw(ctx,id,t*4,t*2,19,DD_DICE.catalog[id].color);ctx.restore();}
    // Signature Neon Fox Mural on the east wall (ref R5). It lives mid-wall,
    // over the Torre lab wing, clear of the DJ stage silhouette.
    const foxSign = window.DD_ASSETS && window.DD_ASSETS.get("prop_hub_fox_neon");
    if (foxSign) {
      const fx = HUB_BOUNDS.x + HUB_BOUNDS.w - 118;
      const fy = HUB_BOUNDS.y + 300;
      W.drawNeonGlow(ctx, fx + 45, fy + 65, 185, "#ff2d7a", 0.36);
      ctx.drawImage(foxSign, fx, fy, 112, 148);
    }

    /* La grieta: ojo negro en la pista; el azul/magenta asciende de dentro.
       Es decoración de suelo: se dibuja antes de la y-sort para que el
       protagonista pise encima de los bordes. */
    W.drawDescentCrack(ctx, DESCENT, state.time);

    // Interactive station floor rings
    for (let i = 0; i < STATIONS.length; i++) {
      const st = STATIONS[i];
      const active = state.nearStation && state.nearStation.id === st.id;
      ctx.save();
      ctx.strokeStyle = active ? "#22d3ee" : "rgba(255, 45, 122, 0.38)";
      ctx.lineWidth = active ? 3 : 1.6;
      ctx.setLineDash(active ? [] : [12, 10]);
      ctx.beginPath();
      ctx.ellipse(st.x, st.y + 12, st.r * 0.72, st.r * 0.34, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      const caption = WAYFINDING[st.id], width = ctx.measureText(caption).width + 14;
      const sy = st.y + st.r * .34 + 18;
      ctx.fillStyle = '#130e1c'; ctx.fillRect(st.x-width/2,sy,width,18);
      ctx.fillStyle = active ? '#94efdc' : '#dac5bd'; ctx.fillText(caption,st.x,sy+13);
      ctx.restore();
    }

    // Y-sorted render list: HUB props + NPCs + Protagonist
    const drawList = [];
    for (let i = 0; i < HUB_PROPS.length; i++) {
      const p = HUB_PROPS[i];
      drawList.push({ y: p.y, kind: "prop", obj: p });
    }
    if(record.repairs>=2)drawList.push({y:928,kind:'prop',obj:{kind:'subwoofer',x:586,y:928,dw:64,br:12}});
    if(record.imprint)drawList.push({y:569,kind:'prop',obj:{kind:'banner',x:1068,y:569,dw:58,br:10}});
    if(record.repairs>=3)drawList.push({y:860,kind:'prop',obj:{kind:'pedestal',x:1260,y:860,dw:86,br:16}});
    if(record.keepsake)drawList.push({y:608,kind:'prop',obj:{kind:{sleeve:'poster',groove:'mirror',plate:'pedestal'}[record.keepsake],x:1342,y:608,dw:48,br:12}});
    // After the booth is repaired Tempo leans toward the working monitor. His
    // dialogue trigger stays within reach; no event moves a resident out of the HUB.
    const monitorOffset=record.repairs>=2?18:0;
    drawList.push({ y: 305, kind: "npc", id: "npc_dj_booth_world", x: 1400+monitorOffset, h: 132 });
    drawList.push({ y: 340, kind: "npc", id: "npc_bartender_hub", x: 400, h: 116 });
    drawList.push({ y: 600, kind: "npc", id: "npc_armorer_hub", x: 378, h: 118 });
    drawList.push({ y: state.py, kind: "player" });

    drawList.sort((a, b) => a.y - b.y);

    for (let i = 0; i < drawList.length; i++) {
      const item = drawList[i];
      if (item.kind === "prop") {
        if(item.obj.kind === "weaponrack" && window.DD_DICE){
          const {d,catalog}=window.DD_DICE;
          ctx.save();ctx.translate(item.obj.x,item.obj.y);
          W.drawNeonGlow(ctx,0,-24,62,catalog[d.id].color,.38);
          ctx.fillStyle="#180e26";ctx.fillRect(-72,-12,144,24);ctx.strokeStyle=catalog[d.id].color;ctx.strokeRect(-72,-12,144,24);
          ctx.fillStyle="#ffe5bf";ctx.font="bold 12px monospace";ctx.textAlign="center";ctx.fillText("THE DICE VAULT",0,4);
          ctx.translate(0,-40);window.DD_DICE_GEOMETRY.draw(ctx,d.id,.4,state.time*.5,25,catalog[d.id].color);ctx.restore();
        } else {
          W.drawProp(ctx, item.obj, state.time);
          if (item.obj.kind === 'astraltable') drawAstralModel(ctx, item.obj);
        }
      } else if (item.kind === "npc") {
        const nim = (window.DD_ASSETS && window.DD_ASSETS.get(item.id)) ||
                    (item.id === "npc_dj_booth_world" && window.DD_ASSETS && window.DD_ASSETS.get("dialogue_portrait_dj"));
        if (nim) {
          const nh = item.h;
          const nw = nh * (nim.naturalWidth / Math.max(1, nim.naturalHeight));
          W.drawSoftShadow(ctx, item.x, item.y + 18, 28, 12, 0.55);
          const bob=astralMotion.matches?0:Math.sin(state.time*(item.id==='npc_dj_booth_world'?2.9:1.4)+item.x)*1.25;
          ctx.drawImage(nim, item.x - nw / 2, item.y - nh + 22 + bob, nw, nh-bob);
        }
      } else if (item.kind === "player") {
        const br = window.__DD_BRIDGE;
        // Ground spotlight pool + warm halo so the dark protagonist never merges
        // into the crimson VIP carpet or the pale checker floor.
        ctx.save();
        const spot = ctx.createRadialGradient(state.px, state.py + 12, 6, state.px, state.py + 12, 58);
        spot.addColorStop(0, "rgba(255, 236, 246, 0.5)");
        spot.addColorStop(1, "rgba(255, 236, 246, 0)");
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle = spot;
        ctx.beginPath();
        ctx.ellipse(state.px, state.py + 12, 58, 24, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        W.drawNeonGlow(ctx, state.px, state.py + 4, 78, "#ffe4f1", 0.34);
        const drewHi = drawRefugeWalk(ctx) || drawRefugeIdle(ctx) || W.drawProtagonist(
          ctx,
          { x: state.px, y: state.py, aimAngle: state.aimAngle },
          window.DMO && window.DMO.playerAnim,
          null,
          0,
          0,
          1.16
        );
        if (!drewHi && br && typeof br.drawPlayerAt === "function") {
          br.drawPlayerAt(ctx, state.px, state.py, state.aimAngle);
        }
      }
    }

    drawAmbient(ctx);

    // Overhead Golden Chandeliers with warm volumetric glow (matching r5_refugio_hub.png)
    const chand = window.DD_ASSETS && window.DD_ASSETS.get("prop_chandelier_gold");
    const chandCoords = [[700, 225], [1130, 225]];
    for (let i = 0; i < chandCoords.length; i++) {
      const [cx, cy] = chandCoords[i];
      W.drawNeonGlow(ctx, cx, cy + 40, 190, "#facc15", 0.2);
      if (chand) {
        ctx.drawImage(chand, cx - 68, cy - 48, 136, 136);
      }
    }

    ctx.restore();

    // Floating interaction prompt at bottom-center when near a station
    if (state.nearStation) {
      ctx.save();
      const txt = state.nearStation.prompt;
      ctx.font = "700 14px Inter, Segoe UI, sans-serif";
      const tw = Math.min(viewW-16,ctx.measureText(txt).width + 36);
      const bx = (viewW - tw) * 0.5;
      const by = viewH - 94;
      ctx.fillStyle = "rgba(9, 4, 18, 0.92)";
      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 2;
      ctx.fillRect(bx, by, tw, 38);
      ctx.strokeRect(bx, by, tw, 38);
      ctx.fillStyle = "#f8fafc";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, viewW * 0.5, by + 19,tw-18);
      ctx.restore();
    }
    return true;
  }

  window.addEventListener("keydown", function (ev) {
    state.keys[ev.code] = true;
    if (!state.active || kit?.open || ev.repeat || window.DD_UI?.isModalOpen() || window.DD_CINE?.isBlocking()) return;
    if ((ev.code === "KeyE" || ev.code === "Enter") && state.nearStation) {
      ev.preventDefault();
      triggerStation(state.nearStation);
    }
  });
  window.addEventListener("keyup", function (ev) {
    state.keys[ev.code] = false;
  });

  // Safe-zone inset, projected from the same walk bounds and triggers as the world.
  function drawLocator(ctx,w,h) {
    const k=Math.min((w-18)/HUB_BOUNDS.w,(h-25)/HUB_BOUNDS.h);
    const left=(w-HUB_BOUNDS.w*k)/2, top=(h-HUB_BOUNDS.h*k)/2+5;
    const x=v=>left+(v-HUB_BOUNDS.x)*k, y=v=>top+(v-HUB_BOUNDS.y)*k;
    ctx.save();ctx.strokeStyle='#615365';ctx.strokeRect(left,top,HUB_BOUNDS.w*k,HUB_BOUNDS.h*k);
    ctx.font='bold 9px monospace';ctx.textAlign='left';ctx.fillStyle='#c8aba6';ctx.fillText('REFUGIO / PLANTA',left,top-3);
    for(const st of STATIONS){ctx.fillStyle=state.nearStation===st?'#a7edda':'#d7a887';ctx.fillText(WAYFINDING[st.id].split(' ')[0],x(st.x)-3,y(st.y)+3);}
    ctx.beginPath();ctx.arc(x(state.px),y(state.py),3,0,Math.PI*2);ctx.fillStyle='#fff9df';ctx.fill();ctx.restore();
  }

  window.DD_HUB = Object.freeze({
    isActive: function () { return state.active; },
    enter,
    exitToRun,
    inspectorOpen:()=>!!kit?.open,
    drawLocator,
    // Read-only coordinates for wayfinding and integration checks, no travel API.
    layout:()=>({zones:Object.fromEntries(Object.entries(zones).map(([k,v])=>[k,v.slice()])),stations:STATIONS.map(({id,x,y,r})=>({id,x,y,r})),obstacles:HUB_PROPS.map(({x,y,br})=>({x,y,r:(br||32)*.72+18}))}),
    update,
    render,
    getState: function () {
      return {
        active: state.active,
        zones:Object.keys(zones),
        x: Math.round(state.px),
        y: Math.round(state.py),
        nearStation: state.nearStation ? state.nearStation.id : null,
        bounds: HUB_BOUNDS,
        stations: STATIONS.map(s => s.id),
        protagonist: state.walking && REFUGE_WALK[REFUGE_WALK_ORDER[state.walkFrame]].img && REFUGE_WALK[REFUGE_WALK_ORDER[state.walkFrame]].img.naturalWidth ? "pm_walk_0" + REFUGE_WALK_ORDER[state.walkFrame] : (REFUGE_IDLE.ok ? "idle_07b" : "sprites_anteriores"),
        walking: state.walking,
        walkFrame: state.walkFrame,
        facingLeft: state.facingLeft,
        protagonistSrc: state.walking && REFUGE_WALK[REFUGE_WALK_ORDER[state.walkFrame]].img && REFUGE_WALK[REFUGE_WALK_ORDER[state.walkFrame]].img.naturalWidth ? REFUGE_WALK[REFUGE_WALK_ORDER[state.walkFrame]].src : REFUGE_IDLE.src,
        protagonistRect: REFUGE_IDLE.lastRect,
        protagonistAspect: REFUGE_IDLE.lastRect ? +(REFUGE_IDLE.lastRect.w / REFUGE_IDLE.lastRect.h).toFixed(4) : null
      };
    }
  });
})();
