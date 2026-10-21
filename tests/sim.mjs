import assert from 'node:assert/strict';
import {simulate,delay} from '../dist/sim.mjs';
const base=simulate(0),late=simulate(30);
assert.equal(base.events.filter(e=>e.kind==='delay').length,0);
assert.deepEqual(base.cases.map(c=>c.start),[0,20,45,60,75,95]);
assert.deepEqual(late.cases.map(c=>c.start),[0,50,75,90,105,125]);
assert.equal(late.cases.reduce((n,c)=>n+delay(c,210),0),150);
assert.deepEqual(simulate(30,25),simulate(30,25));
for(let conflict=0;conflict<=60;conflict+=5){const full=simulate(conflict);for(const c of full.cases){assert(c.start>=c.plan);if(c.prior){const p=full.cases.find(x=>x.id===c.prior);assert(c.start>=p.end+15)}}
const uses=full.cases.filter(c=>c.us);for(let i=1;i<uses.length;i++)assert(uses[i].start>=uses[i-1].start+uses[i-1].us+(i===1?conflict:0)+5);
for(let t=0;t<=210;t++){const s=simulate(conflict,t);assert(s.events.every(e=>e.time<=t));assert(s.cases.every(c=>c.start===null||c.start<=t));const replay=simulate(conflict,t);assert.deepEqual(s,replay)}}
const before=simulate(30,19),after=simulate(30,20);assert.equal(before.cases[1].start,null);assert.equal(delay(after.cases[1],20),0);assert(after.events.some(e=>e.kind==='delay'&&e.entity==='B'));
assert.equal(simulate(30,50).cases[1].start,50);assert.equal(simulate(30,49).cases[1].start,null);
console.log('PASS: baseline, cascade, exclusive equipment, room dependencies, no future events and replay across all 13 conflict settings and 211 clock positions.');

// Physical location and movement must agree with resource gates and replay.
const {position,route}=await import('../dist/floor.mjs');
const walking=simulate(30,19).staff.find(p=>p.id==='S2');
assert.equal(walking.location,'CORRIDOR');assert.deepEqual(walking.motion,{from:'OFFICE',to:'OR2',depart:18,arrive:20});
assert.equal(simulate(30,20).staff.find(p=>p.id==='S2').location,'OR2');
assert.equal(simulate(30,76).staff.find(p=>p.id==='S1').motion.to,'OFFICE');
assert.equal(simulate(30,79).staff.find(p=>p.id==='A1').location,'REC');
assert.equal(simulate(30,84).staff.find(p=>p.id==='N1').location,'OR1');
assert.equal(simulate(30,87).staff.find(p=>p.id==='N1').location,'WORK');
assert(simulate(30,89).staff.filter(p=>p.room===1).every(p=>p.motion.to==='OR1'));
assert(simulate(30,90).staff.filter(p=>p.room===1).every(p=>p.location==='OR1'));
assert.equal(simulate(30,46).machine.status,'Cleaning');
const moving=simulate(30,49).machine;assert.equal(moving.status,'In transit');assert.deepEqual(moving.motion,{from:'OR1',to:'OR2',depart:48,arrive:50});
assert.equal(simulate(30,50).machine.location,'OR2');
assert.equal(simulate(30,100).machine.location,'HUB');
const atStart=position(moving,48,'US'),mid=position(moving,49,'US'),atEnd=position(moving,50,'US');
assert.notDeepEqual(atStart,mid);assert.notDeepEqual(mid,atEnd);assert.deepEqual(mid,position(moving,49,'US'));
assert(route(moving.motion,'US').some(p=>p[1]===305));
for(let conflict=0;conflict<=60;conflict+=5){
 for(let time=0;time<=210;time+=.5){const state=simulate(conflict,time);assert.equal(new Set(state.staff.map(p=>p.id)).size,9);
  for(const p of [...state.staff,state.machine]){if(p.motion){assert.equal(p.location,'CORRIDOR');assert(p.motion.depart<=time&&p.motion.arrive>time)}const xy=position(p,time,p.id||'US');assert(xy.every(Number.isFinite))}
  for(const c of state.cases.filter(c=>c.start===time)){assert(state.staff.filter(p=>p.room===c.room).every(p=>p.location===`OR${c.room}`&&!p.motion));if(c.us)assert.equal(state.machine.location,`OR${c.room}`)}
 }
}
console.log('PASS: staff routines, cleaning/travel stages, physical start gates, corridor paths, fractional motion and rewind consistency.');
