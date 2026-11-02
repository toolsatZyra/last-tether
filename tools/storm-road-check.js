async(page)=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.__expedition,null,{timeout:60000});
 const geometry=await page.evaluate(async()=>{
  const a=window.__expedition; a.start('story');a.pause();a.game.events=[];
  const {SceneLoader,Vector3}=await import('/tests/browser-storm-fixture.ts');
  const fresh=await SceneLoader.LoadAssetContainerAsync('/assets/geology/','boulder_01.glb',a.view.scene);
  const data=c=>c.meshes.filter(m=>m.getTotalVertices()).map(m=>({positions:Array.from(m.getVerticesData('position')),indices:Array.from(m.getIndices())}));
  const source=JSON.stringify(data(a.view.assets.containers.get('Rock_Mass')));
  const pristine=source===JSON.stringify(data(fresh));fresh.dispose();
  const original=a.view.batchStaticSteps.bind(a.view),bounds=[];
  a.view.batchStaticSteps=function*(){for(const m of this.root.getChildMeshes().filter(m=>m.metadata?.stormSpur)){const matrix=m.computeWorldMatrix(true),v=m.getVerticesData('position'),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];for(let i=0;i<v.length;i+=3){const world=Vector3.TransformCoordinates(Vector3.FromArray(v,i),matrix).asArray();for(let k=0;k<3;k++){min[k]=Math.min(min[k],world[k]);max[k]=Math.max(max[k],world[k]);}}bounds.push({min,max,physics:m.metadata.physics});}yield* original();};
  const counts=[];for(let i=0;i<3;i++){a.view.build(a.game);a.game.events=[];counts.push({meshes:a.view.scene.meshes.length,materials:a.view.scene.materials.length,textures:a.view.scene.textures.length,bodies:a.view.physics.bodies.length});}
  a.view.batchStaticSteps=original;
  const points=a.game.chapter.points.filter((p,i)=>i%2===0);
  const contained=bounds.every(b=>points.some(p=>b.min[0]>=p.x-12.251&&b.max[0]<=p.x+12.251&&b.min[2]>=p.z-13.251&&b.max[2]<=p.z+13.251&&b.max[1]<=p.y-3.199&&!b.physics&&b.min.concat(b.max).every(Number.isFinite)));
  const unchanged=source===JSON.stringify(data(a.view.assets.containers.get('Rock_Mass')));
  const stable=counts.every(c=>JSON.stringify(c)===JSON.stringify(counts[0]));
  if(!pristine||!unchanged||!contained||!stable||bounds.length!==12)throw Error(JSON.stringify({pristine,unchanged,contained,stable,bounds,counts}));
  return {pristine,unchanged,contained,stable,bounds,counts};
 });
 const crossings=[];
 for(const [point,beat] of [[2,1],[5,2]]){
  const start=await page.evaluate(([point,beat])=>{const a=window.__expedition,s=a.game;s.loadSector(0,beat);s.events=[];s.spawned=true;s.wave=99;s.p={...s.chapter.points[point-1]};s.transition=0;a.view.build(s);s.events=[];a.view.yaw=0;for(let i=0;i<30;i++)a.view.update(s,1/60);const ring=a.view.anchors.find(m=>Math.abs(m.position.z-(s.chapter.points[point].z-6))<.01);window.stormRing=ring;const out={target:s.anchor,ring:ring.position.asArray(),rotation:ring.rotation.asArray(),deaths:s.deaths};a.close();return out;},[point,beat]);
  await page.keyboard.press('q');await page.waitForFunction(()=>!!window.__expedition.game.grapple,null,{timeout:5000});
  const rope=await page.evaluate(()=>{const a=window.__expedition;a.view.update(a.game,0);return Array.from(a.view.rope.getVerticesData('position')).slice(3,6);});
  await page.waitForFunction(()=>!window.__expedition.game.grapple&&window.__expedition.game.grounded,null,{timeout:10000});
  await page.screenshot({path:'output/playwright/storm-native-gap-'+point+'.png'});
  const landed=await page.evaluate(()=>({...window.__expedition.game.p}));
  await page.keyboard.down('w');await page.waitForTimeout(750);await page.keyboard.up('w');
  const end=await page.evaluate(()=>{const a=window.__expedition;a.pause();return{p:{...a.game.p},deaths:a.game.deaths,grounded:a.game.grounded,rotation:window.stormRing.rotation.asArray()};});
  if(Math.hypot(landed.x-start.target.x,landed.z-start.target.z)>.4||end.deaths!==start.deaths||!end.grounded||end.p.z<landed.z+2||JSON.stringify(start.rotation)!==JSON.stringify(end.rotation)||rope.some((v,i)=>Math.abs(v-start.ring[i])>.001))throw Error(JSON.stringify({point,start,rope,landed,end}));
  crossings.push({point,start,rope,landed,end});
 }
 if(errors.length)throw Error(JSON.stringify(errors));return{geometry,crossings,errors};
}
