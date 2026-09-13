import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cumulativeVolumes} from '../nouveau/js/volumes.mjs';
const event=(date,hours,sources=['ESGT'],shared=false,extra={})=>({date,hours,sources,shared,...extra});
test('cumul depuis septembre, répartition par source et mutualisation',()=>{
 const es=[event('2026-08-31',9),event('2026-09-01',2),event('2026-09-08',3,['ESGT'],true),event('2026-09-09',4,['UNIV']),event('2026-09-10',1,['UNIV'],true),event('2026-09-14',8),event('2026-09-11',8,['ESGT'],false,{invalid:true}),event('2026-09-11',24,['ESGT'],false,{allDay:true})];
 assert.deepEqual(cumulativeVolumes(es,'2026-09-14').volumes,{ESGT:{specific:2,shared:3},UNIV:{specific:4,shared:1}});
 assert.equal(cumulativeVolumes(es,'2026-09-07').volumes.ESGT.shared,0);
});
test('année universitaire et double source',()=>{
 const es=[event('2026-09-02',2,['ESGT','UNIV'],true)];
 const result=cumulativeVolumes(es,'2027-01-11');
 assert.equal(result.start,'2026-09-01');
 assert.equal(result.volumes.UNIV.shared,2);
 assert.equal(result.volumes.ESGT.shared,2);
 assert.equal(cumulativeVolumes(es,'2027-09-06').courses.length,0);
});
