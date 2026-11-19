/* Aspectos cosméticos. La disponibilidad de prueba no modifica los récords del motor. */
(function () {
  'use strict';
  var KEY = 'dd_appearance_v1';
  var styles = [
    { id:'original', name:'Original', description:'El look de siempre. La muerte también aprecia la continuidad.', hue:0, requirement:'Disponible desde el principio', round:0 },
    { id:'knight', name:'Caballero oscuro', description:'Armadura para rodar por el infierno. La dignidad no incluye garantía.', hue:0, requirement:'Alcanza la sala 5', round:5 },
    { id:'assassin', name:'Sombra del club', description:'Capucha y sigilo. La música del club no recibió el memorándum.', hue:0, requirement:'Alcanza la sala 10', round:10 },
    { id:'rider', name:'Jinete del abismo', description:'Vístete para el apocalipsis. El caballo se quedó esperando el DLC.', hue:0, requirement:'Alcanza la sala 15', round:15 },
    { id:'diver', name:'Buzo del neón', description:'Casco de buzo para un descenso seco. La presión viene de serie.', hue:0, requirement:'Alcanza la sala 20', round:20 },
    { id:'gunslinger', name:'Pistolero de neón', description:'Listo para el duelo. La munición infinita no mejora la puntería.', hue:0, requirement:'Alcanza la sala 25', round:25 },
    { id:'tears', name:'Lágrima del abismo', description:'Un look para llorar por dentro. Las lágrimas no dan inmunidad.', hue:0, requirement:'Alcanza la sala 30', round:30 },
    { id:'trainer', name:'Entrenador del neón', description:'Gorra de entrenador. Aquí las criaturas no caben en el bolsillo.', hue:0, requirement:'Alcanza la sala 35', round:35 },
    { id:'adventurer', name:'Guardián del bosque', description:'Túnica y capucha verdes. Romper jarrones no paga el alquiler.', hue:0, requirement:'Alcanza la sala 40', round:40 },
    { id:'chef', name:'Chef de medianoche', description:'Delantal y gorro. El menú del día: supervivencia poco hecha.', hue:0, requirement:'Alcanza la sala 45', round:45 },
    { id:'kickboxer', name:'Luchador del neón', description:'Vendas y pantalón corto. El suelo del club no está desinfectado.', hue:0, requirement:'Alcanza la sala 50', round:50 },
    { id:'painter', name:'Pintor del neón', description:'Manchado de pintura. El infierno también necesita una segunda capa.', hue:0, requirement:'Alcanza la sala 55', round:55 },
    { id:'cyan', name:'Pulso cian', description:'Un toque cian. La crisis existencial sigue en alta definición.', hue:-130, requirement:'Alcanza la sala 5', round:5 },
    { id:'violet', name:'Noche violeta', description:'Violeta de madrugada. El club no cubre la tintorería.', hue:-55, requirement:'Alcanza la sala 15', round:15 },
    { id:'gold', name:'Último baile', description:'Oro para el último baile. El seguro de vida se vende aparte.', hue:80, requirement:'Consigue una victoria', victory:1 }
  ];
  var selected = 'original', cache = new WeakMap(), previewUrls = {}, portraitUrls = {}, showcaseUrls = {};
  var outfitNames = ['idle','walk_a','aim','hurt','roll','death'];
  var outfits = { knight: {}, assassin: {}, rider: {}, diver: {}, gunslinger: {}, tears: {}, trainer: {}, adventurer: {}, chef: {}, kickboxer: {}, painter: {} };
  var showcases = {};
  var paths = { knight: 'caballero', assassin: 'asesino', rider: 'jinete', diver: 'buzo', gunslinger: 'pistolero', tears: 'lagrimas', trainer: 'entrenador', adventurer: 'aventurero', chef: 'cocinero', kickboxer: 'kickboxer', painter: 'pintor' };
  Object.keys(outfits).forEach(function(id) {
    outfitNames.forEach(function(name) {
      var im = new Image(); outfits[id][name] = im;
      im.onload = function () { window.dispatchEvent(new Event('dd-looks-ready')); };
      im.src = 'assets/characters/outfits/' + paths[id] + '/' + name + '.png';
    });
    // Pose de presentación a cuerpo entero para el selector.
    var sw = new Image(); showcases[id] = sw;
    sw.onload = function () { window.dispatchEvent(new Event('dd-looks-ready')); };
    sw.src = 'assets/characters/outfits/' + paths[id] + '/showcase.png';
  });
  // Look original y paletas (cian, violeta, oro): la misma pose del diseño.
  var swBase = new Image(); showcases['original'] = swBase;
  swBase.onload = function () { window.dispatchEvent(new Event('dd-looks-ready')); };
  swBase.src = 'assets/characters/outfits/original/showcase.png';
  function outfitReady(id) { return !!outfits[id] && outfitNames.every(function(n) { var im=outfits[id][n]; return im.complete && im.naturalWidth > 0; }); }
  function outfitFrame(name) { return outfitReady(selected) ? outfits[selected][name] || null : null; }
  function knightReady() { return outfitReady('knight'); }
  function knightFrame(name) { return selected === 'knight' ? outfitFrame(name) : null; }
  var portrait = new Image(); portrait.src = 'assets/ui/scenes/hero.png';
  portrait.onload = function () { window.dispatchEvent(new Event('dd-looks-ready')); };
  var hudPortrait = new Image();
  hudPortrait.onload = function () { window.dispatchEvent(new Event('dd-looks-ready')); };
  hudPortrait.src = 'assets/ui/hud_portrait_protagonist.png';
  function number(key) { try { var v = Number(localStorage.getItem(key)); return isFinite(v) ? Math.max(0,v) : 0; } catch(e) { return 0; } }
  function victories() { try { var v=JSON.parse(localStorage.getItem('dmo_victories_v214') || 'null'); return v && isFinite(Number(v.count)) ? Math.max(0,Number(v.count)) : 0; } catch(e) { return 0; } }
  // Activado para que todos puedan probar los aspectos; los requisitos originales se conservan.
  var PREVIEW_UNLOCK_ALL = true;
  function unlocked(s) { return PREVIEW_UNLOCK_ALL || (s.victory ? victories() >= s.victory : number('dmodisco_best_round_v1') >= s.round); }
  function item(id) { return styles.find(function(s){return s.id===id;}); }
  function setSelected(id) { if (selected !== id) { selected=id; window.dispatchEvent(new Event('dd-appearance-change')); } }
  function sync() { var id; try { id=localStorage.getItem(KEY); } catch(e) {} var s=item(id); setSelected(s && unlocked(s) ? s.id : 'original'); return selected; }
  function equip(id) { var s=item(id); if (!s || !unlocked(s) || (outfits[id] && !outfitReady(id))) return false; try { localStorage.setItem(KEY,id); } catch(e) { return false; } setSelected(id); return true; }
  // Sólo píxeles magenta saturados; el tono de piel, tatuajes y negros se conservan.
  // Cada fotograma se transforma una vez por paleta y se guarda en memoria.
  function recolor(img, id) {
    var s=item(id || selected), w=img && (img.naturalWidth || img.width), h=img && (img.naturalHeight || img.height);
    if (!s || !s.hue || !w || !h) return img;
    var variants=cache.get(img); if (!variants) { variants={}; cache.set(img,variants); }
    if (variants[s.id]) return variants[s.id];
    try {
      var c=document.createElement('canvas');c.width=w;c.height=h;var g=c.getContext('2d',{willReadFrequently:true});g.drawImage(img,0,0,w,h);
      var im=g.getImageData(0,0,w,h), a=im.data;
      for(var i=0;i<a.length;i+=4) {
        if(a[i+3]<16) continue;
        var r=a[i]/255, gr=a[i+1]/255, b=a[i+2]/255, mx=Math.max(r,gr,b), mn=Math.min(r,gr,b), d=mx-mn;
        if(mx<.16 || d<.13 || d/mx<.3) continue;
        var hue=mx===r?((gr-b)/d)%6:mx===gr?(b-r)/d+2:(r-gr)/d+4;
        hue=(hue*60+360)%360;
        if(hue<275 || hue>350) continue;
        var nh=(hue+s.hue+360)%360, chroma=d, x=chroma*(1-Math.abs((nh/60)%2-1)), m=mx-chroma, rr=0,gg=0,bb=0;
        if(nh<60){rr=chroma;gg=x;}else if(nh<120){rr=x;gg=chroma;}else if(nh<180){gg=chroma;bb=x;}else if(nh<240){gg=x;bb=chroma;}else if(nh<300){rr=x;bb=chroma;}else{rr=chroma;bb=x;}
        a[i]=Math.round((rr+m)*255);a[i+1]=Math.round((gg+m)*255);a[i+2]=Math.round((bb+m)*255);
      }
      g.putImageData(im,0,0); variants[s.id]=c; return c;
    } catch(e) { return img; }
  }
  function isPalette(id) { return id==='cyan'||id==='violet'||id==='gold'; }
  function preview(id) {
    // El selector usa la pose de presentación a cuerpo entero si está cargada.
    var sw = showcases[id] || (isPalette(id) ? showcases['original'] : null);
    if (sw && sw.complete && sw.naturalWidth) {
      if (isPalette(id)) {
        if (!previewUrls[id]) { try { var im=recolor(sw,id); previewUrls[id]=im===sw?sw.src:im.toDataURL('image/png'); } catch(e) { return sw.src; } }
        return previewUrls[id];
      }
      return sw.src;
    }
    if(outfits[id]) return outfits[id].idle.src;
    if(!portrait.complete || !portrait.naturalWidth) return portrait.src;
    if(!previewUrls[id]) { try { var im=recolor(portrait,id); previewUrls[id]=im===portrait?portrait.src:im.toDataURL('image/png'); } catch(e) { return portrait.src; } }
    return previewUrls[id];
  }
  function showcase(id) {
    var sw = showcases[id] || (isPalette(id) ? showcases['original'] : null);
    if (!(sw && sw.complete && sw.naturalWidth)) return null;
    if (isPalette(id)) {
      try { var im=recolor(sw,id); return im===sw?sw.src:im.toDataURL('image/png'); } catch(e) { return sw.src; }
    }
    return sw.src;
  }
  // El retrato usa la cabeza de la pose de presentación del atuendo: misma
  // identidad que el selector. Si no está, recorte del sprite de reposo.
  // El original y las paletas conservan el retrato existente del HUD.
  function hudPreview(id) {
    var look = item(id) ? id : 'original';
    if (portraitUrls[look]) return portraitUrls[look];
    var sw = showcases[look] || (isPalette(look) ? showcases['original'] : null);
    if (sw && sw.complete && sw.naturalWidth) {
      try {
        var src = sw;
        if (isPalette(look)) src = recolor(sw, look);
        var c = document.createElement('canvas'); c.width = c.height = 256;
        var w = src.naturalWidth || src.width, h = src.naturalHeight || src.height;
        var side = h * 0.235, top = h * 0.012;
        c.getContext('2d').drawImage(src, (w - side) / 2, top, side, side, 0, 0, 256, 256);
        return (portraitUrls[look] = c.toDataURL('image/png'));
      } catch(e) { /* Fallback below. */ }
    }
    var frame = outfits[look] && outfits[look].idle;
    if (frame && frame.complete && frame.naturalWidth) {
      try {
        var c = document.createElement('canvas'); c.width = c.height = 256;
        c.getContext('2d').drawImage(frame, 40, 35, 208, 208, 0, 0, 256, 256);
        return (portraitUrls[look] = c.toDataURL('image/png'));
      } catch(e) { /* Fallback below if canvas is unavailable. */ }
    }
    if (look !== 'original' && !outfits[look] && hudPortrait.complete && hudPortrait.naturalWidth) {
      try { return (portraitUrls[look] = recolor(hudPortrait, look).toDataURL('image/png')); } catch(e) {}
    }
    return hudPortrait.src;
  }
  sync();
  window.addEventListener('storage',function(e){if(e.key===KEY || e.key==='dmodisco_best_round_v1' || e.key==='dmo_victories_v214' || e.key===null) sync();});
  window.DD_APPEARANCE=Object.freeze({
    list:function(){return styles.map(function(s){return {id:s.id,name:s.name,description:s.description,requirement:s.requirement,unlocked:unlocked(s),selected:s.id===selected};});},
    current:function(){return item(selected) || styles[0];}, equip:equip, sync:sync, recolor:recolor, preview:preview, showcase:showcase, hudPreview:hudPreview, outfitFrame:outfitFrame, outfitReady:outfitReady, knightFrame:knightFrame, knightReady:knightReady, key:KEY
  });
})();
