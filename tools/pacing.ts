import {Expedition} from '../src/expedition/engine.ts';
import {drive} from '../tests/expedition-driver.ts';
const s=new Expedition();let key='',last=0;const results=[];
for(let tick=0;tick<60*2400&&!s.finished;tick++){s.step(1/60,drive(s,tick));s.events=[];const next=s.sector+'-'+s.beat;if(next!==key){results.push({beat:next,elapsed:Math.round(s.seconds),duration:Math.round(s.seconds-last),deaths:s.deaths,kills:s.kills});last=s.seconds;key=next;}}
console.log(JSON.stringify({finished:s.finished,seconds:s.seconds,deaths:s.deaths,kills:s.kills,at:{sector:s.sector,beat:s.beat,p:s.p,enemies:s.living.map(e=>({kind:e.kind,hp:e.hp,p:e.p,state:e.state}))},results},null,2));
