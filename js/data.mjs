import {reconcileOwnership} from './ownership.mjs';
export const SOURCES=[{file:'esgt_events.json',source:'ESGT',promotion:'MOSAE 1'},{file:'univ_events.json',source:'UNIV',promotion:'MOSAE 1'},{file:'esgt_events2.json',source:'ESGT',promotion:'MOSAE 2'},{file:'univ_events2.json',source:'UNIV',promotion:'MOSAE 2'}];
export const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
const known=s=>s&&!/non renseigne|inconnu|a preciser/.test(norm(s));
const array=x=>Array.isArray(x)?x.map(String).filter(Boolean):x?[String(x)]:[];
const uniq=x=>[...new Set(x)];
export function canonicalPublic(value){
 let s=String(value||'').replace(/^P\s*-\s*/i,'').replace(/\s+/g,' ').trim();
 const m=/^(?:M([12])\s+MOSAE(?:\s+GEOGRAPHIE.*)?|MOSAE\s*([12]))$/i.exec(s);
 if(m)return 'MOSAE '+(m[1]||m[2]);
 return s.replace(/^(M[12])\s+S[1-4]\s+/i,'$1 ').replace(/\s*(?:-\s*)?(?:S[1-4]|Semestre\s+\d+)$/i,'').trim().toUpperCase();
}
const publics=x=>uniq(x.map(canonicalPublic).filter(s=>s&&!['ESGT','UNIV','UNIVERSITE DU MANS'].includes(s)));

export const dayAdd=(s,n)=>new Date(Date.parse(s.slice(0,10)+'T12:00:00Z')+n*864e5).toISOString().slice(0,10);
export function normalize(rows,meta){return rows.map((r,i)=>{
 const date=/^\d{2}\/\d{2}\/\d{4}$/.test(r.date)?r.date.split('/').reverse().join('-'):r.date;
 if(!/^\d{4}-\d{2}-\d{2}$/.test(date||'')||![r.start,r.end].every(t=>/^([01]\d|2[0-3]):[0-5]\d$/.test(t||'')))throw Error(`${meta.file} : date ou horaire invalide (ligne ${i+1})`);
 const period= /vacances|ferie|banalis|semaine.*entreprise|semaine.*alternance|campus en fete/.test(norm(r.title));
 const allDay=r.allDay===true||period;
 const start=allDay?date:`${date}T${r.start}:00`,end=allDay?(r.endDate&&r.endDate>date?r.endDate:dayAdd(date,1)):`${r.endDate||date}T${r.end}:00`;
 return {id:`${meta.source}-${meta.promotion}-${r.uid||i}-${date}-${r.start}`,uid:r.uid||'',sessionId:r.session_id||'',title:r.title||'Sans intitulé',date,start,end,allDay,invalid:!allDay&&end<=start,room:known(r.salle)?r.salle:'',teacher:known(r.enseignant)?r.enseignant:'',promotions:publics([meta.promotion,...array(r.promotions||r.promotion)]),groups:publics(array(r.groups||r.groupes)),formations:publics(array(r.formations)),source:meta.source,sources:[meta.source],ue:r.ue||'',ecue:r.ecue||'',modality:r.modality||(/^(CM|TD|TP)\b/i.exec(r.title||'')?.[1].toUpperCase()||''),updated:r.maj||'',evidence:'Métadonnées explicites',metadataSnapshots:r.metadata_source?[r.metadata_source+' · '+(r.metadata_snapshot_date||'date inconnue')]:[],origins:[meta.file],rawTitle:r.raw_title||r.title};
 });}
export function mergeEvents(events){
 const result=[];
 for(const e of events){
 // Shared identity is authoritative; heuristic requires same source, exact title/time/room/teacher.
 const previous=result.find(p=>p.start===e.start&&p.end===e.end&&p.allDay===e.allDay&&(
 (e.sessionId&&p.sessionId===e.sessionId)||
 (e.uid&&p.uid===e.uid&&p.source===e.source)||
 (!e.sessionId&&!p.sessionId&&(!e.uid||!p.uid||e.uid===p.uid)&&!e.allDay&&!e.invalid&&!p.invalid&&p.source===e.source&&norm(p.title)===norm(e.title)&&known(e.room)&&known(e.teacher)&&norm(e.room)===norm(p.room)&&norm(e.teacher)===norm(p.teacher))));
 if(previous){for(const key of ['promotions','groups','formations','sources','origins','metadataSnapshots'])previous[key]=uniq([...previous[key],...e[key]]);previous.evidence=e.sessionId?'Identifiant commun de séance':e.uid&&previous.uid===e.uid?'UID commun dans la même source':'Correspondance stricte : source, intitulé, horaires, salle et enseignant';}
 else result.push({...e});
 }
 return reconcileOwnership(result.map(e=>({...e,shared:e.promotions.length>1||e.groups.length>1||e.formations.length>1,hours:e.allDay||e.invalid?0:(Date.parse(e.end+'Z')-Date.parse(e.start+'Z'))/36e5})));
}
export function conflicts(events){const out=[],sorted=events.filter(e=>!e.allDay&&!e.invalid).sort((a,b)=>a.start.localeCompare(b.start));for(let i=0;i<sorted.length;i++)for(let j=i+1;j<sorted.length&&sorted[j].start<sorted[i].end;j++){
 const a=sorted[i],b=sorted[j];if(a.start>=b.end)continue;
 // A vigilance alert concerns different courses only, even across sources.
 const sameTitle=norm(a.title)&&norm(a.title)===norm(b.title);
 const sameSession=a.sessionId&&a.sessionId===b.sessionId;
 if(sameTitle||sameSession||a.reportOf===b.id||b.reportOf===a.id||(a.reportOf&&a.reportOf===b.reportOf))continue;
 const reasons=[];
 if(a.source===b.source&&a.room&&norm(a.room)===norm(b.room))reasons.push('Salle');
 if(a.teacher&&norm(a.teacher)===norm(b.teacher))reasons.push('Enseignant');
 if(a.promotions.some(p=>b.promotions.includes(p))&&(!a.groups.length||!b.groups.length||a.groups.some(g=>b.groups.includes(g))))reasons.push('Promotion / groupe');
 if(reasons.length)out.push({a,b,reasons});
 }return out;}
