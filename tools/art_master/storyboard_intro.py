# Storyboard y prueba de estilo de la intro en cómic animado (maquetas fijas, no la animación).
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageOps
import random, math
R='/home/user/DEADBEAT-DISCOnew/'; OP=R+'assets/cinematics/restart/opening/'; CM=R+'assets/cinematics/restart/character_master/'
NEW='/home/user/dd_work/raw/R07_COMIC/'; OUT=R+'docs/RESTART/storyboard_intro/'
W,H=1920,1080
INK=(7,3,13); MAG=(255,45,122); CY=(34,211,238); YE=(250,204,21); BONE=(244,236,216); VIO=(124,58,237)
F=lambda n,s: ImageFont.truetype('/tmp/fnt/'+n,s)
CAP=lambda s: F('barlow-condensed-latin-700-italic.ttf',s); SFX=lambda s: F('bangers-latin-400-normal.ttf',s); MRK=lambda s: F('permanent-marker-latin-400-normal.ttf',s); TXT=lambda s: F('barlow-condensed-latin-400-normal.ttf',s)
def load(p,box=None):
    im=Image.open(p).convert('RGB')
    if box: im=im.crop(tuple(int(v*(im.width if i%2==0 else im.height)) for i,v in enumerate(box)))
    return im
def cover(im,w,h,fx=.5,fy=.5,zoom=1.0):
    s=max(w/im.width,h/im.height)*zoom; im=im.resize((int(im.width*s)+1,int(im.height*s)+1),Image.LANCZOS)
    x=int((im.width-w)*fx); y=int((im.height-h)*fy); return im.crop((x,y,x+w,y+h))
