import {test} from 'node:test';
import assert from 'node:assert/strict';
import {volumeProgress} from '../nouveau/js/progress.mjs';
test('progression selon 373,2 + 248,8 heures, spécifique et mutualisé inclus',()=>{
 const r=volumeProgress({ESGT:{specific:150,shared:36.6},UNIV:{specific:100,shared:24.4}});
 assert.equal(r.hours,311);assert.equal(r.completion,50);
 assert.equal(r.parts.ESGT.completion,50);assert.equal(r.parts.UNIV.completion,50);
 assert.equal(r.parts.ESGT.globalCompletion+r.parts.UNIV.globalCompletion,50);
});
test('aucune heure et dépassement sans plafonner le pourcentage',()=>{
 assert.equal(volumeProgress({ESGT:{specific:0,shared:0},UNIV:{specific:0,shared:0}}).parts.ESGT.share,null);
 assert.equal(volumeProgress({ESGT:{specific:746.4,shared:0},UNIV:{specific:497.6,shared:0}}).completion,200);
});
