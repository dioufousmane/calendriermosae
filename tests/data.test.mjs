import{test}from'node:test';import assert from'node:assert/strict';import{normalize,mergeEvents,conflicts,filterEvents,roomHours,toICS,dayAdd}from'../js/data.mjs';
const meta={file:'fixture',source:'ESGT',promotion:'MOSAE 1'};
const raw={date:'10/09/2026',start:'08:00',end:'10:00',title:'SIG',enseignant:'DIOUF',salle:'100'};
const e=(patch={},m={})=>normalize([{...raw,...patch}],{...meta,...m})[0];
test('explicit groups and formations mark mutualisation',()=>{for(const p of [{groups:['A','B']},{formations:['SIG','GAED']},{promotions:['MOSAE 1','IG5']}])assert.equal(mergeEvents([e(p)])[0].shared,true);});
test('strict merge counts one session, both promotions',()=>{let result=mergeEvents([e(),e({},{promotion:'MOSAE 2'})]);assert.equal(result.length,1);assert.equal(result[0].shared,true);assert.equal(result[0].hours,2);assert.equal(filterEvents(result,{promotion:'MOSAE 2',shared:true}).length,1);});
test('different teachers, rooms, source or UID never merge by title alone',()=>{for(const p of [{enseignant:'MOREL'},{salle:'101'},{enseignant:'non renseigné'}])assert.equal(mergeEvents([e(),e(p,{promotion:'MOSAE 2'})]).length,2);assert.equal(mergeEvents([e(),e({},{source:'UNIV'})]).length,2);assert.equal(mergeEvents([e({uid:'a'}),e({uid:'b'})]).length,2);});
test('session identity enables cross-source merge',()=>{const r=mergeEvents([e({session_id:'shared'}),e({session_id:'shared'},{source:'UNIV',promotion:'MOSAE 2'})]);assert.equal(r.length,1);assert.equal(r[0].shared,true);});
test('holidays and invalid times do not inflate hours',()=>{let r=mergeEvents([e({title:'Férié',start:'01:00',end:'01:00'}),e({end:'07:00'})]);assert.equal(r[0].allDay,true);assert.equal(r[0].hours,0);assert.equal(r[1].invalid,true);assert.equal(conflicts(r).length,0);});
test('adjacent events do not conflict, overlapping ones do',()=>{assert.equal(conflicts(mergeEvents([e(),e({title:'Autre',start:'10:00',end:'11:00'})])).length,0);assert.equal(conflicts(mergeEvents([e(),e({title:'Autre',start:'09:00',end:'11:00'})])).length,1);});
test('room occupancy uses union of intervals',()=>assert.equal(roomHours(mergeEvents([e(),e({title:'Autre',start:'09:00',end:'11:00'})]))[0].hours,3));
test('ICS contains shared labels, timezone, escaping and folds in bytes',()=>{const text=toICS(mergeEvents([e({title:'é'.repeat(100)+';A,B',groups:['A','B']})]));assert.match(text,/MUTUALISÉ/);assert.match(text,/DTSTART;TZID=Europe\/Paris:20260910T080000/);assert.match(text,/BEGIN:VTIMEZONE/);for(const line of text.split('\r\n'))assert.ok(Buffer.byteLength(line)<=75);assert.match(text,/\\;A\\,B/);});
test('ICS identifiers stable across ordering',()=>{const a=toICS(mergeEvents([e()])).match(/UID:([^\r]+)/)[1];const b=toICS(mergeEvents(normalize([{...raw,title:'Other'},raw],meta))).matchAll(/UID:([^\r]+)/g);assert.ok([...b].some(x=>x[1]===a));});
test('accents ignored; source selections and empty selections respected',()=>{const r=mergeEvents([e({title:'Géodésie'})]);assert.equal(filterEvents(r,{query:'geodesie'}).length,1);assert.equal(filterEvents(r,{sources:[]}).length,0);});
test('date rollover',()=>assert.equal(dayAdd('2026-12-31',1),'2027-01-01'));

test('same course across sources never triggers vigilance',()=>{
 const rows=mergeEvents([e({title:'Géodésie'}),e({title:'  GEODESIE  ',start:'09:00',end:'11:00'},{source:'UNIV'})]);
 assert.equal(rows.length,2);assert.equal(conflicts(rows).length,0);
});
test('common session with different labels is not a vigilance alert',()=>{
 const rows=mergeEvents([e({session_id:'one'}),e({session_id:'one',title:'SIG et BDD',start:'09:00',end:'11:00'},{source:'UNIV'})]);
 assert.equal(conflicts(rows).length,0);
});
test('different courses across sources still trigger vigilance',()=>{
 const rows=mergeEvents([e(),e({title:'Géodésie'},{source:'UNIV'})]);
 assert.equal(conflicts(rows).length,1);
});
test('aliases of a single promotion are not mutualisation',()=>{
 const r=mergeEvents([e({promotions:['MOSAE1','M1 MOSAE','MOSAE 1','ESGT']})])[0];
 assert.equal(r.shared,false);assert.deepEqual(r.promotions,['MOSAE 1']);
});
test('external publics retained in shared details',()=>{
 const r=mergeEvents([e({promotions:['MF1','MOSAE1']})])[0];
 assert.equal(r.shared,true);assert.deepEqual(r.promotions,['MOSAE 1','MF1']);
});
