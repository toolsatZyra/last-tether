async(page)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:4173/');await page.waitForFunction(()=>window.__expedition,null,{timeout:60000});
 const result=await page.evaluate(async()=>{
 const a=window.__expedition;a.start('story');a.pause();const v=a.view;
 const counts=()=>({meshes:v.scene.meshes.length,skeletons:v.scene.skeletons.length,animations:v.scene.animationGroups.length,textures:v.scene.textures.length,materials:v.scene.materials.length});
 const before=counts(),rows=[];
 for(let pass=0;pass<2;pass++)for(const kind of ['raptor','spitter','brute','bomber','wing','guardian']){
 const actor=v.assets.actor(kind,v.scene,'check-'+kind,v.shadow);actor.root.position.set(0,0,0);actor.root.computeWorldMatrix(true);
 const clip=actor.groups.find(g=>g.name.endsWith(kind==='wing'||kind==='guardian'?'_Flying_Idle':'_Idle'));if(!clip)throw Error('Missing neutral clip '+kind);
 actor.groups.forEach(g=>g.stop());clip.start(false,1,clip.from,clip.to);
 let low=Infinity,high=-Infinity;const samples=kind==='wing'||kind==='guardian'?12:1;
 for(let f=0;f<samples;f++){clip.goToFrame(clip.from+(clip.to-clip.from)*f/samples);actor.nodes.forEach(n=>n.computeWorldMatrix(true));for(const m of actor.meshes){m.computeWorldMatrix(true);m.skeleton?.prepare(true);m.refreshBoundingInfo(true);}const b=actor.root.getHierarchyBoundingVectors(true);low=Math.min(low,b.min.y);high=Math.max(high,b.max.y);}
 if(Math.abs(low)>.025||Math.abs(high-actor.height)>.025)throw Error('Bad grounded envelope '+kind+' '+low+' '+high);
 if(pass===0)rows.push({kind,minY:low,maxY:high,height:actor.height,scale:actor.root.scaling.x,offset:actor.modelBaseOffset});else if(Math.abs(rows.find(r=>r.kind===kind).scale-actor.root.scaling.x)>1e-7)throw Error('Spawn scale changed');
 for(const m of actor.meshes)if(m.getTotalVertices()&&!m.material?.name.includes(kind+'-hide'))throw Error('Missing finish '+kind);
 actor.dispose();}
 const after=counts();if(JSON.stringify(before)!==JSON.stringify(after))throw Error('Creature resources grew '+JSON.stringify({before,after}));
 const {floorAt}=await import('/src/expedition/level.ts');a.game.addEnemy('wing',{x:a.game.p.x,y:a.game.p.y+5,z:a.game.p.z+5});v.update(a.game,0,false);const e=a.game.enemies.at(-1),wing=v.actors.get(e.id),floor=floorAt(a.game.chapter,e.p.x,e.p.z);if(floor===null||Math.abs(wing.contact.position.y-floor-.045)>.001||wing.contact.visibility>=.65)throw Error('Airborne contact shadow');
 return{rows,repeatedSpawnStable:true,resources:{before,after},airborneShadow:{y:wing.contact.position.y,floor,opacity:wing.contact.visibility}};
 });await page.waitForTimeout(600);result.errors=errors;if(errors.length)throw Error(JSON.stringify(errors));return result;
}