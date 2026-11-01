async (page) => {
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.reload();await page.waitForFunction(()=>window.__game);
  await page.evaluate(async()=>{
    const {RouteDriver}=await import('/tests/route-driver.ts');
    window.routeDriver=new RouteDriver();window.__game.start('story');window.__game.world.engine.stopRenderLoop();
  });
  const evidence=[];
  for(const target of [1,2,3,4,5,6,7,8]){
    const result=await page.evaluate(target=>{
      const g=window.__game;let steps=0;
      while(g.sim.stage<target&&!g.sim.finished&&steps++<6000){g.step(1,window.routeDriver.next(g.sim));if(steps%15===0)g.world.update(.05);}
      // Settle only the camera, then suppress the transient chapter title for inspection.
      for(let i=0;i<45;i++)g.world.update(1/60);
      document.getElementById('chapter-title').hidden=true;
      return {target,steps,...g.snapshot(),saved:JSON.parse(localStorage.getItem('last-tether-v1:story'))};
    },target);
    if(result.stage!==target)throw new Error('Route did not reach stage '+target+': '+JSON.stringify(result));
    evidence.push(result);await page.screenshot({path:`output/playwright/chapter-stage-${target}.png`});
  }
  const ending=await page.locator('#ending').isVisible();
  if(!ending)throw new Error('Ending UI did not open.');
  return {route:'input-only; no teleports, health or progression edits',ending,errors,evidence};
}
