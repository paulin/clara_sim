export const END=210;
export const templates=[
{id:'A',room:1,plan:0,duration:45,us:15},{id:'B',room:2,plan:20,duration:40,us:20},{id:'C',room:3,plan:45,duration:35,us:20},{id:'D',room:1,plan:60,duration:35,prior:'A'},{id:'E',room:2,plan:75,duration:35,prior:'B'},{id:'F',room:3,plan:95,duration:35,prior:'C'}];
export const clock=t=>`${String(8+Math.floor(t/60)).padStart(2,'0')}:${String(Math.floor(t%60)).padStart(2,'0')}`;
// Equal-time completions precede arrivals, then requests; insertion order breaks remaining ties.
export function simulate(conflict=30,until=END){
 const cases=templates.map(c=>({...c,start:null,end:null,ready:null,discharge:null,arrived:false}));
 const state={cases,events:[],machine:{location:'OR 1',status:'Available',owner:null},rooms:[0,0,0],time:until};
 let queue=[],seq=0,now=0;const push=(time,type,id)=>queue.push({time,type,id,seq:seq++});
 const log=(text,entity,kind='flow')=>state.events.push({time:now,text,entity,kind});
 cases.forEach(c=>{push(Math.max(0,c.plan-15),'arrival',c.id);push(c.plan,'request',c.id)});
 function startReady(){
  for(const c of cases){
   if(!c.arrived||c.start!==null||now<c.plan||state.rooms[c.room-1]>now)continue;
   const prior=cases.find(x=>x.id===c.prior);if(prior&&(prior.ready===null||prior.ready>now))continue;
   if(c.us&&state.machine.status!=='Available')continue;
   c.start=now;const extra=c.id==='A'?conflict:0;c.end=now+c.duration+extra;
   state.rooms[c.room-1]=c.end+15;
   log(`Case ${c.id} starts in OR ${c.room}${now>c.plan?` · ${now-c.plan} min late`:''}`,c.id,now>c.plan?'delay':'flow');
   if(c.us){state.machine={location:`OR ${c.room}`,status:'In use',owner:c.id};push(now+c.us+extra,'release',c.id);if(extra)log(`Ultrasound held ${extra} extra min in OR 1 (scenario input)`, 'US','delay');}
   push(c.end,'finish',c.id);push(c.end+15,'turnover',c.id);push(c.end+30,'discharge',c.id);
  }
 }
 const priority=e=>e.type==='request'?2:e.type==='arrival'?1:0;
 while(queue.length){queue.sort((a,b)=>a.time-b.time||priority(a)-priority(b)||a.seq-b.seq);const e=queue.shift();if(e.time>until)break;now=e.time;const c=cases.find(c=>c.id===e.id);
  if(e.type==='arrival'){c.arrived=true;log(`Patient P-${c.id} arrives in pre-op`,c.id)}
  if(e.type==='request'&&c.start===null){if(c.us&&state.machine.status!=='Available')log(`Case ${c.id} waiting for ultrasound held by ${state.machine.owner?`case ${state.machine.owner}`:'equipment turnaround'}`,c.id,'delay');else if(c.prior&&cases.find(x=>x.id===c.prior).ready===null)log(`Case ${c.id} waiting for OR ${c.room} and its team`,c.id,'delay');}
  if(e.type==='release'){state.machine={location:`OR ${c.room}`,status:'Cleaning / transfer',owner:null};log(`Ultrasound released by case ${c.id} · 5 min turnaround`, 'US');push(now+5,'available',c.id)}
  if(e.type==='available'){state.machine={location:'Equipment hub',status:'Available',owner:null};log('Ultrasound available for next case','US')}
  if(e.type==='finish'){log(`Case ${c.id} ends · P-${c.id} moves to recovery`,c.id)}
  if(e.type==='turnover'){c.ready=now;log(`OR ${c.room} turnover complete · team available`,c.id)}
  if(e.type==='discharge'){c.discharge=now;log(`P-${c.id} leaves recovery`,c.id)}
  startReady();
 }
 return state;
}
export function status(c,t){return !c.arrived?'Not arrived':c.start===null?(t<c.plan?'In pre-op':'Waiting'):t<c.end?'In case':c.discharge===null?'Recovery':'Complete'}
export function delay(c,t){return c.start!==null?c.start-c.plan:c.arrived&&t>=c.plan?t-c.plan:0}
export function reason(c,s){if(c.start!==null)return 'Start recorded';if(s.time<c.plan)return 'Scheduled start not reached';const p=s.cases.find(x=>x.id===c.prior);if(p&&(p.ready===null||p.ready>s.time))return `Case ${p.id} → OR ${c.room} turnover → room and team`;if(c.us&&s.machine.status!=='Available')return `US-01 → ${s.machine.owner?`case ${s.machine.owner}`:'cleaning / transfer'} → case ${c.id}`;return 'Patient, room, team and equipment ready'}
