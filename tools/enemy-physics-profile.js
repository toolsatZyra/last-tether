async(page)=>{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:4173/');
  await page.waitForFunction(()=>window.__expedition,null,{timeout:60000});
  await page.evaluate(()=>{const a=window.__expedition;a.start('story');a.view.setQuality('balanced');a.game.invuln=10000;});
  await page.waitForTimeout(4000);
  const result=await page.evaluate(async()=>{
    const a=window.__expedition,s=a.game,c=s.destination;
    s.p={x:c.x,y:c.y,z:c.z-12};s.enemies=[];s.spawned=true;s.wave=99;
    for(let i=0;i<8;i++){
      s.addEnemy(['raptor','spitter','brute','bomber'][i%4],{x:c.x+(i%4-1.5)*3,y:c.y,z:c.z+Math.floor(i/4)*4});
      s.enemies.at(-1).state='stunned';s.enemies.at(-1).timer=100000;
    }
    const originalMotion=s.enemyMotion,originalUpdate=s.updateEnemies,originalMove=a.view.physics.moveEnemy;
    let updateMs=0,moveMs=0,calls=0,moves=0;
    s.updateEnemies=function(...args){const t=performance.now();try{return originalUpdate.apply(this,args);}finally{updateMs+=performance.now()-t;calls++;}};
    a.view.physics.moveEnemy=function(...args){const t=performance.now();try{return originalMove.apply(this,args);}finally{moveMs+=performance.now()-t;moves++;}};
    const rows=[];
    for(const native of [false,true,false,true]){
      s.syncEnemyPhysics([]);s.enemyMotion=native?originalMotion:undefined;
      await new Promise(r=>setTimeout(r,1000));updateMs=moveMs=calls=moves=0;
      let frames=0,start=performance.now(),last=start,intervals=[];
      await new Promise(resolve=>{function tick(now){intervals.push(now-last);last=now;frames++;if(now-start<4000)requestAnimationFrame(tick);else resolve();}requestAnimationFrame(tick);});
      intervals.sort((a,b)=>a-b);
      rows.push({native,fps:1000*frames/(last-start),enemyUpdateMs:updateMs/calls,moveEnemyMs:moveMs/Math.max(1,moves),totalMoveMsPerUpdate:moveMs/calls,p95:intervals[Math.floor(intervals.length*.95)],controllers:a.view.physics.enemyControllers.size});
    }
    s.enemyMotion=originalMotion;s.updateEnemies=originalUpdate;a.view.physics.moveEnemy=originalMove;a.pause();
    return{rows,renderSize:[a.view.engine.getRenderWidth(),a.view.engine.getRenderHeight()]};
  });
  return{...result,errors};
}
