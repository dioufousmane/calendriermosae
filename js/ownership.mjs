const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/^\d+\s*/,'').replace(/\b(cm|td|tp|esgt)\b/g,' ').replace(/\b\d{3}[a-z]{2}\d+[a-z]?\b/g,' ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
// Aliases contrôlés : aucune fusion par simple ressemblance de mots.
const catalogue=[
 ['paysages','analyse des paysages','analyse des paysages et des dynamiques rurales','analyses des paysages','analyses des paysages et dynamiques rurales'],
 ['geodesie','géodésie'],['referentiel','référentiel jurid & foncier','référentiel juridique et foncier'],
 ['droit-admin','droit administratif','droit administratif public1'],
 ['bdd','sig et bases de données','sig et base de données'],['sig3d','sig et 3 d','sig et 3d'],
 ['drone','initiation drone','initiation au drône'],['topo1','topographie','topographie 1'],
 ['bim','bim','bim/cim'],['photo','photogrammétrie','lasergrametrie-photogrammetrie'],['tele','télédétection'],
 ['jumeau','jumeau numérique des territoires'],['donnees','droits de la donnée','droit de la donnée'],
 ['urbanisme',"droit de l’urbanisme et de l’aménagement"],['environnement',"droit de l'environnement"],
 ['commande','droit de la commande publique'],['amenagement','droit aménagement public4',"droit de l’aménagement"],
 ['geobim','géobim'],['model3d','modélisation 3d'],['program','modélisation programmation sig','modélisation et programmation sig'],
 ['cao','cao dao','cao autocad covadis','topographie 2'],['pao','dao pao illustrator indesign','pao illustrator indesign granger mosae2'],
 ['websig','sig et websig sql'],['web','web conception'],['chantier','chantier école','chantier école partie 1','chantier école partie 2','chantier école 3']
];
const aliases=new Map(catalogue.flatMap(([id,...names])=>names.map(n=>[norm(n),id])));
export const courseKey=e=>aliases.get(norm(e.title))||'';
export const excludedFromHours=e=>/\b(examens?\b|semaine\w*.*(?:entreprise|alternance)|feries?\b|soutenance\w*|manifestation\w*|campus en fete|rentree|reunion|session d information)\b/.test(norm(e.title));
export function reconcileOwnership(events){
 const native=events.filter(e=>e.sources.includes('ESGT'));
 const result=events.filter(e=>!e.sources.includes('UNIV')||e.sources.includes('ESGT')).map(e=>({...e,accountingSource:'ESGT',reportedSources:e.sources}));
 for(const event of events.filter(e=>e.sources.includes('UNIV')&&!e.sources.includes('ESGT'))){
  const key=courseKey(event),explicit=/\besgt\b/i.test(event.title+' '+event.room);
  const candidates=native.filter(e=>!e.invalid&&!event.invalid&&!e.allDay&&!event.allDay&&e.date===event.date&&e.start===event.start&&e.promotions.some(p=>event.promotions.includes(p))&&(
    (key&&courseKey(e)===key)||
    // Report connu : SIG et 3D peut désigner la séance de bases de données.
    (key==='sig3d'&&courseKey(e)==='bdd'&&explicit&&e.end===event.end)
  ));
  if(candidates.length===1){
   const target=result.find(e=>e.id===candidates[0].id);
   target.reports=[...(target.reports||[]),{title:event.title,start:event.start,end:event.end,source:'UNIV'}];
   target.reportedSources=[...new Set([...(target.reportedSources||[]),'UNIV'])];
   for(const k of ['promotions','groups','formations','origins','metadataSnapshots'])target[k]=[...new Set([...(target[k]||[]),...(event[k]||[])])];
   target.shared=target.promotions.length>1||target.groups.length>1||target.formations.length>1;
   result.push({...event,accountingSource:'ESGT',reportOf:target.id,ownershipNote:'Report d’un cours ESGT : visible dans le calendrier universitaire, sans ajout aux heures. La séance ESGT fait référence pour le cumul.'});
   continue;
  }
  result.push({...event,...(key||explicit?{accountingSource:'ESGT',reportedSources:['UNIV'],ownershipNote:'Cours ESGT reporté par l’Université ; aucune séance ESGT unique concordante trouvée.'}:{})});
 }
 return result.map(e=>({...e,excludedFromHours:excludedFromHours(e),hours:excludedFromHours(e)?0:e.hours})).sort((a,b)=>a.start.localeCompare(b.start));
}
