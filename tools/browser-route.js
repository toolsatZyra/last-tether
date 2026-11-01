async (page) => {
 await page.waitForFunction(()=>window.__expedition);
 return await page.evaluate(async()=>{
  const api=window.__expedition;api.start('story');api.pause();const s=api.game,view=api.view;
  const {drive}=await import('/tests/expedition-driver.ts');let old=-1,mark='',stuck=0,last={x:0,z:0},log=[];
  for(let tick=0;tick<60*1500&&!s.finished;tick++){
   if(view.sector!==s.sector)view.build(s);
   s.step(1/60,drive(s,tick));s.events=[];
   const key=s.sector+'-'+s.beat;if(key!==mark){log.push({key,t:Math.round(s.seconds),deaths:s.deaths});mark=key;}
   if(tick%120===0){view.update(s,1/60);if(Math.hypot(last.x-s.p.x,last.z-s.p.z)<.1)stuck++;else stuck=0;last={...s.p};if(stuck>12)break;await new Promise(r=>setTimeout(r,0));}
  }
  view.update(s,1/60);return{finished:s.finished,seconds:s.seconds,deaths:s.deaths,kills:s.kills,sector:s.sector,beat:s.beat,p:s.p,enemies:s.living.map(e=>({kind:e.kind,hp:e.hp,state:e.state,p:e.p})),log};
 });
}
