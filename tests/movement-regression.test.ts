import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Simulation,vec} from '../src/simulation.ts';
const tick=(s:Simulation,n:number,input={x:0,z:1,jump:false})=>{for(let i=0;i<n;i++)s.step(1/60,input);};
test('raised ledge blocks walking through stone and remains jumpable',()=>{
 const s=new Simulation();Object.assign(s,{stage:7,terrace:true,bridge:true,courtyard:true,boss:true,gate:true,p:vec(0,5,308)});
 tick(s,80);assert.ok(s.p.z<310);assert.equal(s.p.y,5);
 s.step(1/60,{x:0,z:1,jump:true});tick(s,42);tick(s,30,{x:0,z:0,jump:false});
 assert.ok(s.p.y>=6);assert.ok(s.p.z>310);assert.equal(s.deaths,0);
});
test('optional lookout is reachable with walking and jumping inputs',()=>{
 const s=new Simulation();Object.assign(s,{stage:2,terrace:true,p:vec(0,5,67)});s.enemies.slice(0,2).forEach(e=>e.hp=0);
 const points=[[7,67],[7,72],[10,78],[10,86]];
 for(const [x,z] of points){for(let i=0;i<300&&Math.hypot(s.p.x-x,s.p.z-z)>.4;i++){const d=Math.hypot(s.p.x-x,s.p.z-z);s.step(1/60,{x:(x-s.p.x)/d,z:(z-s.p.z)/d,jump:s.grounded&&z>68});}}
 s.step(1/60,{x:0,z:0,interact:true});assert.equal(s.cache,true,JSON.stringify(s.p));assert.ok(s.notes.includes('routefinder'));assert.equal(s.deaths,0);
});
