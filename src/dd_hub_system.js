/* ==========================================================================
   DEADBEAT DISCO — PLAYABLE ISOMETRIC REFUGIO / HUB (window.DD_HUB)
   Faithful playable reconstruction of REF_05 -> REFUGIO / HUB with full
   keyboard, mouse & Xbox gamepad navigation, NPCs, stations & Descent Pad.
   ========================================================================== */
(function () {
  "use strict";

  const L=window.DD_HUB_LAYOUT,HUB_BOUNDS=L.bounds,STATIONS=L.stations;
  const range=window.DD_HUB_RANGE(L),vestibule=window.DD_HUB_LIVE(L);
  let pointer=null,fire=false,fireEdge=false,dashHeld=false;
  function clearRange(){range.leave();pointer=null;fire=fireEdge=dashHeld=false;}
  const state = {
    active: false,
    px: L.spawn.x,
    py: L.spawn.y,
    vx: 0,
    vy: 0,
    aimAngle: -Math.PI / 2,
    time: 0,
    walkPhase: 0,
    walkFrame: 0,
    walking: false,
    facingLeft: false,
    lastTs: 0,
    keys: Object.create(null),
    nearStation: null,
    interactCooldown: 0,

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

  const record=window.DD_REFUGE_RECORD;
  const zones={salon:['dj','mix'],habitacion:['bedroom','upgrades','keepsake'],arsenal:['armory','practice'],archivo:['map','ledger'],taller:['workshop'],residentes:['bar','armorer'],descanso:['rest'],galeria:['gallery'],acceso:['prepare','descent']};
  const voices={
    dj:['TEMPO','dialogue_portrait_dj',['Escucha la sala antes de bajar. Aquí puedes dejar pasar un compás.','¿Oyes la diferencia? La cabina escucha de vuelta.','Hoy puedes quedarte junto a los altavoces. No hace falta decir nada.']],
    bar:['EL BARTENDER','dialogue_portrait_bartender',['Deja el vaso sobre la marca. Así no se desliza con los graves.','Te guardé el mismo sitio.','No hace falta pedir nada. La barra también sirve para descansar.']],
    armorer:['LA ARMERA','dialogue_portrait_armorer',['El circuito del salón está aislado. Ya puedes encenderlo desde el taller.','Prueba tu dado en la marca de ensayo. Aquí no te cuesta nada.','Si ya reconoces el peso, cierra los ojos y escucha cómo cae.']]
  };
  let galleryPage=0,ledgerPage=0,padHeld=false,pendingPad=null;
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
    if(id==='practice'){range.enter();msg='Apunta a las dianas. Clic / RT lanza; Espacio / B impulsa en movimiento. Sal del recinto para terminar.';}
    if(id==='prepare')msg=`${DD_APPEARANCE.current().name} · D${dice.d.id} · ${dice.catalog[dice.d.id].name}. Para bajar, camina hasta la grieta.`;
    ui.showDialogue(st.label,msg,6.5);
  }
  // Purchases dispatch the native offer's click. No duplicate prices, money or effect code.
  let kit=null,kitPadNav=0;
  function openKit(kind,conversation){
    if(!kit){kit=document.createElement('dialog');kit.id='dd-refuge-kit';kit.setAttribute('aria-label','Kit permanente');document.body.appendChild(kit);
      kit.addEventListener('close',()=>{state.interactCooldown=.35;state.keys=Object.create(null);});}
    const rows=Array.from(document.querySelectorAll('#shop .shop-row'));
    const title=document.createElement('h2');title.textContent='Arsenal · Kit permanente';
    const balance=document.createElement('p');balance.textContent=`${DD_UI.readProgress().currency} fichas · Mejoras para futuras incursiones`;
    kit.replaceChildren(title,balance);
    if(conversation){
      const {who,portrait,rapport,line}=conversation;
      title.textContent=who+' · '+rapport;kit.setAttribute('aria-label',who);balance.textContent=line;
      const topics={dj:[['Preguntar por la cabina','Maestro mueve toda la sala. Música sólo mueve la mezcla; las voces siguen donde estaban.'],['Escuchar juntos','Cuenta el silencio entre dos golpes. Ahí también hay música.']],bar:[['Preguntar por el salón','Desde esta barra se ve quién va a bajar y quién sólo necesita sentarse.'],['Recordar la última visita','Lo primero que hago al abrir es dejar un sitio libre. Ya sabes cuál es.']],armorer:[['Preguntar por la mesa de ensayo','Apunta a las dianas del recinto oeste. Tu dado de incursión no cambia.'],['Preguntar por el taller',record.repairs?'Vi las lámparas encendidas. Buen trabajo.':'El primer trabajo es la iluminación. No hacen falta fichas, sólo cerrar el circuito.']]};
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
    if(state.active)return;
    ensureRefugeIdle();
    ensureRefugeWalk();
    state.walking = false;
    state.walkFrame = 0;
    state.walkPhase = 0;
    state.facingLeft = false;
    state.active = true;
    state.px=L.spawn.x;state.py=L.spawn.y;state.aimAngle=-Math.PI/2;state.keys=Object.create(null);clearRange();
    state.vx = 0;
    state.vy = 0;
    state.interactCooldown = 0.35;

    // Freeze the live run (if any) while the player walks the safe zone, so no
    // offscreen simulation can damage/kill the protagonist behind the HUB camera.
    if (window.__DD_BRIDGE && typeof window.__DD_BRIDGE.setPaused === "function") {
      window.__DD_BRIDGE.setPaused(true);
    }
    record.load();galleryPage=ledgerPage=0;padHeld=true;pendingPad=null;state.nearStation=null;
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
    state.active = false;clearRange();state.keys=Object.create(null);
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
      window.DD_HUB.exitToRun();
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
      out.fire=gp.buttons[7]?.pressed;out.dash=gp.buttons[1]?.pressed;
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

    if (state.interactCooldown > 0) state.interactCooldown = Math.max(0, state.interactCooldown - cdt);

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

    if(Math.hypot(gp.ax,gp.ay)>.2){pointer=null;state.aimAngle=Math.atan2(gp.ay,gp.ax);}
    else if(pointer)state.aimAngle=Math.atan2(pointer.y-state.py,pointer.x-state.px);
    else if(mag>.15)state.aimAngle=Math.atan2(iy,ix);
    const dash=!!(state.keys.Space||gp.dash);
    const speed=285*range.step(cdt,state.px,state.py,state.aimAngle,fire||fireEdge||gp.fire,dash&&!dashHeld);
    dashHeld=dash;fireEdge=false;state.vx=ix*speed;state.vy=iy*speed;
    let nx=state.px,ny=state.py;
    // Axis sliding in short steps prevents a practice boost crossing a counter.
    const steps=Math.max(1,Math.ceil(speed*cdt/8));
    for(let i=0;i<steps;i++){const x=nx+state.vx*cdt/steps,y=ny+state.vy*cdt/steps;
      if(L.walkable(x,ny))nx=x;if(L.walkable(nx,y))ny=y;}
    if(range.current&&!L.contains(L.lane,nx,ny))clearRange();
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

    const best=STATIONS.find(st=>L.contains(st.area,nx,ny))||null;
    state.nearStation = best;

    if(pressed)pendingPad=best;
    if(!gp.interact||pendingPad!==best)pendingPad=null;
    if(pendingPad&&state.interactCooldown<=0){pendingPad=null;triggerStation(best);}

  }

  function render(ctx,w,h){return state.active&&vestibule.render(ctx,w,h,state,range.current,()=>drawRefugeWalk(ctx)||drawRefugeIdle(ctx));}
  function canAim(){return state.active&&range.current&&!kit?.open&&!window.DD_UI?.isModalOpen()&&!window.DD_CINE?.isBlocking();}
  window.addEventListener('pointermove',e=>{if(canAim())pointer=vestibule.pointer(e);});
  window.addEventListener('pointerdown',e=>{if(canAim()&&e.button===0&&(pointer=vestibule.pointer(e))){fire=fireEdge=true;}});
  window.addEventListener('pointerup',()=>{fire=false;});
  window.addEventListener('blur',()=>{clearRange();state.keys=Object.create(null);});
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
    ctx.save();ctx.strokeStyle='#615365';ctx.beginPath();L.outline.forEach((p,i)=>i?ctx.lineTo(x(p.x),y(p.y)):ctx.moveTo(x(p.x),y(p.y)));ctx.closePath();ctx.stroke();
    ctx.font='bold 9px monospace';ctx.textAlign='left';ctx.fillStyle='#c8aba6';ctx.fillText('REFUGIO / PLANTA',left,top-3);
    for(const st of STATIONS){ctx.fillStyle=state.nearStation===st?'#a7edda':'#d7a887';ctx.fillRect(x(st.area.x+st.area.w/2)-2,y(st.area.y+st.area.h/2)-2,4,4);}
    ctx.beginPath();ctx.arc(x(state.px),y(state.py),3,0,Math.PI*2);ctx.fillStyle='#fff9df';ctx.fill();ctx.restore();
  }

  window.DD_HUB = Object.freeze({
    isActive: function () { return state.active; },
    enter,
    exitToRun,
    inspectorOpen:()=>!!kit?.open,
    drawLocator,
    // Read-only coordinates for wayfinding and integration checks, no travel API.
    layout:()=>JSON.parse(JSON.stringify({zones,bounds:L.bounds,stations:STATIONS.map(st=>({...st,x:st.area.x+st.area.w/2,y:st.area.y+st.area.h/2})),obstacles:L.solids,threshold:L.gate,jambs:L.jambs,walls:L.walls,spawn:L.spawn,lane:L.lane})),
    walkable:L.walkable,
    update,
    render,
    getState: function () {
      return {
        active: state.active,
        practice:range.current?{hits:range.current.hits,projectile:!!range.current.shot,boost:range.current.boost>0}:null,
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
