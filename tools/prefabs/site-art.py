"""South-facing acoustic diffuser (balcony) and recessed floor cable tray (deck)."""
from pathlib import Path
from PIL import Image, ImageDraw
import json
out=Path(__file__).resolve().parents[2]/'assets/prefabs/club'; piv=json.loads((out/'pivots.json').read_text())
for name,W,H in [('difusor-S',144,50),('canal-cabina',158,24)]:
 im=Image.new('RGBA',(W,H));d=ImageDraw.Draw(im);d.rounded_rectangle((2,3,W-3,H-3),radius=4,fill='#302b34',outline='#7b6b70',width=2)
 if name=='difusor-S':
  for i in range(10,134,10):
   depth=4+(i//10*7)%9;d.polygon([(i,9),(i+6,6),(i+6,H-depth),(i,H-depth+2)],fill='#5d4853',outline='#231e27');d.line((i,10,i,H-depth),fill='#84717a')
 else:
  for y in (8,13,16):d.line((8,y,W-8,y),fill='#665159' if y==8 else '#49424a',width=2)
  for x in range(16,W-8,30):d.rectangle((x,6,x+3,H-5),fill='#827574')
 for x in (5,W-7):d.point((x,6),fill='#c1ada1')
 im.save(out/(name+'.png'));piv[name]=[W/2,H-4]
(out/'pivots.json').write_text(json.dumps(piv,indent=2)+'\n')
