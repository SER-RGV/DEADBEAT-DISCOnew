# Fase 07B: composición determinista del fotograma corregido v2.
# base (fid v1) + brazo limpio y cadenas (gen_k, pegado con máscara) + tinta de los paneles HOMBRO y ANTEBRAZO (LOBO) de la lámina.
import sys, json
from PIL import Image, ImageFilter, ImageDraw
import numpy as np, cv2
from scipy import ndimage as ni
R='/home/user/DEADBEAT-DISCOnew/assets/cinematics/restart/character_master/'
W0='/home/user/dd_work/raw/R05_PROTAGONISTA_MAESTRO/'
P=json.loads(sys.argv[1]) if len(sys.argv)>1 else {}
raw=Image.open(W0+'pm_idle_fid_00_v1.png').convert('RGB'); box=(280,150,620,800)
o=np.asarray(raw.crop(box)).astype(np.float32)
k=np.asarray(Image.open('/tmp/f8/k_aligned.png').convert('RGB')).astype(np.float32)
d=np.abs(k-o).max(axis=2)
def region(x0,y0,x1,y1):
    m=np.zeros(d.shape,bool); m[y0-150:y1-150,x0-280:x1-280]=True; return m
# 1) brazo limpio: del hombro a la muñequera
arm=ni.binary_fill_holes(ni.binary_closing(ni.binary_dilation((d>22)&region(340,285,490,625),iterations=3),iterations=5))&region(340,285,490,625)
# solo piel del brazo (más su contorno): el chaleco no se toca
sk=lambda x:(x[...,0]>150)&(x[...,0]>x[...,1]+15)&(x[...,1]>x[...,2])&(x[...,2]>60)
piel=ni.binary_dilation(ni.binary_opening(sk(o)|sk(k),iterations=2),iterations=3)
arm=ni.binary_fill_holes(ni.binary_closing(ni.binary_opening(sk(k)|sk(o),iterations=2),iterations=3))&region(340,285,490,625)   # toda la piel del brazo, no solo donde difiere
arm=arm|(ni.binary_dilation(arm,iterations=7)&(d>22)&region(340,285,490,625))   # restos de tinta de la v1 en el borde del brazo
lab,n=ni.label(arm); arm=np.isin(lab,[i for i in range(1,n+1) if (lab==i).sum()>1500])   # brazo y antebrazo: se descartan islas sueltas
# 2) cadenas: pecho, sin la placa
tag=region(522,424,548,474)
ch=ni.binary_dilation((d>30)&region(486,300,548,440)&~tag,iterations=2)&region(486,300,548,440)&~tag
m=(arm|ch).astype(np.float32)
m=cv2.GaussianBlur(m,(0,0),1.0); m[tag]=0
base=o*(1-m[...,None])+k*m[...,None]
# piel del brazo (para limitar la tinta): tono piel dentro de la zona del brazo
r,g,b=base[...,0],base[...,1],base[...,2]
skin=(r>150)&(r>g+15)&(g>b)&(b>60)&region(340,285,490,625)
skin=ni.binary_opening(ni.binary_closing(skin,iterations=3),iterations=1)
skin=ni.binary_fill_holes(skin)
skin_soft=cv2.GaussianBlur(ni.binary_erosion(skin,iterations=1).astype(np.float32),(0,0),0.8)
td=np.asarray(Image.open(R+'protagonist_master_crop_tattoo_details.png').convert('RGB')).astype(np.float32)
def ink_layer(poly, lo, hi, fade=None, grey=0.0):
    L=td[...,0]*0.35+td[...,1]*0.45+td[...,2]*0.20          # la piel naranja queda clara; el magenta y el negro, oscuros
    a=np.clip((hi-L)/(hi-lo),0,1)
    if grey:   # pelaje gris del lobo: poco saturado frente a la piel naranja
        rb=td[...,0]-td[...,2]; a=np.maximum(a,grey*np.clip((95-rb)/50,0,1)*(L<165))
    pm=Image.new('L',(td.shape[1],td.shape[0]),0); ImageDraw.Draw(pm).polygon(poly,fill=255)
    pm=np.asarray(pm.filter(ImageFilter.GaussianBlur(2)))/255.0
    if fade: pm=pm*np.clip((fade[1]-np.arange(td.shape[0]))/(fade[1]-fade[0]),0,1)[:,None]
    return a*pm
