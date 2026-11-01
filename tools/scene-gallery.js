async(page)=>{
 await page.waitForFunction(()=>window.__expedition);const results=[];
 for(const [sector,beat,name] of [[2,1,'gardens'],[3,1,'forest'],[4,0,'quarry'],[5,0,'turbines'],[6,1,'guardian']]){
  await page.evaluate(([sector,beat])=>{const a=window.__expedition;a.start('story');a.game.loadSector(sector,beat);const p=a.game.destination;a.game.p={x:p.x,y:p.y,z:p.z-16};a.game.invuln=1000;},[sector,beat]);
  await page.waitForTimeout(4500);await page.screenshot({path:'output/playwright/art-'+name+'.png'});results.push(await page.evaluate(()=>window.__expedition.snapshot()));
 }
 await page.keyboard.press('Escape');return results;
}
