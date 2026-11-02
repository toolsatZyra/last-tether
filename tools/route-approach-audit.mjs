import { Expedition } from '../src/expedition/engine.ts';
import { drive } from '../tests/expedition-driver.ts';
import { floorAt } from '../src/expedition/level.ts';
const rows=[];
for(const x of [20,30,38,48,56]){const s=new Expedition();s.loadSector(4,2);s.p={x,y:16,z:187};s.grounded=true;let firstUnsupported=null;for(let t=0;t<1200&&s.deaths===0;t++){s.step(1/60,drive(s,t));s.events=[];if(floorAt(s.chapter,s.p.x,s.p.z)===null)firstUnsupported??={...s.p};}rows.push({startX:x,deaths:s.deaths,p:s.p,firstUnsupported});}
console.log(JSON.stringify(rows,null,2));