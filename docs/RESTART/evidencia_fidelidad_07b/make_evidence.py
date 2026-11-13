# Genera las hojas de comparación y hashes_y_diferencias.json de la FASE 07B.
# Uso: python make_evidence.py   (requiere Pillow, numpy, opencv; rutas del entorno de trabajo)
from PIL import Image, ImageDraw, ImageFont
import numpy as np, cv2, os, json, hashlib, subprocess
R='/home/user/DEADBEAT-DISCOnew/'; E=R+'docs/RESTART/evidencia_fidelidad_07b/'; W0='/home/user/dd_work/raw/R05_PROTAGONISTA_MAESTRO/'
CM=R+'assets/cinematics/restart/character_master/'; F=R+'assets/characters/protagonist_master/'
f=ImageFont.truetype([os.path.join(dp,x) for dp,_,fs in os.walk('/tmp/fonts') for x in fs if x.endswith('.ttf')][0],20)
BG=(30,26,43); Y=(255,212,0); HU=(240,230,219)
act=Image.open(F+'pm_idle_00.png').convert('RGBA'); v1=Image.open(F+'fidelidad/versiones/pm_idle_fid_00_v1.png').convert('RGBA'); v2=Image.open(F+'fidelidad/pm_idle_fid_00.png').convert('RGBA')
ta=Image.open(CM+'protagonist_master_crop_turnaround.png').convert('RGBA'); td=Image.open(CM+'protagonist_master_crop_tattoo_details.png').convert('RGB')
fit=lambda im,h: im.resize((round(im.width*h/im.height),h),Image.LANCZOS)
def hoja(cols,name,extra=None,minw=300):
    H=max(c[2].height for c in cols); W=sum(max(c[2].width,minw) for c in cols)+40*(len(cols)+1)
    eh=(extra[1].height+70) if extra else 0
    o=Image.new('RGB',(W,H+110+eh),BG); d=ImageDraw.Draw(o); x=40
    for a,b,im in cols:
        d.text((x,16),a,fill=Y,font=f); d.text((x,42),b,fill=HU,font=f)
        o.paste(im,(x,80),im if im.mode=='RGBA' else None); x+=max(im.width,minw)+40
    if extra: d.text((40,H+110),extra[0],fill=Y,font=f); o.paste(extra[1],(40,H+145))
    o.save(E+name,quality=90); print(name,o.size)
B=(100,120,190,300); z=lambda im: im.crop(B).resize((450,900),Image.LANCZOS)
hoja([("1 · ACTUAL","pm_idle_00",fit(act,900)),("2 · CORRECCIÓN ANTERIOR","pm_idle_fid_00_v1",fit(v1,900)),("3 · NUEVA CORRECCIÓN","pm_idle_fid_00 (v2)",fit(v2,900)),("4 · LÁMINA MAESTRA","PERFIL D. · canon",fit(ta.crop((365,0,480,ta.height)),900))],'01_comparacion_actual_anterior_nueva_lamina.jpg',("LÁMINA MAESTRA · DETALLE DE TATUAJES (canon)",fit(td,420)),minw=280)
hoja([("ACTUAL ×5","recorte del PNG 288×512",z(act)),("CORRECCIÓN ANTERIOR ×5","recorte del PNG",z(v1)),("NUEVA CORRECCIÓN ×5","recorte del PNG",z(v2))],'02_brazo_png_x5_actual_anterior_nueva.jpg',minw=450)
r1=Image.open(W0+'pm_idle_fid_00_v1.png').convert('RGB'); r2=Image.open(W0+'pm_idle_fid_00.png').convert('RGB'); r0=Image.open(W0+'_gen/gen_h_1f.png').convert('RGB'); tdn=np.asarray(td)
def panel_en_maestro(p0,O,s,ang,box,K):   # el panel de la lámina con la misma transformación usada en compose_fid2.py
    c,sn=np.cos(np.radians(ang)),np.sin(np.radians(ang)); M=np.array([[s*c,-s*sn,0],[s*sn,s*c,0]],np.float32)
    M[:,2]=(np.array(O)-np.array(box[:2]))-M[:,:2]@np.array(p0); M*=K
    return Image.fromarray(cv2.warpAffine(tdn,M,((box[2]-box[0])*K,(box[3]-box[1])*K),flags=cv2.INTER_CUBIC,borderValue=BG))