def halftone(w,h,step=7,a=38):
    t=Image.new('L',(w,h),0); d=ImageDraw.Draw(t)
    for y in range(0,h,step):
        for x in range((y//step%2)*step//2,w,step): d.ellipse((x,y,x+2,y+2),fill=a)
    return t
HT=halftone(W,H)
def panel(base,im,x,y,w,h,rot=0,border=12,fx=.5,fy=.5,zoom=1.0,shadow=True):
    p=cover(im,w,h,fx,fy,zoom); p.paste(INK,(0,0),HT.crop((0,0,w,h)))
    p=ImageOps.expand(p,border,INK); p=ImageOps.expand(p,3,BONE).convert('RGBA')
    if rot: p=p.rotate(rot,expand=True,resample=Image.BICUBIC)
    if shadow:
        sh=Image.new('RGBA',p.size,(0,0,0,0)); sh.paste((0,0,0,190),(0,0),p.split()[3]); base.alpha_composite(sh,(max(0,x+14),max(0,y+16)))
    base.alpha_composite(p,(max(0,x),max(0,y)))
def caption(base,text,x,y,size=44,bg=YE,fg=INK,rot=-2,pad=16):
    f=CAP(size); d=ImageDraw.Draw(base); l,t,r,b=d.multiline_textbbox((0,0),text,font=f,spacing=4)
    c=Image.new('RGBA',(r-l+pad*2+8,b-t+pad*2+8),(0,0,0,0)); cd=ImageDraw.Draw(c)
    cd.rectangle((6,6,c.width-1,c.height-1),fill=INK); cd.rectangle((0,0,c.width-7,c.height-7),fill=bg,outline=INK,width=4)
    cd.multiline_text((pad-l,pad-t),text,font=f,fill=fg,spacing=4)
    c=c.rotate(rot,expand=True,resample=Image.BICUBIC); base.alpha_composite(c,(x,y))
def sfx(base,text,x,y,size=150,fill=YE,rot=-8,stroke=10):
    f=SFX(size); d=ImageDraw.Draw(base); l,t,r,b=d.textbbox((0,0),text,font=f,stroke_width=stroke)
    c=Image.new('RGBA',(r-l+30,b-t+30),(0,0,0,0)); cd=ImageDraw.Draw(c)
    cd.text((22-l,22-t),text,font=f,fill=INK,stroke_width=stroke,stroke_fill=INK); cd.text((14-l,14-t),text,font=f,fill=fill,stroke_width=stroke,stroke_fill=INK)
    c=c.rotate(rot,expand=True,resample=Image.BICUBIC); base.alpha_composite(c,(x,y))
def splat(base,x,y,r,col,seed=1,n=26):
    rnd=random.Random(seed); d=ImageDraw.Draw(base); d.ellipse((x-r,y-r*.8,x+r,y+r*.8),fill=col)
    for i in range(n):
        a=rnd.uniform(0,6.28); q=rnd.uniform(.7,2.4)*r; s=rnd.uniform(.05,.3)*r; px,py=x+math.cos(a)*q,y+math.sin(a)*q*.8
        d.ellipse((px-s,py-s,px+s,py+s),fill=col)
        if rnd.random()<.4: d.line((x,y,px,py),fill=col,width=max(2,int(s*.6)))
def crack(base,pts,w=10):
    d=ImageDraw.Draw(base); d.line(pts,fill=INK,width=w+8,joint='curve'); d.line(pts,fill=BONE,width=w,joint='curve')
def speed(base,cx,cy,n=70,seed=3,col=INK+(170,)):
    rnd=random.Random(seed); o=Image.new('RGBA',base.size,(0,0,0,0)); d=ImageDraw.Draw(o)
    for i in range(n):
        a=rnd.uniform(0,6.28); r0=rnd.uniform(520,820); r1=1400; wd=rnd.uniform(.004,.02)
        d.polygon([(cx+math.cos(a)*r0,cy+math.sin(a)*r0),(cx+math.cos(a-wd)*r1,cy+math.sin(a-wd)*r1),(cx+math.cos(a+wd)*r1,cy+math.sin(a+wd)*r1)],fill=col)
    base.alpha_composite(o)
def full(im,fx=.5,fy=.5,zoom=1.0,dark=0):
    b=cover(im,W,H,fx,fy,zoom); b.paste(INK,(0,0),HT)
    if dark: b=Image.blend(b,Image.new('RGB',(W,H),INK),dark)
    return b.convert('RGBA')
def finish(base,n,title,t,notes,test=False):
    g=Image.effect_noise((W,H),22).convert('L'); base=Image.blend(base.convert('RGB'),Image.merge('RGB',(g,g,g)),.05)
    if test: base.save(OUT+'prueba_estilo_plano_%02d.jpg'%n,quality=92)
    S=Image.new('RGB',(W,H+230),(24,20,30)); S.paste(base,(0,0)); d=ImageDraw.Draw(S)
    d.text((30,H+14),'PLANO %02d · %s'%(n,title),font=CAP(52),fill=YE); d.text((W-30,H+22),t,font=CAP(44),fill=CY,anchor='ra')
    y=H+82
    for k,v in notes:
        d.text((30,y),k,font=CAP(30),fill=MAG); d.text((230,y),v,font=TXT(30),fill=BONE); y+=36
    S.save(OUT+'storyboard_plano_%02d.jpg'%n,quality=88); return S

boards=[]
# 01 EL MUNDO
b=Image.new('RGBA',(W,H),INK+(255,)); im=load(NEW+'mc_01_world.png',(0.02,0.04,0.76,0.96))
panel(b,im,90,170,1740,640,rot=-1,fy=.45); splat(b,150,890,60,MAG,2); splat(b,1790,160,46,CY,5)
caption(b,'LA GUERRA HABÍA TERMINADO.',130,110,56); caption(b,'ESA NOCHE, POR FIN,\nNADIE ESPERABA MORIR.',1210,800,46,bg=BONE,rot=1)
boards.append(finish(b,1,'EL MUNDO','0–4 s',[('IMAGEN','Viñeta panorámica sobre negro: la ciudad a oscuras y la única luz, la estación. La viñeta crece hasta llenar la pantalla.'),('MOVIMIENTO','Tres capas (tejados, estación, cielo) con paralaje lento hacia la puerta. Los rótulos entran a golpe de compás.'),('SONIDO','Viento y una orquesta lejana, filtrada, que sale del edificio. Bombo a los 2 s: aparece el primer rótulo.'),('FUENTE','Biblia §2.1. La ciudad exterior no está descrita en la biblia: es una deducción mínima (pendiente de tu visto bueno).')]))
# 02 LA ESTACIÓN
b=full(load(OP+'op_03_dancefloor.jpg'),fy=.4,zoom=1.06)
panel(b,load(OP+'op_03_dancefloor.jpg',(0.36,0.02,0.66,0.42)),1180,70,640,360,rot=3,border=10)
panel(b,load(NEW+'mc_01_world.png',(0.3,0.06,0.62,0.5)),1300,400,520,330,rot=-4,border=10)
panel(b,load(OP+'op_04c_vespera.jpg'),70,640,470,360,rot=-3,border=10,fy=.2)
caption(b,'UNA VIEJA ESTACIÓN DE TREN.\nCRISTAL, HIERRO… Y UN BAILE.',80,70,50); caption(b,'POR UNAS HORAS, TODOS\nIMAGINARON UN MAÑANA.',1250,880,46,bg=BONE,rot=2)
boards.append(finish(b,2,'LA ESTACIÓN','4–9 s',[('IMAGEN','La cámara cruza la puerta del plano 1: página completa del salón. Encima caen tres viñetas de detalle: bóveda de cristal, reloj, invitados.'),('MOVIMIENTO','Empuje continuo hacia la bola de espejos. Cada viñeta entra deslizándose y girada, una por compás, con su sombra.'),('SONIDO','La orquesta se abre al cruzar la puerta (se quita el filtro). Un golpe de caja por viñeta.'),('FUENTE','Biblia §2.1: estación reconvertida en sala de baile, techos de cristal, columnas de hierro. Reutiliza la lámina aprobada de la pista.')]))
# 03 LAS NUEVE PISTAS
b=Image.new('RGBA',(W,H),INK+(255,)); nine=load(NEW+'mc_03_nine.png',(0.1,0.0,0.9,1.0))
panel(b,nine,720,-30,560,1140,rot=0,border=12,fy=0)
tw=load(OP+'op_02_tower.jpg')
for i,(x,y,r,box) in enumerate([(110,90,-4,(0.3,0.1,0.7,0.34)),(150,420,3,(0.3,0.34,0.7,0.56)),(90,740,-2,(0.3,0.56,0.7,0.8)),(1370,120,4,(0.32,0.3,0.68,0.5)),(1400,450,-3,(0.3,0.5,0.7,0.74)),(1350,770,2,(0.3,0.7,0.7,0.95))]):
    panel(b,tw.crop(tuple(int(v*(tw.width if k%2==0 else tw.height)) for k,v in enumerate(box))),x,y,440,250,rot=r,border=9)
d=ImageDraw.Draw(b)
for (x0,y0),(x1,y1) in [((560,230),(760,300)),((600,560),(760,520)),((540,880),(760,760)),((1370,250),(1240,380)),((1400,590),(1240,640)),((1350,900),(1240,900))]: d.line((x0,y0,x1,y1),fill=YE,width=6)
caption(b,'PERO LA NOCHE NO TERMINÓ.',560,40,54,rot=-2); caption(b,'EL SALÓN CRECIÓ HACIA ABAJO.',1010,470,44,bg=BONE,rot=2); caption(b,'NUEVE PISTAS.\nUNA DEBAJO DE OTRA.',640,900,52,bg=MAG,fg=BONE,rot=-1)
boards.append(finish(b,3,'LAS NUEVE PISTAS','9–14 s',[('IMAGEN','Corte ilustrado del edificio: arriba la estación; debajo, nueve plantas hundidas y un pozo central. Viñetas de detalle unidas al plano con trazos.'),('MOVIMIENTO','Travelling vertical hacia abajo por el corte, como una aguja siguiendo el surco. Las viñetas se encienden de arriba abajo, una por pulso.'),('SONIDO','La misma melodía baja un tono en cada planta. Un bajo grave crece.'),('FUENTE','Biblia §2.3 y §5.1. Sin nombres de pista: los de la biblia son propuestas no aprobadas. La lámina definitiva debe mostrar NUEVE plantas y ningún rótulo.')]))
# 04 ALGO NO FUNCIONA (prueba de estilo)
b=full(load(NEW+'mc_04_doors.png'),fy=.3,zoom=1.02,dark=.12)
panel(b,load(OP+'op_01_vinyl.jpg'),60,560,620,440,rot=-5,border=12,fx=.7)
panel(b,load(OP+'op_04b_smiles.jpg'),1200,80,650,400,rot=4,border=12,fy=.25)
panel(b,load(OP+'op_04a_tempo_hand.jpg'),1290,560,540,400,rot=-3,border=12)
crack(b,[(1010,-10),(960,170),(1040,330),(930,520),(1000,700),(900,880),(960,1090)],9)
crack(b,[(930,520),(760,560),(640,520)],6); crack(b,[(1000,700),(1160,740),(1290,700)],6)
splat(b,700,1010,70,MAG,9); splat(b,1180,520,50,YE,4,18)
sfx(b,'CLAC',380,470,170,YE,-10); sfx(b,'TUM-TUM',1380,430,120,MAG,6)
caption(b,'LAS PUERTAS YA NO LLEVAN FUERA.',70,60,52); caption(b,'LA ÚLTIMA CANCIÓN VUELVE\nANTES DE TERMINAR.',640,330,44,bg=BONE,rot=2); caption(b,'TODOS BAILAN.\nNADIE RECUERDA DESDE CUÁNDO.',700,890,46,bg=MAG,fg=BONE,rot=-2)
boards.append(finish(b,4,'ALGO NO FUNCIONA','14–19 s',[('IMAGEN','Página completa: la puerta de salida da otra vez a la misma pista. La página se RAJA y tres viñetas saltan: la aguja que vuelve, las sonrisas, la mano del DJ.'),('MOVIMIENTO','Zoom brusco a la puerta; temblor en cada golpe; la grieta avanza a tirones; las viñetas entran torcidas. Colores en contraste duro.'),('SONIDO','El compás se repite a los 17 s (salto de aguja, «CLAC»). La música sube y se ensucia. La onomatopeya entra con el golpe.'),('FUENTE','Biblia §2.3 (las puertas dejan de llevar al exterior), §3.1 (la última nota regresa; el DJ enlaza otra canción), §3.2 (los bailarines olvidan).')],test=True))
tst=b
# 05 EL PROTAGONISTA
b=full(load(OP+'op_05a_boots.jpg'),fy=.6,dark=.45)
hero=load(CM+'protagonist_master_crop_hero.png',(0.2,0.12,1.0,0.92))
panel(b,hero,900,-20,960,1120,rot=0,border=14,fx=.5,fy=.3)
panel(b,load(OP+'op_05a_boots.jpg'),60,90,760,420,rot=-3,border=12,fx=.6)
panel(b,load(CM+'protagonist_master_crop_arm_tattoos.png'),150,560,330,430,rot=4,border=10)
panel(b,load(OP+'op_06_face.jpg',(0.3,0.12,0.75,0.62)),520,600,420,330,rot=-4,border=10)
splat(b,640,470,60,YE,7); sfx(b,'TAC',600,330,140,YE,-12)
caption(b,'UNO NO SIGUE EL COMPÁS.',70,40,54); caption(b,'A ÉL, LA TORRE LE DUELE.',1040,930,56,bg=MAG,fg=BONE,rot=-2)
boards.append(finish(b,5,'EL PROTAGONISTA','19–24 s',[('IMAGEN','Las botas pisan tarde (viñeta). Entra a toda página la ilustración de la LÁMINA MAESTRA, sin redibujar. Detalles: brazo tatuado y mirada.'),('MOVIMIENTO','La música se corta al pisar. La lámina entra de un tirón desde la derecha y respira (zoom lento). Mancha amarilla bajo la bota.'),('SONIDO','«TAC» seco fuera de compás; silencio de un pulso; después un zumbido disonante sostenido (el dolor de la torre).'),('FUENTE','Biblia §4.1 (un paso fuera de tiempo), §4.3 (la torre le duele). No se cuenta de dónde sale ni quién es.')]))
# 06 EL DESCENSO
b=full(load(NEW+'mc_06_fall.png'),zoom=1.04); speed(b,1180,640)
panel(b,load(OP+'op_05b_back.jpg',(0.2,0.45,0.8,1.0)),50,640,560,330,rot=-5,border=12)
crack(b,[(600,760),(740,700),(700,600),(840,540)],8)
sfx(b,'CRRRAC',70,500,150,YE,-6); sfx(b,'FSSSSH',1250,860,130,CY,8)
caption(b,'Y EL SUELO SE ABRE.',60,60,56,rot=-2)
boards.append(finish(b,6,'EL DESCENSO','24–29 s',[('IMAGEN','Viñeta: el suelo se agrieta bajo sus botas. La viñeta se rompe y da paso al picado del pozo: plataforma, cadenas, plantas que pasan. EL SOMBRERO SE DESPRENDE.'),('MOVIMIENTO','Cámara cayendo con él; líneas de velocidad; las plantas pasan como viñetas circulares. El sombrero sube hacia el espectador hasta tapar el encuadre.'),('SONIDO','Golpe grave desde abajo, cadenas, aire. La música vuelve, más grave en cada planta. El sombrero tapa la imagen en un golpe de caja.'),('FUENTE','Biblia §5.3 (grietas, mecanismo circular, pozo, plataforma, balcones de otras pistas). No se dice quién abrió el suelo. Sombrero: decisión del autor.')]))
# 07 EL COMIENZO
b=full(load(NEW+'mc_07_hat.png',(0.02,0.03,0.98,0.97)),fx=1)
logo=Image.open(R+'assets/logos/logo_deadbeat_graffiti.png').convert('RGBA'); logo=logo.resize((560,int(560*logo.height/logo.width)),Image.LANCZOS); b.alpha_composite(logo,(40,40))
d=ImageDraw.Draw(b); d.text((70,430),'LA NOCHE QUE DEVORÓ EL AMANECER',font=CAP(40),fill=BONE)
for i,(t,sel) in enumerate([('NUEVA PARTIDA',1),('OPCIONES',0),('CRÉDITOS',0),('SALIR',0)]):
    y=520+i*78
    if sel: d.polygon([(52,y-4),(470,y-10),(478,y+62),(46,y+66)],fill=YE)
    d.text((70,y),t,font=CAP(58),fill=INK if sel else BONE)
boards.append(finish(b,7,'EL COMIENZO','29–32 s',[('IMAGEN','El sombrero cae y se queda en el borde del agujero. Abajo, el pozo. El logotipo oficial se estampa en la zona oscura y el encuadre YA ES el menú.'),('MOVIMIENTO','El sombrero aterriza y gira hasta pararse. Estampado del logotipo con mancha de tinta. Las opciones del menú aparecen sin corte.'),('SONIDO','Golpe de título; arranca el tema del menú. El sonido de la intro se apaga aquí.'),('FUENTE','No entra en partida: el descenso queda en suspenso. NUEVA PARTIDA lo retoma y termina en el Refugio (biblia §5.3).')]))
tst_final=None
# hoja resumen
T=Image.new('RGB',(4*960,2*655),(24,20,30))
for i,s in enumerate(boards): T.paste(s.resize((960,655),Image.LANCZOS),((i%4)*960,(i//4)*655))
d=ImageDraw.Draw(T); d.text((3*960+50,655+60),'DEADBEAT DISCO\nINTRO · CÓMIC ANIMADO\nSTORYBOARD v1\n\n7 planos · 32 s\nMaquetas fijas para validar:\nno es la animación final.',font=CAP(54),fill=BONE,spacing=10)
T.save(OUT+'storyboard_hoja_completa.jpg',quality=86)
