#!/usr/bin/env python3
"""Prepare BOSS-T02 HD state frames for the existing boss renderer slots."""
from __future__ import annotations
from collections import Counter, deque
from hashlib import sha256
from pathlib import Path
import json
from PIL import Image, ImageFilter

ROOT=Path(__file__).resolve().parents[1]
SRC=ROOT/'ART_ASSETS/bosses/tanda_02/_source'
DST=ROOT/'ART_ASSETS/bosses/tanda_02'
# source name, stable boss ID, runtime cache key, native slot, 2x output target
SPECS=[
 ('boss_05_fusioncosmica_attack_00.png','boss_05_fusioncosmica','boss_05_fusioncosmica_attack',(160,150),(320,300)),
 ('boss_05_fusioncosmica_attack_01.png','boss_05_fusioncosmica','boss_05_fusioncosmica_attack1',(160,151),(320,302)),
 ('boss_05_fusioncosmica_hit_00.png','boss_05_fusioncosmica','boss_05_fusioncosmica_hit',(160,147),(320,294)),
 ('boss_05_fusioncosmica_death_00.png','boss_05_fusioncosmica','boss_05_fusioncosmica_death',(160,158),(320,316)),
 ('boss_06_djabismo_attack_00.png','boss_06_djabismo','boss_06_djabismo_attack',(160,159),(320,318)),
 ('boss_06_djabismo_attack_01.png','boss_06_djabismo','boss_06_djabismo_attack1',(160,144),(320,288)),
 ('boss_06_djabismo_hit_00.png','boss_06_djabismo','boss_06_djabismo_hit',(133,160),(266,320)),
 ('boss_06_djabismo_death_00.png','boss_06_djabismo','boss_06_djabismo_death',(160,94),(320,188)),
 ('boss_07_altavoztitan_attack_00.png','boss_07_altavoztitan','boss_07_altavoztitan_attack',(160,146),(320,292)),
 ('boss_07_altavoztitan_attack_01.png','boss_07_altavoztitan','boss_07_altavoztitan_attack1',(160,136),(320,272)),
]

