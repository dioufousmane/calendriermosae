import {test} from 'node:test';
import assert from 'node:assert/strict';
import {teachingDuration} from '../nouveau/js/teaching-hours.mjs';
import {cumulativeVolumes} from '../nouveau/js/volumes.mjs';
const event=(hours,source='ESGT')=>({hours,sources:[source],date:'2026-09-10'});
test('pauses ESGT entre 1, 2, 3 et 4 séances',()=>{
 for(const [gross,net,pause] of [[1.25,1.25,0],[2.75,2.5,15],[4.25,3.75,30],[5.75,5,45]]){
  assert.deepEqual(teachingDuration(event(gross)),{hours:net,breakMinutes:pause,nonstandard:false});
 }
});
test('université inchangée, report isolé ESGT corrigé, durée atypique signalée',()=>{
 assert.equal(teachingDuration(event(2.75,'UNIV')).hours,2.75);
 assert.equal(teachingDuration({...event(2.75,'UNIV'),accountingSource:'ESGT'}).hours,2.5);
 assert.equal(teachingDuration(event(2)).nonstandard,true);
});
test('cumul spécifique et mutualisé net sans modifier les horaires',()=>{
 const a=event(2.75),b={...event(4.25),shared:true};
 assert.deepEqual(cumulativeVolumes([a,b],'2026-09-14').volumes.ESGT,{specific:2.5,shared:3.75});
 assert.equal(a.hours,2.75);
});
