import { validProgress,type Progress,type GhostFrame } from './simulation';
const PREFIX='last-tether-v1:';
export type Run={date:string;seconds:number;deaths:number;ghost:GhostFrame[]};
export class Saves{
 available=true;
 read(key:string):unknown{try{const v=localStorage.getItem(PREFIX+key);return v?JSON.parse(v):null;}catch{this.available=false;return null;}}
 write(key:string,value:unknown){try{localStorage.setItem(PREFIX+key,JSON.stringify(value));return true;}catch{this.available=false;return false;}}
 progress(){return validProgress(this.read('story'));}
 save(p:Progress){return this.write('story',p);}
 reset(){try{localStorage.removeItem(PREFIX+'story');}catch{this.available=false;}}
 runs():Run[]{const r=this.read('runs');if(!Array.isArray(r))return[];return r.filter(v=>v&&typeof v.date==='string'&&Number.isFinite(v.seconds)&&v.seconds>0&&Number.isInteger(v.deaths)&&Array.isArray(v.ghost)&&v.ghost.length<=18000&&v.ghost.every((f:any)=>['t','x','y','z','yaw'].every(k=>Number.isFinite(f[k])))).slice(0,20);}
 addRun(run:Run){const all=[...this.runs(),run];const dates=[...new Set(all.map(r=>r.date))].sort().reverse().slice(0,4);const runs=dates.flatMap(date=>all.filter(r=>r.date===date).sort((a,b)=>a.seconds-b.seconds).slice(0,5));return this.write('runs',runs);}
 best(date:string){return this.runs().filter(r=>r.date===date).sort((a,b)=>a.seconds-b.seconds)[0];}
}
export function formatTime(s:number){const min=Math.floor(s/60),sec=Math.floor(s%60);return `${String(min).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;}
