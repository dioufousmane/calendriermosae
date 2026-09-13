import {test} from 'node:test';
import assert from 'node:assert/strict';
import {normalize,mergeEvents} from '../js/data.mjs';
import {cumulativeVolumes} from '../nouveau/js/volumes.mjs';
import {volumeProgress} from '../nouveau/js/progress.mjs';
import fs from 'node:fs';
test('examens, entreprise et fériés visibles mais hors volumes et progression',()=>{
 for(const source of ['ESGT','UNIV']){
  const titles=['EXAMEN','1EXAMEN Anglais technique et scientifique','Examens','SEMAINE en ENTREPRISE','Semaine entreprise','Férié','Jour férié','SOUTENANCES','CAMPUS EN FETE'];
  const events=mergeEvents(normalize(titles.map((title,i)=>({title,date:'2026-09-10',start:'08:30',end:'11:15',uid:String(i)})),{source,promotion:'MOSAE 1',file:'test.json'}));
  assert.equal(events.length,titles.length);
  assert.ok(events.every(e=>e.hours===0));
  assert.equal(volumeProgress(cumulativeVolumes(events,'2026-09-14').volumes).hours,0);
 }
});
test('les trois pages proposent la navigation dédiée',()=>{
 for(const name of ['index.html','mosae1.html','mosae2.html']){
  const html=fs.readFileSync(new URL('../nouveau/'+name,import.meta.url),'utf8');
  assert.equal(html.split('data-page="progress"').length-1,1);
 }
});
