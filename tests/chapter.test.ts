import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Simulation,dailySeed} from '../src/simulation.ts';
import {RouteDriver} from './route-driver.ts';

test('complete chapter is reachable with inputs alone',()=>{const s=new Simulation(),driver=new RouteDriver();let frames=0;while(!s.finished&&frames++<24000)s.step(1/60,driver.next(s));assert.equal(s.finished,true,JSON.stringify({stage:s.stage,position:s.p,health:s.health,deaths:s.deaths,boss:s.enemies.at(-1)}));assert.equal(s.stage,8);assert.equal(s.terrace&&s.bridge&&s.courtyard&&s.boss&&s.gate,true);assert.ok(s.notes.includes('slateback'));console.log(JSON.stringify({chapter:'complete',seconds:s.elapsed,deaths:s.deaths,frames,notes:s.notes}));});
test('dated challenge can finish through actual movement and puzzle inputs',()=>{const s=new Simulation(null,'daily',dailySeed('2026-11-01')),driver=new RouteDriver();let frames=0;while(!s.finished&&frames++<6000)s.step(1/60,driver.next(s));assert.equal(s.finished,true,JSON.stringify({stage:s.stage,p:s.p,deaths:s.deaths}));assert.equal(s.bridge,true);assert.ok(s.ghost.length>50);console.log(JSON.stringify({daily:'complete',seconds:s.elapsed,deaths:s.deaths,frames,ghost:s.ghost.length}));});
