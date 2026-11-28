// Inventory the exact artwork inherited by each base prefab; no asset is created.
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..'),dir=path.join(root,'src/room_generation'),assets='assets/prefabs/club/';
const catalog=require(path.join(dir,'prefabs/catalog.json')),pivots=require(path.join(root,assets,'pivots.json'));
const api=Function('prefabCatalog',['seed','rooms','population','floor','validate','architecture','prefabs','playable'].map(n=>fs.readFileSync(path.join(dir,n+'.js'),'utf8')).join('\n')+';return {instantiatePrefab};')(catalog);
const templates={};
for(const name of Object.keys(catalog.templates)){
 const mesh=api.instantiatePrefab({key:'audit',prefab:{template:name,connections:[]}}),files=new Set();
 for(const p of mesh.placements)for(const state of p.destructible?['intacto','roto']:['intacto'])for(const suffix of ['','-sombra'])files.add(`${p.asset}-${p.view}-${state}${suffix}`);
 templates[name]=[...files].sort().map(id=>({path:assets+id+'.png',exists:fs.existsSync(path.join(root,assets,id+'.png')),pivotDefined:!!pivots[id.replace(/-sombra$/,'')]}));
}
console.log(JSON.stringify({templates,note:'All 2.4 proportions inherit these sprite requests and colliders. Missing sprite files fall back to native prop rendering; no visual review or image-quality assessment. Static shell tiles and circle floor assets are inherited unchanged.'},null,2));
