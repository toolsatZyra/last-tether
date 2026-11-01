import {Expedition} from '../src/expedition/engine.ts';
import {drive} from '../tests/expedition-driver.ts';
import {distance} from '../src/expedition/level.ts';
const s=new Expedition();for(let tick=0;tick<60*1800&&!s.finished;tick++){const i=drive(s,tick),enemy=s.target;if((s.sector>0||s.beat>=2)&&enemy?.kind!=='guardian'){i.attack=false;i.burst=false;if(enemy&&distance(s.p,s.destination)<22&&distance(s.p,enemy.p)>8){i.x=0;i.z=0;}}s.step(1/60,i);s.events=[];}console.log(JSON.stringify({style:'Ranged-heavy, automatic aiming and known puzzle solutions',finished:s.finished,seconds:Math.round(s.seconds),deaths:s.deaths,kills:s.kills,sector:s.sector,beat:s.beat}));
