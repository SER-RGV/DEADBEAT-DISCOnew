#!/usr/bin/env python3
import hashlib,json,shutil,subprocess,tempfile
from html.parser import HTMLParser
from pathlib import Path
R=Path(__file__).resolve().parents[2]; S=R/'assets/cinematics/spatial_08c2'; N=R/'assets/cinematics/spatial_08c22'
def sha(p):return hashlib.sha256(p.read_bytes()).hexdigest()
assert sha(S/'plan.json')=='890daa7cc0fd91c1e02dcbf20652a25dbf6a927cff39defe67442b8cb0de21ea'
assert sha(S/'planta.svg')=='ad56ed673141f93d64c18b66bfac1fd7423cebef9d0503052c11579f0ee3b611'
assert sha(S/'alzados.svg')=='f13adfab42a4f698ba0402990f6d8c3e8fa46d5a1e01de4f12aa6dfc4119c053'
for name,expected in [('backgrounds/definitive/scene_04_main_hall/master.png','9c1c9358acaca94abea7c7eb20c6e505e2605a884f8d18a99e8d3383ec74bba3'),('backgrounds/continuity_08c1/scene_05_dancefloor.png','6843655e948bbbca7507faeaf8ebb76cba0f92c192d1c16b3f9f967360975df3'),('backgrounds/continuity_08c1/scene_06_hero.png','62e7e60be7d14cad51cae93bf9a4febbaafddab3599ea91523304b5bfa2d9135')]:assert sha(R/'assets/cinematics'/name)==expected
model=json.loads((S/'plan.json').read_text());comparison=json.loads((N/'comparison.json').read_text()); matrix=json.loads((N/'matrix.json').read_text())
assert [x['id'] for x in model['cameras']]==['BG04','BG05','BG06']
assert comparison['source_model_sha256']==sha(S/'plan.json') and comparison['geometry_lines']>0
assert len(matrix)==11 and all(all(x.get(k) for k in ['element','bg04','bg05','bg06','identified','continuity','confidence','missing']) for x in matrix)
assert matrix[0]['continuity']=='CONTRADICE'
assert comparison['cameras']['BG06']['hero_box_fits_candidate']
class Links(HTMLParser):
 def __init__(self):super().__init__();self.paths=[]
 def handle_starttag(self,tag,attrs):
  for k,v in attrs:
   if k in ('src','href','data-base','data-hipotesis') and v and not v.startswith('#'):self.paths.append(v)
gallery=R/'docs/CINEMATIC_STORYBOARD/FASE_08C22_GALERIA_CONTINUIDAD.html';parser=Links();parser.feed(gallery.read_text())
for p in parser.paths:
 assert not '://' in p and (gallery.parent/p).is_file(),p
assert (R/'docs/CINEMATIC_STORYBOARD/FASE_08C2_GALERIA_PLANO.html').is_file() and (S/'archive_08c2/plan.json').is_file()
with tempfile.TemporaryDirectory() as d:
 t=Path(d);(t/'tools').mkdir();shutil.copy(R/'tools/compare_cinematic_08c22.py',t/'tools');shutil.copy(R/'tools/generate_cinematic_08c2.py',t/'tools');shutil.copytree(S,t/'assets/cinematics/spatial_08c2');(t/'assets/cinematics/spatial_08c22').mkdir();shutil.copy(N/'anchors.json',t/'assets/cinematics/spatial_08c22')
 subprocess.run(['python3',str(t/'tools/compare_cinematic_08c22.py')],check=True,stdout=subprocess.DEVNULL)
 for p in N.glob('*.svg'):assert sha(p)==sha(t/'assets/cinematics/spatial_08c22'/p.name),p
 assert sha(N/'comparison.json')==sha(t/'assets/cinematics/spatial_08c22/comparison.json')
print('OK: integridad, referencias, matriz y variantes reproducibles sin escribir en 08C2.1')
