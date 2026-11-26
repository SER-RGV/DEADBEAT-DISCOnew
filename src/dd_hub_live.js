// Use the studio's authored floor, furniture and relief, but the game's player,
// range and station handlers. Coordinates here are floor-plan units.
(() => {
  const L = organicVestibule(window.DD_HUB_LAYOUT);
  const scale = r => Object.fromEntries(Object.entries(r).map(([k,v]) => [k,typeof v==='number'?2*v:v]));
  const world={...L,bounds:scale(L.bounds),spawn:scale(L.spawn),gate:scale(L.gate),lane:scale(L.lane),jambs:L.jambs.map(scale),solids:L.solids.map(scale),outline:L.outline.map(scale),
    walls:L.walls.map(w=>({...w,a:scale(w.a),c:scale(w.c),cap:w.cap.map(scale),h:w.h*2})),
    targets:L.targets.map(t=>scale({...t,y:t.y-24})),stations:L.stations.map(s=>({...s,area:scale(s.area),base:s.base&&scale(s.base)}))};
  world.walkable=(x,y)=>L.fits(x/2,y/2,world.radius/2)&&world.solids.every(r=>Math.hypot(x-Math.max(r.x,Math.min(x,r.x+r.w)),y-Math.max(r.y,Math.min(y,r.y+r.h)))>=world.radius);
  window.DD_HUB_LAYOUT = world;
  window.DD_HUB_LIVE = () => {
    const B=L.bounds, relief=previewRelief(L), stations=new Map(L.stations.map(s=>[s.id,s])), images={}, patterns={};
    let view;
    function render(g,W,H,s,session,drawPlayer) {
      if(!view) for(const [id,src] of Object.entries({...ART,crack:'environments/threshold_descent_crack'})) {
        const im=new Image(); im.onload=()=>images[id]=im; im.src='assets/'+src+'.png';
      }
      const z=Math.min(W/(B.w+100),(H-60)/(B.h+155)),cx=B.x+B.w/2,cy=B.y+B.h/2-32;
      const ox=W/2-cx*z,oy=H/2-cy*z;
      view={canvas:g.canvas,W,H,z,ox,oy};
      g.save();g.fillStyle='#100e18';g.fillRect(0,0,W,H);g.translate(ox,oy);g.scale(z,z);
      paintVestibule({g,L,B,relief,stations,images,patterns,material:true,player:{x:s.px/2,y:s.py/2},k:2,all:true,W,z,$:()=>({checked:false}),cx,cy,t:0,drawPlayer:()=>{
        g.scale(.5,.5);drawPlayer();g.beginPath();g.moveTo(s.px,s.py);g.lineTo(s.px+32*Math.cos(s.aimAngle),s.py+32*Math.sin(s.aimAngle));g.strokeStyle='#91e4df';g.stroke();
      }});
      g.scale(.5,.5);if(session?.shot){g.fillStyle='#fff0a5';g.fillRect(session.shot.x-4,session.shot.y-4,8,8);}
      if(session?.flash){const t=session.flash.target;g.strokeStyle='white';g.strokeRect(t.x-8,t.y-16,16,32);}
      g.restore();g.save();g.textAlign='center';g.fillStyle='#ece6dc';g.font='bold 15px monospace';g.fillText(session?`ENSAYO · ${session.hits} impactos · Clic/RT: lanzar · Espacio/B: dash`:s.nearStation?'E / A · '+s.nearStation.label:'VESTÍBULO DEL INFIERNO',W/2,H-14,W-12);g.restore();return true;
    }
    function pointer(e){if(!view||e.target!==view.canvas)return null;const {W,H,z,ox,oy,canvas}=view,r=canvas.getBoundingClientRect();return {x:((e.clientX-r.left)*W/r.width-ox)*2/z,y:((e.clientY-r.top)*H/r.height-oy)*2/z};}
    return {render,pointer};
  };
})();