export function filterEvents(events,f){return events.filter(e=>(!f.query||norm([e.title,e.teacher,e.room,...e.promotions,...e.groups,e.ue,e.ecue].join(' ')).includes(norm(f.query)))&&(!f.promotion||e.promotions.includes(f.promotion))&&(!f.teacher||e.teacher===f.teacher)&&(!f.room||e.room===f.room)&&(!f.ue||e.ue===f.ue)&&(!f.ecue||e.ecue===f.ecue)&&(!f.shared||e.shared)&&(!f.sources||e.sources.some(s=>f.sources.includes(s))));}
export const inRange=(e,start,end)=>e.start<end&&(e.end>start||e.invalid&&e.start>=start);
export function roomHours(events){const by=new Map();for(const e of events.filter(e=>e.room&&!e.reportOf&&!e.allDay&&!e.invalid&&!e.excludedFromHours)){const key=e.source+' · '+e.room;if(!by.has(key))by.set(key,[]);by.get(key).push([Date.parse(e.start+'Z'),Date.parse(e.end+'Z')]);}return [...by].map(([name,slots])=>{slots.sort((a,b)=>a[0]-b[0]);let sum=0,low=0,high=0;for(const [s,e]of slots){if(s>high){sum+=high-low;low=s;high=e;}else high=Math.max(high,e);}return{name,hours:(sum+high-low)/36e5};});}
const esc=s=>String(s).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/;/g,'\\;').replace(/,/g,'\\,');
function fold(line){const lines=[];let part='',bytes=0;for(const c of line){const n=new TextEncoder().encode(c).length;if(bytes+n>75){lines.push(part);part=' ';bytes=1;}part+=c;bytes+=n;}return [...lines,part].join('\r\n');}
export function toICS(events){const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//ESGT//MOSAE Planning//FR','CALSCALE:GREGORIAN','X-WR-CALNAME:Planning MOSAE','X-WR-TIMEZONE:Europe/Paris','BEGIN:VTIMEZONE','TZID:Europe/Paris','BEGIN:DAYLIGHT','DTSTART:19700329T020000','RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU','TZOFFSETFROM:+0100','TZOFFSETTO:+0200','TZNAME:CEST','END:DAYLIGHT','BEGIN:STANDARD','DTSTART:19701025T030000','RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU','TZOFFSETFROM:+0200','TZOFFSETTO:+0100','TZNAME:CET','END:STANDARD','END:VTIMEZONE'];
 for(const e of events.filter(e=>!e.invalid)){const key=[e.sessionId||e.uid||[e.title,e.room,e.teacher].join('|'),e.start,e.source].join('|');let hash=2166136261;for(const c of key)hash=Math.imul(hash^c.charCodeAt(0),16777619);lines.push('BEGIN:VEVENT',`UID:${(hash>>>0).toString(16)}@planning.mosae`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+Z/,'Z')}`,`DTSTART${e.allDay?';VALUE=DATE':';TZID=Europe/Paris'}:${e.start.replace(/[-:]/g,'')}`,`DTEND${e.allDay?';VALUE=DATE':';TZID=Europe/Paris'}:${e.end.replace(/[-:]/g,'')}`,`SUMMARY:${esc((e.shared?'🟣 MUTUALISÉ · ':'')+e.title)}`,`LOCATION:${esc(e.room)}`,`DESCRIPTION:${esc([e.teacher,e.promotions.join(', '),e.groups.join(', '),e.formations.join(', '),e.modality,e.shared?e.evidence:'',e.sources.join(' / ')].filter(Boolean).join('\n'))}`,'END:VEVENT');}return lines.concat('END:VCALENDAR','').map(fold).join('\r\n');}
