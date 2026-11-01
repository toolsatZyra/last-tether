async (page) => {
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.reload();await page.waitForFunction(()=>window.__game);
 const completedSave=await page.evaluate(()=>JSON.parse(localStorage.getItem('last-tether-v1:story')));
 await page.evaluate(()=>window.__game.start('story'));
 await page.keyboard.down('w');await page.waitForTimeout(900);await page.keyboard.up('w');
 await page.keyboard.press('Escape');
 const before=await page.evaluate(()=>window.__game.snapshot());await page.waitForTimeout(1000);
 const after=await page.evaluate(()=>window.__game.snapshot());
 if(!after.paused||after.elapsed!==before.elapsed)throw new Error('Pause advanced the simulation.');
 await page.keyboard.press('Escape');
 const saved=await page.evaluate(async()=>{
  const {RouteDriver}=await import('/tests/route-driver.ts');const d=new RouteDriver(),g=window.__game;
  g.start('story');g.world.engine.stopRenderLoop();let n=0;
  while(g.sim.stage<3&&n++<3000)g.step(1,d.next(g.sim));g.save();
  return {progress:g.sim.save(),position:{...g.sim.p}};
 });
 await page.reload();await page.waitForFunction(()=>window.__game);
 const restored=await page.evaluate(()=>{const g=window.__game;g.start('story',true);g.pause();return g.snapshot();});
 if(restored.stage!==3||restored.p.z!==101||restored.enemies.slice(0,2).some(e=>e.hp!==0))throw new Error('Checkpoint restore mismatch');
 const daily=await page.evaluate(async()=>{
  const {RouteDriver}=await import('/tests/route-driver.ts');const d=new RouteDriver(),g=window.__game;
  g.start('daily');g.world.engine.stopRenderLoop();let n=0;
  while(!g.sim.finished&&n++<3000){g.step(1,d.next(g.sim));if(n%15===0)g.world.update(.05);}
  return {finished:g.sim.finished,seconds:g.sim.elapsed,ghost:g.sim.ghost.length,story:JSON.parse(localStorage.getItem('last-tether-v1:story'))};
 });
 if(!daily.finished||daily.story.stage!==3||daily.ghost<50)throw new Error('Daily route damaged story or did not save ghost.');
 await page.screenshot({path:'output/playwright/daily-complete.png'});
 await page.reload();await page.waitForFunction(()=>window.__game);
 const replay=await page.evaluate(()=>{const g=window.__game;g.start('daily');g.world.engine.stopRenderLoop();g.step(30,{x:0,z:1});for(let i=0;i<45;i++)g.world.update(1/60);document.getElementById('chapter-title').hidden=true;return {frames:g.world.ghostFrames.length,visible:g.world.ghostActor.root.isEnabled(),story:JSON.parse(localStorage.getItem('last-tether-v1:story'))};});
 if(!replay.visible||replay.frames<50||replay.story.stage!==3)throw new Error('Recorded ghost did not survive reload.');
 await page.screenshot({path:'output/playwright/daily-ghost.png'});
 return {completedSaveSurvivedReload:completedSave?.stage===8,keyboardMove:before.p.z>7,pause:{before:before.elapsed,after:after.elapsed},saved,restored,daily,replay,errors};
}
