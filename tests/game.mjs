import assert from 'node:assert/strict';
import {defaultConfig,simulateGame,costs,END,catalog} from '../dist/game-sim.mjs';
const config=defaultConfig(),base=simulateGame(config),bill=costs(config,base);
assert.deepEqual(base.cases.map(c=>c.start),[10,107,189,286,368,465]);assert.equal(bill.complete,5);assert.equal(bill.missed,1);assert.equal(bill.total,39443);
const stocked=defaultConfig();for(const k of ['S','N','A','T','MC'])stocked.counts[k]=3;stocked.counts.US=stocked.counts.NV=2;
const full=simulateGame(stocked),success=costs(stocked,full);assert.deepEqual(full.cases.map(c=>c.start),[10,30,50,130,150,170]);assert(success.win);assert.equal(success.total,11796);
for(const type of Object.keys(catalog)){const empty=structuredClone(stocked);empty.counts[type]=0;const result=simulateGame(empty);assert(costs(empty,result).missed>0,`removing required ${type} must affect completion`);assert(result.events.some(e=>e.kind==='blocked'))}
const noNav=structuredClone(stocked);noNav.counts.NV=0;noNav.types.cranial.requires.NV=0;assert(costs(noNav,simulateGame(noNav)).win);
const extraNurse=structuredClone(stocked);extraNurse.types.cranial.requires.N=2;assert(costs(extraNurse,simulateGame(extraNurse)).late>0);
const upfront=structuredClone(stocked);upfront.capitalMode='upfront';assert.equal(costs(upfront,simulateGame(upfront,0)).equipment,1970000);assert.equal(costs(stocked,simulateGame(stocked,0)).total,0);assert.equal(costs(stocked,simulateGame(stocked,240)).payroll,4920);
for(const cfg of [config,stocked,noNav,extraNurse]){
 for(let time=0;time<=END;time++){
  const state=simulateGame(cfg,time);assert.deepEqual(state,simulateGame(cfg,time));assert(state.events.every(e=>e.time<=time));assert(state.cases.every(c=>c.start===null||c.start<=time));
  for(const r of state.resources){if(r.motion){assert.equal(r.location,'CORRIDOR');assert(r.motion.depart<=time&&r.motion.arrive>time)}if(r.status==='In case'){const c=state.cases.find(c=>c.id===r.owner);assert(c.start!==null&&time<c.end)}}
 }
 const result=simulateGame(cfg);for(const c of result.cases.filter(c=>c.start!==null)){assert(c.start>=c.plan);const at=simulateGame(cfg,c.start);for(const id of c.assigned){const resource=at.resources.find(r=>r.id===id);assert.equal(resource.location,`OR${c.room}`);assert(!resource.motion)}
  for(const other of result.cases.filter(o=>o.id!==c.id&&o.start!==null)){if(other.room===c.room&&other.plan<c.plan)assert(c.start>=other.end+15);for(const id of c.assigned.filter(id=>!id.startsWith('US'))){if(other.assigned.includes(id))assert(c.end<=other.start||other.end<=c.start,'exclusive resources must not overlap')}}
 }
}
console.log('PASS: resource pools, zero capacity, custom requirements, physical start gates, exclusivity, room turnover, reproducibility, no future events, winning setup, penalties and accounting.');
