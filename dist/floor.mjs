import {placeName,status,reason} from './sim.mjs';
const NS='http://www.w3.org/2000/svg';
export const rooms=[
{id:'OR1',x:30,y:30,w:300,h:220,label:'Operating room 01',sub:'Surgical suite'},
{id:'OR2',x:350,y:30,w:300,h:220,label:'Operating room 02',sub:'Surgical suite'},
{id:'OR3',x:670,y:30,w:300,h:220,label:'Operating room 03',sub:'Surgical suite'},
{id:'PRE',x:30,y:360,w:160,h:220,label:'Pre-op',sub:'Patient preparation'},
{id:'REC',x:205,y:360,w:175,h:220,label:'Recovery',sub:'Post-op / handoff'},
{id:'HUB',x:395,y:360,w:130,h:220,label:'Equipment hub',sub:'Shared resources'},
{id:'WORK',x:540,y:360,w:130,h:220,label:'Nurse workroom',sub:'Prep & documentation'},
{id:'OFFICE',x:685,y:360,w:130,h:220,label:'Staff office',sub:'Between cases'},
{id:'LOUNGE',x:830,y:360,w:140,h:220,label:'Staff lounge',sub:'Between cases'}];
const centers=Object.fromEntries(rooms.map(r=>[r.id,[r.x+r.w/2,r.y<250?196:490]]));
export function anchor(location,id){const base=centers[location]||[500,305];let [x,y]=base;
 if(id==='US')return location.startsWith('OR')?[x+95,145]:[x,490];
 if(/^[SNA][123]$/.test(id)){if(location.startsWith('OR'))x+=({S:-45,N:0,A:45}[id[0]]);else {x+=(+id[1]-2)*33;y=location==='REC'?540:495;}return [x,y]}
 return base;
}
export function route(m,id){const from=anchor(m.from,id),to=anchor(m.to,id);const exit=centers[m.from][0],entry=centers[m.to][0];return [from,[exit,from[1]],[exit,305],[entry,305],[entry,to[1]],to].filter((p,i,a)=>!i||p[0]!==a[i-1][0]||p[1]!==a[i-1][1])}
export function position(entity,t,id){if(!entity.motion)return anchor(entity.location,id);const points=route(entity.motion,id);const lengths=points.slice(1).map((p,i)=>Math.hypot(p[0]-points[i][0],p[1]-points[i][1]));const total=lengths.reduce((a,b)=>a+b,0);let d=Math.min(1,Math.max(0,(t-entity.motion.depart)/(entity.motion.arrive-entity.motion.depart)))*total;for(let i=0;i<lengths.length;i++){if(d<=lengths[i]){const f=lengths[i]?d/lengths[i]:0;return points[i].map((v,j)=>v+(points[i+1][j]-v)*f)}d-=lengths[i]}return points.at(-1)}
let svg,layer,pathLayer;
function patientBeds(r){const bed=(x,y,w,h)=>`<g class="patient-bed" aria-hidden="true"><rect class="bed-frame" x="${x}" y="${y}" width="${w}" height="${h}" rx="7"/><rect class="bed-pillow" x="${x+6}" y="${y+6}" width="${w-12}" height="11" rx="3"/></g>`;if(r.id.startsWith('OR'))return bed(r.x+125,100,50,70);if(r.id==='PRE'||r.id==='REC')return [0,1,2].map(i=>bed(r.x+12+i*50,435,38,65)).join('');return ''}
function heartMonitor(r){if(!r.id.startsWith('OR'))return '';const x=r.x+218,y=90;const wave=`M ${x+6} ${y+18} h 10 l 4 -5 l 4 12 l 5 -20 l 5 13 h 7 l 4 -4 l 4 4 h 6`;return `<g class="heart-monitor" role="img" aria-label="Surgery activity monitor idle"><title>Surgery activity indicator only; not patient vital signs</title><rect class="monitor-frame" x="${x}" y="${y}" width="62" height="35" rx="4"/><path class="monitor-idle" d="M ${x+6} ${y+18} h 50"/><path class="monitor-wave-ghost" d="${wave}"/><path class="monitor-wave" d="${wave}" pathLength="100"/><circle class="monitor-led" cx="${x+55}" cy="${y+6}" r="2"/></g>`}
export function initFloor(root){root.innerHTML=`<svg viewBox="0 0 1000 610" class="hospital-plan" aria-label="Hospital floor with operating rooms, corridor, pre-op, recovery, equipment hub, workroom, office and lounge"><defs><pattern id="floorTiles" width="25" height="25" patternUnits="userSpaceOnUse"><path d="M 25 0 H 0 V 25" fill="none" stroke="#dde5df" stroke-width=".6"/></pattern></defs><rect x="15" y="15" width="970" height="580" rx="10" fill="#e8eee7"/><rect x="30" y="250" width="940" height="110" fill="url(#floorTiles)"/><path class="corridor-guide" d="M 50 305 H 950"/><text class="corridor-caption" x="500" y="340" text-anchor="middle">PERIOPERATIVE CORRIDOR</text>${rooms.map(r=>`<g class="floor-room" data-entity="${r.id}" role="button" tabindex="0" aria-label="Inspect ${r.label}"><rect class="room-shell" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="3"/><rect class="room-accent" x="${r.x+2}" y="${r.y+2}" width="${r.w-4}" height="4"/><text class="floor-room-title" x="${r.x+12}" y="${r.y+27}">${r.label}</text><text class="floor-room-sub" x="${r.x+12}" y="${r.y+44}">${r.sub}</text><text class="floor-room-state" data-room-state="${r.id}" x="${r.x+12}" y="${r.y+64}"></text>${patientBeds(r)}${heartMonitor(r)}<path class="door-gap" d="M ${r.x+r.w/2-22} ${r.y<250?250:360} h 44"/><path class="door-swing" d="M ${r.x+r.w/2-22} ${r.y<250?250:360} v ${r.y<250?30:-30} a 30 30 0 0 ${r.y<250?0:1} 30 ${r.y<250?-30:30}"/></g>`).join('')}<g id="route-layer"></g><g id="people-layer"></g><text class="map-scale" x="30" y="605">SCHEMATIC HOSPITAL FLOOR · SYNTHETIC ROUTINES · NOT TO SCALE</text></svg>`;svg=root.querySelector('svg');layer=svg.querySelector('#people-layer');pathLayer=svg.querySelector('#route-layer')}
function token(id,label,kind){let el=layer.querySelector(`[data-entity="${id}"]`);if(el)return el;el=document.createElementNS(NS,'g');el.setAttribute('data-entity',id);el.setAttribute('role','button');el.setAttribute('tabindex','0');el.setAttribute('aria-label',`Inspect ${label}`);el.innerHTML=`<title></title>${kind==='equipment'?'<rect x="-25" y="-17" width="50" height="34" rx="5"/><circle class="wheel" cx="-15" cy="20" r="3"/><circle class="wheel" cx="15" cy="20" r="3"/>':kind==='patient'?'<rect x="-19" y="-11" width="38" height="24" rx="7"/>':'<circle class="badge" r="15"/><circle class="person-head" cy="-5" r="4"/><path class="person-body" d="M -7 7 A 7 7 0 0 1 7 7 Z"/>'}<text text-anchor="middle" dy="${kind==='staff'?29:4}">${label}</text>`;el.classList.add('floor-entity',kind);if(kind==='staff')el.classList.add(`role-${id[0]}`);layer.append(el);return el}
export function updateFloor(s,t,selected){
 const entities=s.staff.map(p=>({...p,label:p.id,kind:'staff'}));entities.push({...s.machine,id:'US',label:'US-01',kind:'equipment'});
 for(const c of s.cases.filter(c=>c.arrived&&c.discharge===null)){let location=c.start===null?'PRE':t<c.end?`OR${c.room}`:'REC';entities.push({id:c.id,label:`P-${c.id}`,kind:'patient',location,motion:null})}
 const ids=new Set(entities.map(e=>e.id));for(const el of [...layer.children])if(!ids.has(el.dataset.entity))el.remove();
 let paths='';for(const entity of entities){const el=token(entity.id,entity.label,entity.kind);let p=position(entity,t,entity.id);
 if(entity.kind==='patient'){const peers=entities.filter(e=>e.kind==='patient'&&e.location===entity.location);const index=peers.findIndex(e=>e.id===entity.id);const r=rooms.find(r=>r.id===entity.location);p=entity.location.startsWith('OR')?[r.x+150,135]:[r.x+31+(index%3)*50,462+Math.floor(index/3)*53]}
 el.setAttribute('transform',`translate(${p[0]} ${p[1]})`);el.classList.toggle('is-selected',entity.id===selected);el.classList.toggle('in-motion',!!entity.motion);const title=entity.motion?`${entity.label} · Moving: ${placeName(entity.motion.from)} → ${placeName(entity.motion.to)}`:`${entity.label} · ${placeName(entity.location)}`;el.querySelector('title').textContent=title;el.setAttribute('aria-label',`Inspect ${entity.label}: ${title}`);
 if(entity.motion&&(selected===entity.id||entity.id==='US')){paths+=`<polyline class="movement-path ${entity.kind}" points="${route(entity.motion,entity.id).map(p=>p.join(',')).join(' ')}"/>`}
 }
 pathLayer.innerHTML=paths;
 for(const room of rooms){const g=svg.querySelector(`.floor-room[data-entity="${room.id}"]`);g.classList.toggle('room-selected',selected===room.id);let text='';let busy=false,waiting=false;
 if(room.id.startsWith('OR')){const n=+room.id.slice(2);const c=s.cases.find(c=>c.room===n&&c.start!==null&&t<c.end)||s.cases.find(c=>c.room===n&&c.start===null&&t>=c.plan);busy=c&&c.start!==null;waiting=c&&c.start===null;const turnover=s.cases.some(c=>c.room===n&&c.end!==null&&t>=c.end&&c.ready===null);text=c?`Case ${c.id} · ${busy?'IN CASE':'WAITING'}`:turnover?'ROOM TURNOVER':'ROOM AVAILABLE';g.querySelector('.room-shell').setAttribute('data-detail',c?reason(c,s):text)}
 else if(room.id==='PRE'||room.id==='REC'){const count=entities.filter(e=>e.kind==='patient'&&e.location===room.id).length;text=`${count} patient${count===1?'':'s'}`}
 else if(room.id==='HUB')text=s.machine.location==='HUB'?'US-01 parked':'US-01 in suite';
 else {const count=s.staff.filter(p=>p.location===room.id).length;text=`${count} staff`}
 const monitor=g.querySelector('.heart-monitor');if(monitor){monitor.classList.toggle('active',!!busy);monitor.setAttribute('aria-label',`${room.label}: ${busy?'surgery in progress':'no surgery in progress'}; simulated activity indicator`);monitor.querySelector('.monitor-wave').setAttribute('stroke-dashoffset',String(-(t*80)%100));}
 g.classList.toggle('busy',!!busy);g.classList.toggle('waiting',!!waiting);g.querySelector('[data-room-state]').textContent=text;
 }
 return entities.filter(e=>e.motion).map(e=>`${e.label}: ${placeName(e.motion.from)} → ${placeName(e.motion.to)}`);
}
