import {Simulation,flat,vec,type Input,type Enemy} from '../src/simulation.ts';

// Input-only agent for deterministic integration checks. It never teleports,
// changes health, edits progression, removes enemies, or grants invulnerability.
export class RouteDriver{
 stage=-1;phase=0;frames=0;lastDeaths=0;bossTarget={x:14,z:234};
 move(s:Simulation,x:number,z:number,speed=1):Input{const d=Math.hypot(x-s.p.x,z-s.p.z);return {x:d>.15?(x-s.p.x)/d*speed:0,z:d>.15?(z-s.p.z)/d*speed:0};}
 close(s:Simulation,x:number,z:number,r=.65){return Math.hypot(s.p.x-x,s.p.z-z)<r;}
 fight(s:Simulation,e:Enemy):Input{const d=flat(s.p,e.p);const out=this.move(s,e.p.x,e.p.z,d<2.9?.18:1);out.attack=d<3.8;out.jump=s.grounded&&e.p.y>s.p.y+.6;if(e.state==='windup'&&e.timer<.18&&d<5){out.x=(s.p.z-e.p.z)/(d||1);out.z=-(s.p.x-e.p.x)/(d||1);out.dodge=true;}return out;}
 next(s:Simulation):Input{this.frames++;if(s.stage!==this.stage){this.stage=s.stage;this.phase=0;}if(s.deaths!==this.lastDeaths){this.phase=0;this.lastDeaths=s.deaths;}if(s.deathTimer>0)return{x:0,z:0};
 if(s.stage===0){if(this.phase===0){if(s.p.z<12)return this.move(s,0,12);this.phase=1;return{x:0,z:1,tether:true};}if(this.phase===1){if(s.p.z<24)return{x:0,z:1,pull:true};this.phase=2;return{x:0,z:1,jump:true};}return this.move(s,0,40);}
 if(s.stage===1){const e=s.enemies.filter(e=>e.id.startsWith('terrace')&&e.hp>0).sort((a,b)=>flat(s.p,a.p)-flat(s.p,b.p))[0];return e?this.fight(s,e):{x:0,z:0};}
 if(s.stage===2){if(this.phase===0){if(!this.close(s,-4,69))return this.move(s,-4,69);this.phase=1;}if(this.phase===1){if(s.p.z<96)return this.move(s,-4,97);this.phase=2;}return this.move(s,0,103);}
 if(s.stage===3){if(!this.close(s,3,105))return this.move(s,3,105);return{x:0,z:0,tether:!s.tetherId,pull:true};}
 if(s.stage===4){if(this.phase===0){if(!this.close(s,0,135))return this.move(s,0,135);this.phase=1;return{x:0,z:1,tether:true};}if(this.phase===1){if(s.p.z<150)return{x:0,z:1,pull:true};this.phase=2;return{x:0,z:1,jump:true};}return this.move(s,0,162);}
 if(s.stage===5){const e=s.enemies.filter(e=>e.id.startsWith('court')&&e.hp>0).sort((a,b)=>flat(s.p,a.p)-flat(s.p,b.p))[0];if(e)return this.fight(s,e);if(this.close(s,0,190,2))return{x:0,z:0,interact:true};return this.move(s,0,190);}
 if(s.stage===6){const b=s.enemies.find(e=>e.kind==='slateback')!;if(s.p.z<226)return this.move(s,0,227);if(b.state==='stunned'&&b.armour){if(flat(s.p,b.p)>9)return this.move(s,b.p.x,b.p.z);return{...this.move(s,b.p.x,b.p.z,.2),tether:!s.tetherId,pull:true};}if(!b.armour)return this.fight(s,b);
 // Stand on the far side of whichever support is easiest to line up.
 if(b.state==='windup'||b.state==='charge'){return{x:0,z:0};}
 const pillar={x:b.p.x>0?-9:9,z:240};const dx=pillar.x-b.p.x,dz=pillar.z-b.p.z,d=Math.hypot(dx,dz)||1;const target={x:Math.max(-14,Math.min(14,pillar.x+dx/d*5)),z:Math.max(226,Math.min(263,pillar.z+dz/d*5))};return this.move(s,target.x,target.z);
 }
 if(s.stage===7){if(!s.gate){if(this.close(s,0,273,2))return{x:0,z:0,interact:true};return this.move(s,0,273);}if(this.phase===0){if(s.p.z<286)return this.move(s,0,286);this.phase=1;return{x:0,z:1,tether:true};}if(this.phase===1){if(s.p.z<302)return{x:0,z:1,pull:true};this.phase=2;return{x:0,z:1,jump:true};}if(s.p.z<309.3)return this.move(s,0,310);if(s.grounded&&s.p.y<7)return{x:0,z:1,jump:true};return this.move(s,0,324);}
 return{x:0,z:0};}
}