def place(a, p0, O, s, ang, thick):
    # raw = O + s*Rot(ang)*(p-p0), en coordenadas del recorte
    c,sn=np.cos(np.radians(ang)),np.sin(np.radians(ang))
    M=np.array([[s*c,-s*sn,0],[s*sn,s*c,0]],np.float32)
    M[:,2]=np.array(O)-np.array([280,150])-M[:,:2]@np.array(p0)
    w=cv2.warpAffine(a.astype(np.float32),M,(340,650),flags=cv2.INTER_AREA if s<1 else cv2.INTER_LINEAR)
    if thick>0:
        dil=cv2.dilate(w,cv2.getStructuringElement(cv2.MORPH_ELLIPSE,(3,3)))
        w=w*(1-thick)+dil*thick
    return np.clip(w,0,1)
sh=P.get('sh',{}); wo=P.get('wo',{})
poly_sh=[(190,312),(188,200),(192,125),(206,84),(232,56),(268,42),(306,56),(330,84),(342,116),(344,200),(338,312)]
poly_wo=[(396,312),(396,282),(401,250),(403,200),(407,150),(412,100),(418,44),(450,38),(478,62),(493,100),(498,150),(495,200),(488,250),(480,290),(474,312)]
a1=place(ink_layer(poly_sh,sh.get('lo',55),sh.get('hi',105),sh.get('fade',(262,306))),(266,38),sh.get('O',(407,297)),sh.get('s',0.62),sh.get('ang',0),sh.get('thick',0.5))
a2=place(ink_layer(poly_wo,wo.get('lo',40),wo.get('hi',135),None,wo.get('grey',0.6)),(450,38),wo.get('O',(409,482)),wo.get('s',0.49),wo.get('ang',-28),wo.get('thick',0.15))
# líneas de músculo del brazo limpio que cruzarían el lobo: se rellenan con piel antes de entintar
foot=cv2.dilate((a2>0.03).astype(np.uint8),np.ones((9,9),np.uint8))>0
Lb=base[...,0]*0.3+base[...,1]*0.59+base[...,2]*0.11
med=cv2.medianBlur(np.clip(Lb,0,255).astype(np.uint8),21).astype(np.float32)
lines=cv2.dilate(((Lb<med-22)&foot&ni.binary_erosion(skin,iterations=4)).astype(np.uint8),np.ones((3,3),np.uint8))
base=cv2.inpaint(np.clip(base,0,255).astype(np.uint8)[...,::-1].copy(),lines,4,cv2.INPAINT_TELEA)[...,::-1].astype(np.float32)
m=np.maximum(m,lines.astype(np.float32))
a=np.clip(np.maximum(a1,a2),0,1)*skin_soft
ink=np.array([24,20,30],np.float32)
res=base*(1-a[...,None]*0.93)+ink*a[...,None]*0.93
# guardia final: fuera del brazo y de las cadenas no cambia nada
permit=ni.binary_dilation(arm,iterations=3)|ni.binary_dilation(ch,iterations=2)
permit&=~region(330,560,392,650)   # bajo del chaleco y cinta del pantalón, junto al codo: intactos
res[~permit]=o[~permit]
# silueta intacta: el fondo original sigue siendo fondo y nada de la figura original pasa a fondo
isbg=lambda x:(x[...,1]>150)&(x[...,0]<140)&(x[...,2]<140)&(x[...,1]>x[...,0]+40)
keep=ni.binary_dilation(isbg(o),iterations=2)|isbg(res)
res[keep]=o[keep]
np.save('/tmp/f8/mask_total.npy',np.maximum(m,a)*(~keep))
out=raw.copy(); out.paste(Image.fromarray(np.clip(res,0,255).astype('uint8')),box[:2])
out.save(W0+'_gen/gen_l_1f_fidelidad2.png')
c=out.crop((330,250,570,650)); c.resize((720,1200),Image.LANCZOS).save('/tmp/f8/l_view.png')
