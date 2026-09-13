import {test} from 'node:test';
import assert from 'node:assert/strict';
import {academicWeeks,weekStart} from '../nouveau/js/weeks.mjs';
test('semaines ISO et changement année',()=>{
 assert.equal(weekStart('2026-09-13'),'2026-09-07');
 const weeks=academicWeeks('2027-01-04');
 assert.equal(weeks[0].start,'2026-08-31');
 assert.equal(weeks.find(w=>w.start==='2027-01-04').number,1);
 assert.equal(weeks.find(w=>w.start==='2026-12-28').number,53);
 assert.ok(weeks.some(w=>w.start==='2027-08-30'));
});
