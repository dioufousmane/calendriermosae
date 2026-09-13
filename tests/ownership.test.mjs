import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cumulativeVolumes} from '../nouveau/js/volumes.mjs';
import {conflicts,filterEvents} from '../js/data.mjs';
import {reconcileOwnership} from '../js/ownership.mjs';
const e=(id,title,source,start='2026-09-10T08:30:00',end='2026-09-10T12:45:00')=>({id,title,source,sources:[source],date:start.slice(0,10),start,end,hours:(Date.parse(end)-Date.parse(start))/36e5,promotions:['MOSAE 1'],groups:[],formations:[],origins:[],metadataSnapshots:[]});
test('report avec variante et horaires différents : ESGT prioritaire',()=>{
 const r=reconcileOwnership([e('a','Géodésie','ESGT'),e('b','CM GEODESIE','UNIV',undefined,'2026-09-10T12:00:00')]);
 assert.equal(r.length,2);assert.equal(r[0].hours,4.25);assert.deepEqual(r[0].sources,['ESGT']);
});
test('alias paysages et report isolé attribué ESGT',()=>{
 const r=reconcileOwnership([e('a','Analyse des paysages','ESGT'),e('b','Analyse des Paysages et des Dynamiques Rurales - ESGT','UNIV')]);
 assert.equal(r.length,2);
 assert.equal(reconcileOwnership([e('c','CM GEODESIE','UNIV')])[0].accountingSource,'ESGT');
});
test('soutenances et manifestations exclues, cours ordinaires conservés',()=>{
 const r=reconcileOwnership([e('a','1Soutenances','UNIV'),e('b','CAMPUS EN FETE','UNIV'),e('c','TD LANGUE','UNIV')]);
 assert.equal(r.find(x=>x.id==='a').hours,0);assert.equal(r.find(x=>x.id==='b').hours,0);assert.equal(r.find(x=>x.id==='c').hours,4.25);
});
test('cours différents et créneaux distincts ne fusionnent pas',()=>{
 assert.equal(reconcileOwnership([e('a','Géodésie','ESGT'),e('b','TD LANGUE','UNIV')]).length,2);
 assert.equal(reconcileOwnership([e('a','Géodésie','ESGT'),e('b','CM GEODESIE','UNIV','2026-09-10T14:00:00','2026-09-10T16:00:00')]).length,2);
});

test('report visible côté Univ, exclu du cumul et des faux conflits',()=>{
 const r=reconcileOwnership([e('a','Analyse des paysages','ESGT'),e('b','Analyse des Paysages et des Dynamiques Rurales - ESGT','UNIV')]);
 assert.equal(filterEvents(r,{sources:['UNIV']}).length,1);
 assert.equal(r.find(x=>x.id==='b').hours,4.25);
 assert.equal(conflicts(r).length,0);
 assert.deepEqual(cumulativeVolumes(r,'2026-09-14').volumes,{ESGT:{specific:3.75,shared:0},UNIV:{specific:0,shared:0}});
});
