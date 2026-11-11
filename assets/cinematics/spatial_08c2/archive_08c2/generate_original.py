#!/usr/bin/env python3
"""Dibuja planta/alzados y proyecciones de una sola geometría, sin tocar assets de juego."""
import json, math
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
BASE = Path(__file__).resolve().parent
M = json.loads((BASE / 'plan.json').read_text())
C = {'grid':'#34465a','base':'#bdc7d9','stage':'#e9ad66','floor':'#d1b073','reserve':'#ed73b9','speaker':'#56dbe5','gallery':'#b799e3','column':'#919fb3','audience':'#f6da9a','light':'#ec72bd','camera':'#ef9ed9','axis':'#ffb6ce'}
def svg_open(w,h,title):
 return [f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" role="img" aria-label="{title}">',f'<title>{title}</title>',f'<rect width="{w}" height="{h}" fill="#111824"/>']
def line2(a,b,color,width=2,dash=''):
 attr = ' stroke-dasharray="'+dash+'"' if dash else ''
 return f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="{color}" stroke-width="{width}"{attr}/>'
def txt(x,y,text,size=15,color='#e6ecf3'):
 return f'<text x="{x}" y="{y}" font-family="sans-serif" font-size="{size}" fill="{color}">{text}</text>'
def rect2(x,y,w,h,stroke,fill='none',dash=''):
 attr = ' stroke-dasharray="'+dash+'"' if dash else ''
 return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{fill}" stroke="{stroke}" stroke-width="2"{attr}/>'
def plan():
 s=svg_open(1200,880,'Planta espacial proporcional: nave y cámaras')
 def p(x,y): return (105+7*x,790-7*y)
 def area(x,y,color,fill='none',dash=''):
  a=p(x[0],y[1]);return rect2(a[0],a[1],(x[1]-x[0])*7,(y[1]-y[0])*7,color,fill,dash)
 for i in range(0,101,10):
  s.append(line2(p(i,0),p(i,100),C['grid'],1));s.append(line2(p(0,i),p(100,i),C['grid'],1))
  s.append(txt(p(i,0)[0]-5,810,str(i),12));s.append(txt(70,p(0,i)[1]+4,str(i),12))
 hall=M['hall'];s.append(area(hall['x'],hall['y'],C['base']))
 for b in M['balconies']+[M['rear_gallery']]:s.append(area(b['x'],b['y'],C['gallery'],'#302944'))
 floor=M['dancefloor'];s.append(area(floor['x'],floor['y'],C['floor']))
 center=p(*floor['circle_center']);s.append(f'<circle cx="{center[0]}" cy="{center[1]}" r="{floor["circle_radius"]*7}" fill="none" stroke="{C["floor"]}" stroke-width="2"/>')
 res=M['future_descent_reserve'];s.append(area(res['x'],res['y'],C['reserve'],'none','5 5'))
 st=M['stage'];s.append(area(st['x'],st['y'],C['stage'],'#32291e'))
 stairs=M['stairs'];s.append(area(stairs['x'],stairs['y'],C['stage']))
 for i in range(1,stairs['count']):s.append(line2(p(stairs['x'][0],stairs['y'][0]+i*2),p(stairs['x'][1],stairs['y'][0]+i*2),C['stage'],1))
 for stack in M['speaker_stacks']:s.append(area(stack['x'],stack['y'],C['speaker'],'#1c3b44'))
 booth=M['dj_booth'];s.append(area(booth['x'],booth['y'],C['stage'],'#80663a'))
 for x in M['columns']['x']:
  for y in M['columns']['y']:
   q=p(x,y);s.append(f'<circle cx="{q[0]}" cy="{q[1]}" r="9" fill="{C["column"]}"/>')
 for x,y in M['audience']['positions']:
  q=p(x,y);s.append(f'<circle cx="{q[0]}" cy="{q[1]}" r="4" fill="{C["audience"]}"/>')
 s.append(line2(p(50,5),p(50,95),C['axis'],1,'7 6'))
 for cam in M['cameras']:
  q=p(*cam['position'][:2]);s.append(f'<circle cx="{q[0]}" cy="{q[1]}" r="6" fill="{C["camera"]}"/>');s.append(txt(q[0]+10,q[1]+5,cam['id'],13))
 for light in M['lights']:s.append(line2(p(*light['origin'][:2]),p(*light['target'][:2]),C['light'] if light['color']=='magenta' else C['speaker'],2,'5 6'))
 s += [txt(35,35,'PLANTA · unidades proporcionales 0–100',23),txt(840,130,'LEYENDA',19),txt(840,170,'Oro: escenario / escalera / cabina'),txt(840,200,'Cian: altavoces y luz'),txt(840,230,'Violeta: balcones'),txt(840,260,'Gris: columnas'),txt(840,290,'Puntos amarillos: público fijo'),txt(840,320,'Círculo: motivo fijo del suelo'),txt(840,350,'Rosa punteado: reserva futura'),txt(840,380,'Puntos rosas: cámaras'),txt(840,430,'Eje X: izquierda → derecha'),txt(840,460,'Eje Y: acceso → escenario'),txt(840,505,'No es plano físico ni escala del juego',14),'</svg>']
 (BASE/'planta.svg').write_text('\n'.join(s))
def elevations():
 s=svg_open(1200,760,'Alzados transversal y longitudinal de la nave')
 # rear view looking toward stage, x horizontal z upward
 def front(x,z):return (80+5*x,350-5*z)
 s += [txt(40,35,'ALZADO TRANSVERSAL · hacia el escenario',21)]
 for x in [10,20,80,90]:s.append(line2(front(x,0),front(x,38),C['base']))
 # common vault section
 points=[(20,38),(26,46),(34,53),(42,58),(50,60),(58,58),(66,53),(74,46),(80,38)]
 for a,b in zip(points,points[1:]):s.append(line2(front(*a),front(*b),C['base']))
 for x in [(12,20),(80,88)]:s.append(line2(front(x[0],22),front(x[1],22),C['gallery'],4))
 s.append(line2(front(10,0),front(90,0),C['base']))
 s.append(rect2(*front(26,5),48*5,5*5,C['stage'],'#32291e'))
 s.append(rect2(*front(45,10),10*5,5*5,C['stage'],'#80663a'))
 for x0,x1 in [(28,33),(67,72)]:s.append(rect2(*front(x0,21),(x1-x0)*5,16*5,C['speaker'],'#1c3b44'))
 s += [txt(640,110,'Cúspide bóveda z=60'),txt(640,145,'Arranque bóveda z=38'),txt(640,180,'Balcones z=22'),txt(640,215,'Altavoces z=5..21'),txt(640,250,'Cabina Tempo z=5..10'),txt(640,285,'Escenario z=5 · suelo z=0')]
 # side elevation y across, z up
 def side(y,z):return (80+5*y,700-4*z)
 s += [txt(40,420,'ALZADO LONGITUDINAL · entrada → escenario',21)]
 s.append(line2(side(5,0),side(95,0),C['base']));s.append(line2(side(12,22),side(86,22),C['gallery'],4))
 s.append(line2(side(5,60),side(95,60),C['base']))
 for y in M['columns']['y']:s.append(line2(side(y,0),side(y,38),C['column'],2))
 s.append(rect2(*side(76,5),15*5,5*4,C['stage'],'#32291e'))
 for i in range(5):
  y=66+i*2;z=i+1;s.append(line2(side(y,z),side(y+2,z),C['stage'],2));s.append(line2(side(y,z-1),side(y,z),C['stage'],2))
 for cam in M['cameras']:
  q=side(cam['position'][1],cam['position'][2]);s.append(f'<circle cx="{q[0]}" cy="{q[1]}" r="5" fill="{C["camera"]}"/>');s.append(txt(q[0]+6,q[1]-8,cam['id'],12))
 s += [txt(640,480,'Niveles proporcionales, no medidas físicas'),txt(640,515,'5 huellas / 5 contrahuellas desde y=66 a 76'),txt(640,550,'Escenario y=76..91'),txt(640,585,'Cámaras: posición y altura indicadas'),'</svg>']
 (BASE/'alzados.svg').write_text('\n'.join(s))
def sub(a,b):return tuple(x-y for x,y in zip(a,b))
def dot(a,b):return sum(x*y for x,y in zip(a,b))
def cross(a,b):return (a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
def norm(a):
 l=math.sqrt(dot(a,a));return tuple(x/l for x in a)
def geometry():
 lines=[]
 def add(a,b,c,w=1.5,dash=''):lines.append((a,b,c,w,dash))
 def poly(pts,c,w=1.5,dash=''):
  for a,b in zip(pts,pts[1:]+pts[:1]):add(a,b,c,w,dash)
 def box(x0,x1,y0,y1,z0,z1,c):
  a=[(x0,y0,z0),(x1,y0,z0),(x1,y1,z0),(x0,y1,z0)];b=[(x,y,z1) for x,y,_ in a];poly(a,c);poly(b,c)
  for p,q in zip(a,b):add(p,q,c)
 # floor plan and perspective floor grid, fixed ornament
 poly([(10,5,0),(90,5,0),(90,95,0),(10,95,0)],C['base'])
 poly([(22,20,0),(78,20,0),(78,70,0),(22,70,0)],C['floor'])
 for x in [30,40,50,60,70]:add((x,20,.03),(x,70,.03),C['grid'],1)
 for y in [30,40,50,60]:add((22,y,.03),(78,y,.03),C['grid'],1)
 for radius in [M['dancefloor']['circle_radius'], M['dancefloor']['circle_radius'] * 0.625]:
  cx,cy=M['dancefloor']['circle_center'];pts=[(cx+radius*math.cos(2*math.pi*i/72),cy+radius*math.sin(2*math.pi*i/72),.08) for i in range(72)];poly(pts,C['floor'],1.5)
 r=M['future_descent_reserve'];poly([(r['x'][0],r['y'][0],.1),(r['x'][1],r['y'][0],.1),(r['x'][1],r['y'][1],.1),(r['x'][0],r['y'][1],.1)],C['reserve'],1,'5 5')
 stage=M['stage'];box(*stage['x'],*stage['y'],0,stage['top_z'],C['stage'])
 stairs=M['stairs']
 for i in range(stairs['count']):
  y0,y1=stairs['y'];step=(y1-y0)/stairs['count'];box(*stairs['x'],y0+step*i,y0+step*(i+1),0,stairs['top_z']*(i+1)/stairs['count'],C['stage'])
 booth=M['dj_booth'];box(*booth['x'],*booth['y'],booth['base_z'],booth['top_z'],C['stage'])
 for a in M['speaker_stacks']:box(*a['x'],*a['y'],a['base_z'],a['top_z'],C['speaker'])
 for b in M['balconies']:
  box(*b['x'],*b['y'],21,22,C['gallery'])
  inner=b['x'][1] if b['id']=='L' else b['x'][0]
  add((inner,12,25),(inner,86,25),C['gallery'])
  for y in range(12,87,7):add((inner,y,22),(inner,y,25),C['gallery'],1)
 rear=M['rear_gallery'];box(*rear['x'],*rear['y'],21,22,C['gallery'])
 add((20,12,25),(80,12,25),C['gallery'])
 for x in range(20,81,6):add((x,12,22),(x,12,25),C['gallery'],1)
 for x in M['columns']['x']:
  for y in M['columns']['y']:box(x-1.3,x+1.3,y-1.3,y+1.3,0,38,C['column'])
 # same transverse rib at every column bay, pointed vault
 profile=[(20,38),(26,46),(34,53),(42,58),(50,60),(58,58),(66,53),(74,46),(80,38)]
 for y in M['columns']['y']:
  for (x,z),(x2,z2) in zip(profile,profile[1:]):add((x,y,z),(x2,y,z2),C['column'],2)
 add((50,16,60),(50,86,60),C['column'])
 # geometric feature behind DJ, same object projected in every view
 poly([(38,90,18),(50,90,31),(62,90,18),(50,90,13)],C['speaker'],2)
 for pos in M['ornament']['chandeliers']:
  x,y,z=pos;add((x,y,60),(x,y,z),C['stage']);poly([(x-3,y,z),(x,y-2,z-2),(x+3,y,z),(x,y+2,z-2)],C['stage'])
 for x,y in M['audience']['positions']:
  height=M['audience']['height'];add((x,y,0),(x,y,height),C['audience'],2);add((x-1,y,height*2/3),(x+1,y,height*2/3),C['audience'],1.5)
 for l in M['lights']:add(tuple(l['origin']),tuple(l['target']),C['light'] if l['color']=='magenta' else C['speaker'],1,'6 5')
 return lines

def project(cam,lines):
 W,H=960,540;pos=cam['position'];forward=norm(sub(cam['target'],pos));right=norm(cross(forward,(0,0,1)));up=cross(right,forward);f=(W/2)/math.tan(math.radians(cam['horizontal_fov_degrees'])/2)
 def camera(p):
  d=sub(p,pos);return (dot(d,right),dot(d,up),dot(d,forward))
 def screen(p):return (W/2+f*p[0]/p[2],H/2-f*p[1]/p[2])
 s=svg_open(W,H,cam['id']+' proyección del mismo modelo espacial');s.append('<defs><clipPath id="f"><rect width="960" height="540"/></clipPath></defs><g clip-path="url(#f)">')
 for a,b,col,w,dash in lines:
  a,b=camera(a),camera(b);near=.5
  if a[2]<near and b[2]<near:continue
  if a[2]<near or b[2]<near:
   if a[2]<near:
    t=(near-a[2])/(b[2]-a[2]);a=tuple(a[i]+t*(b[i]-a[i]) for i in range(3))
   else:
    t=(near-b[2])/(a[2]-b[2]);b=tuple(b[i]+t*(a[i]-b[i]) for i in range(3))
  s.append(line2(screen(a),screen(b),col,w,dash))
 s.append('</g>')
 if cam['id']=='BG06':
  guide=M['hero_composition_guide'];x,y,z=guide['anchor'];w=guide['width'];h=guide['height']
  a=screen(camera((x-w/2,y,z+h)));b=screen(camera((x+w/2,y,z)))
  s.append(rect2(a[0],a[1],b[0]-a[0],b[1]-a[1],C['reserve'],'none','5 5'))
  s.append(txt(a[0]+5,a[1]-8,'Reserva sprite (orientativa)',12,C['reserve']))
  l=M['logo_composition_guide']['screen_rectangle_normalized'];s.append(rect2(l[0]*W,l[1]*H,(l[2]-l[0])*W,(l[3]-l[1])*H,C['reserve'],'none','6 6'))
  s.append(txt(l[0]*W+5,l[1]*H+16,'Reserva logo (2D)',12,C['reserve']))
 s += [txt(16,27,cam['id']+' · modelo geométrico compartido',18),txt(16,525,'Esquema de producción · no representa arte final',12),'</svg>']
 (BASE/(cam['id'].lower()+'_proyeccion.svg')).write_text('\n'.join(s))
if __name__=='__main__':
 plan();elevations();g=geometry()
 for c in M['cameras']:project(c,g)
 print('Generados planta, alzados y 3 proyecciones desde plan.json; líneas:',len(g))
