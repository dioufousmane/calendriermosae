import{readFile,mkdir,writeFile}from'node:fs/promises';
import{SOURCES,normalize,mergeEvents,toICS}from'../js/data.mjs';
const all=mergeEvents((await Promise.all(SOURCES.map(async s=>normalize(JSON.parse(await readFile(new URL('../'+s.file,import.meta.url),'utf8')),s)))).flat());
await mkdir(new URL('../feeds/',import.meta.url),{recursive:true});
for(const [file,events]of [['mosae',all],['mosae1',all.filter(e=>e.promotions.includes('MOSAE 1'))],['mosae2',all.filter(e=>e.promotions.includes('MOSAE 2'))]])await writeFile(new URL('../feeds/'+file+'.ics',import.meta.url),toICS(events));
console.log(JSON.stringify({events:all.length,shared:all.filter(e=>e.shared).length,invalid:all.filter(e=>e.invalid).length,periods:all.filter(e=>e.allDay).length}));
