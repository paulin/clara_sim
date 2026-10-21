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
