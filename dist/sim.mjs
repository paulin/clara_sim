export const END=210;
export const templates=[
{id:'A',room:1,plan:0,duration:45,us:15},{id:'B',room:2,plan:20,duration:40,us:20},{id:'C',room:3,plan:45,duration:35,us:20},{id:'D',room:1,plan:60,duration:35,prior:'A'},{id:'E',room:2,plan:75,duration:35,prior:'B'},{id:'F',room:3,plan:95,duration:35,prior:'C'}];
export const clock=t=>`${String(8+Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;
export const homes={S:'OFFICE',N:'WORK',A:'LOUNGE'};
export const placeName=id=>({OFFICE:'Staff office',WORK:'Nurse workroom',LOUNGE:'Staff lounge',PRE:'Pre-op',REC:'Recovery',HUB:'Equipment hub',OR1:'OR 1',OR2:'OR 2',OR3:'OR 3',CORRIDOR:'Corridor'}[id]||id);
// Equal-time completions precede arrivals, then requests; insertion order breaks remaining ties.
export function simulate(conflict=30,until=END){
 const cases=templates.map(c=>({...c,start:null,end:null,ready:null,discharge:null,arrived:false}));
 const staff=[1,2,3].flatMap(room=>['S','N','A'].map(role=>({id:`${role}${room}`,room,role,location:room===1?'OR1':homes[role],motion:null})));
 const state={cases,staff,events:[],machine:{location:'OR1',status:'Available',owner:null,motion:null},rooms:[0,0,0],time:until};
 let queue=[],seq=0,now=0;const push=(time,type,id,data={})=>queue.push({time,type,id,data,seq:seq++});
 const log=(text,entity,kind='flow')=>state.events.push({time:now,text,entity,kind});
 const trip=(at,id,to)=>{push(at,'staffDepart',id,{to});push(at+2,'staffArrive',id,{to})};
 cases.forEach(c=>{push(Math.max(0,c.plan-15),'arrival',c.id);push(c.plan,'request',c.id);if(!c.prior&&c.plan>0)staff.filter(p=>p.room===c.room).forEach(p=>trip(c.plan-2,p.id,`OR${c.room}`))});
 function startReady(){
  for(const c of cases){
   if(!c.arrived||c.start!==null||now<c.plan||state.rooms[c.room-1]>now)continue;
   const prior=cases.find(x=>x.id===c.prior);if(prior&&(prior.ready===null||prior.ready>now))continue;
   if(staff.some(p=>p.room===c.room&&(p.location!==`OR${c.room}`||p.motion)))continue;
   if(c.us&&(state.machine.status!=='Available'||state.machine.location!==`OR${c.room}`))continue;
   c.start=now;const extra=c.id==='A'?conflict:0;c.end=now+c.duration+extra;
   state.rooms[c.room-1]=c.end+15;
   log(`Case ${c.id} starts in OR ${c.room}${now>c.plan?` · ${now-c.plan} min late`:''}`,c.id,now>c.plan?'delay':'flow');
   if(c.us){state.machine={location:`OR${c.room}`,status:'In use',owner:c.id,motion:null};push(now+c.us+extra,'release',c.id);if(extra)log(`Ultrasound held ${extra} extra min in OR 1 (scenario input)`, 'US','delay');}
   push(c.end,'finish',c.id);push(c.end+15,'turnover',c.id);push(c.end+30,'discharge',c.id);
  }
 }
 const priority=e=>e.type==='request'?2:e.type==='arrival'?1:0;
 while(queue.length){queue.sort((a,b)=>a.time-b.time||priority(a)-priority(b)||a.seq-b.seq);const e=queue.shift();if(e.time>until)break;now=e.time;const c=cases.find(c=>c.id===e.id);
  if(e.type==='arrival'){c.arrived=true;log(`Patient P-${c.id} arrives in pre-op`,c.id)}
  if(e.type==='request'&&c.start===null){if(c.us&&state.machine.status!=='Available')log(`Case ${c.id} waiting for ultrasound ${state.machine.owner?`held by case ${state.machine.owner}`:state.machine.status.toLowerCase()}`,c.id,'delay');else if(c.prior&&cases.find(x=>x.id===c.prior).ready===null)log(`Case ${c.id} waiting for OR ${c.room} and its team`,c.id,'delay');}
  if(e.type==='release'){
   const next=cases.find(x=>x.us&&x.start===null);const to=next?`OR${next.room}`:'HUB';
   state.machine={location:`OR${c.room}`,status:'Cleaning',owner:null,motion:null};
   log(`Ultrasound released by case ${c.id} · cleaning for 3 min`, 'US');push(now+3,'transfer',c.id,{to});push(now+5,'available',c.id,{to});
  }
  if(e.type==='transfer'){const from=state.machine.location;state.machine={location:'CORRIDOR',status:'In transit',owner:null,motion:{from,to:e.data.to,depart:now,arrive:now+2}};log(`US-01 moving: ${placeName(from)} → ${placeName(e.data.to)} · 2 min`, 'US','movement')}
  if(e.type==='available'){state.machine={location:e.data.to,status:'Available',owner:null,motion:null};log(`Ultrasound arrives at ${placeName(e.data.to)} · available`,'US','movement')}
  if(e.type==='finish'){
   log(`Case ${c.id} ends · P-${c.id} moves to recovery`,c.id);
   const next=cases.find(x=>x.prior===c.id);
   for(const p of staff.filter(p=>p.room===c.room)){
    if(p.role==='A'){trip(now,p.id,'REC');trip(now+5,p.id,'LOUNGE')}
    else trip(now+(p.role==='N'?10:0),p.id,homes[p.role]);
    if(next)trip(Math.max(next.plan-2,now+13),p.id,`OR${c.room}`);
   }
  }
  if(e.type==='staffDepart'){const p=staff.find(p=>p.id===e.id);p.motion={from:p.location,to:e.data.to,depart:now,arrive:now+2};p.location='CORRIDOR';log(`${p.id} moving: ${placeName(p.motion.from)} → ${placeName(e.data.to)}`,p.id,'movement')}
  if(e.type==='staffArrive'){const p=staff.find(p=>p.id===e.id);p.location=e.data.to;p.motion=null;log(`${p.id} arrives at ${placeName(p.location)}`,p.id,'movement')}
  if(e.type==='turnover'){c.ready=now;log(`OR ${c.room} turnover complete · team returned`,c.id)}
  if(e.type==='discharge'){c.discharge=now;log(`P-${c.id} leaves recovery`,c.id)}
  startReady();
 }
 return state;
}
export function status(c,t){return !c.arrived?'Not arrived':c.start===null?(t<c.plan?'In pre-op':'Waiting'):t<c.end?'In case':c.discharge===null?'Recovery':'Complete'}
export function delay(c,t){return c.start!==null?c.start-c.plan:c.arrived&&t>=c.plan?t-c.plan:0}
export function reason(c,s){if(c.start!==null)return 'Start recorded';if(s.time<c.plan)return 'Scheduled start not reached';const p=s.cases.find(x=>x.id===c.prior);if(p&&(p.ready===null||p.ready>s.time))return `Case ${p.id} → OR ${c.room} turnover → room and team`;if(c.us&&s.machine.status!=='Available')return `US-01 → ${s.machine.owner?`case ${s.machine.owner}`:s.machine.status.toLowerCase()} → case ${c.id}`;if(s.staff.some(p=>p.room===c.room&&p.location!==`OR${c.room}`))return `Team ${c.room} returning to OR ${c.room}`;return 'Patient, room, team and equipment ready'}
