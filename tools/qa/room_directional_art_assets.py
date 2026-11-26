"""Check authored directional PNG canvas, transparency, pivots and shadows."""
from pathlib import Path
import json, hashlib
from PIL import Image
root=Path(__file__).resolve().parents[2]; folder=root/'assets/prefabs/club'
pivots=json.loads((folder/'pivots.json').read_text())
refs={'sofa':'sofa-W','mesa':'mesa-N','monitor':'monitor-S','panel':'panel-E'}
views={'sofa':('N','S'),'mesa':('S','W'),'monitor':('W',),'panel':('N',)}
results=[]
for asset,dirs in views.items():
 for view in dirs:
  for state in (('intacto','roto') if asset in ('sofa','mesa') else ('intacto',)):
   key=f'{asset}-{view}-{state}'; ref=f'{refs[asset]}-{state}'
   im=Image.open(folder/(key+'.png')).convert('RGBA'); shadow=Image.open(folder/(key+'-sombra.png')).convert('RGBA')
   original=Image.open(folder/(ref+'.png')).convert('RGBA')
   assert im.size==shadow.size==original.size,(key,'size')
   assert pivots[key]==pivots[ref],(key,'pivot')
   alpha=im.getchannel('A');assert alpha.getextrema()==(0,255),(key,'alpha')
   assert im.getbbox(),(key,'empty')
   assert im.tobytes()!=original.tobytes(),(key,'duplicate')
   assert all(not (r==0 and g==255 and b==0 and a) for r,g,b,a in im.getdata()),(key,'chroma leak')
   results.append({'id':key,'size':list(im.size),'pivot':pivots[key],'bounds':list(im.getbbox()),'sha256':hashlib.sha256((folder/(key+'.png')).read_bytes()).hexdigest()})
print(json.dumps({'sprites':results,'count':len(results),'note':'Alpha masters rendered directly; neutral shadows and pivots are inherited from the corresponding original. Tests dimensions and pixels, not artistic fidelity.'},indent=2))