def palette(im):
 rgb=im.convert('RGB');w,h=rgb.size;px=rgb.load();counts=Counter()
 for y in range(h):
  xs=range(w) if y<8 or y>=h-8 else (*range(8),*range(max(8,w-8),w))
  for x in xs:
   r,g,b=px[x,y]
   if max(r,g,b)-min(r,g,b)<=20:counts[((r//8)*8,(g//8)*8,(b//8)*8)]+=1
 if not counts:raise RuntimeError('cannot infer neutral border palette')
 top=counts.most_common(12);mx=top[0][1];out=[]
 for c,n in top:
  if n<max(400,mx*.12):continue
  if any(max(abs(c[i]-x[i]) for i in range(3))<=12 for x in out):continue
  out.append(c)
  if len(out)==4:break
 return out

def checker_mask(rgb,colors):
 if len(colors)<2:return None,0
 w,h=rgb.size;px=rgb.load()
 def label(seq):
  result=[]
  for c in seq:
   ds=[max(abs(c[i]-p[i]) for i in range(3)) for p in colors]
   result.append(ds.index(min(ds)) if min(ds)<=24 else -1)
  return result
 top=label([px[x,0] for x in range(w)]);left=label([px[0,y] for y in range(h)])
 def boundary(seq):
  first=next((v for v in seq if v>=0),-1)
  if first<0:return None,None
  for i in range(1,len(seq)):
   if seq[i]>=0 and seq[i-1]>=0 and seq[i]!=seq[i-1]:return i,seq[i]
  return None,first
 xb,_=boundary(top);yb,_=boundary(left)
 if xb is None or yb is None:return None,0
 def runs(seq):
  out=[];start=0
  for i in range(1,len(seq)):
   if seq[i]!=seq[i-1]:out.append((seq[i-1],i-start));start=i
  out.append((seq[-1],len(seq)-start));return out
 lengths=[n for lab,n in runs(top)+runs(left) if lab>=0 and 8<=n<=40]
 if not lengths:return None,0
 tile=Counter(lengths).most_common(1)[0][0]
 phase_x=(tile-xb%tile)%tile;phase_y=(tile-yb%tile)%tile;base=next((v for v in top if v>=0),0)
 raw=bytearray(w*h)
 for y in range(h):
  iy=((y+phase_y)//tile)&1
  for x in range(w):
   idx=base^(((x+phase_x)//tile)&1)^iy;r,g,b=px[x,y];c=colors[idx]
   if max(abs(r-c[0]),abs(g-c[1]),abs(b-c[2]))<=18:raw[y*w+x]=255
 # Require a 5x5 neighborhood to follow the globally inferred checker grid.
 smooth=Image.frombytes('L',(w,h),bytes(raw)).filter(ImageFilter.BoxBlur(2))
 remove=smooth.point(lambda v:255 if v>=190 else 0)
 count=sum(remove.histogram()[1:])
 return remove,count

def cutout(im):
 rgb=im.convert('RGB');w,h=rgb.size;data=rgb.tobytes();colors=palette(rgb)
 lev=[sum(c)//3 for c in colors];lo=max(0,min(lev)-36);hi=min(255,max(lev)+36)
 candidate=bytearray(w*h)
 for i in range(w*h):
  j=3*i;r,g,b=data[j:j+3];gray=(r+g+b)//3
  if max(r,g,b)-min(r,g,b)<=26 and lo<=gray<=hi:candidate[i]=1
 alpha=bytearray([255])*(w*h);q=deque()
 def seed(i):
  if candidate[i]:candidate[i]=0;alpha[i]=0;q.append(i)
 for x in range(w):seed(x);seed((h-1)*w+x)
 for y in range(h):seed(y*w);seed(y*w+w-1)
 while q:
  i=q.popleft();x=i%w;y=i//w
  for ny in range(max(0,y-1),min(h,y+2)):
   row=ny*w
   for nx in range(max(0,x-1),min(w,x+2)):
    ni=row+nx
    if candidate[ni]:candidate[ni]=0;alpha[ni]=0;q.append(ni)
 seen=bytearray(w*h);cleared=0
 for start in range(w*h):
  if not candidate[start] or seen[start]:continue
  comp=[];queue=deque([start]);seen[start]=1;palette_hits=0
  while queue:
   i=queue.popleft();comp.append(i);j=3*i;r,g,b=data[j:j+3]
   if any(max(abs(r-c[0]),abs(g-c[1]),abs(b-c[2]))<=16 for c in colors):palette_hits+=1
   x=i%w;y=i//w
   for ny in range(max(0,y-1),min(h,y+2)):
    row=ny*w
    for nx in range(max(0,x-1),min(w,x+2)):
     ni=row+nx
     if candidate[ni] and not seen[ni]:seen[ni]=1;queue.append(ni)
  if len(comp)>=5 and palette_hits/max(1,len(comp))>=0.55:
   for i in comp:alpha[i]=0
   cleared+=len(comp)
 matte=Image.frombytes('L',(w,h),bytes(alpha))
 pattern,pattern_pixels=checker_mask(rgb,colors)
 if pattern is not None:
  ma=bytearray(matte.tobytes());pm=pattern.tobytes()
  for i,v in enumerate(pm):
   if v:ma[i]=0
  matte=Image.frombytes('L',(w,h),bytes(ma))
 matte=matte.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(.55))
 out=rgb.convert('RGBA');out.putalpha(matte)
 return out,{'background_palette_rgb':[list(c) for c in colors],'enclosed_backdrop_pixels_cleared':cleared,
             'checker_pattern_pixels_cleared':pattern_pixels}

def fit(im,target=None):
 alpha=im.getchannel('A');bbox=alpha.point(lambda a:255 if a>16 else 0).getbbox()
 if not bbox:raise RuntimeError('empty cutout')
 obj=im.crop(bbox);target_h=400;scale=target_h/obj.height
 nw=max(1,round(obj.width*scale));return obj.resize((nw,target_h),Image.Resampling.LANCZOS)

def remove_small_islands(im,min_area=1000):
 w,h=im.size;alpha=im.getchannel('A').tobytes();seen=bytearray(w*h);q=deque();remove=[]
 for s in range(w*h):
  if alpha[s]<=16 or seen[s]:continue
  comp=[s];q.append(s);seen[s]=1
  while q:
   i=q.popleft();x=i%w;y=i//w
   for yy in range(max(0,y-1),min(h,y+2)):
    row=yy*w
    for xx in range(max(0,x-1),min(w,x+2)):
     j=row+xx
     if alpha[j]>16 and not seen[j]:seen[j]=1;comp.append(j);q.append(j)
  if len(comp)<min_area:remove.extend(comp)
 out=im.copy();a=bytearray(out.getchannel('A').tobytes())
 for i in remove:a[i]=0
 out.putalpha(Image.frombytes('L',(w,h),bytes(a)))
 return out,len(remove)

def restore_hit_eye(hit,master):
 if hit.size!=master.size:master=master.resize(hit.size,Image.Resampling.LANCZOS)
 mask=Image.new('L',hit.size,0)
 from PIL import ImageDraw
 ImageDraw.Draw(mask).ellipse((259,77,340,158),fill=255)
 mask=mask.filter(ImageFilter.GaussianBlur(9))
 return Image.composite(master,hit,mask)

def main():
 DST.mkdir(parents=True,exist_ok=True);assets=[]
 for source,boss_id,key,native,target in SPECS:
  src=SRC/source
  # The death concept deliberately avoids authored lettering; keep its original generated source intact.
  raw=Image.open(src).convert('RGB');matte,qa=cutout(raw);final=fit(matte,target)
  if key=='boss_05_fusioncosmica_hit':
   master=Image.open(ROOT/'ART_ASSETS/bosses/tanda_01/boss_art_boss_05_fusioncosmica.png').convert('RGBA')
   final=restore_hit_eye(final,master);qa['hit_eye_restored_from_master']=True
  if key=='boss_05_fusioncosmica_death':
   final,qa['small_island_pixels_removed']=remove_small_islands(final,1000)
  out=DST/source;final.save(out,'PNG',optimize=True)
  hist=final.getchannel('A').histogram();row={'id':'bosses/'+source,'boss_id':boss_id,'cache_key':key,
   'source':str(src.relative_to(ROOT)),'file':str(out.relative_to(ROOT)),'source_dimensions':list(raw.size),
   'native_slot_dimensions':list(native),'dimensions':list(final.size),'format':'PNG','mode':'RGBA','pivot':'center',
   'loader':'HD','sha256':sha256(out.read_bytes()).hexdigest(),'bytes':out.stat().st_size,
   'status':'PREPARED_NOT_YET_INTEGRATED','qa':{**qa,'transparent_px':hist[0],
   'partial_alpha_px':sum(hist[1:255]),'opaque_px':hist[255],
   'coverage_pct':round(100*sum(hist[1:])/(final.width*final.height),3)}}
  assets.append(row);print(f"{key:42s} {final.width}x{final.height} alpha0={hist[0]} sha256={row['sha256'][:16]}")
 manifest={'batch':'BOSS-T02','source_build':'DEADBEAT_DISCO.ART.html','asset_count':len(assets),
  'status':'PREPARED_NOT_YET_INTEGRATED','assets':assets}
 (DST/'manifest.json').write_text(json.dumps(manifest,indent=2,ensure_ascii=False)+'\n',encoding='utf8')
if __name__=='__main__':main()
