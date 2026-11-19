/* Aspectos cosméticos. La disponibilidad de prueba no modifica los récords del motor. */
(function () {
  'use strict';
  var KEY = 'dd_appearance_v1';
  /* Catálogo definitivo — colección de ocho atuendos (00–07) sustituyendo al
     catálogo anterior. Los requisitos heredan las condiciones existentes por
     correspondencia (ver LEGACY más abajo); no se inventan condiciones nuevas. */
  var styles = [
    { id:'original', name:'El Desafinado', description:'El look de siempre. La muerte también aprecia la continuidad.', hue:0, requirement:'Disponible desde el principio', round:0 },
    { id:'rapture', name:'Rapture', description:'Elegancia art déco para una ciudad que se hunde. El último brindis lo paga el océano.', hue:0, requirement:'Alcanza la sala 30', round:30 },
    { id:'shadow', name:'Shadow', description:'Capucha integrada al sombrero. El sigilo es gratis; el alquiler del abrigo, no.', hue:0, requirement:'Alcanza la sala 10', round:10 },
    { id:'apocalypse', name:'Apocalypse', description:'Armadura asimétrica para el fin del mundo. La hombrera pesa más que tus remordimientos.', hue:0, requirement:'Alcanza la sala 5', round:5 },
    { id:'gunslinger', name:'Gunslinger', description:'Pistolero de arcade. La munición es infinita; tu paciencia, no.', hue:0, requirement:'Alcanza la sala 25', round:25 },
    { id:'fightclub', name:'Fight Club', description:'Vendas y garra de gimnasio. Las reclamaciones se presentan con los puños.', hue:0, requirement:'Alcanza la sala 50', round:50 },
    { id:'kitchenriot', name:'Kitchen Riot', description:'Cocina punk con delantal de combate. El menú del día: supervivencia poco hecha.', hue:0, requirement:'Alcanza la sala 45', round:45 },
    { id:'streetart', name:'Street Art', description:'Chaqueta intervenida y bolsillos de pintura. El lienzo eres tú; el presupuesto, también.', hue:0, requirement:'Alcanza la sala 55', round:55 }
  ];
  /* Correspondencia de IDs antiguos → nuevos para partidas guardadas. Ningún
     dato se elimina: selecciones previas se migran al equivalente más cercano. */
  var LEGACY = {
    knight:'apocalypse', assassin:'shadow', rider:'apocalypse', diver:'original',
    gunslinger:'gunslinger', tears:'rapture', trainer:'fightclub', adventurer:'shadow',
    chef:'kitchenriot', kickboxer:'fightclub', painter:'streetart',
    cyan:'original', violet:'original', gold:'original'
  };
  function migrate(id) { return LEGACY[id] || id; }
  var selected = 'original', cache = new WeakMap(), previewUrls = {}, portraitUrls = {}, showcaseUrls = {};
  var outfitNames = ['idle','walk_a','aim','hurt','roll','death'];
  /* Original se registra cuando sus sprites propios estén listos; hasta entonces
     el motor usa las sprites base. Los demás apuntan a su carpeta nueva. */
  var outfits = { rapture: {}, shadow: {}, apocalypse: {}, gunslinger: {}, fightclub: {}, kitchenriot: {}, streetart: {} };
  var showcases = {};
  var paths = { rapture: 'rapture', shadow: 'shadow', apocalypse: 'apocalypse', gunslinger: 'gunslinger', fightclub: 'fightclub', kitchenriot: 'kitchenriot', streetart: 'streetart' };
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
  function sync() { var id; try { id=localStorage.getItem(KEY); } catch(e) {} id = migrate(id); var s=item(id); setSelected(s && unlocked(s) ? s.id : 'original'); return selected; }
  function equip(id) { id = migrate(id); var s=item(id); if (!s || !unlocked(s) || (outfits[id] && !outfitReady(id))) return false; try { localStorage.setItem(KEY,id); } catch(e) { return false; } setSelected(id); return true; }
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
