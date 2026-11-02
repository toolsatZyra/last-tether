import { Expedition } from '../src/expedition/engine.ts';
import { floorAt } from '../src/expedition/level.ts';
const rows=[];
for(let i=0;i<16;i++){const s=new Expedition(),c=s.destination,angle=i*Math.PI/8,dx=Math.cos(angle),dz=Math.sin(angle);s.p={x:c.x+22*dx,y:c.y,z:c.z+22*dz};s.addEnemy('raptor',{x:c.x+21*dx,y:c.y,z:c.z+21*dz});const e=s.enemies.at(-1);e.timer=0;let unsupported=0,first=null;for(let tick=0;tick<150;tick++){s.time+=1/60;s.updateEnemies(1/60);if(floorAt(s.chapter,e.p.x,e.p.z)===null){unsupported++;first??={tick,state:e.state,p:{...e.p},home:{...e.home}};}}rows.push({angle,unsupportedSeconds:unsupported/60,first});}
console.log(JSON.stringify({groundEnemyCases:rows.length,unsupportedCases:rows.filter(r=>r.unsupportedSeconds>0).length,rows},null,2));
