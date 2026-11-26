const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
(async()=>{
 const urls=[];
 class Image {
  set src(url){this.url=url;urls.push(url);queueMicrotask(()=>{if(url.includes('missing'))this.onerror();else{this.complete=true;this.naturalWidth=16;this.naturalHeight=16;this.onload()}})}
 }
 const context={Image,console,setTimeout,clearTimeout,Promise};context.window=context;
 vm.runInNewContext(fs.readFileSync('src/dd_asset_registry.js','utf8'),context);
 const assets=context.DD_ASSETS;
 assert(urls.length>0);
 assert(Object.keys(assets.images).every(id=>assets.priorityOf(id)===0));
 const cinematic=Object.keys(assets.manifest.entries).find(id=>assets.priorityOf(id)===3);
 assert(cinematic&&!assets.images[cinematic]);
 const first=assets.request(cinematic),second=assets.request(cinematic);assert.equal(first,second);await first;
 const entry=assets.manifest.entries[cinematic];assert.equal(urls.filter(url=>url.startsWith(entry.src+'?')).length,1);
 assets.manifest.entries.qa_fallback={id:'qa_fallback',src:'missing.png',fallback:'ok.png'};
 assert(await assets.request('qa_fallback'));assert.equal(assets.statusOf('qa_fallback'),'ready');
 assets.manifest.entries.qa_broken={id:'qa_broken',src:'missing.png',fallback:'missing-again.png'};
 assert.equal(await assets.request('qa_broken'),null);assert.equal(assets.statusOf('qa_broken'),'error');
 assert.equal(urls.filter(url=>url.startsWith('missing-again.png')).length,1);
 assert.equal(await assets.request('unknown'),null);
 console.log('PASS critical-only initial load, on-demand cinematics, request deduplication, successful fallback and bounded failed fallback');
})().catch(e=>{console.error(e);process.exitCode=1});