zoom=lambda im,box,K: im.crop(box).resize(((box[2]-box[0])*K,(box[3]-box[1])*K),Image.LANCZOS)
bh=(345,290,470,470); K=5
hoja([("LÁMINA · panel HOMBRO","misma escala y giro que en el fotograma",panel_en_maestro((266,38),(407,297),0.62,0,bh,K)),("NUEVA CORRECCIÓN","maestro 848×1264, ×5",zoom(r2,bh,K)),("CORRECCIÓN ANTERIOR","maestro, ×5",zoom(r1,bh,K))],'03_hombro_lamina_vs_nueva_vs_anterior.jpg',minw=600)
bw=(385,470,500,630)
hoja([("LÁMINA · panel ANTEBRAZO (LOBO)","misma escala y giro que en el fotograma",panel_en_maestro((450,38),(409,482),0.49,-28,bw,K)),("NUEVA CORRECCIÓN","maestro 848×1264, ×5",zoom(r2,bw,K)),("CORRECCIÓN ANTERIOR","maestro, ×5",zoom(r1,bw,K))],'04_lobo_lamina_vs_nueva_vs_anterior.jpg',minw=560)
bc=(480,290,560,480)
hoja([("NUEVA CORRECCIÓN","maestro, ×6",zoom(r2,bc,6)),("CORRECCIÓN ANTERIOR","maestro, ×6",zoom(r1,bc,6)),("ACTUAL","maestro, ×6",zoom(r0,bc,6)),("LÁMINA · panel CUELLO","cadenas de la lámina",fit(td.crop((0,200,160,320)),480))],'05_cadenas_y_placa.jpg',minw=480)
tb=(522,424,548,474); tag_eq=bool((np.asarray(r1.crop(tb))==np.asarray(r2.crop(tb))).all())
A=np.asarray(act).astype(int); V1=np.asarray(v1).astype(int); V2=np.asarray(v2).astype(int)
def sup(X,tit):
    ch=(X!=V2).any(axis=2); g=np.asarray(v2.convert('L').convert('RGBA')).copy(); g[...,:3]=(g[...,:3]*0.55).astype('uint8')
    g[ch]=(255,0,122,255); g[V2[...,3]==0]=(0,0,0,0); ys,xs=np.where(ch)
    return (tit,"magenta = píxeles distintos · caja x %d–%d, y %d–%d"%(xs.min(),xs.max(),ys.min(),ys.max()),Image.fromarray(g).resize((864,1536),Image.NEAREST)),dict(pct=round(float(ch.mean()*100),2),caja=[int(xs.min()),int(ys.min()),int(xs.max()),int(ys.max())],alfa_distinto=int((X[...,3]!=V2[...,3]).sum()),max_dif_alfa=int(np.abs(X[...,3]-V2[...,3]).max()))
c1,n1=sup(V1,"CORRECCIÓN ANTERIOR → NUEVA"); c2,n2=sup(A,"ACTUAL → NUEVA")
hoja([c1,c2],'06_superposicion_zonas_modificadas.jpg',minw=864)
zonas={'cabeza, rostro, pelo y ankh (y < 120)':(0,0,288,120),'pantalón y botas (y > 290)':(0,290,288,512),'mano y muñequera (y 272–330)':(0,272,288,330),'espalda del chaleco (x < 104)':(0,0,104,512)}
prot={k:{'anterior_a_nueva':int((V1[b[1]:b[3],b[0]:b[2]]!=V2[b[1]:b[3],b[0]:b[2]]).sum()),'actual_a_nueva':int((A[b[1]:b[3],b[0]:b[2]]!=V2[b[1]:b[3],b[0]:b[2]]).sum())} for k,b in zonas.items()}
sha=lambda p: hashlib.sha256(open(p,'rb').read()).hexdigest()
git=lambda *a: subprocess.run(['git','-C',R]+list(a),capture_output=True,text=True).stdout.strip()
orig=['assets/cinematics/restart/character_master/protagonist_master_approved.png','assets/cinematics/restart/character_master/protagonist_master_crop_tattoo_details.png','assets/characters/protagonist_master/pm_idle_00.png','assets/characters/protagonist_master/pm_idle.manifest.json','assets/characters/player_idle_00.png','assets/manifest.json','src/dd_world_renderer.js','src/dd_asset_registry.js']
hs={p:{'sha256':sha(R+p),'igual_que_en_el_commit_anterior':git('hash-object',p)==git('rev-parse','75cb357:'+p)} for p in orig}
sp=sorted(x for x in os.listdir(R+'assets/characters') if x.startswith('player_') and x.endswith('.png'))
h=hashlib.sha256(); [h.update(open(R+'assets/characters/'+x,'rb').read()) for x in sp]
out={'fecha':'2026-11-12','referencia':'commit 75cb357 (entrega de la FASE 07)','originales':hs,
 'sprites_player':{'archivos':len(sp),'sha256_conjunto':h.hexdigest(),'cambios_respecto_a_75cb357':git('diff','--stat','75cb357','--','assets/characters/player_*') or 'ninguno'},
 'src_index_registro_cambios_respecto_a_75cb357':git('diff','--stat','75cb357','--','src','index.html','DEADBEAT_DISCO.html','assets/manifest.json') or 'ninguno',
 'versiones':{'pm_idle_fid_00.png (v2, nueva)':sha(F+'fidelidad/pm_idle_fid_00.png'),'versiones/pm_idle_fid_00_v1.png (anterior)':sha(F+'fidelidad/versiones/pm_idle_fid_00_v1.png'),'v1_identica_a_pm_idle_fid_00_de_75cb357':git('hash-object','assets/characters/protagonist_master/fidelidad/versiones/pm_idle_fid_00_v1.png')==git('rev-parse','75cb357:assets/characters/protagonist_master/fidelidad/pm_idle_fid_00.png')},
 'diferencias_png_final':{'anterior_a_nueva':n1,'actual_a_nueva':n2,'actual_a_anterior_alfa':{'pixeles':int((A[...,3]!=V1[...,3]).sum()),'max_dif':int(np.abs(A[...,3]-V1[...,3]).max())}},
 'zonas_protegidas_valores_de_pixel_distintos':prot,'placa_identica_en_el_maestro_anterior_y_nuevo':tag_eq}
json.dump(out,open(E+'hashes_y_diferencias.json','w'),ensure_ascii=False,indent=1)
print(json.dumps({k:out[k] for k in ('diferencias_png_final','zonas_protegidas_valores_de_pixel_distintos','placa_identica_en_el_maestro_anterior_y_nuevo','sprites_player','src_index_registro_cambios_respecto_a_75cb357')},ensure_ascii=False)); print([v['igual_que_en_el_commit_anterior'] for v in hs.values()], out['versiones'])
