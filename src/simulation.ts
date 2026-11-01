export type V3 = { x: number; y: number; z: number };
export type Input = { x:number; z:number; jump?:boolean; attack?:boolean; dodge?:boolean; tether?:boolean; pull?:boolean; interact?:boolean };
export type Platform = { id:string; x:number; z:number; w:number; d:number; y:number; enabled:boolean; kind?:string };
export type Anchor = { id:string; p:V3; kind:'swing'|'pin'|'cargo'|'armour'; active:boolean };
export type Enemy = { id:string; kind:'scrabbler'|'spitter'|'reefwing'|'slateback'; p:V3; home:V3; hp:number; maxHp:number; state:string; timer:number; cooldown:number; dir:V3; active:boolean; flash:number; armour:boolean; exposed:number; pull:number };
export type Shot = {p:V3; v:V3; life:number};
export type GameEvent = { type:string; text?:string; p?:V3 };
export type Progress = {version:1; stage:number; checkpoint:number; bridge:boolean; terrace:boolean; courtyard:boolean; boss:boolean; gate:boolean; cache:boolean; notes:string[]; deaths:number; elapsed:number};
export type GhostFrame = {t:number;x:number;y:number;z:number;yaw:number};
export const vec=(x=0,y=0,z=0):V3=>({x,y,z});
export const dist=(a:V3,b:V3)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);
export const flat=(a:V3,b:V3)=>Math.hypot(a.x-b.x,a.z-b.z);
export const clamp=(v:number,a:number,b:number)=>Math.max(a,Math.min(b,v));
export const CHECKPOINTS=[vec(0,5,3),vec(0,5,39),vec(-4,5,68),vec(0,5,101),vec(0,5,130),vec(0,5,163),vec(0,5,195),vec(0,2,271)];
export const OBJECTIVES=[
 ['THE BROKEN SPILLWAY','Reach the supply terrace','Cross the broken bridge. Attach to a gold anchor, then reel towards it.'],
 ['THE SUPPLY TERRACE','Clear the terrace','Watch for the crouch. Dodge a leap, then strike with your spear.'],
 ['A ROUTE THROUGH','Find the counterweight bridge','Follow the lamps. The upper path holds a routefinder’s cache.'],
 ['WEIGHT & CONSEQUENCE','Lower the maintenance bridge','Attach to the gold release pin beside the winch. Hold reel to pull it free.'],
 ['THE EXPOSED SPAN','Cross the reefwing’s territory','Watch its dive warning. Use the high anchor to cross the break.'],
 ['THE OLD STATION','Secure the courtyard','Clear the predators, then open the maintenance shortcut at the green lamp.'],
 ['BECOME THE HUNTER','Defeat the Slateback','Bait its charge into a striped support. Tether and pull the loosened armour.'],
 ['THE FLOODGATE','Divert the surge','Operate the wheel behind the arena. Then reach the high refuge.'],
 ['THE VALLEY HOLDS','Chapter complete','The route ahead is yours.']
];
export function makePlatforms():Platform[]{
 const a:Platform[]=[];const p=(id:string,x:number,z:number,w:number,d:number,y:number,kind='stone',enabled=true)=>a.push({id,x,z,w,d,y,kind,enabled});
 p('arrival',0,4,9,24,5); p('recovery',0,20,12,8,0);p('landing',0,31,9,16,5);p('terrace',0,51,26,26,5);
 p('main-path',-4,81,8,34,5);p('fork-link',1,67,14,6,5);
 p('lookout-step1',7,72,5,6,6);p('lookout-step2',10,78,5,6,7);p('lookout',10,86,8,10,8);p('lookout-down',7,94,6,6,6);
 p('winch',0,105,20,14,5);p('counterweight-bridge',0,120,6,16,5,'bridge',false);p('span-a',0,133,8,10,5);p('span-rest',-6,137,6,6,5);p('span-b',0,154,8,14,5);
 p('courtyard',0,177,29,34,5);p('spitter-step',10,174,4,6,6);p('spitter-perch',11,181,6,8,7);
 p('station',0,201,14,18,5);p('stairs-a',0,212,10,4,4);p('stairs-b',0,216,10,4,3);p('stairs-c',0,220,10,4,2);
 p('boss-arena',0,245,34,46,2);p('gate',0,273,12,10,2);p('escape-a',0,284,7,12,2);p('escape-b',0,303,8,14,5);p('escape-step',0,313,8,6,6);p('refuge',0,326,20,20,7);
 return a;
}
export const PILLARS=[vec(-9,2,240),vec(9,2,240),vec(0,2,260)];
export const COVER=[{x:-6,z:175,r:1.4},{x:5,z:181,r:1.4},{x:-7,z:187,r:1.3}];
export function validProgress(raw:unknown):Progress|null{
 if(!raw||typeof raw!=='object')return null;const p=raw as Progress;
 if(p.version!==1||!Number.isInteger(p.stage)||p.stage<0||p.stage>8||!Number.isInteger(p.checkpoint)||p.checkpoint<0||p.checkpoint>7)return null;
 if(!['bridge','terrace','courtyard','boss','gate','cache'].every(k=>typeof (p as any)[k]==='boolean'))return null;
 if(!Number.isFinite(p.elapsed)||p.elapsed<0||!Number.isFinite(p.deaths)||p.deaths<0||!Array.isArray(p.notes))return null;
 if((p.stage>=2&&!p.terrace)||(p.stage>=4&&!p.bridge)||(p.stage>=6&&!p.courtyard)||(p.stage>=7&&!p.boss)||(p.stage===8&&!p.gate))return null;
 const maxCheckpoint=[0,1,2,3,4,5,6,7,7][p.stage];if(p.checkpoint>maxCheckpoint)return null;
 if((p.terrace&&p.stage<2)||(p.bridge&&p.stage<4)||(p.courtyard&&p.stage<6)||(p.boss&&p.stage<7)||(p.gate&&p.stage<7))return null;
 return {version:1,stage:p.stage,checkpoint:p.checkpoint,bridge:p.bridge,terrace:p.terrace,courtyard:p.courtyard,boss:p.boss,gate:p.gate,cache:p.cache,notes:p.notes.filter(n=>typeof n==='string').map(n=>n.slice(0,64)).slice(0,12),deaths:Math.floor(p.deaths),elapsed:p.elapsed};
}
export function dailySeed(date:string){let h=2166136261;for(const c of date)h=Math.imul(h^c.charCodeAt(0),16777619);return h>>>0;}
export class Simulation{
 p=vec(0,5,3);v=vec();yaw=0;health=100;grounded=true;invulnerable=0;attackCooldown=0;attackAnim=0;dodgeCooldown=0;dodgeTime=0;dodgeDir=vec();
 stage=0;checkpoint=0;bridge=false;terrace=false;courtyard=false;boss=false;gate=false;cache=false;notes:string[]=[];deaths=0;elapsed=0;escapeTime=75;finished=false;
 platforms=makePlatforms();anchors:Anchor[]=[{id:'first',p:vec(0,14,23),kind:'swing',active:true},{id:'pin',p:vec(6,7,108),kind:'pin',active:true},{id:'span',p:vec(0,15,149),kind:'swing',active:true},{id:'cargo',p:vec(-2,11,178),kind:'cargo',active:true},{id:'escape',p:vec(0,16,301),kind:'swing',active:true},{id:'armour',p:vec(),kind:'armour',active:false}];
 enemies:Enemy[]=[];shots:Shot[]=[];events:GameEvent[]=[];tetherId:string|null=null;ropeLength=0;pullProgress=0;cargoDropped=false;time=0;deathTimer=0;lastSafe=vec(0,5,3);coyote=0;mode:'story'|'daily'='story';ghost:GhostFrame[]=[];recordTimer=0;seed=0;
 constructor(save?:Progress|null,mode:'story'|'daily'='story',seed=0){this.mode=mode;this.seed=seed;this.spawnEnemies();if(save&&mode==='story')this.restore(save);if(mode==='daily'){this.stage=2;this.checkpoint=2;this.terrace=true;this.p={...CHECKPOINTS[2]};this.enemies.filter(e=>e.id.startsWith('terrace')).forEach(e=>e.hp=0);}}
 spawnEnemies(){const add=(id:string,kind:Enemy['kind'],x:number,y:number,z:number,hp:number)=>this.enemies.push({id,kind,p:vec(x,y,z),home:vec(x,y,z),hp,maxHp:hp,state:'idle',timer:1,cooldown:0,dir:vec(),active:false,flash:0,armour:kind==='slateback',exposed:0,pull:0});
 add('terrace-a','scrabbler',-4,5,48,45);add('terrace-b','scrabbler',4,5,54,45);add('reefwing','reefwing',7,11,143,45);this.enemies[2].timer=1+(this.seed%5)*.35;add('court-a','scrabbler',-4,5,175,60);add('court-b','scrabbler',4,5,179,60);add('court-spitter','spitter',11,7,181,65);add('slateback','slateback',0,2,248,210);}
 save():Progress{return {version:1,stage:this.stage,checkpoint:this.checkpoint,bridge:this.bridge,terrace:this.terrace,courtyard:this.courtyard,boss:this.boss,gate:this.gate,cache:this.cache,notes:[...this.notes],deaths:this.deaths,elapsed:this.elapsed};}
 restore(s:Progress){Object.assign(this,s);this.p={...CHECKPOINTS[s.checkpoint]};this.lastSafe={...this.p};this.platforms.find(p=>p.id==='counterweight-bridge')!.enabled=s.bridge;this.anchors.find(a=>a.id==='pin')!.active=!s.bridge;
 for(const e of this.enemies){if((s.terrace&&e.id.startsWith('terrace'))||(s.courtyard&&e.id.startsWith('court'))||(s.boss&&e.kind==='slateback'))e.hp=0;}
 if(s.stage===8){this.finished=true;this.p=vec(0,7,325);} if(s.gate&&!this.finished){this.escapeTime=75;}}
 event(type:string,text?:string,p?:V3){this.events.push({type,text,p});}
 note(id:string){if(!this.notes.includes(id)){this.notes.push(id);this.event('note',id);}}
 setStage(n:number,cp?:number){if(n<=this.stage)return;this.stage=n;if(cp!==undefined)this.checkpoint=cp;this.health=100;this.event('stage',OBJECTIVES[n][1]);this.event('save');}
 get target(){let best:Anchor|null=null;let score=1e6;for(const a of this.anchors){if(!a.active)continue;if(a.kind==='swing'&&a.id==='escape'&&!this.gate)continue;const d=dist(vec(this.p.x,this.p.y+1,this.p.z),a.p);const max=a.kind==='swing'?29:13;if(d>max)continue;const dz=a.p.z-this.p.z;const dx=a.p.x-this.p.x;const facing=(dx*Math.sin(this.yaw)+dz*Math.cos(this.yaw))/Math.max(0.01,Math.hypot(dx,dz));const s=d+(facing<-.2?20:0)+(a.kind==='swing'?3:0);if(s<score){best=a;score=s;}}return best;}
 toggleTether(){if(this.tetherId){this.tetherId=null;this.event('detach');return;}const a=this.target;if(!a){this.event('hint','Move closer to a gold anchor or exposed target.');return;}this.tetherId=a.id;this.ropeLength=dist(vec(this.p.x,this.p.y+1,this.p.z),a.p);this.pullProgress=0;this.event('attach',a.kind,a.p);}
 hurt(amount:number){if(this.invulnerable>0||this.finished||this.deathTimer>0)return;this.health=Math.max(0,this.health-amount);this.invulnerable=.8;this.event('hurt');if(this.health===0)this.die();}
 die(){if(this.deathTimer>0||this.finished)return;this.deaths++;this.deathTimer=1;this.tetherId=null;this.event('death','Back to your last safe route.');}
 respawn(){const state=this.save();state.gate=false;this.gate=false;this.shots=[];this.enemies=[];this.spawnEnemies();this.restore(state);this.v=vec();this.health=100;this.invulnerable=2;this.grounded=true;this.deathTimer=0;this.pullProgress=0;this.escapeTime=75;this.event('respawn');this.event('save');}
 attack(){if(this.attackCooldown>0||this.deathTimer>0)return;this.attackCooldown=.43;this.attackAnim=.28;this.event('swing');let hit=false;for(const e of this.enemies){if(e.hp<=0)continue;const d=flat(this.p,e.p),dy=Math.abs(this.p.y-e.p.y);const facing=((e.p.x-this.p.x)*Math.sin(this.yaw)+(e.p.z-this.p.z)*Math.cos(this.yaw))/Math.max(.01,d);if(d<(e.kind==='slateback'?4.4:3.8)&&dy<3&&facing>-.15){if(e.kind==='slateback'&&e.armour){this.event('hint','Armoured. Bait a charge into a striped support.');continue;}e.hp=Math.max(0,e.hp-25);e.flash=.18;hit=true;this.event('hit',undefined,e.p);if(e.hp===0)this.event('kill',e.kind,e.p);}}
 if(hit)this.invulnerable=Math.max(this.invulnerable,.1);}
 blocked(a:V3,b:V3){for(const c of COVER){const dx=b.x-a.x,dz=b.z-a.z,t=clamp(((c.x-a.x)*dx+(c.z-a.z)*dz)/(dx*dx+dz*dz),0,1);if(Math.hypot(a.x+dx*t-c.x,a.z+dz*t-c.z)<c.r+.25)return true;}return false;}
 step(dt:number,input:Input){dt=Math.min(dt,.05);if(this.finished)return;this.time+=dt;if(this.deathTimer>0){this.deathTimer-=dt;if(this.deathTimer<=0)this.respawn();return;}this.elapsed+=dt;
 this.invulnerable=Math.max(0,this.invulnerable-dt);this.attackCooldown=Math.max(0,this.attackCooldown-dt);this.attackAnim=Math.max(0,this.attackAnim-dt);this.dodgeCooldown=Math.max(0,this.dodgeCooldown-dt);this.dodgeTime=Math.max(0,this.dodgeTime-dt);
 if(input.tether)this.toggleTether();if(input.attack)this.attack();
 let ix=input.x,iz=input.z;const len=Math.hypot(ix,iz);if(len>1){ix/=len;iz/=len;}if(len>.1)this.yaw=Math.atan2(ix,iz);
 if(input.dodge&&this.dodgeCooldown===0){this.dodgeCooldown=.85;this.dodgeTime=.24;this.invulnerable=.3;this.dodgeDir=len>.1?vec(ix,0,iz):vec(Math.sin(this.yaw),0,Math.cos(this.yaw));this.event('dodge');}
 if(this.grounded)this.coyote=.12;else this.coyote=Math.max(0,this.coyote-dt);
 if(input.jump){if(this.tetherId){this.tetherId=null;this.v.y=Math.max(this.v.y,5);this.event('detach');}else if(this.coyote>0){this.v.y=10.7;this.grounded=false;this.coyote=0;this.event('jump');}}
 const speed=this.dodgeTime>0?18:7.7;const tx=this.dodgeTime>0?this.dodgeDir.x:ix,tz=this.dodgeTime>0?this.dodgeDir.z:iz;const accel=this.grounded?15:4;
 this.v.x+=(tx*speed-this.v.x)*Math.min(1,accel*dt);this.v.z+=(tz*speed-this.v.z)*Math.min(1,accel*dt);this.v.y-=23*dt;
 const oldY=this.p.y,oldX=this.p.x,oldZ=this.p.z;this.p.x+=this.v.x*dt;this.p.y+=this.v.y*dt;this.p.z+=this.v.z*dt;
 const anchor=this.anchors.find(a=>a.id===this.tetherId);
 if(anchor?.active){if(anchor.kind==='swing'){if(input.pull)this.ropeLength=Math.max(2.2,this.ropeLength-10*dt);const chest=vec(this.p.x,this.p.y+1,this.p.z),d=dist(chest,anchor.p);if(d>this.ropeLength){const nx=(chest.x-anchor.p.x)/d,ny=(chest.y-anchor.p.y)/d,nz=(chest.z-anchor.p.z)/d;this.p=vec(anchor.p.x+nx*this.ropeLength,anchor.p.y+ny*this.ropeLength-1,anchor.p.z+nz*this.ropeLength);const dot=this.v.x*nx+this.v.y*ny+this.v.z*nz;if(dot>0){this.v.x-=dot*nx;this.v.y-=dot*ny;this.v.z-=dot*nz;}}}
 else if(input.pull){this.pullProgress+=dt;if(this.pullProgress>1.05){if(anchor.kind==='pin'){this.bridge=true;this.platforms.find(p=>p.id==='counterweight-bridge')!.enabled=true;anchor.active=false;this.note('counterweight');this.setStage(4,4);this.event('bridge');}
 if(anchor.kind==='cargo'){this.cargoDropped=true;anchor.active=false;for(const e of this.enemies.filter(e=>e.id.startsWith('court')&&flat(e.p,vec(-2,5,178))<8)){e.hp=Math.max(0,e.hp-70);e.flash=.3;}this.event('cargo');}
 if(anchor.kind==='armour'){const boss=this.enemies.find(e=>e.kind==='slateback')!;if(boss.state==='stunned'){boss.armour=false;boss.exposed=12;boss.state='recover';boss.timer=2.8;boss.hp=Math.max(0,boss.hp-35);this.note('slateback');this.event('armour');}}
 this.tetherId=null;this.pullProgress=0;}}
 }else if(this.tetherId)this.tetherId=null;
 // Raised stone has solid sides, matching the rendered 2.4-unit slabs.
 // Resolve a side entry before looking for a landing on the top surface.
 for(const f of this.platforms){if(!f.enabled||oldY>=f.y-.22||this.p.y>=f.y-.22||this.p.y+1.8<f.y-2.4)continue;
 const rx=f.w/2+.32,rz=f.d/2+.32,dx=this.p.x-f.x,dz=this.p.z-f.z;
 if(Math.abs(dx)>=rx||Math.abs(dz)>=rz)continue;
 if(Math.abs(oldX-f.x)>=rx){this.p.x=f.x+Math.sign(oldX-f.x)*rx;this.v.x=0;}
 else if(Math.abs(oldZ-f.z)>=rz){this.p.z=f.z+Math.sign(oldZ-f.z)*rz;this.v.z=0;}
 else if(rx-Math.abs(dx)<rz-Math.abs(dz)){this.p.x=f.x+(Math.sign(dx)||1)*rx;this.v.x=0;}
 else{this.p.z=f.z+(Math.sign(dz)||1)*rz;this.v.z=0;}
 }
 this.grounded=false;let ground=-100;for(const f of this.platforms){if(!f.enabled)continue;if(Math.abs(this.p.x-f.x)<f.w/2+.22&&Math.abs(this.p.z-f.z)<f.d/2+.22){if(this.v.y<=0&&oldY>=f.y-.22&&this.p.y<=f.y&&f.y>ground)ground=f.y;}}
 if(ground>-99){this.p.y=ground;this.v.y=0;this.grounded=true;this.lastSafe={...this.p};}
 // Physical barriers and cover; combat gates are visibly represented by portcullises.
 if(!this.terrace&&this.p.z>63){this.p.z=63;this.v.z=0;}if(!this.courtyard&&this.p.z>193){this.p.z=193;this.v.z=0;}if(!this.boss&&this.p.z>267){this.p.z=267;this.v.z=0;}if(!this.gate&&this.p.z>278){this.p.z=278;this.v.z=0;}
 for(const c of [...COVER,...PILLARS.map(p=>({x:p.x,z:p.z,r:1.4}))]){const d=Math.hypot(this.p.x-c.x,this.p.z-c.z);if(this.p.y<8&&d<c.r+.45){const nx=(this.p.x-c.x)/(d||1),nz=(this.p.z-c.z)/(d||1);this.p.x=c.x+nx*(c.r+.45);this.p.z=c.z+nz*(c.r+.45);}}
 if(this.p.y<-9)this.die();
 if(input.interact)this.interact();this.updateEnemies(dt);this.updateProgress();
 if(this.gate){this.escapeTime-=dt;if(this.escapeTime<=0)this.die();if(this.p.z>319&&this.p.y>=6.8&&this.grounded){this.finished=true;this.stage=8;this.event('complete');this.event('save');}}
 if(this.mode==='daily'&&this.p.z>=160){this.finished=true;this.event('complete');}
 this.recordTimer+=dt;if(this.recordTimer>.1){this.recordTimer=0;this.ghost.push({t:this.elapsed,x:this.p.x,y:this.p.y,z:this.p.z,yaw:this.yaw});if(this.ghost.length>18000)this.ghost.shift();}
 }
 interact(){if(this.p.y<2&&this.p.z<26){this.p=vec(0,5,27);this.v=vec();this.event('hint','You found the maintenance ladder. Try the next anchor.');return;}
 if(!this.cache&&flat(this.p,vec(10,8,86))<4&&this.p.y>6.5){this.cache=true;this.health=100;this.note('routefinder');this.event('cache','Routefinder’s cache · field note recovered');this.event('save');return;}
 if(this.stage===5&&flat(this.p,vec(0,5,190))<5){if(this.enemies.some(e=>e.id.startsWith('court')&&e.hp>0)){this.event('hint','Clear the courtyard before opening the shortcut.');return;}this.courtyard=true;this.setStage(6,6);this.note('hunter');return;}
 if(this.boss&&!this.gate&&flat(this.p,vec(0,2,273))<4){this.gate=true;this.checkpoint=7;this.escapeTime=75;this.event('gate','The water is moving. Reach the high refuge!');this.event('save');}
 }
 updateProgress(){if(this.stage===0&&this.p.z>38)this.setStage(1,1);if(this.stage===1&&this.enemies.filter(e=>e.id.startsWith('terrace')).every(e=>e.hp<=0)){this.terrace=true;this.note('scrabbler');this.setStage(2,2);}if(this.stage===2&&this.p.z>98)this.setStage(3,3);if(this.stage===4&&this.p.z>160)this.setStage(5,5);const b=this.enemies.find(e=>e.kind==='slateback')!;if(b.hp<=0&&!this.boss){this.boss=true;this.anchors.find(a=>a.id==='armour')!.active=false;this.setStage(7,7);this.event('bossdown');}}
 updateEnemies(dt:number){for(const e of this.enemies){e.flash=Math.max(0,e.flash-dt);if(e.hp<=0){e.active=false;continue;}const distance=flat(e.p,this.p);e.active=e.kind==='reefwing'?this.p.z>128&&this.p.z<161:e.kind==='slateback'?this.p.z>222&&this.stage>=6:distance<22&&Math.abs(this.p.y-e.p.y)<7;if(!e.active)continue;e.timer-=dt;e.cooldown=Math.max(0,e.cooldown-dt);
 if(e.kind==='slateback'){this.updateBoss(e,dt);continue;}
 if(e.kind==='reefwing'){if(e.state==='idle'){e.p.x=Math.sin(this.time*1.4)*8;e.p.z=143+Math.cos(this.time)*4;e.p.y=11+Math.sin(this.time*2);if(e.timer<=0){e.state='windup';e.timer=1.4;e.dir={...this.p};this.event('warning','Reefwing diving · move away',e.dir);}}
 else if(e.state==='windup'&&e.timer<=0){e.state='dive';e.timer=.65;}
 else if(e.state==='dive'){e.p.x+=(e.dir.x-e.p.x)*dt*6;e.p.z+=(e.dir.z-e.p.z)*dt*6;e.p.y+=(e.dir.y+.8-e.p.y)*dt*6;if(dist(e.p,vec(this.p.x,this.p.y+.8,this.p.z))<1.8)this.hurt(16);if(e.timer<=0){e.state='idle';e.timer=3.5;}}
 continue;}
 if(e.kind==='spitter'){if(e.state==='idle'&&e.timer<=0){e.state='windup';e.timer=1.1;e.dir=vec(this.p.x,this.p.y+1,this.p.z);}
 else if(e.state==='windup'&&e.timer<=0){const from=vec(e.p.x,e.p.y+1.2,e.p.z),d=dist(from,e.dir);this.shots.push({p:from,v:vec((e.dir.x-from.x)/d*13,(e.dir.y-from.y)/d*13,(e.dir.z-from.z)/d*13),life:3});e.state='idle';e.timer=2.4;this.event('spit');}continue;}
 if(e.state==='idle'){if(distance>2.5){e.p.x+=(this.p.x-e.p.x)/distance*2.8*dt;e.p.z+=(this.p.z-e.p.z)/distance*2.8*dt;const zmin=e.id.startsWith('court')?162:39,zmax=e.id.startsWith('court')?192:62;e.p.z=clamp(e.p.z,zmin,zmax);e.p.x=clamp(e.p.x,-12,12);}if(distance<5&&e.timer<=0){e.state='windup';e.timer=.75;const d=Math.max(.1,distance);e.dir=vec((this.p.x-e.p.x)/d,0,(this.p.z-e.p.z)/d);}}
 else if(e.state==='windup'&&e.timer<=0){e.state='leap';e.timer=.42;}
 else if(e.state==='leap'){e.p.x+=e.dir.x*10*dt;e.p.z+=e.dir.z*10*dt;if(flat(e.p,this.p)<1.65&&Math.abs(e.p.y-this.p.y)<2)this.hurt(16);if(e.timer<=0){e.state='recover';e.timer=1;}}
 else if(e.state==='recover'&&e.timer<=0){e.state='idle';e.timer=.5;}
 }
 for(const s of this.shots){const old={...s.p};s.p.x+=s.v.x*dt;s.p.y+=s.v.y*dt;s.p.z+=s.v.z*dt;s.life-=dt;if(this.blocked(old,s.p))s.life=0;if(dist(s.p,vec(this.p.x,this.p.y+1,this.p.z))<.9){this.hurt(18);s.life=0;}}this.shots=this.shots.filter(s=>s.life>0);
 }
 updateBoss(e:Enemy,dt:number){const a=this.anchors.find(a=>a.id==='armour')!;a.p=vec(e.p.x,e.p.y+2,e.p.z);a.active=e.state==='stunned'&&e.armour;e.exposed=Math.max(0,e.exposed-dt);if(!e.armour&&e.exposed===0){e.armour=true;this.event('hint','Its armour settles. Bait another charge.');}
 if(e.state==='idle'){if(e.timer<=0){const d=Math.max(.1,flat(this.p,e.p));e.dir=vec((this.p.x-e.p.x)/d,0,(this.p.z-e.p.z)/d);e.state='windup';e.timer=1.6;this.event('warning','Slateback charging · dodge sideways',e.p);}}
 else if(e.state==='windup'&&e.timer<=0){e.state='charge';e.timer=1.5;this.event('charge');}
 else if(e.state==='charge'){e.p.x+=e.dir.x*18*dt;e.p.z+=e.dir.z*18*dt;if(flat(e.p,this.p)<3&&Math.abs(e.p.y-this.p.y)<3)this.hurt(30);const pillar=PILLARS.find(p=>flat(e.p,p)<3);if(pillar){e.state='stunned';e.timer=7;e.armour=true;e.pull=0;this.event('stun','Armour loose! Attach and hold reel.',e.p);}else if(e.timer<=0||Math.abs(e.p.x)>14||e.p.z<225||e.p.z>264){e.p.x=clamp(e.p.x,-14,14);e.p.z=clamp(e.p.z,225,264);e.state='recover';e.timer=2;}}
 else if(e.state==='stunned'&&e.timer<=0){e.state='recover';e.timer=1.5;}
 else if(e.state==='recover'&&e.timer<=0){e.state='idle';e.timer=1.2;}
 }
}
