#  Une el vídeo y las pistas de audio grabadas por capture_audio_flow.js (en /tmp/aud) y mide niveles y desfases. Requiere numpy, scipy e imageio-ffmpeg. 
import numpy as np, json, subprocess, imageio_ffmpeg, glob
from scipy.io import wavfile
FF=imageio_ffmpeg.get_ffmpeg_exe(); D='/tmp/aud/'
run=lambda *a: subprocess.run([FF,'-y','-loglevel','error',*a],check=True)
v=glob.glob(D+'video/*.webm')[0]
J=json.load(open(D+'marks.json')); M={m['n'].split('@')[0]:m['t']/1000 for m in J['marks']}; tr={t['i']:t['start']/1000 for t in J['tracks']}
for i in tr: run('-i',D+'ctx%d.webm'%i,'-ar','48000','-ac','1',D+'ctx%d.wav'%i)
run('-i',v,'-vf','scale=32:18','-pix_fmt','gray','-f','rawvideo',D+'lum.raw')
L=np.fromfile(D+'lum.raw',dtype=np.uint8); L=L[:len(L)//576*576].reshape(-1,576).mean(1); d=np.abs(np.diff(L))
ev=[14.0,20.25,24.0,29.0]; best=max(np.arange(0,8,0.04),key=lambda o: sum(d[int(round((t+o)*25))-1] for t in ev)); V0=float(best)
T0=float(np.median([M['plano_%d'%k]-st for k,st in [(2,4),(3,9),(4,14),(5,19),(6,24),(7,29)]]))  # reloj visual del juego
d1=V0-(T0-tr[1])+0.06; d2=d1+tr[2]-tr[1]
dur=len(L)/25
run('-i',v,'-i',D+'ctx1.wav','-i',D+'ctx2.wav','-filter_complex','[1:a]adelay=%d[a1];[2:a]adelay=%d[a2];[a1][a2]amix=inputs=2:normalize=0:duration=longest[a]'%(d1*1000,d2*1000),'-map','0:v','-map','[a]','-c:v','libx264','-pix_fmt','yuv420p','-crf','28','-preset','slow','-c:a','aac','-b:a','128k','-t','%.2f'%dur,'-movflags','+faststart',D+'out.mp4')
run('-i',D+'out.mp4','-vn','-c:a','libmp3lame','-b:a','128k',D+'audio.mp3'); run('-i',D+'out.mp4','-vn','-ar','48000','-ac','1',D+'chk.wav')
sr,a=wavfile.read(D+'ctx1.wav'); a=a.astype(float)/32768; sr2,b=wavfile.read(D+'ctx2.wav'); b=b.astype(float)/32768
env=lambda x: np.sqrt((x[:len(x)//480*480].reshape(-1,480)**2).mean(1)); ea=env(a); eb=env(b); off=T0-tr[1]
db=lambda x: 20*np.log10(max(x,1e-6)); lvl=lambda e,t0,t1: round(db(np.sqrt((e[int(t0*100):int(t1*100)]**2).mean())),1)
R={'video_t0':V0,'duracion_intro_s':round(M['menu']-T0,2),'duracion_descenso_s':round(M['refugio']-M['nueva_partida'],2),'pico_intro':round(float(abs(a).max()),3),'pico_menu':round(float(abs(b).max()),3),'muestras_saturadas':int((abs(a)>0.985).sum()+(abs(b)>0.985).sum())}
R['nivel_dB']={n:lvl(ea,off+x,off+y) for n,x,y in [('plano 01',0,4),('plano 02',4,9),('plano 03',9,14),('plano 04',14,19),('plano 05 hasta el paso',19,20.2),('silencio tras el paso (20,30–20,70)',20.3,20.7),('plano 05 resto',20.75,24),('plano 06',24,29),('plano 07 (solo intro)',29,32)]}
R['sucesos_desfase_ms']={}
for n,t in [('puerta 3,98',3.98),('viñeta 4,5',4.5),('viñeta 5,0',5.0),('viñeta 5,5',5.5),('cartela 6,9',6.9),('golpe 14,0',14.0),('viñeta 15,0',15.0),('viñeta 16,0',16.0),('bucle 17,0',17.0),('bucle 17,5',17.5),('paso tardío 20,25',20.25),('lámina 20,75',20.75),('suelo 24,0',24.0),('página 25,5',25.5),('picado 27,5',27.5),('sombrero 28,62',28.62),('título 29,0',29.0)]:
    i0=int((off+t-0.2)*100); seg=ea[i0:int((off+t+0.2)*100)]; R['sucesos_desfase_ms'][n]=int(round(((i0+np.diff(seg).argmax()+1)/100-off-t)*1000))
end=M['menu']-tr[1]; np_=M['nueva_partida']-tr[1]; rf=M['refugio']-tr[1]; fin=M['fin']-tr[1]
R['intro_tras_terminar_dB']=lvl(ea,end+0.5,np_-0.1); R['descenso_dB']=lvl(ea,np_,rf); seg=ea[int(np_*100):int((rf+1)*100)]; R['descenso_pico_en_s']=round(seg.argmax()/100,2)
R['refugio_dB']=lvl(ea,rf+1,fin-0.2); R['menu_musica_empieza_t_intro']=round(tr[2]-T0,2); R['menu_musica_termina_tras_nueva_partida_s']=round(tr[2]+len(b)/sr2-M['nueva_partida'],2)
R['menu_musica_dB']={'bajo el título (29–32)':lvl(eb,0,3),'menú':lvl(eb,3.5,8.5)}; R['contextos_de_audio']=len(tr)
json.dump(R,open(D+'medicion_audio.json','w'),ensure_ascii=False,indent=1); print(json.dumps(R,ensure_ascii=False))
