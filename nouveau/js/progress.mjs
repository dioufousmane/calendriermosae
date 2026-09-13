export const TARGETS={ESGT:373.2,UNIV:248.8};
export function volumeProgress(volumes){
 const totalTarget=TARGETS.ESGT+TARGETS.UNIV;
 const parts=Object.fromEntries(Object.entries(TARGETS).map(([source,target])=>{
  const {specific,shared}=volumes[source],hours=specific+shared;
  return [source,{specific,shared,hours,target,completion:hours/target*100,globalCompletion:hours/totalTarget*100}];
 }));
 const hours=parts.ESGT.hours+parts.UNIV.hours;
 for(const part of Object.values(parts))part.share=hours?part.hours/hours*100:null;
 return {parts,hours,totalTarget,completion:hours/totalTarget*100};
}
